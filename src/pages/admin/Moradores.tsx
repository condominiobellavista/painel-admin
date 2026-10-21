import { useEffect, useRef, useState } from 'react'
import { Search, Plus, AlertTriangle, X, ArrowUpDown, MoreVertical } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import type { Resident, ResidentRole } from '@/types'

const ROLE_LABEL: Record<ResidentRole, string> = {
  proprietario_morador: 'Proprietário morador',
  proprietario_nao_morador: 'Proprietário não morador',
  inquilino: 'Inquilino',
  dependente: 'Dependente',
  dependente_inquilino: 'Dependente inquilino',
}

const ROLE_COLOR: Record<ResidentRole, string> = {
  proprietario_morador: 'var(--color-accent)',
  proprietario_nao_morador: 'var(--color-text-3)',
  inquilino: 'var(--color-success)',
  dependente: 'var(--color-warning)',
  dependente_inquilino: 'var(--color-warning)',
}

const STATUS_LABEL = { aprovado: 'Aprovado', aguardando: 'Aguardando', inativo: 'Inativo' }
const STATUS_COLOR = {
  aprovado: 'var(--color-success)',
  aguardando: 'var(--color-warning)',
  inativo: 'var(--color-danger)',
}

const DEMO_RESIDENTS: ResidentRow[] = [
  { id: '1', unit_id: 'u1', unit_number: '101', role: 'proprietario_morador', full_name: 'Demo Morador', birth_date: '01/01/1980', cpf: null, phone: '(47) 99000-0001', email: 'demo@example.com', access_code: '000001', lgpd_consent: true, status: 'aprovado', notes: null, created_at: '' },
  { id: '2', unit_id: 'u2', unit_number: '501', role: 'inquilino', full_name: 'Demo Inquilino', birth_date: '01/01/1990', cpf: null, phone: '(47) 99000-0002', email: 'demo2@example.com', access_code: '000002', lgpd_consent: true, status: 'aprovado', notes: '⚠️ REVISAR: código de acesso duplicado.', created_at: '' },
]

interface ResidentRow extends Resident {
  unit_number: string
}

interface EditForm {
  full_name: string
  role: ResidentRole
  status: 'aprovado' | 'aguardando' | 'inativo'
  phone: string
  email: string
  birth_date: string
  cpf: string
  access_code: string
  notes: string
}

