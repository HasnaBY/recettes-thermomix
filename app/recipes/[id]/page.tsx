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

      <h1 className="font-display text-3xl text-[#3A3532] mb-2">{recipe.title}</h1>
      <p className="text-[#3A3532]/70 mb-3">{recipe.description}</p>
      <p className="text-sm text-[#3A3532]/50 mb-4">
        {recipe.category}
        {recipe.origin && ` · ${recipe.origin}`} · {recipe.time_minutes} min
      </p>

      {recipe.cookidoo_url && (
        <a
          href={recipe.cookidoo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-[#F6DEE1]/40 text-[#3A3532] rounded-full text-sm font-medium hover:bg-[#F6DEE1]/70 border border-[#C9A44C]"
        >
          📱 Ouvrir sur Cookidoo
        </a>
      )}
    </div>
  )
}
