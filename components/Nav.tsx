'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

export default function Nav() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async (currentUser: User | null) => {
      setUser(currentUser)
      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .single()
        setIsAdmin(!!data?.is_admin)
      } else {
        setIsAdmin(false)
      }
    }

    supabase.auth.getUser().then(({ data }) => loadUser(data.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
      <Link href="/" className="font-bold text-lg text-gray-900 no-underline">
        Recettes Thermomix
      </Link>

      {user ? (
        <div className="flex gap-4 items-center text-sm">
          {isAdmin && (
            <Link href="/admin" className="text-gray-700 hover:text-black">
              Admin
            </Link>
          )}
          <Link href="/favorites" className="text-gray-700 hover:text-black">
            Mes favoris
          </Link>
          <span className="text-gray-500 hidden sm:inline">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-gray-700 hover:text-black cursor-pointer"
          >
            Se déconnecter
          </button>
        </div>
      ) : (
        <Link href="/login" className="text-gray-700 hover:text-black text-sm">
          Se connecter
        </Link>
      )}
    </nav>
  )
}
