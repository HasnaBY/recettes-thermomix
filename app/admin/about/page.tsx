'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ValueItem = { icon: string; label: string }

export default function AdminAbout() {
  const [subtitle, setSubtitle] = useState('')
  const [beforeThermomix, setBeforeThermomix] = useState('')
  const [discovery, setDiscovery] = useState('')
  const [whatChanged, setWhatChanged] = useState<string[]>([])
  const [whyAdvisor, setWhyAdvisor] = useState('')
  const [values, setValues] = useState<ValueItem[]>([])
  const [accompaniment, setAccompaniment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('about_page_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setSubtitle(data.subtitle ?? '')
          setBeforeThermomix(data.before_thermomix ?? '')
          setDiscovery(data.discovery ?? '')
          setWhatChanged(data.what_changed ?? [])
          setWhyAdvisor(data.why_advisor ?? '')
          setValues(data.values ?? [])
          setAccompaniment(data.accompaniment ?? '')
        }
        setLoading(false)
      })
  }, [])

  const updateChangedItem = (index: number, value: string) => {
    setWhatChanged((prev) => prev.map((item, i) => (i === index ? value : item)))
  }
  const removeChangedItem = (index: number) => {
    setWhatChanged((prev) => prev.filter((_, i) => i !== index))
  }
  const addChangedItem = () => {
    setWhatChanged((prev) => [...prev, ''])
  }

  const updateValue = (index: number, field: keyof ValueItem, value: string) => {
    setValues((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }
  const removeValue = (index: number) => {
    setValues((prev) => prev.filter((_, i) => i !== index))
  }
  const addValue = () => {
    setValues((prev) => [...prev, { icon: '', label: '' }])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('about_page_content')
      .update({
        subtitle,
        before_thermomix: beforeThermomix,
        discovery,
        what_changed: whatChanged,
        why_advisor: whyAdvisor,
        values,
        accompaniment,
      })
      .eq('id', 1)

    setSaving(false)
    setMessage(error ? error.message : 'Enregistré avec succès !')
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier "Qui suis-je ?"</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Sous-titre (sous "Qui suis-je ?")
          </label>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Mon quotidien avant Thermomix
          </label>
          <textarea
            value={beforeThermomix}
            onChange={(e) => setBeforeThermomix(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">La découverte</label>
          <textarea
            value={discovery}
            onChange={(e) => setDiscovery(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-3 text-sm font-medium text-gray-700">
            Ce que Thermomix a changé
          </label>
          <div className="flex flex-col gap-2">
            {whatChanged.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={item}
                  onChange={(e) => updateChangedItem(i, e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeChangedItem(i)}
                  className="px-3 text-red-600 border border-red-300 rounded-lg text-sm"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addChangedItem} className="mt-2 text-sm text-gray-700 underline">
            + Ajouter un élément
          </button>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Pourquoi je suis devenue conseillère
          </label>
          <textarea
            value={whyAdvisor}
            onChange={(e) => setWhyAdvisor(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-3 text-sm font-medium text-gray-700">Mes valeurs</label>
          <div className="flex flex-col gap-2">
            {values.map((v, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={v.icon}
                  onChange={(e) => updateValue(i, 'icon', e.target.value)}
                  placeholder="Emoji"
                  className="w-16 px-3 py-1.5 border border-gray-300 rounded-lg"
                />
                <input
                  value={v.label}
                  onChange={(e) => updateValue(i, 'label', e.target.value)}
                  placeholder="Valeur"
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeValue(i)}
                  className="px-3 text-red-600 border border-red-300 rounded-lg text-sm"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addValue} className="mt-2 text-sm text-gray-700 underline">
            + Ajouter une valeur
          </button>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Mon accompagnement</label>
          <textarea
            value={accompaniment}
            onChange={(e) => setAccompaniment(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {message && <p className="text-sm text-gray-700">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
