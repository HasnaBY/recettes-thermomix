'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { categorizeIngredient } from '@/lib/categorizeIngredient'

type MenuItem = { recipe_id: string; recipe_title: string }
type Menu = { plats?: MenuItem[]; desserts?: MenuItem[]; boissons?: MenuItem[]; pains?: MenuItem[] }

export default function MenuPdfDownloadButton({ menu }: { menu: Menu }) {
  const [grouping, setGrouping] = useState<'recipe' | 'category'>('recipe')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const allItems = [
    ...(menu.plats ?? []),
    ...(menu.desserts ?? []),
    ...(menu.boissons ?? []),
    ...(menu.pains ?? []),
  ]

  const handleDownload = async () => {
    setGenerating(true)
    setError('')
    try {
      const ids = allItems.map((i) => i.recipe_id)

      const { data: recipes, error: fetchError } = await supabase
        .from('recipes')
        .select('id, title, image_url, cookidoo_url, ingredients')
        .in('id', ids)

      if (fetchError || !recipes) throw new Error(fetchError?.message ?? 'Erreur de récupération des recettes')

      const { data: logoData } = await supabase
        .from('brand_photos')
        .select('key, image_url')
        .in('key', ['round_logo', 'cercle_logo'])

      const siteLogo = logoData?.find((l) => l.key === 'round_logo')?.image_url ?? null
      const cercleLogo = logoData?.find((l) => l.key === 'cercle_logo')?.image_url ?? siteLogo

      const { pdf } = await import('@react-pdf/renderer')
      const { default: MenuPdfDocument } = await import('@/lib/pdf/MenuPdfDocument')

      const recipeMap = new Map(recipes.map((r) => [r.id, r]))

      const buildCategoryList = (items: MenuItem[] | undefined) =>
        (items ?? [])
          .map((i) => recipeMap.get(i.recipe_id))
          .filter((r): r is NonNullable<typeof r> => Boolean(r))

      const categorizedRecipes = {
        plats: buildCategoryList(menu.plats),
        desserts: buildCategoryList(menu.desserts),
        boissons: buildCategoryList(menu.boissons),
        pains: buildCategoryList(menu.pains),
      }

      const orderedRecipes = [
        ...categorizedRecipes.plats,
        ...categorizedRecipes.desserts,
        ...categorizedRecipes.boissons,
        ...categorizedRecipes.pains,
      ]

      const shoppingByRecipe: { recipeTitle: string; items: string[] }[] = []
      const shoppingByCategory: Record<string, { ingredient: string; recipeTitle: string }[]> = {}

      orderedRecipes.forEach((r) => {
        const ingredients: string[] = r.ingredients ?? []
        shoppingByRecipe.push({ recipeTitle: r.title, items: ingredients })
        ingredients.forEach((ing) => {
          const cat = categorizeIngredient(ing)
          if (!shoppingByCategory[cat]) shoppingByCategory[cat] = []
          shoppingByCategory[cat].push({ ingredient: ing, recipeTitle: r.title })
        })
      })

      const blob = await pdf(
        <MenuPdfDocument
          categorizedRecipes={categorizedRecipes}
          shoppingByRecipe={shoppingByRecipe}
          shoppingByCategory={shoppingByCategory}
          grouping={grouping}
          siteLogo={siteLogo}
          cercleLogo={cercleLogo}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mon-menu-thermomix.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="border border-[#F0EAE0] bg-white rounded-2xl p-4 mb-6">
      <p className="text-sm text-[#3A3532] font-medium mb-2">Télécharger le menu en PDF</p>
      <div className="flex gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setGrouping('recipe')}
          className={`px-3 py-1.5 rounded-full text-xs ${grouping === 'recipe' ? 'bg-[#3A3532] text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Courses triées par recette
        </button>
        <button
          onClick={() => setGrouping('category')}
          className={`px-3 py-1.5 rounded-full text-xs ${grouping === 'category' ? 'bg-[#3A3532] text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Courses triées par type de produit
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      <button
        onClick={handleDownload}
        disabled={generating || allItems.length === 0}
        className="py-2 px-5 bg-[#3A3532] text-[#FDFBF6] rounded-full text-sm font-medium disabled:opacity-50"
      >
        {generating ? 'Génération du PDF...' : '📄 Télécharger en PDF'}
      </button>
    </div>
  )
}