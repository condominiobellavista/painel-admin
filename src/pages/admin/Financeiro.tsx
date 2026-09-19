import { useEffect, useState } from 'react'
import { Search, DollarSign, AlertTriangle, Lock, Unlock, Check } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

interface Unit {
  id: string
  number: string
  type: 'proprio' | 'alugado'
  responsible: string
  phone: string | null
  email: string | null
  is_delinquent: boolean
  is_blocked: boolean
  delinquent_date: string | null
  delinquent_by: string | null
  notes: string | null
}

const DEMO: Unit[] = [
  { id: '1', number: '102', type: 'alugado', responsible: 'Demo Inquilino', phone: '(47) 99000-0002', email: null, is_delinquent: true, is_blocked: true, delinquent_date: '2025-01-15', delinquent_by: 'Admin', notes: null },
  { id: '2', number: '205', type: 'proprio', responsible: 'Demo Proprietário', phone: '(47) 99000-0005', email: null, is_delinquent: true, is_blocked: false, delinquent_date: '2025-03-01', delinquent_by: 'Admin', notes: null },
  { id: '3', number: '301', type: 'proprio', responsible: 'Demo Regular', phone: '(47) 99000-0006', email: null, is_delinquent: false, is_blocked: false, delinquent_date: null, delinquent_by: null, notes: null },
]

function fmt(date: string | null) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export default function AdminFinanceiro() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    if (isDemo) { setUnits(DEMO); setLoading(false); return }
    const { data } = await supabase
      .from('units')
      .select('id,number,type,responsible,phone,email,is_delinquent,is_blocked,delinquent_date,delinquent_by,notes')
      .order('number')
    setUnits((data ?? []) as Unit[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markDelinquent(u: Unit) {
    const next = !u.is_delinquent
    if (isDemo) {
      setUnits(us => us.map(x => x.id === u.id ? { ...x, is_delinquent: next, delinquent_date: next ? new Date().toISOString().slice(0,10) : null } : x))
      return
    }
    setActing(u.id + '-delinquent')
    await supabase.from('units').update({
      is_delinquent: next,
      delinquent_date: next ? new Date().toISOString() : null,
      delinquent_by: next ? 'admin' : null,
    }).eq('id', u.id)
    setActing(null)
    load()
  }

  async function toggleBlock(u: Unit) {
    const next = !u.is_blocked
    if (isDemo) {
      setUnits(us => us.map(x => x.id === u.id ? { ...x, is_blocked: next } : x))
      return
    }
    setActing(u.id + '-block')
    await supabase.from('units').update({
      is_blocked: next,
      blocked_date: next ? new Date().toISOString() : null,
    }).eq('id', u.id)
    setActing(null)
    load()
  }

  const q = busca.toLowerCase()
  const filtered = units.filter(u =>
    !q || u.number.includes(q) || u.responsible.toLowerCase().includes(q) || u.phone?.includes(q)
  )

  const inadimplentes = filtered.filter(u => u.is_delinquent)
  const emDia = filtered.filter(u => !u.is_delinquent)

  const totalInadim = units.filter(u => u.is_delinquent).length
  const totalBloq = units.filter(u => u.is_blocked).length

  function UnitCard({ u }: { u: Unit }) {
    const acting1 = acting === u.id + '-delinquent'
    const acting2 = acting === u.id + '-block'
    return (
      <div className="bg-[var(--color-card)] border rounded-2xl px-4 py-3 space-y-2"
        style={{
          borderColor: u.is_blocked
            ? 'color-mix(in srgb, var(--color-warning) 35%, var(--color-border-1))'
            : u.is_delinquent
            ? 'color-mix(in srgb, var(--color-danger) 30%, var(--color-border-1))'
            : 'var(--color-border-1)',
        }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
            style={{
              background: u.is_delinquent ? 'color-mix(in srgb, var(--color-danger) 15%, transparent)' : 'var(--color-elevated)',
              color: u.is_delinquent ? 'var(--color-danger)' : 'var(--color-text-1)',
            }}>
            {u.number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-[var(--color-text-1)] truncate">{u.responsible || '—'}</span>
              {u.type === 'alugado' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--color-elevated)', color: 'var(--color-text-3)' }}>Alugado</span>
              )}
              {u.is_blocked && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }}>
                  🔒 Bloqueado
                </span>
              )}
            </div>
            {u.is_delinquent && u.delinquent_date && (
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-danger)' }}>
                Inadimplente desde {fmt(u.delinquent_date)}
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 flex-wrap">
          {u.is_delinquent ? (
            <button onClick={() => markDelinquent(u)} disabled={!!acting}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50 transition"
              style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)' }}>
              {acting1 ? '...' : <><Check size={11} /> Quitar inadimplência</>}
            </button>
          ) : (
            <button onClick={() => markDelinquent(u)} disabled={!!acting}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50 transition"
              style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', color: 'var(--color-danger)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)' }}>
              {acting1 ? '...' : <><AlertTriangle size={11} /> Marcar inadimplente</>}
            </button>
          )}
          {u.is_delinquent && (
            u.is_blocked ? (
              <button onClick={() => toggleBlock(u)} disabled={!!acting}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50 transition"
                style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)' }}>
                {acting2 ? '...' : <><Unlock size={11} /> Remover bloqueio</>}
              </button>
            ) : (
              <button onClick={() => toggleBlock(u)} disabled={!!acting}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50 transition"
                style={{ background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', color: 'var(--color-warning)', border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)' }}>
                {acting2 ? '...' : <><Lock size={11} /> Bloquear acesso</>}
              </button>
            )
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--color-text-1)]">Financeiro</h1>
        {!loading && (
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-[var(--color-text-3)]">{units.length} unidades</span>
            {totalInadim > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', color: 'var(--color-danger)' }}>
                {totalInadim} inadimplente{totalInadim !== 1 ? 's' : ''}
              </span>
            )}
            {totalBloq > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', color: 'var(--color-warning)' }}>
                {totalBloq} bloqueada{totalBloq !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-3)]" />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por apto, responsável, telefone..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition" />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-3)]">
          <DollarSign size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{busca ? 'Nenhum resultado.' : 'Nenhuma unidade cadastrada.'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {inadimplentes.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"
                style={{ color: 'var(--color-danger)' }}>
                <AlertTriangle size={12} /> Inadimplentes ({inadimplentes.length})
              </div>
              <div className="space-y-2">
                {inadimplentes.map(u => <UnitCard key={u.id} u={u} />)}
              </div>
            </div>
          )}
          {emDia.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-text-3)' }}>
                ✅ Em dia ({emDia.length})
              </div>
              <div className="space-y-2">
                {emDia.map(u => <UnitCard key={u.id} u={u} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
