'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Recipe = { id: string; title: string }

export default function RecipesAdminList() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('recipes')
      .select('id, title')
      .order('title')
      .then(({ data }) => setRecipes(data ?? []))
  }, [])

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {recipes.map((r) => (
        <div
          key={r.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
          }}
        >
          <span>{r.title}</span>
          <Link href={`/admin/edit-recipe/${r.id}`}>Modifier</Link>
        </div>
      ))}
    </div>
  )
}
