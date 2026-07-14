'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

type SiteSettings = {
  show_parrainage: boolean
  show_club: boolean
  show_concours: boolean
  show_public_testimonials: boolean
}

export default function Nav() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [settings, setSettings] = useState<SiteSettings>({
    show_parrainage: true,
    show_club: true,
    show_concours: true,
    show_public_testimonials: true,
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

  const hasMoreItems = settings.show_club || settings.show_parrainage || settings.show_concours

  return (
    <nav className="px-6 py-4 border-b border-[#F0EAE0] flex flex-wrap justify-between items-center gap-3 bg-[#FDFBF6] relative">
      <Link href="/" className="font-display text-lg text-[#3A3532] no-underline">
        Thermomix With Love, Hasna
      </Link>

      <div className="flex flex-wrap gap-4 items-center text-sm">
        <Link href="/qui-suis-je" className="text-[#3A3532]/80 hover:text-[#3A3532]">
          Qui suis-je
        </Link>
        <Link href="/pourquoi-commander" className="text-[#3A3532]/80 hover:text-[#3A3532]">
          Pourquoi commander
        </Link>
        {settings.show_club && (
          <Link href="/club-fondatrices" className="text-[#3A3532]/80 hover:text-[#3A3532]">
            Le Cercle With Love
          </Link>
        )}
        <Link href="/recettes" className="text-[#3A3532]/80 hover:text-[#3A3532]">
          Recettes
        </Link>
        <Link href="/confiance" className="text-[#3A3532]/80 hover:text-[#3A3532]">
          Elles m'ont fait confiance
        </Link>
        {settings.show_public_testimonials && (
          <Link href="/laisser-un-avis" className="text-[#3A3532]/80 hover:text-[#3A3532]">
            Laisser un avis
          </Link>
        )}

        {(hasMoreItems || true) && (
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="text-[#3A3532]/80 hover:text-[#3A3532] flex items-center gap-1"
            >
              Plus {moreOpen ? '▲' : '▼'}
            </button>
            {moreOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-[#F0EAE0] rounded-xl shadow-lg py-2 min-w-[180px] z-50">
                <Link
                  href="/listes"
                  onClick={() => setMoreOpen(false)}
                  className="block px-4 py-2 text-[#3A3532]/80 hover:bg-[#F6DEE1]/20 no-underline"
                >
                  Listes
                </Link>
                {settings.show_parrainage && (
                  <Link
                    href="/parrainage"
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2 text-[#3A3532]/80 hover:bg-[#F6DEE1]/20 no-underline"
                  >
                    Parrainage
                  </Link>
                )}
                {settings.show_concours && (
                  <Link
                    href="/grand-concours"
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2 text-[#3A3532]/80 hover:bg-[#F6DEE1]/20 no-underline"
                  >
                    Grand Concours
                  </Link>
                )}
                {user && (
                  <Link
                    href="/challenge"
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2 text-[#3A3532]/80 hover:bg-[#F6DEE1]/20 no-underline"
                  >
                    Challenge du mois
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        <Link
          href="/contact"
          className="px-3 py-1.5 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors no-underline"
        >
          Me contacter
        </Link>

        {user ? (
          <>
            {isAdmin && (
              <Link href="/admin" className="text-[#3A3532]/80 hover:text-[#3A3532]">
                Admin
              </Link>
            )}
            <Link href="/favorites" className="text-[#3A3532]/80 hover:text-[#3A3532]">
              Mes favoris
            </Link>
            <span className="text-[#3A3532]/50 hidden sm:inline">{user.email}</span>
            <button onClick={handleLogout} className="text-[#3A3532]/80 hover:text-[#3A3532] cursor-pointer">
              Se déconnecter
            </button>
          </>
        ) : (
          <Link href="/login" className="text-[#3A3532]/80 hover:text-[#3A3532]">
            Se connecter
          </Link>
        )}
      </div>
    </nav>
  )
}
