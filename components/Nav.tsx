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

  const primaryLinkClass = 'text-sm text-[#3A3532]/80 hover:text-[#3A3532] no-underline whitespace-nowrap'
  const secondaryLinkClass = 'block px-6 py-3 text-[#3A3532] hover:bg-[#F6DEE1]/20 no-underline text-base'

  return (
    <>
      <nav className="px-6 py-4 border-b border-[#F0EAE0] flex flex-wrap justify-between items-center gap-3 bg-[#FDFBF6]">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="font-display text-lg text-[#3A3532] no-underline">
            Thermomix With Love, Hasna
          </Link>

          <div className="flex flex-wrap items-center gap-4">
            {user ? (
              <>
                <Link href="/recettes" className={primaryLinkClass}>
                  Recettes
                </Link>
                <Link href="/listes" className={primaryLinkClass}>
                  Listes
                </Link>
                <Link href="/favorites" className={primaryLinkClass}>
                  Mes favoris
                </Link>
                <Link href="/astuces" className={primaryLinkClass}>
                  Astuces
                </Link>
                <Link href="/challenge" className={primaryLinkClass}>
                  Challenge du mois
                </Link>
                {settings.show_public_testimonials && (
                  <Link href="/laisser-un-avis" className={primaryLinkClass}>
                    Laisser un avis
                  </Link>
                )}
                <button onClick={handleLogout} className={`${primaryLinkClass} cursor-pointer`}>
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link href="/qui-suis-je" className={primaryLinkClass}>
                  Qui suis-je
                </Link>
                <Link href="/pourquoi-commander" className={primaryLinkClass}>
                  Pourquoi commander
                </Link>
                {settings.show_club && (
                  <Link href="/cercle-withlove" className={primaryLinkClass}>
                    Le Cercle With Love
                  </Link>
                )}
                <Link href="/confiance" className={primaryLinkClass}>
                  Elles m'ont fait confiance
                </Link>
                {settings.show_public_testimonials && (
                  <Link href="/laisser-un-avis" className={primaryLinkClass}>
                    Laisser un avis
                  </Link>
                )}
                <Link href="/login" className={primaryLinkClass}>
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </div>

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
                  <Link href="/qui-suis-je" onClick={close} className={secondaryLinkClass}>
                    Qui suis-je
                  </Link>
                  <Link href="/pourquoi-commander" onClick={close} className={secondaryLinkClass}>
                    Pourquoi commander
                  </Link>
                  {settings.show_club && (
                    <Link href="/cercle-withlove" onClick={close} className={secondaryLinkClass}>
                      Le Cercle With Love
                    </Link>
                  )}
                  <Link href="/confiance" onClick={close} className={secondaryLinkClass}>
                    Elles m'ont fait confiance
                  </Link>
                  {settings.show_parrainage && (
                    <Link href="/parrainage" onClick={close} className={secondaryLinkClass}>
                      Parrainage
                    </Link>
                  )}
                  {settings.show_concours && (
                    <Link href="/grand-concours" onClick={close} className={secondaryLinkClass}>
                      Grand Concours
                    </Link>
                  )}

                  <div className="my-2 border-t border-[#F0EAE0]" />

                  <Link href="/contact" onClick={close} className={secondaryLinkClass}>
                    Me contacter
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={close} className={secondaryLinkClass}>
                      Admin
                    </Link>
                  )}

                  <div className="my-2 border-t border-[#F0EAE0]" />

                  <div className="px-6 py-2 text-sm text-[#3A3532]/50">{user.email}</div>
                </>
              ) : (
                <>
                  <Link href="/recettes" onClick={close} className={secondaryLinkClass}>
                    Recettes
                  </Link>
                  <Link href="/listes" onClick={close} className={secondaryLinkClass}>
                    Listes
                  </Link>
                  {settings.show_parrainage && (
                    <Link href="/parrainage" onClick={close} className={secondaryLinkClass}>
                      Parrainage
                    </Link>
                  )}
                  {settings.show_concours && (
                    <Link href="/grand-concours" onClick={close} className={secondaryLinkClass}>
                      Grand Concours
                    </Link>
                  )}

                  <div className="my-2 border-t border-[#F0EAE0]" />

                  <Link href="/contact" onClick={close} className={secondaryLinkClass}>
                    Me contacter
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