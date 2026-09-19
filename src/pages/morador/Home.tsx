import { useNavigate } from 'react-router-dom'
import { Lock, FileText, Info, Shield } from 'lucide-react'

export default function MoradorHome() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-base)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-5 border border-[var(--color-accent)]/20">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-1)] mb-1">
            Condomínio Bella Vista
          </h1>
          <p className="text-xs text-[var(--color-text-3)] uppercase tracking-[0.15em] font-semibold">
            Sistema de Controle de Acesso
          </p>
          <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent mx-auto mt-4 rounded-full" />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/morador/login')}
            className="w-full flex items-center gap-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white px-5 py-4 rounded-2xl font-semibold transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Lock size={20} />
            </div>
            <div className="flex-1">
              <div className="text-base font-bold leading-tight">Acessar meu cadastro</div>
              <div className="text-xs text-white/70 mt-0.5">Já tenho senha — entrar na minha área</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-60 flex-shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/morador/cadastro')}
            className="w-full flex items-center gap-4 bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] border border-[var(--color-border-1)] hover:border-[var(--color-border-2)] px-5 py-4 rounded-2xl font-semibold transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--color-elevated)] flex items-center justify-center flex-shrink-0 text-[var(--color-accent)]">
              <FileText size={20} />
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-[var(--color-text-1)] leading-tight">Fazer meu cadastro</div>
              <div className="text-xs text-[var(--color-text-3)] mt-0.5">Ainda não tenho senha de acesso</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-3)" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/morador/ajuda')}
            className="w-full flex items-center gap-3 px-4 py-3 border border-[var(--color-border-1)] rounded-xl transition-colors hover:bg-[var(--color-card)] text-left"
          >
            <Info size={16} className="text-[var(--color-text-3)] flex-shrink-0" />
            <span className="text-sm text-[var(--color-text-3)] font-medium flex-1">
              Informações importantes para novos moradores
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-3)" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-3)]">
            <Shield size={11} />
            Dados protegidos conforme LGPD — Lei 13.709/2018
          </div>
        </div>
      </div>
    </div>
  )
}
