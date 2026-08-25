'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminNav from '@/components/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userData.user.id)
        .single()

      if (!profile?.is_admin) {
        setIsAdmin(false)
        setChecking(false)
        return
      }

      setIsAdmin(true)
      setChecking(false)
    }
    check()
  }, [])

  if (checking) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  if (!isAdmin) {
    return <div className="p-8 text-center text-gray-500">Accès réservé aux administrateurs.</div>
  }

  return (
    <div>
      <AdminNav />
      {children}
    </div>
  )
}