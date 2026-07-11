'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

type SiteSettings = {
  show_parrainage: boolean
  show_club: boolean
  show_concours: boolean
}

export default function Nav() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [settings, setSettings] = useState<SiteSettings>({
    show_parrainage: true,
    show_club: true,
    show_concours: true,
  })
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

    supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setSettings(data as any))

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3 bg-white">
      <Link href="/" className="font-bold text-lg text-gray-900 no-underline">
       Thermomix With Love, Hasna
      </Link>

      <div className="flex flex-wrap gap-4 items-center text-sm">
        <Link href="/qui-suis-je" className="text-gray-700 hover:text-black">
          Qui suis-je
        </Link>
        <Link href="/pourquoi-commander" className="text-gray-700 hover:text-black">
          Pourquoi commander
        </Link>
        {settings.show_club && (
          <Link href="/club-fondatrices" className="text-gray-700 hover:text-black">
            Club Fondatrices
          </Link>
        )}
        <Link href="/recettes" className="text-gray-700 hover:text-black">
          Recettes
        </Link>
        <Link href="/confiance" className="text-gray-700 hover:text-black">
          Elles m'ont fait confiance
        </Link>
        {settings.show_parrainage && (
          <Link href="/parrainage" className="text-gray-700 hover:text-black">
            Parrainage
          </Link>
        )}
        {settings.show_concours && (
          <Link href="/grand-concours" className="text-gray-700 hover:text-black">
            Grand Concours
          </Link>
        )}

        <Link
          href="/contact"
          className="px-3 py-1.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors no-underline"
        >
          Me contacter
        </Link>

        {user ? (
          <>
            {isAdmin && (
              <Link href="/admin" className="text-gray-700 hover:text-black">
                Admin
              </Link>
            )}
            <Link href="/favorites" className="text-gray-700 hover:text-black">
              Mes favoris
            </Link>
            <span className="text-gray-500 hidden sm:inline">{user.email}</span>
            <button onClick={handleLogout} className="text-gray-700 hover:text-black cursor-pointer">
              Se déconnecter
            </button>
          </>
        ) : (
          <Link href="/login" className="text-gray-700 hover:text-black">
            Se connecter
          </Link>
        )}
      </div>
    </nav>
  )
}