function toForm(r: ResidentRow): EditForm {
  return {
    full_name: r.full_name,
    role: r.role,
    status: r.status,
    phone: r.phone ?? '',
    email: r.email ?? '',
    birth_date: r.birth_date ?? '',
    cpf: r.cpf ?? '',
    access_code: r.access_code ?? '',
    notes: r.notes ?? '',
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider mb-1 font-semibold"
        style={{ color: 'var(--color-text-3)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none transition"
const inputStyle = { background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }

export default function Moradores() {
  const [residents, setResidents] = useState<ResidentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [sortBy, setSortBy] = useState<'nome' | 'unidade'>('nome')
  const [alertNote, setAlertNote] = useState<string | null>(null)
  const [editing, setEditing] = useState<ResidentRow | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isDemo) { setResidents(DEMO_RESIDENTS); setLoading(false); return }
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('residents')
      .select('*, units(number)')
      .order('full_name')
    if (data) setResidents(data.map((r: any) => ({ ...r, unit_number: r.units?.number ?? '' })))
    setLoading(false)
  }

  // Close menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function openEdit(r: ResidentRow) {
    setEditing(r)
    setForm(toForm(r))
    setMenuOpen(null)
  }

  function closeEdit() { setEditing(null); setForm(null) }

  function set(field: keyof EditForm, value: string) {
    setForm(f => f ? { ...f, [field]: value } : f)
  }

  async function handleSave() {
    if (!editing || !form) return
    setSaving(true)
    const payload = {
      full_name: form.full_name,
      role: form.role,
      status: form.status,
      phone: form.phone || null,
      email: form.email || null,
      birth_date: form.birth_date || null,
      cpf: form.cpf || null,
      access_code: form.access_code || null,
      notes: form.notes || null,
    }
    if (!isDemo) {
      await supabase.from('residents').update(payload).eq('id', editing.id)
    }
    setResidents(prev => prev.map(r => r.id === editing.id ? { ...r, ...payload, unit_number: r.unit_number } : r))
    setSaving(false)
    closeEdit()
  }

  const filtered = residents
    .filter(r => {
      const q = busca.toLowerCase()
      return r.full_name.toLowerCase().includes(q) || r.unit_number.includes(q) || (r.phone ?? '').includes(q)
    })
    .sort((a, b) =>
      sortBy === 'nome'
        ? a.full_name.localeCompare(b.full_name, 'pt-BR')
        : a.unit_number.localeCompare(b.unit_number, 'pt-BR', { numeric: true }) || a.full_name.localeCompare(b.full_name, 'pt-BR')
    )

  const alertCount = residents.filter(r => r.notes).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Moradores</h1>
          {alertCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: 'var(--color-warning)', background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' }}>
              <AlertTriangle size={12} />
              {alertCount} para revisar
            </span>
          )}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:opacity-90 text-white text-sm font-semibold rounded-lg transition">
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-3)]" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, apto, telefone..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-lg text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition"
          />
        </div>
        <button
          onClick={() => setSortBy(s => s === 'nome' ? 'unidade' : 'nome')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition flex-shrink-0"
          style={{ background: 'var(--color-card)', borderColor: 'var(--color-border-1)', color: 'var(--color-text-2)' }}
        >
          <ArrowUpDown size={13} />
          {sortBy === 'nome' ? 'A–Z' : 'Unidade'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-text-3)]">Nenhum resultado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id}
              className="bg-[var(--color-card)] border rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ borderColor: r.notes ? 'color-mix(in srgb, var(--color-warning) 40%, var(--color-border-1))' : 'var(--color-border-1)' }}>
              {/* Apto badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black bg-[var(--color-elevated)] text-[var(--color-text-2)]">
                {r.unit_number}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[var(--color-text-1)] truncate">{r.full_name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: ROLE_COLOR[r.role], background: `color-mix(in srgb, ${ROLE_COLOR[r.role]} 15%, transparent)` }}>
                    {ROLE_LABEL[r.role]}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: STATUS_COLOR[r.status], background: `color-mix(in srgb, ${STATUS_COLOR[r.status]} 15%, transparent)` }}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-3)] flex-wrap">
                  {r.phone && <span>{r.phone}</span>}
                  {r.access_code && <span className="font-mono">código: {r.access_code}</span>}
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.notes && (
                  <button onClick={() => setAlertNote(r.notes)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                    style={{ color: 'var(--color-warning)', background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' }}>
                    <AlertTriangle size={14} />
                  </button>
                )}
                {/* 3-dot menu */}
                <div className="relative" ref={menuOpen === r.id ? menuRef : undefined}>
                  <button
                    onClick={() => setMenuOpen(v => v === r.id ? null : r.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:bg-[var(--color-elevated)]"
                    style={{ color: 'var(--color-text-3)' }}>
                    <MoreVertical size={14} />
                  </button>
                  {menuOpen === r.id && (
                    <div className="absolute right-0 top-8 z-20 rounded-xl shadow-xl min-w-[140px] overflow-hidden"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-1)' }}>
                      <button onClick={() => openEdit(r)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-elevated)] transition"
                        style={{ color: 'var(--color-text-1)' }}>
                        Editar dados
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nota */}
      {alertNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setAlertNote(null)}>
          <div className="bg-[var(--color-card)] border rounded-2xl p-5 max-w-sm w-full shadow-xl"
            style={{ borderColor: 'color-mix(in srgb, var(--color-warning) 50%, var(--color-border-1))' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--color-warning)' }}>
                <AlertTriangle size={16} /> Revisão pendente
              </div>
              <button onClick={() => setAlertNote(null)} className="text-[var(--color-text-3)] hover:text-[var(--color-text-1)]"><X size={16} /></button>
            </div>
            <p className="text-sm text-[var(--color-text-2)] leading-relaxed">{alertNote}</p>
          </div>
        </div>
      )}

      {/* Modal edição */}
      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={closeEdit}>
          <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-1)]">
              <div>
                <div className="font-bold text-base text-[var(--color-text-1)]">{editing.full_name}</div>
                <div className="text-xs text-[var(--color-text-3)] mt-0.5">Apto {editing.unit_number}</div>
              </div>
              <button onClick={closeEdit} className="text-[var(--color-text-3)] hover:text-[var(--color-text-1)] transition"><X size={18} /></button>
            </div>

            {/* Form */}
            <div className="px-5 py-4 space-y-4">
              <Field label="Nome completo">
                <input value={form.full_name} onChange={e => set('full_name', e.target.value)} className={inputCls} style={inputStyle} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Vínculo">
                  <select value={form.role} onChange={e => set('role', e.target.value)} className={inputCls} style={inputStyle}>
                    {(Object.entries(ROLE_LABEL) as [ResidentRole, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls} style={inputStyle}>
                    <option value="aprovado">Aprovado</option>
                    <option value="aguardando">Aguardando</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone">
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} style={inputStyle} placeholder="(47) 99000-0000" />
                </Field>
                <Field label="Data de nascimento">
                  <input value={form.birth_date} onChange={e => set('birth_date', e.target.value)} className={inputCls} style={inputStyle} placeholder="DD/MM/AAAA" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="E-mail">
                  <input value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} style={inputStyle} placeholder="email@exemplo.com" />
                </Field>
                <Field label="CPF">
                  <input value={form.cpf} onChange={e => set('cpf', e.target.value)} className={inputCls} style={inputStyle} placeholder="000.000.000-00" />
                </Field>
              </div>

              <Field label="Código de acesso">
                <input value={form.access_code} onChange={e => set('access_code', e.target.value)} className={inputCls} style={inputStyle} placeholder="ex: 123456" />
              </Field>

              <Field label="Observações / Notas de revisão">
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  rows={3} className={inputCls} style={inputStyle}
                  placeholder="Deixe em branco para remover alertas de revisão" />
              </Field>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-[var(--color-border-1)]">
              <button onClick={closeEdit}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                style={{ background: 'var(--color-elevated)', color: 'var(--color-text-2)' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: 'var(--color-accent)' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
