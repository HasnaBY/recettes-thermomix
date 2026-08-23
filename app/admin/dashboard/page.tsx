'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CategoryCount = { category: string; count: number }

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [totalRecipes, setTotalRecipes] = useState(0)
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([])
  const [featuredCount, setFeaturedCount] = useState(0)
  const [creationCount, setCreationCount] = useState(0)
  const [cookidooCount, setCookidooCount] = useState(0)

  const [totalAccounts, setTotalAccounts] = useState(0)
  const [approvedAccounts, setApprovedAccounts] = useState(0)
  const [pendingAccounts, setPendingAccounts] = useState(0)

  const [totalMenus, setTotalMenus] = useState(0)
  const [totalTestimonials, setTotalTestimonials] = useState(0)
  const [pendingTestimonials, setPendingTestimonials] = useState(0)
  const [totalTips, setTotalTips] = useState(0)
  const [totalContactMessages, setTotalContactMessages] = useState(0)
  const [totalReferrals, setTotalReferrals] = useState(0)
  const [totalChallengeEntries, setTotalChallengeEntries] = useState(0)
  const [totalFavorites, setTotalFavorites] = useState(0)

  const [noImageCount, setNoImageCount] = useState(0)
  const [noCategoryCount, setNoCategoryCount] = useState(0)
  const [noOriginCount, setNoOriginCount] = useState(0)
  const [noIngredientsCount, setNoIngredientsCount] = useState(0)
  const [duplicateTitles, setDuplicateTitles] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: recipes } = await supabase.from('recipes').select('category, recipe_source, is_featured')

      const { data: fullRecipes } = await supabase.from('recipes').select('title, category, origin, image_url, ingredients')

      setNoImageCount(fullRecipes?.filter((r) => !r.image_url).length ?? 0)
      setNoCategoryCount(fullRecipes?.filter((r) => !r.category).length ?? 0)
      setNoOriginCount(fullRecipes?.filter((r) => !r.origin).length ?? 0)
      setNoIngredientsCount(fullRecipes?.filter((r) => !r.ingredients || r.ingredients.length === 0).length ?? 0)

      const titleCounts: Record<string, number> = {}
      fullRecipes?.forEach((r) => {
        const key = r.title.trim().toLowerCase()
        titleCounts[key] = (titleCounts[key] ?? 0) + 1
      })
      setDuplicateTitles(Object.entries(titleCounts).filter(([, c]) => c > 1).map(([t]) => t))


      setTotalRecipes(recipes?.length ?? 0)
      setFeaturedCount(recipes?.filter((r) => r.is_featured).length ?? 0)
      setCreationCount(recipes?.filter((r) => r.recipe_source === 'creation').length ?? 0)
      setCookidooCount(recipes?.filter((r) => r.recipe_source !== 'creation').length ?? 0)

      
      const catMap: Record<string, number> = {}
      recipes?.forEach((r) => {
        const cat = r.category || 'Non classée'
        catMap[cat] = (catMap[cat] ?? 0) + 1
      })
      setCategoryCounts(
        Object.entries(catMap)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
      )

      const { data: profiles } = await supabase.from('profiles').select('approved, is_admin')
      const clients = profiles?.filter((p) => !p.is_admin) ?? []
      setTotalAccounts(clients.length)
      setApprovedAccounts(clients.filter((p) => p.approved).length)
      setPendingAccounts(clients.filter((p) => !p.approved).length)

      const { count: menusCount } = await supabase
        .from('generated_menus')
        .select('*', { count: 'exact', head: true })
      setTotalMenus(menusCount ?? 0)

      const { data: testimonials } = await supabase.from('testimonials').select('approved')
      setTotalTestimonials(testimonials?.length ?? 0)
      setPendingTestimonials(testimonials?.filter((t) => !t.approved).length ?? 0)

      const { count: tipsCount } = await supabase.from('tips').select('*', { count: 'exact', head: true })
      setTotalTips(tipsCount ?? 0)

      const { count: messagesCount } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
      setTotalContactMessages(messagesCount ?? 0)

      const { count: referralsCount } = await supabase.from('referrals').select('*', { count: 'exact', head: true })
      setTotalReferrals(referralsCount ?? 0)

      const { count: challengeCount } = await supabase
        .from('challenge_entries')
        .select('*', { count: 'exact', head: true })
      setTotalChallengeEntries(challengeCount ?? 0)

      const { count: favCount } = await supabase.from('favorites').select('*', { count: 'exact', head: true })
      setTotalFavorites(favCount ?? 0)

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <div className="border border-gray-200 rounded-xl p-4 text-center">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>

      <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-3">Recettes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Recettes au total" value={totalRecipes} />
        <StatCard label="En avant sur l'accueil" value={featuredCount} />
        <StatCard label="Mes créations" value={creationCount} />
        <StatCard label="Recettes Cookidoo" value={cookidooCount} />
      </div>

      <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-3">Recettes par catégorie</h2>
      <div className="grid gap-2 mb-8">
        {categoryCounts.map((c) => (
          <div key={c.category} className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-700">{c.category}</span>
            <span className="text-sm font-medium text-gray-900">{c.count}</span>
          </div>
        ))}
      </div>

      <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-3">Qualité du contenu</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Sans photo" value={noImageCount} />
          <StatCard label="Sans catégorie" value={noCategoryCount} />
          <StatCard label="Sans origine" value={noOriginCount} />
          <StatCard label="Sans ingrédients" value={noIngredientsCount} />
        </div>
        {duplicateTitles.length > 0 && (
          <div className="border border-amber-300 bg-amber-50 rounded-xl p-3 mb-8">
            <p className="text-sm font-medium text-amber-800 mb-1">Titres potentiellement en doublon :</p>
            <p className="text-xs text-amber-700">{duplicateTitles.join(', ')}</p>
          </div>
        )}

      <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-3">Clientes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <StatCard label="Comptes créés" value={totalAccounts} />
        <StatCard label="Comptes validés" value={approvedAccounts} />
        <StatCard label="En attente de validation" value={pendingAccounts} />
      </div>

      <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-3">Activité</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Menus générés" value={totalMenus} />
        <StatCard label="Favoris ajoutés" value={totalFavorites} />
        <StatCard label="Témoignages publiés" value={totalTestimonials} />
        <StatCard label="Témoignages en attente" value={pendingTestimonials} />
        <StatCard label="Astuces publiées" value={totalTips} />
        <StatCard label="Messages de contact" value={totalContactMessages} />
        <StatCard label="Parrainages déclarés" value={totalReferrals} />
        <StatCard label="Participations au challenge" value={totalChallengeEntries} />
      </div>
    </div>
  )
}