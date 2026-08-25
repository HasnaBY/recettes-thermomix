import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import FavoriteButton from '@/components/FavoriteButton'

function renderWithLinks(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-[#3A3532]">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export default async function RecipeDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  let isApproved = false
  let isAdmin = false

  if (userData.user) {
    const { data: profile } = await supabase.from('profiles').select('approved, is_admin').eq('id', userData.user.id).single()
    isApproved = !!profile?.approved
    isAdmin = !!profile?.is_admin
  }

  const { data: recipe, error } = await supabase.from('recipes').select('*').eq('id', id).single()

  if (error || !recipe) {
    return (
      <div className="p-8 text-center text-[#3A3532]/60">
        Cette recette est introuvable ou réservée aux clientes connectées.{' '}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </div>
    )
  }

  if (recipe.status === 'draft' && !isAdmin) {
    return <div className="p-8 text-center text-[#3A3532]/60">Cette recette n'est pas encore disponible.</div>
  }

  const isCreation = recipe.recipe_source === 'creation'

  const { data: siteSettings } = await supabase.from('site_settings').select('hide_cookidoo_steps').eq('id', 1).single()
  const hideDetails = !isCreation && !!siteSettings?.hide_cookidoo_steps && !isAdmin

  let relatedRecipes: { id: string; title: string; image_url: string | null }[] = []
  if (recipe.related_recipe_ids && recipe.related_recipe_ids.length > 0) {
    const { data } = await supabase.from('recipes').select('id, title, image_url').in('id', recipe.related_recipe_ids)
    relatedRecipes = data ?? []
  }

  if (!isApproved) {
    return (
      <div className="p-6 sm:p-8 max-w-2xl mx-auto">
        <Link href="/recettes" className="inline-block mb-4 text-sm text-[#3A3532]/70 hover:text-[#3A3532]">
          ← Retour aux recettes
        </Link>

        {recipe.image_url && (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-64 object-cover rounded-2xl my-4" />
        )}

        <div className="mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full ${isCreation ? 'bg-[#F6DEE1]/60' : 'bg-[#DCEAF0]/60'} text-[#3A3532]`}>
            {isCreation ? '👩‍🍳 Ma création' : '📱 Recette Cookidoo'}
          </span>
        </div>

        <h1 className="font-display text-3xl text-[#3A3532] mb-2">{recipe.title}</h1>
        <p className="text-[#3A3532]/70 mb-3">{recipe.description}</p>
        <p className="text-sm text-[#3A3532]/50 mb-6">
          {recipe.category}
          {recipe.origin && ` · ${recipe.origin}`}
        </p>

        <div className="border border-[#C9A44C] bg-[#F6DEE1]/20 rounded-2xl p-5 text-center">
          <p className="text-[#3A3532]/80 mb-4">
            Les ingrédients et les étapes complètes de cette recette sont réservés à mes clientes connectées.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
          >
            Se connecter pour voir la recette complète
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <Link href="/recettes" className="text-sm text-[#3A3532]/70 hover:text-[#3A3532]">
          ← Retour aux recettes
        </Link>
        {isAdmin && (
          <Link href={`/admin/edit-recipe/${id}`} className="text-sm px-3 py-1.5 bg-[#3A3532] text-[#FDFBF6] rounded-full no-underline">
            ✏️ Modifier
          </Link>
        )}
      </div>

      <FavoriteButton recipeId={id} />

      {recipe.image_url && (
        <img src={recipe.image_url} alt={recipe.title} className="w-full h-64 object-cover rounded-2xl my-4" />
      )}

      <div className="mb-3 flex gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full ${isCreation ? 'bg-[#F6DEE1]/60' : 'bg-[#DCEAF0]/60'} text-[#3A3532]`}>
          {isCreation ? '👩‍🍳 Ma création' : '📱 Recette Cookidoo'}
        </span>
        {recipe.status === 'draft' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Brouillon</span>
        )}
      </div>

      <h1 className="font-display text-3xl text-[#3A3532] mb-2">{recipe.title}</h1>
      <p className="text-[#3A3532]/70 mb-3">{recipe.description}</p>
      <p className="text-sm text-[#3A3532]/50 mb-2">
        {recipe.category}
        {recipe.origin && ` · ${recipe.origin}`}
      </p>

      {(recipe.prep_time_minutes || recipe.total_time_minutes) && (
        <div className="flex gap-4 mb-4 text-sm text-[#3A3532]/70">
          {recipe.prep_time_minutes && <span>⏱️ {recipe.prep_time_minutes} min de préparation</span>}
          {recipe.total_time_minutes && <span>🍽️ {recipe.total_time_minutes} min au total</span>}
        </div>
      )}

      {recipe.cookidoo_url && (
        
          href={recipe.cookidoo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mb-6 px-4 py-2 bg-[#F6DEE1]/40 text-[#3A3532] rounded-full text-sm font-medium hover:bg-[#F6DEE1]/70 border border-[#C9A44C]"
        >
          📱 Ouvrir sur Cookidoo
        </a>
      )}

      {hideDetails ? (
        <div className="border border-[#C9A44C] bg-[#F6DEE1]/20 rounded-2xl p-5 text-center mb-6">
          <p className="text-[#3A3532]/80">
            Retrouve les ingrédients et les étapes complètes directement sur Cookidoo via le lien ci-dessus.
          </p>
        </div>
      ) : (
        <>
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
            <section className="mb-6">
              <h2 className="font-display text-xl text-[#3A3532] mb-3">Étapes de préparation</h2>
              <p className="text-[#3A3532]/80 whitespace-pre-wrap leading-relaxed">{recipe.steps}</p>
            </section>
          )}
        </>
      )}

      {recipe.advice && (
        <section className="mb-6">
          <h2 className="font-display text-xl text-[#3A3532] mb-3">💡 Conseils</h2>
          <p className="text-[#3A3532]/80 whitespace-pre-wrap leading-relaxed">{renderWithLinks(recipe.advice)}</p>
        </section>
      )}

      {relatedRecipes.length > 0 && (
        <section>
          <h2 className="font-display text-xl text-[#3A3532] mb-3">Recettes liées</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {relatedRecipes.map((r) => (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                className="block rounded-xl border border-[#F0EAE0] bg-white overflow-hidden no-underline text-inherit"
              >
                {r.image_url ? (
                  <img src={r.image_url} alt={r.title} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-[#F6DEE1]/30" />
                )}
                <p className="text-xs text-[#3A3532] p-2">{r.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}