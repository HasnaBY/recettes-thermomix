'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Recipe = { id: string; title: string }
type Item = { id: string; recipe_id: string; position: number; recipes: Recipe }

export default function AdminRecipeListDetail({ params }: { params: Promise<{ id: string }> }) {
  const [listId, setListId] = useState('')
  const [listTitle, setListTitle] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadItems = async (id: string) => {
    const { data } = await supabase
      .from('recipe_list_items')
      .select('id, recipe_id, position, recipes(id, title)')
      .eq('list_id', id)
      .order('position')
    setItems((data ?? []) as any)
  }

  useEffect(() => {
    const load = async () => {
      const { id } = await params
      setListId(id)

      const { data: listData } = await supabase.from('recipe_lists').select('title').eq('id', id).single()
      setListTitle(listData?.title ?? '')

      const { data: recipesData } = await supabase.from('recipes').select('id, title').order('title')
      setAllRecipes(recipesData ?? [])

      await loadItems(id)
      setLoading(false)
    }
    load()
  }, [])

  const addRecipe = async () => {
    if (!selectedRecipeId) return
    await supabase.from('recipe_list_items').insert({
      list_id: listId,
      recipe_id: selectedRecipeId,
      position: items.length,
    })
    setSelectedRecipeId('')
    loadItems(listId)
  }

  const removeItem = async (itemId: string) => {
    await supabase.from('recipe_list_items').delete().eq('id', itemId)
    loadItems(listId)
  }

  const moveItem = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= items.length) return

    const current = items[index]
    const target = items[targetIndex]

    await supabase.from('recipe_list_items').update({ position: target.position }).eq('id', current.id)
    await supabase.from('recipe_list_items').update({ position: current.position }).eq('id', target.id)

    loadItems(listId)
  }

  if (loading) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  const availableRecipes = allRecipes.filter((r) => !items.some((i) => i.recipe_id === r.id))

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-[#3A3532] mb-6">Liste : {listTitle}</h1>

      <div className="flex gap-2 mb-8">
        <select
          value={selectedRecipeId}
          onChange={(e) => setSelectedRecipeId(e.target.value)}
          className="flex-1 px-4 py-2 border border-[#F0EAE0] rounded-xl"
        >
          <option value="">Choisir une recette à ajouter...</option>
          {availableRecipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        <button
          onClick={addRecipe}
          disabled={!selectedRecipeId}
          className="px-4 py-2 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium disabled:opacity-50"
        >
          Ajouter
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={item.id} className="flex justify-between items-center border border-[#F0EAE0] rounded-xl p-3">
            <span className="text-[#3A3532]">{item.recipes.title}</span>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => moveItem(i, -1)}
                disabled={i === 0}
                className="px-2 py-1 border border-[#F0EAE0] rounded text-sm disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => moveItem(i, 1)}
                disabled={i === items.length - 1}
                className="px-2 py-1 border border-[#F0EAE0] rounded text-sm disabled:opacity-30"
              >
                ↓
              </button>
              <button onClick={() => removeItem(item.id)} className="text-sm text-red-600 ml-2">
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
