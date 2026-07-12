'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminEditButton({ href }: { href: string }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userData.user.id)
        .single()
      setIsAdmin(!!data?.is_admin)
    }
    check()
  }, [])

  if (!isAdmin) return null

  return (
    <Link
      href={href}
      className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-[#3A3532] text-[#FDFBF6] rounded-full shadow-lg text-sm font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
    >
      ✏️ Modifier cette page
    </Link>
  )
}
