import { useState } from 'react'
import { useMorador } from '@/context/MoradorContext'
import { User, Mail, Phone, Building2, Pencil, Check, X, Loader2 } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

const roleLabel: Record<string, string> = {
  proprietario_morador: 'Proprietário (morador)',
  proprietario_nao_morador: 'Proprietário (não morador)',
  inquilino: 'Inquilino',
  dependente: 'Dependente',
  dependente_inquilino: 'Dependente (inquilino)',
}

export default function MoradorDados() {
  const { morador, updateMorador } = useMorador()
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(morador?.phone ?? '')
  const [email, setEmail] = useState(morador?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setPhone(morador?.phone ?? '')
    setEmail(morador?.email ?? '')
    setSuccess(false)
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setError(null)
  }

  async function save() {
    if (isDemo) {
      setEditing(false)
      setSuccess(true)
      return
    }
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('residents')
      .update({ phone: phone || null, email: email || null })
      .eq('id', morador!.id)
    setSaving(false)
    if (err) {
      setError('Erro ao salvar. Tente novamente.')
      return
    }
    updateMorador({ phone: phone || undefined, email: email || undefined })
    setEditing(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  return (
    <div>
      <h1 className="text-lg font-black text-[var(--color-text-1)] mb-1">Meus dados</h1>
      <p className="text-sm text-[var(--color-text-3)] mb-6">Informações do seu cadastro no condomínio.</p>

      {isDemo && (
        <div className="mb-5 px-4 py-3 bg-[var(--color-warning-light)] border border-[var(--color-warning)]/30 rounded-xl text-xs text-[var(--color-warning)] font-medium">
          Modo demo — dados fictícios para demonstração
        </div>
      )}

      {/* Card de dados */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden mb-4">
        <div className="bg-[var(--color-elevated)] px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)]">
            <User size={18} />
          </div>
          <div className="flex-1">
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

          <div className="flex items-center gap-3 px-5 py-3.5">
            <Mail size={15} className="text-[var(--color-text-3)] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[11px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">E-mail</div>
              <div className="text-sm font-semibold text-[var(--color-text-1)] mt-0.5">{morador?.email || '—'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3.5">
            <Phone size={15} className="text-[var(--color-text-3)] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[11px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">WhatsApp</div>
              <div className="text-sm font-semibold text-[var(--color-text-1)] mt-0.5">{morador?.phone || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de edição */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border-0)] flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-3)]">
            Alterar dados
          </div>
          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:opacity-80 transition"
            >
              <Pencil size={12} /> Editar
            </button>
          )}
        </div>

        <div className="p-5">
          {!editing ? (
            <p className="text-sm text-[var(--color-text-3)] leading-relaxed">
              Você pode atualizar seu e-mail e telefone a qualquer momento.
              {success && (
                <span className="block mt-2 text-[var(--color-success)] font-semibold text-xs">
                  ✓ Dados atualizados com sucesso.
                </span>
              )}
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2.5 bg-[var(--color-elevated)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider mb-1.5">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(47) 99999-9999"
                  className="w-full px-3 py-2.5 bg-[var(--color-elevated)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition"
                />
              </div>

              {error && (
                <p className="text-xs text-[var(--color-danger)]">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--color-accent)] hover:opacity-90 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Salvar
                </button>
                <button
                  onClick={cancel}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-elevated)] border border-[var(--color-border-1)] text-[var(--color-text-2)] text-sm font-semibold rounded-xl hover:opacity-80 transition"
                >
                  <X size={14} /> Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
