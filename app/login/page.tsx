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
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
        {isSignUp ? 'Créer un compte' : 'Connexion'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
        <button
          type="submit"
          style={{ padding: '0.75rem', backgroundColor: '#000', color: '#fff', borderRadius: '4px', border: 'none' }}
        >
          {isSignUp ? "S'inscrire" : 'Se connecter'}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#666', textDecoration: 'underline' }}
      >
        {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
      </button>

    {!isSignUp && (
  <button
    onClick={handleResetPassword}
    style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#666', textDecoration: 'underline', display: 'block' }}
  >
    Mot de passe oublié ?
  </button>
)}
  
    </div>
  )
}
