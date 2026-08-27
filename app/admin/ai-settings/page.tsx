'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AiFeatures = {
  auto_tagging_enabled: boolean
  recommendations_enabled: boolean
  recipe_writer_enabled: boolean
  recipe_creator_enabled: boolean
  chatbot_enabled: boolean
  recipe_import_enabled: boolean
  translate_enabled: boolean
}

const FEATURES: { key: keyof AiFeatures; label: string; description: string }[] = [
  { key: 'auto_tagging_enabled', label: 'Tagging automatique des recettes', description: "L'IA suggère description/catégorie/origine à partir du titre et des ingrédients." },
  { key: 'recommendations_enabled', label: 'Suggestions basées sur les favoris', description: 'Algorithme (sans IA) qui propose des recettes proches des favoris de la cliente.' },
  { key: 'recipe_writer_enabled', label: 'Assistant rédaction (descriptions + newsletters)', description: 'Génère des descriptions accrocheuses et des mails pour tes clientes.' },
  { key: 'recipe_creator_enabled', label: 'Création de recette depuis ingrédients bruts', description: 'Transforme tes idées en recette au format Thermomix, avec temps calculé automatiquement.' },
  { key: 'recipe_import_enabled', label: 'Import de recette (lien ou texte collé)', description: "Colle un lien ou le texte d'une recette, l'IA extrait titre/ingrédients/étapes tels quels." },
  { key: 'translate_enabled', label: 'Traduction de recette vers le français', description: 'Traduit titre, description, ingrédients, étapes et conseils d\'une recette existante.' },
  { key: 'chatbot_enabled', label: 'Chatbot culinaire pour les clientes', description: 'Assistant conversationnel pour répondre aux questions Thermomix.' },
]

export default function AdminAiSettings() {
  const [features, setFeatures] = useState<AiFeatures | null>(null)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('ai_features')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setFeatures(data as any))
  }, [])

  const toggle = async (key: keyof AiFeatures) => {
    if (!features) return
    const newValue = !features[key]
    setFeatures({ ...features, [key]: newValue })
    const { error } = await supabase.from('ai_features').update({ [key]: newValue }).eq('id', 1)
    setMessage(error ? error.message : 'Enregistré')
  }

  if (!features) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Fonctionnalités IA</h1>
      <p className="text-gray-500 text-sm mb-6">Active ou désactive chaque outil indépendamment.</p>

      <div className="flex flex-col gap-3">
        {FEATURES.map((f) => (
          <div key={f.key} className="border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-900 font-medium">{f.label}</span>
              <button
                onClick={() => toggle(f.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  features[f.key] ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {features[f.key] ? 'Activé' : 'Désactivé'}
              </button>
            </div>
            <p className="text-xs text-gray-500">{f.description}</p>
          </div>
        ))}
      </div>

      {message && <p className="text-sm text-gray-700 mt-4">{message}</p>}
    </div>
  )
}