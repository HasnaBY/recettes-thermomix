'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
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

  const pending = profiles.filter((p) => !p.approved)
  const approvedList = profiles.filter((p) => p.approved)

  const QuickLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '0.75rem 1rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        textDecoration: 'none',
        color: '#000',
        fontSize: '0.9rem',
      }}
    >
      {label}
    </Link>
  )

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Administration</h1>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Utilise le menu ☰ en haut pour accéder à toutes les pages de gestion du site.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '2.5rem' }}>
        <QuickLink href="/admin/dashboard" label="📊 Tableau de bord" />
        <QuickLink href="/admin/new-recipe" label="+ Ajouter une recette" />
        <QuickLink href="/admin/import-recipe" label="📥 Importer une recette" />
        <QuickLink href="/admin/messages" label="✉️ Messages de contact" />
      </div>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        Demandes de compte en attente ({pending.length})
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

      <details>
        <summary style={{ cursor: 'pointer', fontSize: '1.1rem', marginBottom: '1rem' }}>
          Comptes validés ({approvedList.length})
        </summary>
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
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
      </details>
    </div>
  )
}