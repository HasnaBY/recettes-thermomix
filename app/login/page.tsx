'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isSignUp) {
      if (!fullName.trim()) {
        setError('Le nom est obligatoire')
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/recettes')
        router.refresh()
      }
      return
    }

    // Connexion : vérifie d'abord si le compte est bloqué
    const { data: attempt } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(attempt.locked_until).getTime() - Date.now()) / 60000
      )
      setError(`Compte temporairement bloqué suite à plusieurs échecs. Réessaie dans ${minutesLeft} minute(s).`)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const newCount = (attempt?.failed_count ?? 0) + 1

      if (newCount >= 5) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString()
        await supabase.from('login_attempts').upsert({
          email,
          failed_count: 0,
          locked_until: lockedUntil,
        })
        setError('Trop de tentatives échouées. Ton compte est bloqué pendant 15 minutes.')
      } else {
        await supabase.from('login_attempts').upsert({
          email,
          failed_count: newCount,
          locked_until: null,
        })
        setError(error.message)
      }
    } else {
      await supabase.from('login_attempts').upsert({
        email,
        failed_count: 0,
        locked_until: null,
      })
      router.push('/recettes')
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
      <h1 className="font-display text-2xl text-[#3A3532] mb-6">
        {isSignUp ? 'Créer un compte' : 'Connexion'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSignUp && (
          <input
            type="text"
            placeholder="Ton nom"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="py-2.5 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors border border-[#C9A44C]"
        >
          {isSignUp ? "S'inscrire" : 'Se connecter'}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="mt-4 text-sm text-[#3A3532]/60 underline block"
      >
        {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
      </button>

      {!isSignUp && (
        <button
          onClick={handleResetPassword}
          className="mt-2 text-sm text-[#3A3532]/60 underline block"
        >
          Mot de passe oublié ?
        </button>
      )}
    </div>
  )
}
