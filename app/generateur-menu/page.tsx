'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type MenuItem = { recipe_id: string; recipe_title: string }
type Menu = { plats: MenuItem[]; desserts: MenuItem[] }

export default function GenerateurMenu() {
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [approved, setApproved] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [nbPlats, setNbPlats] = useState('5')
  const [nbDesserts, setNbDesserts] = useState('2')
  const [source, setSource] = useState('favorites')

  const [menu, setMenu] = useState<Menu | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [usedCount, setUsedCount] = useState(0)
  const [limit, setLimit] = useState(3)
  const [showForm, setShowForm] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setCheckingAccess(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('approved, is_admin')
        .eq('id', userData.user.id)
        .single()

      setApproved(!!profile?.approved)
      setIsAdmin(!!profile?.is_admin)

      if (profile?.approved) {
        const { data: lastMenu } = await supabase
          .from('generated_menus')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (lastMenu) {
          setMenu(lastMenu.menu)
          setGeneratedAt(lastMenu.created_at)
        } else {
          setShowForm(true)
        }

        const { count } = await supabase
          .from('generated_menus')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userData.user.id)
        setUsedCount(count ?? 0)

        const { data: settings } = await supabase
          .from('site_settings')
          .select('menu_generation_limit')
          .eq('id', 1)
          .single()
        setLimit(settings?.menu_generation_limit ?? 3)
      }

      setCheckingAccess(false)
    }
    load()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setError('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          nbPlats: parseInt(nbPlats),
          nbDesserts: parseInt(nbDesserts),
          source,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue')
      } else {
        setMenu(data.menu)
        setGeneratedAt(new Date().toISOString())
        setShowForm(false)
        setUsedCount((prev) => prev + 1)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (checkingAccess) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  if (!approved) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-[#3A3532]/70">
        Connecte-toi et fais valider ton compte pour accéder au générateur de menu.{' '}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </div>
    )
  }

  const remaining = isAdmin ? null : Math.max(limit - usedCount, 0)
  const canGenerate = isAdmin || remaining! > 0

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-2 text-center">🗓️ Générateur de menu</h1>
      <p className="text-[#3A3532]/70 text-center mb-2">
        Génère ton menu à partir des recettes du site.
      </p>
      {remaining !== null && (
        <p className="text-sm text-[#3A3532]/50 text-center mb-8">
          {remaining} génération{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}
        </p>
      )}

      {menu && !showForm && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-xl text-[#3A3532]">Ton menu actuel</h2>
            {generatedAt && (
              <p className="text-xs text-[#3A3532]/40">
                {new Date(generatedAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>

          {menu.plats?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-display text-lg text-[#3A3532] mb-2">🍽️ Plats</h3>
              <div className="flex flex-col gap-2">
                {menu.plats.map((item, i) => (
                  <Link
                    key={i}
                    href={`/recipes/${item.recipe_id}`}
                    className="px-3 py-2 bg-[#DCEAF0]/30 rounded-xl no-underline text-[#3A3532] text-sm font-medium"
                  >
                    {item.recipe_title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {menu.desserts?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-display text-lg text-[#3A3532] mb-2">🍰 Desserts / goûters</h3>
              <div className="flex flex-col gap-2">
                {menu.desserts.map((item, i) => (
                  <Link
                    key={i}
                    href={`/recipes/${item.recipe_id}`}
                    className="px-3 py-2 bg-[#F6DEE1]/30 rounded-xl no-underline text-[#3A3532] text-sm font-medium"
                  >
                    {item.recipe_title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {canGenerate && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-[#3A3532] underline"
            >
              Générer un nouveau menu
            </button>
          )}
        </div>
      )}

      {showForm && (
        <>
          {!canGenerate ? (
            <p className="text-red-600 text-center mb-8">
              Tu as atteint ta limite de {limit} générations de menu.
            </p>
          ) : (
            <form onSubmit={handleGenerate} className="border border-[#F0EAE0] bg-white rounded-2xl p-5 mb-10 flex flex-col gap-4">
              <div>
                <label className="block mb-1 text-sm text-[#3A3532]/70">Recettes à utiliser</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-4 py-2 border border-[#F0EAE0] rounded-xl"
                >
                  <option value="favorites">Mes recettes favorites</option>
                  <option value="all">Toutes les recettes du site</option>
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block mb-1 text-sm text-[#3A3532]/70">Nombre de plats</label>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={nbPlats}
                    onChange={(e) => setNbPlats(e.target.value)}
                    className="w-full px-4 py-2 border border-[#F0EAE0] rounded-xl"
                  />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 text-sm text-[#3A3532]/70">Nombre de desserts/goûters</label>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={nbDesserts}
                    onChange={(e) => setNbDesserts(e.target.value)}
                    className="w-full px-4 py-2 border border-[#F0EAE0] rounded-xl"
                  />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={generating}
                className="py-2.5 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors border border-[#C9A44C] disabled:opacity-50"
              >
                {generating ? 'Génération en cours...' : 'Générer mon menu'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}