'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Entre ton email d\'abord, puis clique sur "Mot de passe oublié"')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setError('')
      alert('Un email de réinitialisation a été envoyé.')
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isSignUp ? 'Créer un compte' : 'Connexion'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
        >
          {isSignUp ? "S'inscrire" : 'Se connecter'}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="mt-4 text-sm text-gray-500 underline block"
      >
        {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
      </button>

      {!isSignUp && (
        <button
          onClick={handleResetPassword}
          className="mt-2 text-sm text-gray-500 underline block"
        >
          Mot de passe oublié ?
        </button>
      )}
    </div>
  )
}
