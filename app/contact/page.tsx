'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminEditButton from '@/components/AdminEditButton'
import BrandPhoto from '@/components/BrandPhoto'

type RequestType = 'atelier' | 'demo' | 'rappel' | 'question' | 'offres'

const CARDS: { type: RequestType; icon: string; title: string }[] = [
  { type: 'atelier', icon: '👩‍🍳', title: 'Réserver un atelier' },
  { type: 'demo', icon: '🎬', title: 'Demander une démonstration' },
  { type: 'rappel', icon: '📞', title: 'Être rappelé(e)' },
  { type: 'question', icon: '❓', title: 'Poser une question' },
  { type: 'offres', icon: '🎉', title: 'Recevoir les offres du moment' },
]

export default function Contact() {
  const [settings, setSettings] = useState<{
    whatsapp_number: string
    contact_email: string
    intro_text: string | null
  } | null>(null)
  const [activeType, setActiveType] = useState<RequestType | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('contact_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setSettings(data as any))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await supabase.from('contact_messages').insert({
      name,
      email,
      phone: phone || null,
      message,
      request_type: activeType,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  const resetForm = () => {
    setActiveType(null)
    setSent(false)
    setName('')
    setEmail('')
    setPhone('')
    setMessage('')
  }

  const activeCard = CARDS.find((c) => c.type === activeType)

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-4 text-center">📩 Me contacter</h1>

      <div className="flex justify-center mb-6">
        <BrandPhoto
          photoKey="portrait_thermomix"
          alt="Hasna"
          className="w-32 h-32 rounded-full object-cover border-2 border-[#C9A44C]"
        />
      </div>

      {settings?.intro_text && (
        <p className="text-[#3A3532]/70 text-center mb-8 max-w-md mx-auto">{settings.intro_text}</p>
      )}

      {!activeType ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CARDS.map((card) => (
            <button
              key={card.type}
              onClick={() => setActiveType(card.type)}
              className="border border-[#F0EAE0] bg-white rounded-2xl p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <p className="font-medium text-[#3A3532]">{card.title}</p>
            </button>
          ))}

          {settings?.whatsapp_number && (
            <a
              href={`https://wa.me/${settings.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#E3ECDD] bg-[#E3ECDD]/40 rounded-2xl p-4 text-left hover:shadow-md transition-shadow no-underline"
            >
              <div className="text-2xl mb-2">💬</div>
              <p className="font-medium text-[#3A3532]">Me contacter sur WhatsApp</p>
            </a>
          )}

          {settings?.contact_email && (
            <a
              href={`mailto:${settings.contact_email}`}
              className="border border-[#F0EAE0] bg-white rounded-2xl p-4 text-left hover:shadow-md transition-shadow no-underline"
            >
              <div className="text-2xl mb-2">✉️</div>
              <p className="font-medium text-[#3A3532]">M'envoyer un e-mail</p>
            </a>
          )}
        </div>
      ) : (
        <div className="border border-[#F0EAE0] bg-white rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg text-[#3A3532]">{activeCard?.title}</h2>
            <button onClick={resetForm} className="text-sm text-[#3A3532]/50 underline">
              ← Retour
            </button>
          </div>

          {sent ? (
            <p className="text-[#3A3532]/70">
              {activeType === 'offres'
                ? 'Merci ! Tu vas recevoir les offres du moment par email dans quelques instants.'
                : 'Merci, ton message a bien été envoyé ! Je te répondrai rapidement.'}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                placeholder="Ton nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              {activeType === 'rappel' && (
                <input
                  type="tel"
                  placeholder="Ton numéro de téléphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
                />
              )}
              {activeType !== 'offres' && (
                <textarea
                  placeholder="Ton message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required={activeType !== 'offres'}
                  rows={4}
                  className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
                />
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                className="py-2.5 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors border border-[#C9A44C]"
              >
                Envoyer
              </button>
            </form>
          )}
        </div>
      )}

      <AdminEditButton href="/admin/contact-settings" />
    </div>
  )
}
