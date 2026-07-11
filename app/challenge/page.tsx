'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminEditButton from '@/components/AdminEditButton'
import imageCompression from 'browser-image-compression'
import type { User } from '@supabase/supabase-js'

type Challenge = {
  title: string
  description: string
  recipe_id: string | null
  active: boolean
}

type Entry = {
  id: string
  user_id: string
  image_urls: string[]
  comment: string | null
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function ChallengePage() {
  const [user, setUser] = useState<User | null>(null)
  const [approved, setApproved] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [myEntry, setMyEntry] = useState<Entry | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const monthKey = currentMonthKey()

  const loadEntries = async (uid?: string) => {
    const { data } = await supabase
      .from('challenge_entries')
      .select('*')
      .eq('challenge_month', monthKey)
      .order('created_at', { ascending: false })
    setEntries(data ?? [])
    if (uid) {
      setMyEntry((data ?? []).find((e) => e.user_id === uid) ?? null)
    }
  }

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      setUser(userData.user)

      if (!userData.user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('approved')
        .eq('id', userData.user.id)
        .single()

      setApproved(!!profile?.approved)

      if (profile?.approved) {
        const { data: challengeData } = await supabase
          .from('monthly_challenge')
          .select('*')
          .eq('id', 1)
          .single()
        setChallenge(challengeData as any)

        await loadEntries(userData.user.id)
      }

      setLoading(false)
    }
    load()
  }, [])

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setFiles(selected.slice(0, 5)) // max 5 photos par participation
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0 || !user) return
    setUploading(true)
    setError('')

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Envoi de la photo ${i + 1}/${files.length}...`)

        const compressed = await imageCompression(files[i], {
          maxWidthOrHeight: 1200,
          maxSizeMB: 0.3,
          fileType: 'image/webp',
        })

        const fileName = `${user.id}-${Date.now()}-${i}.webp`
        const { error: uploadError } = await supabase.storage
          .from('challenge-images')
          .upload(fileName, compressed)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('challenge-images').getPublicUrl(fileName)
        uploadedUrls.push(urlData.publicUrl)
      }

      const { error: insertError } = await supabase.from('challenge_entries').insert({
        user_id: user.id,
        challenge_month: monthKey,
        image_urls: uploadedUrls,
        comment: comment || null,
      })

      if (insertError) throw insertError

      setFiles([])
      setComment('')
      await loadEntries(user.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  if (!user) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-gray-600">
        Connecte-toi pour découvrir le challenge du mois.{' '}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </div>
    )
  }

  if (!approved) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-gray-600">
        Ton compte est en attente de validation. Tu pourras participer au challenge une fois ton compte approuvé.
      </div>
    )
  }

  if (!challenge?.active) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-gray-600">
        Pas de challenge en cours pour le moment — reviens bientôt !
        <AdminEditButton href="/admin/challenge" />
      </div>
    )
  }

  return (
    <div className="px-6 sm:px-8 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">🏆 Challenge du mois</h1>
      <p className="text-gray-600 text-center mb-1">{challenge.title}</p>
      <p className="text-gray-600 text-center mb-8">{challenge.description}</p>

      {challenge.recipe_id && (
        <div className="text-center mb-10">
          <Link href={`/recipes/${challenge.recipe_id}`} className="text-gray-900 underline text-sm">
            Voir la recette du challenge
          </Link>
        </div>
      )}

      <div className="border border-gray-200 rounded-xl p-5 mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          {myEntry ? 'Ta participation' : 'Partage ta réalisation'}
        </h2>

        {myEntry ? (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {myEntry.image_urls?.map((url, i) => (
                <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-full h-32 object-cover rounded-lg" />
              ))}
            </div>
            {myEntry.comment && <p className="text-gray-600 text-sm">{myEntry.comment}</p>}
            <p className="text-xs text-gray-400 mt-2">
              Tu as déjà participé ce mois-ci, merci ! 🎉
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block mb-2 text-sm text-gray-600">
                Jusqu'à 5 photos de ta réalisation
              </label>
              <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
              {files.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{files.length} photo(s) sélectionnée(s)</p>
              )}
            </div>
            <textarea
              placeholder="Un commentaire sur ta réalisation (optionnel)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            {uploadProgress && <p className="text-sm text-gray-500">{uploadProgress}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {uploading ? 'Envoi...' : 'Partager ma réalisation'}
            </button>
          </form>
        )}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Les réalisations de ce mois ({entries.length})
      </h2>
      {entries.length === 0 ? (
        <p className="text-gray-500">Sois la première à partager ta réalisation !</p>
      ) : (
        <div className="grid gap-6">
          {entries.map((e) => (
            <div key={e.id}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {e.image_urls?.map((url, i) => (
                  <img key={i} src={url} alt="Participation" className="w-full h-32 object-cover rounded-lg" />
                ))}
              </div>
              {e.comment && <p className="text-xs text-gray-500 mt-1">{e.comment}</p>}
            </div>
          ))}
        </div>
      )}

      <AdminEditButton href="/admin/challenge" />
    </div>
  )
}
