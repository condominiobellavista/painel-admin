import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Building2, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { user, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base">
      <div className="w-full max-w-sm bg-card border border-border-2 rounded-2xl p-8 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Building2 className="w-8 h-8 text-accent" />
          <div>
            <div className="font-bold text-lg text-text-1">Bella Vista</div>
            <div className="text-xs text-text-3">Painel Administrativo</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-3 mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-elevated border border-border-1 rounded-lg text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-3 mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 bg-elevated border border-border-1 rounded-lg text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-1"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger-light rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold text-sm rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
