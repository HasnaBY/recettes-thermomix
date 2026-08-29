'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { categorizeIngredient } from '@/lib/categorizeIngredient'

type MenuItem = { recipe_id: string; recipe_title: string }
type Menu = { plats?: MenuItem[]; desserts?: MenuItem[]; boissons?: MenuItem[]; pains?: MenuItem[] }

export default function MenuPdfDownloadButton({
  menu,
  origin,
  periodStart,
}: {
  menu: Menu
  origin?: string
  periodStart?: string | null
}) {
  const [grouping, setGrouping] = useState<'recipe' | 'category'>('recipe')
  const [generatingMenu, setGeneratingMenu] = useState(false)
  const [generatingList, setGeneratingList] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const allItems = [
    ...(menu.plats ?? []),
    ...(menu.desserts ?? []),
    ...(menu.boissons ?? []),
    ...(menu.pains ?? []),
  ]

  const fetchRecipesAndAssets = async () => {
    const ids = allItems.map((i) => i.recipe_id)

    const { data: recipes, error: fetchError } = await supabase
      .from('recipes')
      .select('id, title, image_url, cookidoo_url, ingredients')
      .in('id', ids)

    if (fetchError || !recipes) throw new Error(fetchError?.message ?? 'Erreur de récupération des recettes')

    const { data: logoData } = await supabase
      .from('brand_photos')
      .select('key, image_url')
      .in('key', ['round_logo', 'menu_pdf_background'])

    const siteLogo = logoData?.find((l) => l.key === 'round_logo')?.image_url ?? null
    const backgroundImage = logoData?.find((l) => l.key === 'menu_pdf_background')?.image_url ?? null

    const { data: settings } = await supabase.from('site_settings').select('menu_pdf_tagline').eq('id', 1).single()
    const tagline = settings?.menu_pdf_tagline ?? 'Idées gourmandes pour simplifier le quotidien'

    return { recipes, siteLogo, backgroundImage, tagline }
  }

  const handleDownloadMenu = async () => {
    setGeneratingMenu(true)
    setError('')
    try {
      const { recipes, backgroundImage, tagline } = await fetchRecipesAndAssets()

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

      const distributeByDay = origin === 'admin' || (menu.plats ?? []).length >= 5

      const blob = await pdf(
        <MenuPdfDocument
          categorizedRecipes={categorizedRecipes}
          backgroundImage={backgroundImage}
          distributeByDay={distributeByDay}
          periodStart={periodStart ?? null}
          tagline={tagline}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'menu-thermomix.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGeneratingMenu(false)
    }
  }

  const handleDownloadShoppingList = async () => {
    setGeneratingList(true)
    setError('')
    try {
      const { recipes, siteLogo } = await fetchRecipesAndAssets()

      const { pdf } = await import('@react-pdf/renderer')
      const { default: ShoppingListPdfDocument } = await import('@/lib/pdf/ShoppingListPdfDocument')

      const recipeMap = new Map(recipes.map((r) => [r.id, r]))
      const orderedRecipes = allItems
        .map((i) => recipeMap.get(i.recipe_id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r))

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

      const generatedAt = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

      const blob = await pdf(
        <ShoppingListPdfDocument
          shoppingByRecipe={shoppingByRecipe}
          shoppingByCategory={shoppingByCategory}
          grouping={grouping}
          siteLogo={siteLogo}
          generatedAt={generatedAt}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'liste-de-courses.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGeneratingList(false)
    }
  }

  return (
    <div className="border border-[#F0EAE0] bg-white rounded-2xl p-4 mb-6">
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm text-[#3A3532] font-medium mb-2">Menu (recettes + liens Cookidoo)</p>
          <button
            onClick={handleDownloadMenu}
            disabled={generatingMenu || allItems.length === 0}
            className="py-2 px-5 bg-[#3A3532] text-[#FDFBF6] rounded-full text-sm font-medium disabled:opacity-50"
          >
            {generatingMenu ? 'Génération...' : 'Télécharger le menu en PDF'}
          </button>
        </div>

        <div className="pt-2 border-t border-[#F0EAE0]">
          <p className="text-sm text-[#3A3532] font-medium mb-2">Liste de courses</p>
          <div className="flex gap-2 mb-2 flex-wrap">
            <button
              onClick={() => setGrouping('recipe')}
              className={`px-3 py-1.5 rounded-full text-xs ${grouping === 'recipe' ? 'bg-[#3A3532] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Triée par recette
            </button>
            <button
              onClick={() => setGrouping('category')}
              className={`px-3 py-1.5 rounded-full text-xs ${grouping === 'category' ? 'bg-[#3A3532] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Triée par type de produit
            </button>
          </div>
          <button
            onClick={handleDownloadShoppingList}
            disabled={generatingList || allItems.length === 0}
            className="py-2 px-5 bg-[#3A3532] text-[#FDFBF6] rounded-full text-sm font-medium disabled:opacity-50"
          >
            {generatingList ? 'Génération...' : 'Télécharger la liste de courses en PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}