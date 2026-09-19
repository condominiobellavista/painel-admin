import { useState } from 'react'
import { useMorador } from '@/context/MoradorContext'
import { User, Mail, Phone, Building2, FileText, Calendar, Pencil, Check, X, Loader2 } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

const roleLabel: Record<string, string> = {
  proprietario_morador: 'Proprietário (morador)',
  proprietario_nao_morador: 'Proprietário (não morador)',
  inquilino: 'Inquilino',
  dependente: 'Dependente',
  dependente_inquilino: 'Dependente (inquilino)',
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="text-[var(--color-text-3)] flex-shrink-0">{icon}</div>
      <div>
        <div className="text-[11px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">{label}</div>
        <div className="text-sm font-semibold text-[var(--color-text-1)] mt-0.5">{value || '—'}</div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[var(--color-elevated)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition" />
    </div>
  )
}

export default function MoradorDados() {
  const { morador, code, updateMorador } = useMorador()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setName(morador?.name ?? '')
    setCpf(morador?.cpf ?? '')
    setBirthDate(morador?.birth_date ?? '')
    setPhone(morador?.phone ?? '')
    setEmail(morador?.email ?? '')
    setSuccess(false)
    setError(null)
    setEditing(true)
  }

  function cancel() { setEditing(false); setError(null) }

  async function save() {
    if (isDemo) {
      updateMorador({ name: name || undefined, cpf: cpf || undefined, birth_date: birthDate || undefined, phone: phone || undefined, email: email || undefined })
      setEditing(false); setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
      return
    }
    setSaving(true); setError(null)
    const { error: err } = await supabase.rpc('morador_update_profile', {
      p_code: code!,
      p_name: name,
      p_cpf: cpf,
      p_birth_date: birthDate,
      p_phone: phone,
      p_email: email,
    })
    setSaving(false)
    if (err) { setError('Erro ao salvar. Tente novamente.'); return }
    updateMorador({ name: name || undefined, cpf: cpf || undefined, birth_date: birthDate || undefined, phone: phone || undefined, email: email || undefined })
    setEditing(false); setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  return (
    <div>
      <h1 className="text-lg font-black text-[var(--color-text-1)] mb-1">Meus dados</h1>
      <p className="text-sm text-[var(--color-text-3)] mb-6">Informações do seu cadastro no condomínio.</p>

      {isDemo && (
        <div className="mb-5 px-4 py-3 rounded-xl text-xs font-medium"
          style={{ background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', color: 'var(--color-warning)' }}>
          Modo demo — dados fictícios
        </div>
      )}

      {/* Card de dados */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden mb-4">
        <div className="bg-[var(--color-elevated)] px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}>
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
          <InfoRow icon={<Building2 size={15} />} label="Apartamento" value={morador?.unit} />
          <InfoRow icon={<FileText size={15} />} label="CPF" value={morador?.cpf} />
          <InfoRow icon={<Calendar size={15} />} label="Data de nascimento" value={morador?.birth_date} />
          <InfoRow icon={<Mail size={15} />} label="E-mail" value={morador?.email} />
          <InfoRow icon={<Phone size={15} />} label="WhatsApp" value={morador?.phone} />
        </div>
      </div>

      {/* Card de edição */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border-0)] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-3)]">Alterar dados</span>
          {!editing && (
            <button onClick={startEdit}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:opacity-80 transition">
              <Pencil size={12} /> Editar
            </button>
          )}
        </div>
        <div className="p-5">
          {!editing ? (
            <p className="text-sm text-[var(--color-text-3)] leading-relaxed">
              Você pode atualizar seus dados cadastrais a qualquer momento.
              {success && (
                <span className="block mt-2 text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
                  ✓ Dados atualizados com sucesso.
                </span>
              )}
            </p>
          ) : (
            <div className="space-y-4">
              <Field label="Nome completo" value={name} onChange={setName} placeholder="Seu nome completo" />
              <Field label="CPF" value={cpf} onChange={setCpf} placeholder="000.000.000-00" />
              <Field label="Data de nascimento" value={birthDate} onChange={setBirthDate} placeholder="DD/MM/AAAA" />
              <Field label="E-mail" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" />
              <Field label="WhatsApp" value={phone} onChange={setPhone} placeholder="(47) 99999-9999" type="tel" />
              {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                  style={{ background: 'var(--color-accent)' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
                </button>
                <button onClick={cancel} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 border text-sm font-semibold rounded-xl hover:opacity-80 transition"
                  style={{ background: 'var(--color-elevated)', borderColor: 'var(--color-border-1)', color: 'var(--color-text-2)' }}>
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
