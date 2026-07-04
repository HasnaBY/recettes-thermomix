import FavoriteButton from '@/components/FavoriteButton'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default async function RecipeDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createClient()
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !recipe) {
    return <div style={{ padding: '2rem' }}>Recette introuvable</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Retour aux recettes
      </Link>

      <FavoriteButton recipeId={id} />

<h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{recipe.title}</h1>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{recipe.title}</h1>
      <p style={{ color: '#666', marginBottom: '1rem' }}>{recipe.description}</p>
      <p style={{ marginBottom: '1.5rem' }}>
        {recipe.category} · {recipe.time_minutes} min
      </p>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Ingrédients</h2>
      <pre style={{ marginBottom: '1.5rem' }}>
        {JSON.stringify(recipe.ingredients, null, 2)}
      </pre>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Étapes</h2>
      <p>{recipe.steps}</p>
    </div>
  )
}
