import { useEffect, useState } from 'react'
import { Search, Building2, AlertTriangle, X } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

interface Unit {
  id: string
  number: string
  type: 'proprio' | 'alugado'
  responsible: string
  phone: string | null
  email: string | null
  resident_count: number
  vehicle_count: number
  provider_count: number
  status: 'aprovado' | 'aguardando' | 'inativo'
  is_delinquent: boolean
  is_blocked: boolean
  notes: string | null
}

const DEMO: Unit[] = [
  { id: '1', number: '101', type: 'proprio', responsible: 'Demo Proprietário', phone: '(47) 99000-0001', email: 'demo@example.com', resident_count: 2, vehicle_count: 1, provider_count: 1, status: 'aprovado', is_delinquent: false, is_blocked: false, notes: null },
  { id: '2', number: '202', type: 'alugado', responsible: 'Demo Inquilino', phone: '(47) 99000-0002', email: null, resident_count: 1, vehicle_count: 0, provider_count: 0, status: 'aprovado', is_delinquent: true, is_blocked: false, notes: 'Inadimplente desde jan/2025' },
  { id: '3', number: '303', type: 'proprio', responsible: 'Demo Bloqueado', phone: null, email: null, resident_count: 0, vehicle_count: 0, provider_count: 0, status: 'inativo', is_delinquent: false, is_blocked: true, notes: 'Unidade bloqueada por decisão assembleia' },
]

function badge(label: string, color: string, bg: string) {
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color, background: bg }}>
      {label}
    </span>
  )
}

export default function AdminUnidades() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [noteUnit, setNoteUnit] = useState<Unit | null>(null)

  useEffect(() => {
    async function load() {
      if (isDemo) { setUnits(DEMO); setLoading(false); return }
      const { data } = await supabase
        .from('units')
        .select('id,number,type,responsible,phone,email,resident_count,vehicle_count,provider_count,status,is_delinquent,is_blocked,notes')
        .order('number')
      setUnits((data ?? []) as Unit[])
      setLoading(false)
    }
    load()
  }, [])

  const q = busca.toLowerCase()
  const filtered = units.filter(u =>
    !q ||
    u.number.includes(q) ||
    u.responsible.toLowerCase().includes(q) ||
    u.phone?.includes(q) ||
    u.email?.toLowerCase().includes(q)
  )

  const inadimplentes = units.filter(u => u.is_delinquent).length
  const bloqueadas = units.filter(u => u.is_blocked).length
  const comNota = units.filter(u => u.notes).length

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--color-text-1)]">Unidades</h1>
        {!loading && (
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-[var(--color-text-3)]">{units.length} unidades</span>
            {inadimplentes > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', color: 'var(--color-danger)' }}>
                {inadimplentes} inadimplente{inadimplentes !== 1 ? 's' : ''}
              </span>
            )}
            {bloqueadas > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', color: 'var(--color-warning)' }}>
                {bloqueadas} bloqueada{bloqueadas !== 1 ? 's' : ''}
              </span>
            )}
            {comNota > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)', color: 'var(--color-accent)' }}>
                {comNota} com nota
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-3)]" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por número, responsável, telefone..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition"
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-3)]">
          <Building2 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{busca ? 'Nenhum resultado encontrado.' : 'Nenhuma unidade cadastrada.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div key={u.id}
              className="bg-[var(--color-card)] border rounded-2xl px-4 py-3 transition"
              style={{
                borderColor: u.is_delinquent
                  ? 'color-mix(in srgb, var(--color-danger) 35%, var(--color-border-1))'
                  : u.is_blocked
                  ? 'color-mix(in srgb, var(--color-warning) 35%, var(--color-border-1))'
                  : 'var(--color-border-1)'
              }}>
              <div className="flex items-center gap-3">
                {/* Número do apto */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-base"
                  style={{
                    background: u.is_delinquent
                      ? 'color-mix(in srgb, var(--color-danger) 15%, transparent)'
                      : u.is_blocked
                      ? 'color-mix(in srgb, var(--color-warning) 15%, transparent)'
                      : 'var(--color-elevated)',
                    color: u.is_delinquent
                      ? 'var(--color-danger)'
                      : u.is_blocked
                      ? 'var(--color-warning)'
                      : 'var(--color-text-1)',
                  }}>
                  {u.number}
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-[var(--color-text-1)] truncate">{u.responsible || '—'}</span>
                    {u.type === 'alugado' && badge('Alugado', 'var(--color-text-3)', 'var(--color-elevated)')}
                    {u.is_delinquent && badge('Inadimplente', 'var(--color-danger)', 'color-mix(in srgb, var(--color-danger) 12%, transparent)')}
                    {u.is_blocked && badge('Bloqueado', 'var(--color-warning)', 'color-mix(in srgb, var(--color-warning) 12%, transparent)')}
                  </div>
                  <div className="text-xs text-[var(--color-text-3)] mt-0.5">
                    {u.phone || u.email || '—'}
                  </div>
                </div>

                {/* Contadores + nota */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden sm:flex gap-3 text-center">
                    <div>
                      <div className="text-[10px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">Mor.</div>
                      <div className="text-sm font-bold text-[var(--color-text-1)]">{u.resident_count}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">Veíc.</div>
                      <div className="text-sm font-bold text-[var(--color-text-1)]">{u.vehicle_count}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">Prest.</div>
                      <div className="text-sm font-bold text-[var(--color-text-1)]">{u.provider_count}</div>
                    </div>
                  </div>
                  {u.notes && (
                    <button onClick={() => setNoteUnit(u)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition"
                      style={{ background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }}
                      title="Ver nota">
                      <AlertTriangle size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de nota */}
      {noteUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setNoteUnit(null)}>
          <div className="rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                <span className="font-bold text-sm text-[var(--color-text-1)]">Nota — Apto {noteUnit.number}</span>
              </div>
              <button onClick={() => setNoteUnit(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition"
                style={{ color: 'var(--color-text-3)' }}>
                <X size={14} />
              </button>
            </div>
            <p className="text-sm text-[var(--color-text-2)] leading-relaxed">{noteUnit.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}
