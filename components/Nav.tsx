'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

export default function Nav() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav
      style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Link href="/" style={{ fontWeight: 'bold', textDecoration: 'none', color: 'inherit' }}>
        Recettes Thermomix
      </Link>

      {user ? (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
         <Link href="/favorites">Mes favoris</Link>
          <span style={{ fontSize: '0.9rem' }}>{user.email}</span>
          <button onClick={handleLogout} style={{ cursor: 'pointer' }}>
            Se déconnecter
          </button>
        </div>
      ) : (
        <Link href="/login">Se connecter</Link>
      )}
    </nav>
  )
}
