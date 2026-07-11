'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RecipesAdminList from '@/components/RecipesAdminList'
import AdminEditButton from '@/components/AdminEditButton'

type Profile = {
  id: string
  email: string
  approved: boolean
  is_admin: boolean
  created_at: string
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        window.location.href = '/login'
        return
      }

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userData.user.id)
        .single()

      if (!myProfile?.is_admin) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setIsAdmin(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) setProfiles(data)
      setLoading(false)
    }
    load()
  }, [])

  const toggleApproval = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ approved: !current }).eq('id', id)
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, approved: !current } : p)))
  }

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>

  if (!isAdmin) {
    return <div style={{ padding: '2rem' }}>Accès réservé aux administrateurs.</div>
  }

  const pending = profiles.filter((p) => !p.approved)
  const approvedList = profiles.filter((p) => p.approved)

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Administration</h1>

      <Link href="/admin/new-recipe" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
  + Ajouter une recette
</Link>
<Link href="/admin/testimonials" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Gérer les témoignages
</Link>
<Link href="/admin/messages" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Messages de contact
</Link>

<Link href="/admin/homepage" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Modifier l'accueil
</Link>

<Link href="/admin/about" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Modifier "Qui suis-je ?"
</Link>

<Link href="/admin/why-order" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Modifier "Pourquoi commander"
</Link>

<Link href="/admin/club" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Gérer le Cercle With Love
</Link>

<Link href="/admin/referrals" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Gérer le parrainage
</Link>
<Link href="/admin/contest" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Modifier "Grand Concours"
</Link>

<Link href="/admin/contact-settings" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Réglages contact
</Link>

<Link href="/admin/social-proof" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Gérer "Elles m'ont fait confiance"
</Link>

<Link href="/admin/challenge" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Gérer le challenge du mois
</Link>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        Demandes en attente ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <p style={{ color:'#666', marginBottom: '2rem' }}>Aucune demande en attente.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
          {pending.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
              }}
            >
              <span>{p.email}</span>
              <button
                onClick={() => toggleApproval(p.id, p.approved)}
                style={{
                  padding: '0.4rem 0.8rem',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Valider
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        Comptes validés ({approvedList.length})
      </h2>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {approvedList.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
            }}
          >
            <span>
              {p.email} {p.is_admin && '(admin)'}
            </span>
            {!p.is_admin && (
              <button
                onClick={() => toggleApproval(p.id, p.approved)}
                style={{
                  padding: '0.4rem 0.8rem',
                  backgroundColor: '#fff',
                  color: '#000',
                  border: '1px solid #000',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Révoquer
              </button>
            )}
          </div>
        ))}
      </div>


      <h2 style={{ fontSize: '1.25rem', margin: '2rem 0 1rem' }}>Recettes</h2>
<RecipesAdminList />
<AdminEditButton href="/admin/homepage" />`
  
  <Link href="/admin/site-settings" style={{ display: 'inline-block', marginLeft: '1rem', marginBottom: '1.5rem' }}>
  Visibilité des pages
</Link>

    </div>
  )
}
