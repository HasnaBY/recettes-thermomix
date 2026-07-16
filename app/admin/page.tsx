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

const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Contenu du site',
    links: [
      { href: '/admin/homepage', label: "Modifier l'accueil" },
      { href: '/admin/about', label: 'Modifier "Qui suis-je ?"' },
      { href: '/admin/why-order', label: 'Modifier "Pourquoi commander"' },
      { href: '/admin/club', label: 'Gérer le Cercle With Love' },
      { href: '/admin/contest', label: 'Modifier "Grand Concours"' },
      { href: '/admin/brand-photos', label: 'Photos de marque' },
      { href: '/admin/site-settings', label: 'Visibilité des pages' },
    ],
  },
  {
    title: 'Recettes',
    links: [
      { href: '/admin/new-recipe', label: '+ Ajouter une recette' },
      { href: '/admin/recipe-lists', label: 'Gérer les listes de recettes' },
    ],
  },
  {
    title: 'Astuces & challenge',
    links: [
      { href: '/admin/tips', label: 'Gérer les astuces Thermomix' },
      { href: '/admin/challenge', label: 'Gérer le challenge du mois' },
    ],
  },
  {
    title: 'Témoignages & confiance',
    links: [
      { href: '/admin/testimonials', label: 'Gérer les témoignages' },
      { href: '/admin/social-proof', label: 'Gérer "Elles m\'ont fait confiance"' },
    ],
  },
  {
    title: 'Contact & offres',
    links: [
      { href: '/admin/messages', label: 'Messages de contact' },
      { href: '/admin/contact-settings', label: 'Réglages contact' },
      { href: '/admin/offers', label: 'Offres du moment' },
    ],
  },
  {
    title: 'Parrainage',
    links: [{ href: '/admin/referrals', label: 'Gérer le parrainage' }],
  },
]

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
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Administration</h1>

      {SECTIONS.map((section) => (
        <div key={section.title} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#666', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {section.title}
          </h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'block',
                  padding: '0.75rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#000',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ))}

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
      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
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

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recettes</h2>
      <RecipesAdminList />
    </div>
  )
}
