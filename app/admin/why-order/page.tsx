'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminWhyOrder() {
  const [beforePurchase, setBeforePurchase] = useState<string[]>([])
  const [deliveryDay, setDeliveryDay] = useState<string[]>([])
  const [afterDelivery, setAfterDelivery] = useState<string[]>([])
  const [conclusion, setConclusion] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('why_order_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setBeforePurchase(data.before_purchase ?? [])
          setDeliveryDay(data.delivery_day ?? [])
          setAfterDelivery(data.after_delivery ?? [])
          setConclusion(data.conclusion ?? '')
        }
        setLoading(false)
      })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('why_order_content')
      .update({
        before_purchase: beforePurchase,
        delivery_day: deliveryDay,
        after_delivery: afterDelivery,
        conclusion,
      })
      .eq('id', 1)

    setSaving(false)
    setMessage(error ? error.message : 'Enregistré avec succès !')
  }

  const EditableList = ({
    label,
    items,
    setItems,
  }: {
    label: string
    items: string[]
    setItems: (v: string[]) => void
  }) => {
    const update = (index: number, value: string) => {
      setItems(items.map((item, i) => (i === index ? value : item)))
    }
    const remove = (index: number) => {
      setItems(items.filter((_, i) => i !== index))
    }
    const add = () => {
      setItems([...items, ''])
    }

    return (
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={item}
                onChange={(e) => update(i, e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="px-3 text-red-600 border border-red-300 rounded-lg text-sm"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={add}
          className="mt-2 text-sm text-gray-700 underline"
        >
          + Ajouter un argument
        </button>
      </div>
    )
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Modifier "Pourquoi commander avec moi ?"
      </h1>

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        <EditableList label="Avant votre achat" items={beforePurchase} setItems={setBeforePurchase} />
        <EditableList label="Le jour de la livraison" items={deliveryDay} setItems={setDeliveryDay} />
        <EditableList label="Après la livraison" items={afterDelivery} setItems={setAfterDelivery} />

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Conclusion</label>
          <textarea
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
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
