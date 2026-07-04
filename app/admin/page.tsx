'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RecipesAdminList from '@/components/RecipesAdminList'

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


      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        Demandes en attente ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <p style={{ color: '#666', marginBottom: '2rem' }}>Aucune demande en attente.</p>
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

    </div>
  )
}
