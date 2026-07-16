'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminEditButton from '@/components/AdminEditButton'

type Tip = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  video_url: string | null
  external_video_url: string | null
}

function getYoutubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export default function AstucesPage() {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [approved, setApproved] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setCheckingAccess(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('approved')
        .eq('id', userData.user.id)
        .single()

      setApproved(!!profile?.approved)
      setCheckingAccess(false)

      if (profile?.approved) {
        const { data } = await supabase.from('tips').select('*').order('position')
        setTips(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (checkingAccess) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  const { data: sessionCheck } = supabase.auth.getSession() as any

  if (!approved) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-[#3A3532]/70">
        Connecte-toi et fais valider ton compte pour accéder aux astuces Thermomix.{' '}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </div>
    )
  }

  if (loading) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  return (
    <div className="px-6 sm:px-8 py-12 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-2 text-center">✨ Astuces Thermomix</h1>
      <p className="text-[#3A3532]/70 text-center mb-10">
        Mes conseils et astuces pour tirer le meilleur de ton Thermomix au quotidien.
      </p>

      {tips.length === 0 ? (
        <p className="text-[#3A3532]/60 text-center">Aucune astuce pour le moment, reviens bientôt !</p>
      ) : (
        <div className="flex flex-col gap-8">
          {tips.map((tip) => {
            const embedUrl = tip.external_video_url ? getYoutubeEmbedUrl(tip.external_video_url) : null

            return (
              <div key={tip.id} className="border border-[#F0EAE0] bg-white rounded-2xl overflow-hidden">
                {tip.image_url && (
                  <img src={tip.image_url} alt={tip.title} className="w-full h-56 object-cover" />
                )}

                <div className="p-5">
                  <h2 className="font-display text-xl text-[#3A3532] mb-2">{tip.title}</h2>
                  {tip.description && <p className="text-[#3A3532]/70 mb-3">{tip.description}</p>}

                  {tip.video_url && (
                    <video controls className="w-full rounded-xl mb-3">
                      <source src={tip.video_url} />
                    </video>
                  )}

                  {embedUrl && (
                    <div className="aspect-video mb-3">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full rounded-xl"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {tip.external_video_url && !embedUrl && (
                    <a
                      href={tip.external_video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-[#3A3532] underline"
                    >
                      Voir la vidéo →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AdminEditButton href="/admin/tips" />
    </div>
  )
}
