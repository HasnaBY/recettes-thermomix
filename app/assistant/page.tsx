'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export default function AssistantPage() {
  const [checking, setChecking] = useState(true)
  const [approved, setApproved] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setChecking(false)
        return
      }
      const { data: profile } = await supabase.from('profiles').select('approved').eq('id', userData.user.id).single()
      setApproved(!!profile?.approved)

      const { data: aiFeatures } = await supabase.from('ai_features').select('chatbot_enabled').eq('id', 1).single()
      setEnabled(!!aiFeatures?.chatbot_enabled)
      setChecking(false)
    }
    check()
  }, [])

  const send = async () => {
    if (!input.trim()) return
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')
    setSending(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: `Erreur : ${data.error}` }])
      }
    } finally {
      setSending(false)
    }
  }

  if (checking) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  if (!approved) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-[#3A3532]/70">
        Connecte-toi et fais valider ton compte pour accéder à l'assistant.{' '}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </div>
    )
  }

  if (!enabled) {
    return <div className="p-8 text-center text-[#3A3532]/60">Cet assistant n'est pas disponible pour le moment.</div>
  }

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto flex flex-col" style={{ minHeight: '70vh' }}>
      <h1 className="font-display text-3xl text-[#3A3532] mb-2 text-center">💬 Assistant Thermomix</h1>
      <p className="text-[#3A3532]/70 text-center mb-8">
        Pose tes questions : substitutions, vitesses, adaptation entre modèles...
      </p>

      <div className="flex-1 flex flex-col gap-3 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
              m.role === 'user'
                ? 'self-end bg-[#3A3532] text-[#FDFBF6]'
                : 'self-start bg-[#F0EAE0] text-[#3A3532]'
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && <p className="text-xs text-[#3A3532]/40">L'assistant répond...</p>}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ta question..."
          className="flex-1 px-4 py-2 border border-[#F0EAE0] rounded-xl"
        />
        <button
          onClick={send}
          disabled={sending}
          className="px-5 py-2 bg-[#3A3532] text-[#FDFBF6] rounded-xl font-medium disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}