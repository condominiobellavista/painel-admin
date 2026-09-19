import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMorador } from '@/context/MoradorContext'
import { isDemo } from '@/lib/supabase'

export default function MoradorLogin() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { signIn } = useMorador()
  const navigate = useNavigate()

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    setError('')
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== 6) {
      setError('Digite todos os 6 dígitos do seu código')
      return
    }
    setSubmitting(true)
    const err = await signIn(code)
    setSubmitting(false)
    if (err) {
      setError(err)
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } else {
      navigate('/morador/area')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-base)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/morador')}
          className="flex items-center gap-1.5 text-[var(--color-accent)] text-sm font-semibold mb-8"
        >
          ← Voltar ao início
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-[var(--color-text-1)]">Acessar meu cadastro</h2>
          <p className="text-sm text-[var(--color-text-3)] mt-1.5">
            Digite sua senha de acesso de 6 dígitos
          </p>
        </div>

        {isDemo && (
          <div className="mb-5 px-4 py-3 bg-[var(--color-warning-light)] border border-[var(--color-warning)]/30 rounded-xl text-xs text-[var(--color-warning)] text-center font-medium">
            Modo demo — qualquer código de 6 dígitos funciona
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-[var(--color-card)] border-2 border-[var(--color-border-1)] rounded-xl text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-[var(--color-danger)] mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || digits.join('').length !== 6}
            className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors"
          >
            {submitting ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--color-text-3)] mt-6">
          Não tem senha?{' '}
          <button onClick={() => navigate('/morador/cadastro')} className="text-[var(--color-accent)] font-semibold">
            Faça seu cadastro
          </button>
        </p>
      </div>
    </div>
  )
}
