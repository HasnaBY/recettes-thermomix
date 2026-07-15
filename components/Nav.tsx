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
  const [menuOpen, setMenuOpen] = useState(false)
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

  const close = () => setMenuOpen(false)

  const linkClass =
    'block px-6 py-3 text-[#3A3532] hover:bg-[#F6DEE1]/20 no-underline text-base'

  return (
    <>
      <nav className="px-6 py-4 border-b border-[#F0EAE0] flex justify-between items-center bg-[#FDFBF6]">
        <Link href="/" className="font-display text-lg text-[#3A3532] no-underline" onClick={close}>
          Thermomix With Love, Hasna
        </Link>

        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          className="text-2xl text-[#3A3532] px-2"
        >
          ☰
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          <div className="absolute top-0 right-0 h-full w-[80%] max-w-xs bg-[#FDFBF6] shadow-xl overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#F0EAE0]">
              <span className="font-display text-lg text-[#3A3532]">Menu</span>
              <button onClick={close} className="text-2xl text-[#3A3532] px-2" aria-label="Fermer le menu">
                ✕
              </button>
            </div>

            <div className="py-2">
              {user ? (
                <>
                  <Link href="/recettes" onClick={close} className={linkClass}>
                    Recettes
                  </Link>
                  <Link href="/listes" onClick={close} className={linkClass}>
                    Listes
                  </Link>
                  <Link href="/favorites" onClick={close} className={linkClass}>
                    Mes favoris
                  </Link>
                  <Link href="/challenge" onClick={close} className={linkClass}>
                    Challenge du mois
                  </Link>
                  {settings.show_public_testimonials && (
                    <Link href="/laisser-un-avis" onClick={close} className={linkClass}>
                      Laisser un avis
                    </Link>
                  )}

                  <div className="my-2 border-t border-[#F0EAE0]" />

                  <Link href="/qui-suis-je" onClick={close} className={linkClass}>
                    Qui suis-je
                  </Link>
                  <Link href="/pourquoi-commander" onClick={close} className={linkClass}>
                    Pourquoi commander
                  </Link>
                  {settings.show_club && (
                    <Link href="/club-fondatrices" onClick={close} className={linkClass}>
                      Le Cercle With Love
                    </Link>
                  )}
                  <Link href="/confiance" onClick={close} className={linkClass}>
                    Elles m'ont fait confiance
                  </Link>
                  {settings.show_parrainage && (
                    <Link href="/parrainage" onClick={close} className={linkClass}>
                      Parrainage
                    </Link>
                  )}
                  {settings.show_concours && (
                    <Link href="/grand-concours" onClick={close} className={linkClass}>
                      Grand Concours
                    </Link>
                  )}

                  <div className="my-2 border-t border-[#F0EAE0]" />

                  <Link href="/contact" onClick={close} className={linkClass}>
                    Me contacter
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={close} className={linkClass}>
                      Admin
                    </Link>
                  )}

                  <div className="my-2 border-t border-[#F0EAE0]" />

                  <div className="px-6 py-2 text-sm text-[#3A3532]/50">{user.email}</div>
                  <button
                    onClick={() => {
                      close()
                      handleLogout()
                    }}
                    className="block w-full text-left px-6 py-3 text-[#3A3532] hover:bg-[#F6DEE1]/20"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link href="/qui-suis-je" onClick={close} className={linkClass}>
                    Qui suis-je
                  </Link>
                  <Link href="/pourquoi-commander" onClick={close} className={linkClass}>
                    Pourquoi commander
                  </Link>
                  {settings.show_club && (
                    <Link href="/club-fondatrices" onClick={close} className={linkClass}>
                      Le Cercle With Love
                    </Link>
                  )}
                  <Link href="/confiance" onClick={close} className={linkClass}>
                    Elles m'ont fait confiance
                  </Link>
                  {settings.show_public_testimonials && (
                    <Link href="/laisser-un-avis" onClick={close} className={linkClass}>
                      Laisser un avis
                    </Link>
                  )}

                  <div className="my-2 border-t border-[#F0EAE0]" />

                  <Link href="/recettes" onClick={close} className={linkClass}>
                    Recettes
                  </Link>
                  <Link href="/listes" onClick={close} className={linkClass}>
                    Listes
                  </Link>
                  {settings.show_parrainage && (
                    <Link href="/parrainage" onClick={close} className={linkClass}>
                      Parrainage
                    </Link>
                  )}
                  {settings.show_concours && (
                    <Link href="/grand-concours" onClick={close} className={linkClass}>
                      Grand Concours
                    </Link>
                  )}

                  <div className="my-2 border-t border-[#F0EAE0]" />

                  <Link href="/contact" onClick={close} className={linkClass}>
                    Me contacter
                  </Link>
                  <Link href="/login" onClick={close} className={linkClass}>
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
