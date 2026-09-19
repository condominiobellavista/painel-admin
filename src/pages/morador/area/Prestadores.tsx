import { useEffect, useState } from 'react'
import { Wrench, Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import { useMorador } from '@/context/MoradorContext'

interface Provider { id: string; name: string; service_type: string | null; days: string | null; schedule: string | null; access_code: string | null; status: string }

const DEMO: Provider[] = [
  { id: '1', name: 'Maria Silva', service_type: 'Diarista', days: 'Quarta', schedule: '08:00–14:00', access_code: '000001', status: 'ativo' },
]

const emptyForm = { name: '', service_type: 'Diarista', days: '', schedule: '' }

export default function MoradorPrestadores() {
  const { morador, code } = useMorador()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (isDemo) { setProviders(DEMO); setLoading(false); return }
    const { data } = await supabase.rpc('morador_get_providers', { p_code: code! })
    setProviders((data ?? []) as Provider[])
    setLoading(false)
  }

  useEffect(() => { load() }, [morador])

  function startAdd() { setForm(emptyForm); setEditId(null); setAdding(true); setError(null) }
  function startEdit(p: Provider) {
    setForm({ name: p.name, service_type: p.service_type ?? 'Diarista', days: p.days ?? '', schedule: p.schedule ?? '' })
    setEditId(p.id); setAdding(false); setError(null)
  }
  function cancelForm() { setAdding(false); setEditId(null); setError(null) }

  async function saveProvider() {
    if (!form.name.trim()) { setError('Informe o nome.'); return }
    setSaving(true); setError(null)
    if (isDemo) {
      if (editId) {
        setProviders(ps => ps.map(p => p.id === editId ? { ...p, ...form } : p))
      } else {
        setProviders(ps => [...ps, { id: Date.now().toString(), ...form, access_code: null, status: 'ativo' }])
      }
      setSaving(false); cancelForm(); return
    }
    const fn = editId ? 'morador_update_provider' : 'morador_insert_provider'
    const params = editId
      ? { p_code: code!, p_provider_id: editId, p_name: form.name, p_service_type: form.service_type, p_days: form.days, p_schedule: form.schedule }
      : { p_code: code!, p_name: form.name, p_service_type: form.service_type, p_days: form.days, p_schedule: form.schedule }
    const { error: err } = await supabase.rpc(fn, params)
    setSaving(false)
    if (err) { setError('Erro ao salvar. Tente novamente.'); return }
    cancelForm(); load()
  }

  async function deleteProvider(id: string) {
    if (isDemo) { setProviders(ps => ps.filter(p => p.id !== id)); setConfirmDelete(null); return }
    await supabase.rpc('morador_delete_provider', { p_code: code!, p_provider_id: id })
    setConfirmDelete(null); load()
  }

  const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 bg-[var(--color-elevated)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition" />
    </div>
  )

  function ProviderForm() {
    return (
      <div className="space-y-3">
        <Field label="Nome" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ex: Maria Silva" />
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider mb-1">Tipo de serviço</label>
          <input value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} placeholder="Ex: Diarista, Encanador..."
            className="w-full px-3 py-2 bg-[var(--color-elevated)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition" />
        </div>
        <Field label="Dias" value={form.days} onChange={v => setForm(f => ({ ...f, days: v }))} placeholder="Ex: Quarta e Quinta" />
        <Field label="Horário" value={form.schedule} onChange={v => setForm(f => ({ ...f, schedule: v }))} placeholder="Ex: 08:00–14:00" />
        {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={saveProvider} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-sm font-bold rounded-xl disabled:opacity-50"
            style={{ background: 'var(--color-accent)' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
          </button>
          <button onClick={cancelForm} className="px-4 py-2.5 rounded-xl text-sm font-semibold border hover:opacity-80 transition"
            style={{ background: 'var(--color-elevated)', borderColor: 'var(--color-border-1)', color: 'var(--color-text-2)' }}>
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-black text-[var(--color-text-1)]">Prestadores</h1>
        {!adding && !editId && (
          <button onClick={startAdd}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition"
            style={{ background: 'var(--color-accent)' }}>
            <Plus size={13} /> Adicionar
          </button>
        )}
      </div>
      <p className="text-sm text-[var(--color-text-3)] mb-5">Prestadores com acesso à sua unidade.</p>

      {adding && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-[var(--color-text-3)] uppercase tracking-wider mb-3">Novo prestador</p>
          <ProviderForm />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : providers.length === 0 && !adding ? (
        <div className="text-center py-12 text-[var(--color-text-3)]">
          <Wrench size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum prestador cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map(p => (
            <div key={p.id} className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden">
              {editId === p.id ? (
                <div className="p-4">
                  <p className="text-xs font-bold text-[var(--color-text-3)] uppercase tracking-wider mb-3">Editar prestador</p>
                  <ProviderForm />
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[var(--color-text-1)] text-sm">{p.name}</div>
                      {p.service_type && <div className="text-xs text-[var(--color-text-3)] mt-0.5">{p.service_type}</div>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition"
                        style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)' }}>
                        <Pencil size={12} />
                      </button>
                      {confirmDelete === p.id ? (
                        <button onClick={() => deleteProvider(p.id)}
                          className="h-7 px-2 rounded-lg text-xs font-bold flex items-center gap-1 text-white animate-pulse"
                          style={{ background: 'var(--color-danger)' }}>
                          <Trash2 size={11} /> Remover?
                        </button>
                      ) : (
                        <button onClick={() => setConfirmDelete(p.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition"
                          style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', color: 'var(--color-danger)' }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  {(p.days || p.schedule) && (
                    <div className="flex gap-3 text-xs text-[var(--color-text-3)] mb-2">
                      {p.days && <span>📅 {p.days}</span>}
                      {p.schedule && <span>🕐 {p.schedule}</span>}
                    </div>
                  )}
                  {p.access_code && (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="text-[var(--color-text-3)]">Código de acesso:</span>
                      <span className="font-mono font-bold px-2 py-0.5 rounded"
                        style={{ background: 'var(--color-elevated)', color: 'var(--color-text-1)' }}>
                        {p.access_code}
                      </span>
                    </div>
                  )}
                  {!p.access_code && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>
                      Código pendente — a administração irá atribuir em breve.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
