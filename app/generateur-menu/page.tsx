'use client'

import { getNextMonday, toDateInputValue } from '@/lib/dateHelpers'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import MenuPdfDownloadButton from '@/components/MenuPdfDownloadButton'

type MenuItem = { recipe_id: string; recipe_title: string }
type Menu = { plats: MenuItem[]; desserts: MenuItem[]; boissons: MenuItem[]; pains: MenuItem[]; notes?: string[] }
type MenuRow = { id: string; menu: Menu; created_at: string; origin: string }

export default function GenerateurMenu() {
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [approved, setApproved] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [nbPlats, setNbPlats] = useState('5')
  const [nbDesserts, setNbDesserts] = useState('2')
  const [nbBoissons, setNbBoissons] = useState('0')
  const [nbPains, setNbPains] = useState('0')
  const [source, setSource] = useState('favorites')

  const [adminMenu, setAdminMenu] = useState<MenuRow | null>(null)
  const [clientMenu, setClientMenu] = useState<MenuRow | null>(null)
  const [generating, setGenerating] = useState(false)
  const [swappingId, setSwappingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [usedCount, setUsedCount] = useState(0)
  const [limit, setLimit] = useState(3)
  const [showForm, setShowForm] = useState(false)

  const [periodStart, setPeriodStart] = useState(toDateInputValue(getNextMonday()))

  const supabase = createClient()

  const loadMenus = async (userId: string) => {
    const { data: admin } = await supabase
      .from('generated_menus')
      .select('*')
      .eq('user_id', userId)
      .eq('origin', 'admin')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setAdminMenu(admin as any)

    const { data: client } = await supabase
      .from('generated_menus')
      .select('*')
      .eq('user_id', userId)
      .eq('origin', 'client')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setClientMenu(client as any)

    if (!client) setShowForm(true)
  }

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
        await loadMenus(userData.user.id)

        const { count } = await supabase
          .from('generated_menus')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userData.user.id)
          .eq('origin', 'client')
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
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id

      const response = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({
          nbPlats: parseInt(nbPlats),
          nbDesserts: parseInt(nbDesserts),
          nbBoissons: parseInt(nbBoissons) || 0,
          nbPains: parseInt(nbPains) || 0,
          source,
          periodStart,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue')
      } else {
        setShowForm(false)
        setUsedCount((prev) => prev + 1)
        if (userId) await loadMenus(userId)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSwap = async (
    menuRow: MenuRow,
    setMenuRow: (m: MenuRow) => void,
    itemType: 'plats' | 'desserts' | 'boissons' | 'pains',
    oldRecipeId: string
  ) => {
    setSwappingId(oldRecipeId)
    setError('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/swap-menu-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ menuId: menuRow.id, itemType, oldRecipeId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue')
      } else {
        setMenuRow({ ...menuRow, menu: { ...menuRow.menu, ...data.menu } })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSwappingId(null)
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

  const renderMenuBlock = (menuRow: MenuRow, setMenuRow: (m: MenuRow) => void, title: string) => {
    const renderSection = (
      sectionTitle: string,
      emoji: string,
      items: MenuItem[] | undefined,
      itemType: 'plats' | 'desserts' | 'boissons' | 'pains',
      bg: string
    ) => {
      if (!items || items.length === 0) return null
      return (
        <div className="mb-4">
          <h4 className="font-display text-base text-[#3A3532] mb-2">
            {emoji} {sectionTitle}
          </h4>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.recipe_id} className={`flex justify-between items-center px-3 py-2 ${bg} rounded-xl`}>
                <Link href={`/recipes/${item.recipe_id}`} className="text-sm font-medium text-[#3A3532] no-underline flex-1">
                  {item.recipe_title}
                </Link>
                <button
                  onClick={() => handleSwap(menuRow, setMenuRow, itemType, item.recipe_id)}
                  disabled={swappingId === item.recipe_id}
                  className="text-xs text-[#3A3532]/60 underline ml-2 shrink-0 disabled:opacity-50"
                >
                  {swappingId === item.recipe_id ? '...' : 'Remplacer'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="mb-10 border border-[#F0EAE0] bg-white rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-xl text-[#3A3532]">{title}</h3>
          <p className="text-xs text-[#3A3532]/40">
            {new Date(menuRow.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>

        {menuRow.menu.notes && menuRow.menu.notes.length > 0 && (
          <div className="mb-4 border border-[#C9A44C] bg-[#F6DEE1]/20 rounded-xl p-3">
            {menuRow.menu.notes.map((note, i) => (
              <p key={i} className="text-xs text-[#3A3532]/80">
                {note}
              </p>
            ))}
          </div>
        )}

        <MenuPdfDownloadButton menu={menuRow.menu} origin={menuRow.origin} periodStart={(menuRow as any).params?.periodStart} />
        {renderSection('Plats', '🍽️', menuRow.menu.plats, 'plats', 'bg-[#DCEAF0]/30')}
        {renderSection('Desserts / goûters', '🍰', menuRow.menu.desserts, 'desserts', 'bg-[#F6DEE1]/30')}
        {renderSection('Boissons', '🥤', menuRow.menu.boissons, 'boissons', 'bg-[#E3ECDD]/40')}
        {renderSection('Pains', '🍞', menuRow.menu.pains, 'pains', 'bg-[#F0EAE0]')}
      </div>
    )
  }

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-display text-3xl text-[#3A3532]">🗓️ Mes menus</h1>
        <Link href="/mes-menus" className="text-sm text-[#3A3532]/60 underline whitespace-nowrap">
          Historique
        </Link>
      </div>
      <p className="text-[#3A3532]/70 text-center mb-2">
        Génère ton menu à partir des recettes du site.
      </p>
      {remaining !== null && (
        <p className="text-sm text-[#3A3532]/50 text-center mb-8">
          {remaining} génération{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}
        </p>
      )}

      {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

      {adminMenu && renderMenuBlock(adminMenu, setAdminMenu, '💛 Le menu que Hasna t\'a préparé')}

      {clientMenu && !showForm && renderMenuBlock(clientMenu, setClientMenu, 'Ton menu')}

      {(!clientMenu || showForm) && (
        <>
          {!canGenerate ? (
            <p className="text-red-600 text-center mb-8">
              Tu as atteint ta limite de {limit} générations de menu.
            </p>
          ) : (
            <form onSubmit={handleGenerate} className="border border-[#F0EAE0] bg-white rounded-2xl p-5 mb-10 flex flex-col gap-4">
              <h2 className="font-display text-lg text-[#3A3532]">Générer mon propre menu</h2>

              <div>
                <label className="block mb-1 text-sm text-[#3A3532]/70">Semaine du (lundi)</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-4 py-2 border border-[#F0EAE0] rounded-xl"
                />
              </div>
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
                  <label className="block mb-1 text-sm text-[#3A3532]/70">Plats</label>
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
                  <label className="block mb-1 text-sm text-[#3A3532]/70">Desserts/goûters</label>
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

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block mb-1 text-sm text-[#3A3532]/70">Boissons</label>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={nbBoissons}
                    onChange={(e) => setNbBoissons(e.target.value)}
                    className="w-full px-4 py-2 border border-[#F0EAE0] rounded-xl"
                  />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 text-sm text-[#3A3532]/70">Pains</label>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={nbPains}
                    onChange={(e) => setNbPains(e.target.value)}
                    className="w-full px-4 py-2 border border-[#F0EAE0] rounded-xl"
                  />
                </div>
              </div>

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

      {clientMenu && !showForm && canGenerate && (
        <button onClick={() => setShowForm(true)} className="text-sm text-[#3A3532] underline block mx-auto">
          Générer un nouveau menu (remplace mon menu personnel ci-dessus)
        </button>
      )}
    </div>
  )
}