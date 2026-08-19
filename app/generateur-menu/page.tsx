'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Meal = { type: string; recipe_id: string; recipe_title: string }
type Day = { day: string; meals: Meal[] }
type Menu = { days: Day[] }

export default function GenerateurMenu() {
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [approved, setApproved] = useState(false)

  const [days, setDays] = useState('7')
  const [people, setPeople] = useState('4')
  const [objective, setObjective] = useState('Équilibré')
  const [source, setSource] = useState('favorites')

  const [menu, setMenu] = useState<Menu | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setCheckingAccess(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('approved')
        .eq('id', userData.user.id)
        .single()

      setApproved(!!profile?.approved)
      setCheckingAccess(false)
    }
    check()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setError('')
    setMenu(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          days: parseInt(days),
          people: parseInt(people),
          objective,
          source,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue')
      } else {
        setMenu(data.menu)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (checkingAccess) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  if (!approved) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-[#3A3532]/70">
        Connecte-toi et fais valider ton compte pour accéder au générateur de menu.{' '}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-2 text-center">🗓️ Générateur de menu</h1>
      <p className="text-[#3A3532]/70 text-center mb-10">
        Génère ton menu de la semaine à partir des recettes du site.
      </p>

      <form onSubmit={handleGenerate} className="border border-[#F0EAE0] bg-white rounded-2xl p-5 mb-10 flex flex-col gap-4">
        <div>
          <label className="block mb-1 text-sm text-[#3A3532]/70">Recettes à utiliser</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-4 py-2 border border-[#F0EAE0] rounded-xl"
          >
            <option value="favorites">Mes recettes favorites</option>
            <option value="all">Toutes les recettes du site</option>
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1 text-sm text-[#3A3532]/70">Nombre de jours</label>
            <input
              type="number"
              min="1"
              max="14"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full px-4 py-2 border border-[#F0EAE0] rounded-xl"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 text-sm text-[#3A3532]/70">Nombre de personnes</label>
            <input
              type="number"
              min="1"
              max="12"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className="w-full px-4 py-2 border border-[#F0EAE0] rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm text-[#3A3532]/70">Objectif</label>
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full px-4 py-2 border border-[#F0EAE0] rounded-xl"
          >
            <option value="Équilibré">Équilibré</option>
            <option value="Rapide">Rapide</option>
            <option value="Familial">Familial</option>
            <option value="Sans restriction">Sans restriction</option>
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={generating}
          className="py-2.5 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors border border-[#C9A44C] disabled:opacity-50"
        >
          {generating ? 'Génération en cours...' : 'Générer mon menu'}
        </button>
      </form>

      {menu && (
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl text-[#3A3532] mb-2">Ton menu</h2>
          {menu.days.map((day, i) => (
            <div key={i} className="border border-[#F0EAE0] bg-white rounded-2xl p-4">
              <h3 className="font-display text-lg text-[#3A3532] mb-2">{day.day}</h3>
              <div className="flex flex-col gap-2">
                {day.meals.map((meal, j) => (
                  <Link
                    key={j}
                    href={`/recipes/${meal.recipe_id}`}
                    className="flex justify-between items-center px-3 py-2 bg-[#F6DEE1]/20 rounded-xl no-underline text-inherit"
                  >
                    <span className="text-sm text-[#3A3532]/60">{meal.type}</span>
                    <span className="text-sm font-medium text-[#3A3532]">{meal.recipe_title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}