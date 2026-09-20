import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

interface Staff {
  id: string
  full_name: string
  role: string
  phone: string | null
  email: string | null
  access_code: string | null
  status: 'aprovado' | 'inativo'
}

const ROLES = [
  { value: 'zelador', label: 'Zelador(a)' },
  { value: 'jardineiro', label: 'Jardineiro(a)' },
  { value: 'porteiro', label: 'Porteiro(a)' },
  { value: 'faxineiro', label: 'Faxineiro(a)' },
  { value: 'leiturista', label: 'Leiturista' },
  { value: 'outro', label: 'Outro' },
]

const DEMO_STAFF: Staff[] = [
  { id: '1', full_name: 'Carlos Zelador', role: 'zelador', phone: '(47) 99000-0001', email: null, access_code: '000010', status: 'aprovado' },
  { id: '2', full_name: 'Maria Faxineira', role: 'faxineiro', phone: '(47) 99000-0002', email: null, access_code: '000011', status: 'aprovado' },
  { id: '3', full_name: 'João Leiturista', role: 'leiturista', phone: null, email: null, access_code: null, status: 'inativo' },
]

const blank: Omit<Staff, 'id'> = { full_name: '', role: 'zelador', phone: '', email: '', access_code: '', status: 'aprovado' }

export default function AdminZeladoria() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Omit<Staff, 'id'> | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) { setStaff(DEMO_STAFF); setLoading(false); return }
    supabase
      .from('building_staff')
      .select('id, full_name, role, phone, email, access_code, status')
      .order('full_name')
      .then(({ data }) => { setStaff((data ?? []) as Staff[]); setLoading(false) })
  }, [])

  function startAdd() {
    setEditId(null)
    setForm({ ...blank })
  }

  function startEdit(s: Staff) {
    setEditId(s.id)
    setForm({ full_name: s.full_name, role: s.role, phone: s.phone ?? '', email: s.email ?? '', access_code: s.access_code ?? '', status: s.status })
  }

  async function saveForm() {
    if (!form || !form.full_name.trim()) return
    setSaving(true)
    const payload = {
      full_name: form.full_name.trim(),
      role: form.role,
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      access_code: form.access_code?.trim() || null,
      status: form.status,
    }
    if (editId) {
      if (!isDemo) await supabase.from('building_staff').update(payload).eq('id', editId)
      setStaff(prev => prev.map(s => s.id === editId ? { ...s, ...payload } : s))
    } else {
      if (isDemo) {
        const newId = String(Date.now())
        setStaff(prev => [...prev, { id: newId, ...payload }])
      } else {
        const { data } = await supabase.from('building_staff').insert(payload).select().single()
        if (data) setStaff(prev => [...prev, data as Staff])
      }
    }
    setForm(null)
    setEditId(null)
    setSaving(false)
  }

  async function toggleStatus(s: Staff) {
    const newStatus = s.status === 'aprovado' ? 'inativo' : 'aprovado'
    if (!isDemo) await supabase.from('building_staff').update({ status: newStatus }).eq('id', s.id)
    setStaff(prev => prev.map(x => x.id === s.id ? { ...x, status: newStatus } : x))
  }

  async function deleteStaff(id: string) {
    if (!isDemo) await supabase.from('building_staff').delete().eq('id', id)
    setStaff(prev => prev.filter(s => s.id !== id))
    setDeleteId(null)
  }

  const activeStaff = staff.filter(s => s.status === 'aprovado')
  const inactiveStaff = staff.filter(s => s.status === 'inativo')

  if (loading) return <div className="text-sm text-[var(--color-text-3)] p-4">Carregando zeladoria...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-1)]">Zeladoria</h1>
          <p className="text-xs text-[var(--color-text-3)] mt-1">{activeStaff.length} funcionários ativos</p>
        </div>
        <button
          onClick={startAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition"
          style={{ background: 'var(--color-accent)', color: '#fff' }}>
          <Plus size={15} /> Adicionar
        </button>
      </div>

      {/* Formulário */}
      {form !== null && (
        <div className="mb-5 p-4 rounded-2xl" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--color-text-1)]">{editId ? 'Editar funcionário' : 'Novo funcionário'}</span>
            <button onClick={() => { setForm(null); setEditId(null) }} className="opacity-60 hover:opacity-100">
              <X size={16} style={{ color: 'var(--color-text-3)' }} />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-1">Nome completo *</label>
                <input value={form.full_name} onChange={e => setForm(f => f && ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm text-[var(--color-text-1)] outline-none"
                  style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)' }} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-1">Cargo</label>
                <select value={form.role} onChange={e => setForm(f => f && ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm text-[var(--color-text-1)] outline-none"
                  style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)' }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-1">Código de acesso</label>
                <input value={form.access_code ?? ''} onChange={e => setForm(f => f && ({ ...f, access_code: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm text-[var(--color-text-1)] outline-none"
                  style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)' }} placeholder="6 dígitos" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-1">Telefone</label>
                <input value={form.phone ?? ''} onChange={e => setForm(f => f && ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm text-[var(--color-text-1)] outline-none"
                  style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)' }} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-1">E-mail</label>
                <input value={form.email ?? ''} onChange={e => setForm(f => f && ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm text-[var(--color-text-1)] outline-none"
                  style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)' }} />
              </div>
            </div>
            <button onClick={saveForm} disabled={saving || !form.full_name.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-40"
              style={{ background: 'var(--color-accent)', color: '#fff' }}>
              {saving ? 'Salvando...' : editId ? 'Salvar alterações' : 'Cadastrar funcionário'}
            </button>
          </div>
        </div>
      )}

      {/* Listagem */}
      {[{ label: 'Ativos', items: activeStaff }, { label: 'Inativos', items: inactiveStaff }].map(g => g.items.length === 0 ? null : (
        <div key={g.label} className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-3)] mb-2">{g.label} ({g.items.length})</div>
          <div className="space-y-2">
            {g.items.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', opacity: s.status === 'inativo' ? 0.6 : 1 }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black flex-shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)' }}>
                  {s.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--color-text-1)] truncate">{s.full_name}</div>
                  <div className="text-xs text-[var(--color-text-3)]">
                    {ROLES.find(r => r.value === s.role)?.label ?? s.role}
                    {s.phone ? ` · ${s.phone}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleStatus(s)} title={s.status === 'aprovado' ? 'Inativar' : 'Ativar'}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                    style={{ background: s.status === 'aprovado' ? 'color-mix(in srgb, var(--color-success) 12%, transparent)' : 'color-mix(in srgb, var(--color-text-3) 12%, transparent)', color: s.status === 'aprovado' ? 'var(--color-success)' : 'var(--color-text-3)' }}>
                    <Check size={13} />
                  </button>
                  <button onClick={() => startEdit(s)} title="Editar"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                    style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)' }}>
                    <Pencil size={12} />
                  </button>
                  {deleteId === s.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteStaff(s.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                        style={{ background: 'color-mix(in srgb, var(--color-danger) 20%, transparent)', color: 'var(--color-danger)' }}>
                        <Check size={13} />
                      </button>
                      <button onClick={() => setDeleteId(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                        style={{ background: 'var(--color-elevated)', color: 'var(--color-text-3)' }}>
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(s.id)} title="Remover"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                      style={{ background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', color: 'var(--color-danger)' }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {staff.length === 0 && form === null && (
        <p className="text-sm text-center text-[var(--color-text-3)] py-10">Nenhum funcionário cadastrado. Clique em "Adicionar" para começar.</p>
      )}
    </div>
  )
}
