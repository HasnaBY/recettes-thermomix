'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BrandPhoto from '@/components/BrandPhoto'

type Recipe = {
  title: string
  description: string | null
  image_url: string | null
  category: string | null
}

type Settings = {
  page_title: string
  page_subtitle: string
  button_label: string
  pdf_url: string | null
}

export default function RecetteGratuite() {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: settingsData } = await supabase
        .from('lead_magnet_settings')
        .select('*')
        .eq('id', 1)
        .single()

      setSettings(settingsData as any)

      if (settingsData?.recipe_id) {
        const { data: recipeData } = await supabase
          .from('recipes')
          .select('title, description, image_url, category')
          .eq('id', settingsData.recipe_id)
          .single()
        setRecipe(recipeData as any)
      }

      setLoading(false)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')

    try {
      const response = await fetch('/api/send-lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email, phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue.')
      } else {
        setSent(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  if (!recipe || !settings || !settings.pdf_url) {
    return (
      <div className="p-8 text-center text-[#3A3532]/60">
        Cette offre n'est pas disponible pour le moment.
      </div>
    )
  }

  return (
    <div className="px-6 sm:px-8 py-12 max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <BrandPhoto
          photoKey="round_logo"
          alt="Thermomix With Love, Hasna"
          className="w-20 h-20 rounded-full object-cover border-2 border-[#C9A44C]"
        />
      </div>

      <h1 className="font-display text-3xl text-[#3A3532] mb-2 text-center">{settings.page_title}</h1>
      <p className="text-[#3A3532]/70 text-center mb-8">{settings.page_subtitle}</p>

      <div className="border border-[#F0EAE0] bg-white rounded-2xl overflow-hidden mb-8">
        {recipe.image_url && (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-56 object-cover" />
        )}
        <div className="p-5">
          {recipe.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#DCEAF0]/60 text-[#3A3532]">
              {recipe.category}
            </span>
          )}
          <h2 className="font-display text-xl text-[#3A3532] mt-2 mb-1">{recipe.title}</h2>
          {recipe.description && <p className="text-[#3A3532]/70 text-sm">{recipe.description}</p>}
        </div>
      </div>

      {sent ? (
        <div className="border border-[#C9A44C] bg-[#F6DEE1]/20 rounded-2xl p-5 text-center">
          <p className="text-[#3A3532] font-medium mb-1">Merci {firstName} ! 🎉</p>
          <p className="text-[#3A3532]/70 text-sm">
            Ta recette arrive dans ta boîte mail dans quelques instants (pense à vérifier tes spams).
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border border-[#F0EAE0] bg-white rounded-2xl p-5 flex flex-col gap-3">
          <input
            placeholder="Ton prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
          />
          <input
            type="email"
            placeholder="Ton email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
          />
          <input
            type="tel"
            placeholder="Ton numéro de téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="py-3 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors border border-[#C9A44C] disabled:opacity-50"
          >
            {sending ? 'Envoi en cours...' : settings.button_label}
          </button>
        </form>
      )}
    </div>
  )
}