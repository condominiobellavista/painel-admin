import { useEffect, useState } from 'react'
import { Car, Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import { useMorador } from '@/context/MoradorContext'

interface Vehicle { id: string; model: string | null; color: string | null; plate: string | null; type: string | null; responsible: string; status: string }

const TIPOS = ['Automóvel', 'SUV', 'Camionete', 'Moto', 'Picape', 'Van']

const DEMO: Vehicle[] = [
  { id: '1', model: 'Gol', color: 'Prata', plate: 'ABC1D23', type: 'Automóvel', responsible: 'Demo', status: 'ativo' },
]

const emptyForm = { type: 'Automóvel', model: '', color: '', plate: '' }

export default function MoradorVeiculos() {
  const { morador, code } = useMorador()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (isDemo) { setVehicles(DEMO); setLoading(false); return }
    const { data } = await supabase.rpc('morador_get_vehicles', { p_code: code! })
    setVehicles((data ?? []) as Vehicle[])
    setLoading(false)
  }

  useEffect(() => { load() }, [morador])

  function startAdd() { setForm(emptyForm); setEditId(null); setAdding(true); setError(null) }
  function startEdit(v: Vehicle) {
    setForm({ type: v.type ?? 'Automóvel', model: v.model ?? '', color: v.color ?? '', plate: v.plate ?? '' })
    setEditId(v.id); setAdding(false); setError(null)
  }
  function cancelForm() { setAdding(false); setEditId(null); setError(null) }

  async function saveVehicle() {
    if (!form.model.trim()) { setError('Informe o modelo.'); return }
    if (!form.plate.trim()) { setError('Informe a placa.'); return }
    setSaving(true); setError(null)
    if (isDemo) {
      if (editId) {
        setVehicles(vs => vs.map(v => v.id === editId ? { ...v, ...form } : v))
      } else {
        setVehicles(vs => [...vs, { id: Date.now().toString(), ...form, responsible: morador?.name ?? '', status: 'ativo' }])
      }
      setSaving(false); cancelForm(); return
    }
    const fn = editId ? 'morador_update_vehicle' : 'morador_insert_vehicle'
    const params = editId
      ? { p_code: code!, p_vehicle_id: editId, p_type: form.type, p_model: form.model, p_color: form.color, p_plate: form.plate }
      : { p_code: code!, p_type: form.type, p_model: form.model, p_color: form.color, p_plate: form.plate }
    const { error: err } = await supabase.rpc(fn, params)
    setSaving(false)
    if (err) { setError('Erro ao salvar. Tente novamente.'); return }
    cancelForm(); load()
  }

  async function deleteVehicle(id: string) {
    if (isDemo) { setVehicles(vs => vs.filter(v => v.id !== id)); setConfirmDelete(null); return }
    await supabase.rpc('morador_delete_vehicle', { p_code: code!, p_vehicle_id: id })
    setConfirmDelete(null); load()
  }

  const Field = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 bg-[var(--color-elevated)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-black text-[var(--color-text-1)]">Meus veículos</h1>
        {!adding && !editId && (
          <button onClick={startAdd}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition"
            style={{ background: 'var(--color-accent)' }}>
            <Plus size={13} /> Adicionar
          </button>
        )}
      </div>
      <p className="text-sm text-[var(--color-text-3)] mb-5">Veículos cadastrados na sua unidade.</p>

      {/* Formulário de adição */}
      {adding && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-4 mb-4 space-y-3">
          <p className="text-xs font-bold text-[var(--color-text-3)] uppercase tracking-wider">Novo veículo</p>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider mb-1">Tipo</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--color-elevated)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)] transition">
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <Field label="Modelo" value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} placeholder="Ex: Honda Civic" />
          <Field label="Cor" value={form.color} onChange={v => setForm(f => ({ ...f, color: v }))} placeholder="Ex: Prata" />
          <Field label="Placa" value={form.plate} onChange={v => setForm(f => ({ ...f, plate: v.toUpperCase() }))} placeholder="ABC1D23" />
          {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={saveVehicle} disabled={saving}
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
      )}

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : vehicles.length === 0 && !adding ? (
        <div className="text-center py-12 text-[var(--color-text-3)]">
          <Car size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum veículo cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <div key={v.id} className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden">
              {editId === v.id ? (
                <div className="p-4 space-y-3">
                  <p className="text-xs font-bold text-[var(--color-text-3)] uppercase tracking-wider">Editar veículo</p>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider mb-1">Tipo</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-[var(--color-elevated)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)] transition">
                      {TIPOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <Field label="Modelo" value={form.model} onChange={val => setForm(f => ({ ...f, model: val }))} placeholder="Ex: Honda Civic" />
                  <Field label="Cor" value={form.color} onChange={val => setForm(f => ({ ...f, color: val }))} placeholder="Ex: Prata" />
                  <Field label="Placa" value={form.plate} onChange={val => setForm(f => ({ ...f, plate: val.toUpperCase() }))} placeholder="ABC1D23" />
                  {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveVehicle} disabled={saving}
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
              ) : (
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-elevated)', color: 'var(--color-text-3)' }}>
                    <Car size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[var(--color-text-1)] text-sm truncate">{v.model || '—'}</div>
                    <div className="text-xs text-[var(--color-text-3)] mt-0.5">{[v.type, v.color].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className="font-mono text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'var(--color-elevated)', color: 'var(--color-text-2)' }}>
                    {v.plate || '—'}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(v)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition"
                      style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)' }}>
                      <Pencil size={13} />
                    </button>
                    {confirmDelete === v.id ? (
                      <button onClick={() => deleteVehicle(v.id)}
                        className="h-8 px-2 rounded-lg text-xs font-bold flex items-center gap-1 text-white animate-pulse"
                        style={{ background: 'var(--color-danger)' }}>
                        <Trash2 size={12} /> Remover?
                      </button>
                    ) : (
                      <button onClick={() => setConfirmDelete(v.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition"
                        style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', color: 'var(--color-danger)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
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
