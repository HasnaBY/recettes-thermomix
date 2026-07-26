'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function InstagramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="#3A3532" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="#3A3532" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="#3A3532" />
    </svg>
  )
}

function TiktokIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M14.5 3v9.8a3.6 3.6 0 1 1-3-3.55"
        stroke="#3A3532"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 3.2c.4 2.3 2 4 4.5 4.3"
        stroke="#3A3532"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SnapchatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3c-2.6 0-4.3 1.9-4.3 4.4 0 1.2.1 2.1-.3 2.8-.3.6-1 .9-1.7 1.1-.3.1-.5.4-.4.7.2.6.9 1 1.5 1.2-.1.3-.2.6-.1.9.2.4.7.5 1.2.6-.1.4 0 .8.4 1 .6.4 1.6.2 2.3.6.6.4 1.2 1.1 2.4 1.1s1.8-.7 2.4-1.1c.7-.4 1.7-.2 2.3-.6.4-.2.5-.6.4-1 .5-.1 1-.2 1.2-.6.1-.3 0-.6-.1-.9.6-.2 1.3-.6 1.5-1.2.1-.3-.1-.6-.4-.7-.7-.2-1.4-.5-1.7-1.1-.4-.7-.3-1.6-.3-2.8C16.3 4.9 14.6 3 12 3Z"
        stroke="#3A3532"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
          
            href={links.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="opacity-80 hover:opacity-100 transition-opacity"
          >
            <InstagramIcon />
          </a>
        )}
        {links.tiktok_url && (
          
            href={links.tiktok_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="opacity-80 hover:opacity-100 transition-opacity"
          >
            <TiktokIcon />
          </a>
        )}
        {links.snapchat_url && (
          
            href={links.snapchat_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Snapchat"
            className="opacity-80 hover:opacity-100 transition-opacity"
          >
            <SnapchatIcon />
          </a>
        )}
      </div>
    </footer>
  )
}