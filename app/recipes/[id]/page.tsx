import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import FavoriteButton from '@/components/FavoriteButton'

export default async function RecipeDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !recipe) {
    return <div className="p-8 text-center text-[#3A3532]/60">Recette introuvable</div>
  }

  const isCreation = recipe.recipe_source === 'creation'

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <Link href="/recettes" className="inline-block mb-4 text-sm text-[#3A3532]/70 hover:text-[#3A3532]">
        ← Retour aux recettes
      </Link>

      <FavoriteButton recipeId={id} />

      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="w-full h-64 object-cover rounded-2xl my-4"
        />
      )}

      <div className="mb-3">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isCreation ? 'bg-[#F6DEE1]/60' : 'bg-[#DCEAF0]/60'
          } text-[#3A3532]`}
        >
          {isCreation ? '👩‍🍳 Ma création' : '📱 Recette Cookidoo'}
        </span>
      </div>

      <h1 className="font-display text-3xl text-[#3A3532] mb-2">{recipe.title}</h1>
      <p className="text-[#3A3532]/70 mb-3">{recipe.description}</p>
      <p className="text-sm text-[#3A3532]/50 mb-2">
        {recipe.category}
        {recipe.origin && ` · ${recipe.origin}`}
      </p>

      {(recipe.prep_time_minutes || recipe.total_time_minutes) && (
        <div className="flex gap-4 mb-4 text-sm text-[#3A3532]/70">
          {recipe.prep_time_minutes && (
            <span>⏱️ {recipe.prep_time_minutes} min de préparation</span>
          )}
          {recipe.total_time_minutes && (
            <span>🍽️ {recipe.total_time_minutes} min au total</span>
          )}
        </div>
      )}

      {recipe.cookidoo_url && (
        <a
          href={recipe.cookidoo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mb-6 px-4 py-2 bg-[#F6DEE1]/40 text-[#3A3532] rounded-full text-sm font-medium hover:bg-[#F6DEE1]/70 border border-[#C9A44C]"
        >
          📱 Ouvrir sur Cookidoo
        </a>
      )}

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-xl text-[#3A3532] mb-3">Ingrédients</h2>
          <ul className="grid gap-1.5">
            {recipe.ingredients.map((ingredient: string, i: number) => (
              <li key={i} className="text-[#3A3532]/80 flex gap-2">
                <span className="text-[#C9A44C]">•</span> {ingredient}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.steps && (
        <section>
          <h2 className="font-display text-xl text-[#3A3532] mb-3">Étapes de préparation</h2>
          <p className="text-[#3A3532]/80 whitespace-pre-wrap leading-relaxed">{recipe.steps}</p>
        </section>
      )}
    </div>
  )
}
