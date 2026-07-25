'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Footer() {
  const [links, setLinks] = useState<{
    instagram_url: string | null
    tiktok_url: string | null
    snapchat_url: string | null
  }>({ instagram_url: null, tiktok_url: null, snapchat_url: null })
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('instagram_url, tiktok_url, snapchat_url')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setLinks(data as any))
  }, [])

  const hasAnyLink = links.instagram_url || links.tiktok_url || links.snapchat_url

  if (!hasAnyLink) return null

  return (
    <footer className="mt-auto border-t border-[#F0EAE0] py-6 px-6 text-center bg-[#FDFBF6]">
      <p className="text-sm text-[#3A3532]/60 mb-3">Suis-moi sur les réseaux</p>
      <div className="flex justify-center gap-5">
        {links.instagram_url && (
          <a href={links.instagram_url} target="_blank" rel="noopener noreferrer" className="text-2xl no-underline">
            📷
          </a>
        )}
        {links.tiktok_url && (
          <a href={links.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-2xl no-underline">
            🎵
          </a>
        )}
        {links.snapchat_url && (
          <a href={links.snapchat_url} target="_blank" rel="noopener noreferrer" className="text-2xl no-underline">
            👻
          </a>
        )}
      </div>
    </footer>
  )
}