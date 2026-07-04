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
    return <div className="p-8 text-center text-gray-500">Recette introuvable</div>
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <Link href="/" className="inline-block mb-4 text-sm text-gray-600 hover:text-black">
        ← Retour aux recettes
      </Link>

      <FavoriteButton recipeId={id} />

      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="w-full h-64 object-cover rounded-xl my-4"
        />
      )}

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
      <p className="text-gray-600 mb-3">{recipe.description}</p>
      <p className="text-sm text-gray-500 mb-6">
        {recipe.category} · {recipe.time_minutes} min
        {recipe.cookidoo_url && (
  <a
    href={recipe.cookidoo_url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block mb-6 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100"
  >
    📱 Ouvrir sur Cookidoo
  </a>
)}

      </p>

      <h2 className="text-lg font-semibold text-gray-900 mb-2">Ingrédients</h2>
      <pre className="text-sm bg-gray-50 rounded-lg p-4 mb-6 whitespace-pre-wrap">
        {JSON.stringify(recipe.ingredients, null, 2)}
      </pre>

      <h2 className="text-lg font-semibold text-gray-900 mb-2">Étapes</h2>
      <p className="text-gray-700 whitespace-pre-wrap">{recipe.steps}</p>
    </div>
  )
}
