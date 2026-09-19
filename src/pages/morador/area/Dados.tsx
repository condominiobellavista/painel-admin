import { useMorador } from '@/context/MoradorContext'
import { User, Mail, Phone, Building2 } from 'lucide-react'
import { isDemo } from '@/lib/supabase'

const roleLabel: Record<string, string> = {
  proprietario_morador: 'Proprietário (morador)',
  proprietario_nao_morador: 'Proprietário (não morador)',
  inquilino: 'Inquilino',
  dependente: 'Dependente',
  dependente_inquilino: 'Dependente (inquilino)',
}

export default function MoradorDados() {
  const { morador } = useMorador()

  return (
    <div>
      <h1 className="text-lg font-black text-[var(--color-text-1)] mb-1">Meus dados</h1>
      <p className="text-sm text-[var(--color-text-3)] mb-6">Informações do seu cadastro no condomínio.</p>

      {isDemo && (
        <div className="mb-5 px-4 py-3 bg-[var(--color-warning-light)] border border-[var(--color-warning)]/30 rounded-xl text-xs text-[var(--color-warning)] font-medium">
          Modo demo — dados fictícios para demonstração
        </div>
      )}

      <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden mb-5">
        <div className="bg-[var(--color-elevated)] px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)]">
            <User size={18} />
          </div>
          <div>
            <div className="font-bold text-[var(--color-text-1)]">{morador?.name}</div>
            <div className="text-xs text-[var(--color-accent)]">
              {morador?.role ? (roleLabel[morador.role] ?? morador.role) : ''}
            </div>
          </div>
        </div>

        <div className="divide-y divide-[var(--color-border-0)]">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Building2 size={15} className="text-[var(--color-text-3)] flex-shrink-0" />
            <div>
              <div className="text-[11px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">Apartamento</div>
              <div className="text-sm font-semibold text-[var(--color-text-1)] mt-0.5">{morador?.unit || '—'}</div>
            </div>
          </div>

          {morador?.email && (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Mail size={15} className="text-[var(--color-text-3)] flex-shrink-0" />
              <div>
                <div className="text-[11px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">E-mail</div>
                <div className="text-sm font-semibold text-[var(--color-text-1)] mt-0.5">{morador.email}</div>
              </div>
            </div>
          )}

          {morador?.phone && (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Phone size={15} className="text-[var(--color-text-3)] flex-shrink-0" />
              <div>
                <div className="text-[11px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">WhatsApp</div>
                <div className="text-sm font-semibold text-[var(--color-text-1)] mt-0.5">{morador.phone}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-5">
        <div className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-3)] mb-3">
          Alterar dados
        </div>
        <p className="text-sm text-[var(--color-text-3)] leading-relaxed">
          Para atualizar seus dados cadastrais, entre em contato com a administração do condomínio.
        </p>
        <a
          href="mailto:condominiobellavistasbs@gmail.com"
          className="mt-3 flex items-center gap-2 text-sm text-[var(--color-accent)] font-semibold"
        >
          ✉️ condominiobellavistasbs@gmail.com
        </a>
      </div>
    </div>
  )
}
