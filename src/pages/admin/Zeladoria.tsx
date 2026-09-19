import { useEffect, useState } from 'react'
import { Search, HardHat, Plus, Pencil, Check, X, Loader2, Trash2 } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

interface Staff {
  id: string
  role: string
  full_name: string
  phone: string | null
  email: string | null
  access_code: string | null
  status: 'aprovado' | 'inativo'
  created_at: string
}

const ROLES = ['Zelador(a)', 'Jardineiro(a)', 'Porteiro(a)', 'Faxineiro(a)', 'Leiturista', 'Outro']

const STATUS_COLOR = { aprovado: 'var(--color-success)', inativo: 'var(--color-danger)' }
const STATUS_BG = {
  aprovado: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
  inativo: 'color-mix(in srgb, var(--color-danger) 12%, transparent)',
}

const DEMO: Staff[] = [
  { id: '1', role: 'Zelador(a)', full_name: 'Demo Zeladora', phone: '(47) 99000-0001', email: 'zeladora@bellavista.app', access_code: '000001', status: 'aprovado', created_at: '' },
  { id: '2', role: 'Jardineiro(a)', full_name: 'Demo Jardineiro', phone: '(47) 99000-0002', email: null, access_code: null, status: 'aprovado', created_at: '' },
]

const emptyForm = { role: 'Zelador(a)', full_name: '', phone: '', email: '', access_code: '' }

type Form = typeof emptyForm

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 bg-[var(--color-elevated)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition" />
    </div>
  )
}

export default function AdminZeladoria() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (isDemo) { setStaff(DEMO); setLoading(false); return }
    const { data } = await supabase.from('building_staff').select('*').order('full_name')
    setStaff((data ?? []) as Staff[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startAdd() { setForm(emptyForm); setEditId(null); setAdding(true); setError(null) }
  function startEdit(s: Staff) {
    setForm({ role: s.role, full_name: s.full_name, phone: s.phone ?? '', email: s.email ?? '', access_code: s.access_code ?? '' })
    setEditId(s.id); setAdding(false); setError(null)
  }
  function cancelForm() { setAdding(false); setEditId(null); setError(null) }

  async function save() {
    if (!form.full_name.trim()) { setError('Informe o nome.'); return }
    setSaving(true); setError(null)
    if (isDemo) {
      if (editId) {
        setStaff(ss => ss.map(s => s.id === editId ? { ...s, ...form } : s))
      } else {
        setStaff(ss => [...ss, { id: Date.now().toString(), ...form, status: 'aprovado', created_at: '' }])
      }
      setSaving(false); cancelForm(); return
    }
    const payload = {
      role: form.role,
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      access_code: form.access_code || null,
    }
    const { error: err } = editId
      ? await supabase.from('building_staff').update(payload).eq('id', editId)
      : await supabase.from('building_staff').insert({ ...payload, status: 'aprovado' })
    setSaving(false)
    if (err) { setError('Erro ao salvar.'); return }
    cancelForm(); load()
  }

  async function toggleStatus(s: Staff) {
    const next = s.status === 'aprovado' ? 'inativo' : 'aprovado'
    if (isDemo) { setStaff(ss => ss.map(x => x.id === s.id ? { ...x, status: next } : x)); return }
    await supabase.from('building_staff').update({ status: next }).eq('id', s.id)
    load()
  }

  async function remove(id: string) {
    if (isDemo) { setStaff(ss => ss.filter(s => s.id !== id)); return }
    await supabase.from('building_staff').delete().eq('id', id)
    load()
  }

  const q = busca.toLowerCase()
  const filtered = staff.filter(s =>
    !q || s.full_name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.phone?.includes(q)
  )

  const StaffForm = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider mb-1">Função</label>
        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          className="w-full px-3 py-2 bg-[var(--color-elevated)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)] transition">
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <Field label="Nome completo" value={form.full_name} onChange={v => setForm(f => ({ ...f, full_name: v }))} placeholder="Nome completo" />
      <Field label="WhatsApp" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(47) 99999-0000" type="tel" />
      <Field label="E-mail" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="email@exemplo.com" type="email" />
      <Field label="Código de acesso" value={form.access_code} onChange={v => setForm(f => ({ ...f, access_code: v }))} placeholder="6 dígitos" />
      {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-bold rounded-xl disabled:opacity-50"
          style={{ background: 'var(--color-accent)' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
        </button>
        <button onClick={cancelForm}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border hover:opacity-80 transition"
          style={{ background: 'var(--color-elevated)', borderColor: 'var(--color-border-1)', color: 'var(--color-text-2)' }}>
          <X size={14} />
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-1)]">Zeladoria</h1>
          {!loading && <p className="text-xs text-[var(--color-text-3)] mt-0.5">{staff.length} funcionário{staff.length !== 1 ? 's' : ''}</p>}
        </div>
        {!adding && !editId && (
          <button onClick={startAdd}
            className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-xl text-white transition"
            style={{ background: 'var(--color-accent)' }}>
            <Plus size={14} /> Adicionar
          </button>
        )}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-3)]" />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou função..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition" />
      </div>

      {adding && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-[var(--color-text-3)] uppercase tracking-wider mb-3">Novo funcionário</p>
          <StaffForm />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : filtered.length === 0 && !adding ? (
        <div className="text-center py-16 text-[var(--color-text-3)]">
          <HardHat size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{busca ? 'Nenhum resultado.' : 'Nenhum funcionário cadastrado.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden">
              {editId === s.id ? (
                <div className="p-4">
                  <p className="text-xs font-bold text-[var(--color-text-3)] uppercase tracking-wider mb-3">Editar funcionário</p>
                  <StaffForm />
                </div>
              ) : (
                <div className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'var(--color-elevated)', color: 'var(--color-text-3)' }}>
                      <HardHat size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[var(--color-text-1)]">{s.full_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--color-elevated)', color: 'var(--color-text-3)' }}>
                          {s.role}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: STATUS_BG[s.status], color: STATUS_COLOR[s.status] }}>
                          {s.status === 'aprovado' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--color-text-3)] mt-0.5">
                        {s.phone && <span>📱 {s.phone}</span>}
                        {s.phone && s.email && <span> · </span>}
                        {s.email && <span>✉️ {s.email}</span>}
                      </div>
                      {s.access_code && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">Código de acesso:</span>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg"
                            style={{ background: 'var(--color-elevated)', color: 'var(--color-text-1)' }}>
                            {s.access_code}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(s)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition"
                        style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => toggleStatus(s)} title={s.status === 'aprovado' ? 'Desativar' : 'Ativar'}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition text-xs font-bold"
                        style={{ background: STATUS_BG[s.status], color: STATUS_COLOR[s.status] }}>
                        {s.status === 'aprovado' ? '✓' : '○'}
                      </button>
                      <button onClick={() => remove(s.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition"
                        style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', color: 'var(--color-danger)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
