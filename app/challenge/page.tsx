'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminEditButton from '@/components/AdminEditButton'
import BrandPhoto from '@/components/BrandPhoto'
import imageCompression from 'browser-image-compression'
import type { User } from '@supabase/supabase-js'

type Challenge = {
  title: string
  description: string
  active: boolean
  recipe_list_id: string | null
  recipe_ids: string[] | null
  description_images: string[] | null
  reward_text: string | null
  reward_image_url: string | null
  banner_top_url: string | null
  banner_bottom_url: string | null
}

type Recipe = { id: string; title: string; image_url: string | null }

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
  const [linkedRecipes, setLinkedRecipes] = useState<Recipe[]>([])
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

        if (challengeData?.recipe_list_id) {
          const { data: items } = await supabase
            .from('recipe_list_items')
            .select('recipes(id, title, image_url)')
            .eq('list_id', challengeData.recipe_list_id)
            .order('position')
          setLinkedRecipes((items ?? []).map((i: any) => i.recipes).filter(Boolean))
        } else if (challengeData?.recipe_ids?.length) {
          const { data: recipesData } = await supabase
            .from('recipes')
            .select('id, title, image_url')
            .in('id', challengeData.recipe_ids)
          setLinkedRecipes(recipesData ?? [])
        }

        await loadEntries(userData.user.id)
      }

      setLoading(false)
    }
    load()
  }, [])

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setFiles(selected.slice(0, 5))
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

      const { count } = await supabase
        .from('social_proof')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'realisation')

      const startPosition = count ?? 0

      for (let i = 0; i < uploadedUrls.length; i++) {
        await supabase.from('social_proof').insert({
          category: 'realisation',
          image_url: uploadedUrls[i],
          caption: comment || null,
          position: startPosition + i,
        })
      }

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

  if (loading) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  if (!user) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-[#3A3532]/70">
        Connecte-toi pour découvrir le challenge du mois.{' '}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </div>
    )
  }

  if (!approved) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-[#3A3532]/70">
        Ton compte est en attente de validation. Tu pourras participer au challenge une fois ton compte approuvé.
      </div>
    )
  }

  if (!challenge?.active) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-[#3A3532]/70">
        Pas de challenge en cours pour le moment — reviens bientôt !
        <AdminEditButton href="/admin/challenge" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {challenge.banner_top_url && (
        <img src={challenge.banner_top_url} alt="" className="w-full h-48 sm:h-64 object-cover" />
      )}

      <div className="px-6 sm:px-8 py-12">
        <h1 className="font-display text-3xl text-[#3A3532] mb-2 text-center">🏆 Challenge du mois</h1>
        <p className="text-[#3A3532]/70 text-center mb-1">{challenge.title}</p>
        <p className="text-[#3A3532]/70 text-center mb-6">{challenge.description}</p>

        <div className="flex justify-center mb-6">
          <BrandPhoto
            photoKey="table_ete"
            alt="Table de recettes d'été"
            className="w-full max-w-md h-48 object-cover rounded-2xl"
          />
        </div>

        {challenge.description_images && challenge.description_images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
            {challenge.description_images.map((url, i) => (
              <img key={i} src={url} alt="" className="w-full h-32 object-cover rounded-xl" />
            ))}
          </div>
        )}

        {linkedRecipes.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display text-lg text-[#3A3532] mb-3 text-center">Recettes du challenge</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {linkedRecipes.map((r) => (
                <Link
                  key={r.id}
                  href={`/recipes/${r.id}`}
                  className="block rounded-xl border border-[#F0EAE0] bg-white overflow-hidden no-underline text-inherit"
                >
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.title} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-[#F6DEE1]/30" />
                  )}
                  <p className="text-xs text-[#3A3532] p-2">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {challenge.reward_text && (
          <div className="border border-[#C9A44C] bg-[#F6DEE1]/20 rounded-2xl p-5 mb-10 text-center">
            <h2 className="font-display text-lg text-[#3A3532] mb-2">🎁 À gagner</h2>
            {challenge.reward_image_url && (
              <img
                src={challenge.reward_image_url}
                alt="Récompense"
                className="w-full h-40 object-cover rounded-xl mb-3"
              />
            )}
            <p className="text-[#3A3532]/80">{challenge.reward_text}</p>
          </div>
        )}

        <div className="border border-[#F0EAE0] bg-white rounded-2xl p-5 mb-10">
          <h2 className="font-display text-lg text-[#3A3532] mb-3">
            {myEntry ? 'Ta participation' : 'Partage ta réalisation'}
          </h2>

          {myEntry ? (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                {myEntry.image_urls?.map((url, i) => (
                  <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-full h-32 object-cover rounded-xl" />
                ))}
              </div>
              {myEntry.comment && <p className="text-[#3A3532]/70 text-sm">{myEntry.comment}</p>}
              <p className="text-xs text-[#3A3532]/40 mt-2">
                Tu as déjà participé ce mois-ci, merci ! 🎉
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block mb-2 text-sm text-[#3A3532]/60">
                  Jusqu'à 5 photos de ta réalisation
                </label>
                <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
                {files.length > 0 && (
                  <p className="text-xs text-[#3A3532]/50 mt-1">{files.length} photo(s) sélectionnée(s)</p>
                )}
              </div>
              <textarea
                placeholder="Un commentaire sur ta réalisation (optionnel)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
              />
              {uploadProgress && <p className="text-sm text-[#3A3532]/60">{uploadProgress}</p>}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={uploading || files.length === 0}
                className="py-2.5 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors border border-[#C9A44C] disabled:opacity-50"
              >
                {uploading ? 'Envoi...' : 'Partager ma réalisation'}
              </button>
            </form>
          )}
        </div>

        <div className="flex justify-center mb-10">
          <BrandPhoto
            photoKey="round_logo"
            alt="Thermomix With Love, Hasna"
            className="w-28 h-28 rounded-full object-cover border-2 border-[#C9A44C]"
          />
        </div>

        <h2 className="font-display text-lg text-[#3A3532] mb-4">
          Les réalisations de ce mois ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p className="text-[#3A3532]/60">Sois la première à partager ta réalisation !</p>
        ) : (
          <div className="flex flex-col gap-8">
            {entries.map((e) => (
              <div key={e.id}>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 -mx-6 px-6 pb-2 scrollbar-hide">
                  {e.image_urls?.map((url, i) => (
                    <div key={i} className="snap-center shrink-0 w-[75%] sm:w-[45%]">
                      <img src={url} alt="Participation" className="w-full h-56 object-cover rounded-xl" />
                    </div>
                  ))}
                </div>
                {e.comment && <p className="text-xs text-[#3A3532]/50 mt-2">{e.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <AdminEditButton href="/admin/challenge" />
      </div>

      {challenge.banner_bottom_url && (
        <img src={challenge.banner_bottom_url} alt="" className="w-full h-48 sm:h-64 object-cover" />
      )}
    </div>
  )
}
