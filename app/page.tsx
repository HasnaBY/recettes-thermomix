'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Recipe = {
  id: string
  title: string
  description: string
  category: string
  time_minutes: number
}

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('toutes')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('recipes').select('*')
      if (!error && data) setRecipes(data)
      setLoading(false)
    }
    load()
  }, [])

  const categories = ['toutes', ...new Set(recipes.map((r) => r.category).filter(Boolean))]

  const filtered = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'toutes' || recipe.category === category
    return matchesSearch && matchesCategory
  })

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Mes recettes</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher une recette..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'toutes' ? 'Toutes les catégories' : cat}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p>Aucune recette ne correspond à ta recherche.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{recipe.title}</h2>
                <p style={{ color: '#666', marginBottom: '0.5rem' }}>{recipe.description}</p>
                <p style={{ fontSize: '0.9rem' }}>
                  {recipe.category} · {recipe.time_minutes} min
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
