import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Lock, Unlock } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

interface Unit {
  id: string
  number: string
  responsible: string
  is_delinquent: boolean
  is_blocked: boolean
}

const DEMO_UNITS: Unit[] = [
  { id: '1', number: '101', responsible: 'Demo Inadimplente', is_delinquent: true, is_blocked: false },
  { id: '2', number: '203', responsible: 'Demo Bloqueado', is_delinquent: false, is_blocked: true },
  { id: '3', number: '305', responsible: 'Demo Em Dia', is_delinquent: false, is_blocked: false },
  { id: '4', number: '407', responsible: 'Demo Morador', is_delinquent: false, is_blocked: false },
  { id: '5', number: '502', responsible: 'Demo Proprietário', is_delinquent: true, is_blocked: true },
]

export default function AdminFinanceiro() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) { setUnits(DEMO_UNITS); setLoading(false); return }
    supabase
      .from('units')
      .select('id, number, responsible, is_delinquent, is_blocked')
      .order('number')
      .then(({ data }) => { setUnits((data ?? []) as Unit[]); setLoading(false) })
  }, [])

  async function toggleDelinquent(u: Unit) {
    const val = !u.is_delinquent
    setSaving(u.id + '_d')
    if (!isDemo) await supabase.from('units').update({ is_delinquent: val }).eq('id', u.id)
    setUnits(prev => prev.map(x => x.id === u.id ? { ...x, is_delinquent: val } : x))
    setSaving(null)
  }

  async function toggleBlocked(u: Unit) {
    const val = !u.is_blocked
    setSaving(u.id + '_b')
    if (!isDemo) await supabase.from('units').update({ is_blocked: val }).eq('id', u.id)
    setUnits(prev => prev.map(x => x.id === u.id ? { ...x, is_blocked: val } : x))
    setSaving(null)
  }

  const delinquent = units.filter(u => u.is_delinquent)
  const okUnits = units.filter(u => !u.is_delinquent && !u.is_blocked)
  const blockedOnly = units.filter(u => !u.is_delinquent && u.is_blocked)

  if (loading) return <div className="text-sm text-[var(--color-text-3)] p-4">Carregando financeiro...</div>

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text-1)]">Financeiro</h1>
        <p className="text-xs text-[var(--color-text-3)] mt-1">
          {delinquent.length} inadimplentes · {blockedOnly.length} bloqueadas · {okUnits.length} em dia
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="px-3 py-3 rounded-xl text-center" style={{ background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)' }}>
          <div className="text-2xl font-black" style={{ color: 'var(--color-danger)' }}>{delinquent.length}</div>
          <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-danger)' }}>Inadimplentes</div>
        </div>
        <div className="px-3 py-3 rounded-xl text-center" style={{ background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warning) 25%, transparent)' }}>
          <div className="text-2xl font-black" style={{ color: 'var(--color-warning)' }}>{units.filter(u => u.is_blocked).length}</div>
          <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-warning)' }}>Bloqueadas</div>
        </div>
        <div className="px-3 py-3 rounded-xl text-center" style={{ background: 'color-mix(in srgb, var(--color-success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)' }}>
          <div className="text-2xl font-black" style={{ color: 'var(--color-success)' }}>{okUnits.length}</div>
          <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-success)' }}>Em dia</div>
        </div>
      </div>

      {/* Inadimplentes */}
      {delinquent.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-3)] mb-2">Inadimplentes ({delinquent.length})</div>
          <div className="space-y-2">
            {delinquent.map(u => (
              <UnitCard key={u.id} u={u} saving={saving} onToggleDelinquent={toggleDelinquent} onToggleBlocked={toggleBlocked} />
            ))}
          </div>
        </div>
      )}

      {/* Bloqueadas (sem inadimplência) */}
      {blockedOnly.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-3)] mb-2">Bloqueadas ({blockedOnly.length})</div>
          <div className="space-y-2">
            {blockedOnly.map(u => (
              <UnitCard key={u.id} u={u} saving={saving} onToggleDelinquent={toggleDelinquent} onToggleBlocked={toggleBlocked} />
            ))}
          </div>
        </div>
      )}

      {/* Em dia */}
      {okUnits.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-3)] mb-2">Em dia ({okUnits.length})</div>
          <div className="space-y-2">
            {okUnits.map(u => (
              <UnitCard key={u.id} u={u} saving={saving} onToggleDelinquent={toggleDelinquent} onToggleBlocked={toggleBlocked} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UnitCard({ u, saving, onToggleDelinquent, onToggleBlocked }: {
  u: Unit
  saving: string | null
  onToggleDelinquent: (u: Unit) => void
  onToggleBlocked: (u: Unit) => void
}) {
  return (
    <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[var(--color-text-1)]">Apto {u.number}</span>
            {u.is_delinquent && <AlertTriangle size={13} style={{ color: 'var(--color-danger)' }} />}
            {u.is_blocked && <Lock size={12} style={{ color: 'var(--color-warning)' }} />}
          </div>
          <div className="text-xs text-[var(--color-text-3)] truncate mt-0.5">{u.responsible || 'Sem responsável'}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggleDelinquent(u)}
            disabled={saving === u.id + '_d'}
            title={u.is_delinquent ? 'Quitar inadimplência' : 'Marcar inadimplente'}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition disabled:opacity-40"
            style={{
              background: u.is_delinquent ? 'color-mix(in srgb, var(--color-success) 15%, transparent)' : 'color-mix(in srgb, var(--color-danger) 12%, transparent)',
              color: u.is_delinquent ? 'var(--color-success)' : 'var(--color-danger)',
            }}>
            {u.is_delinquent ? <><CheckCircle size={12} /> Quitar</> : <><AlertTriangle size={12} /> Inadimplir</>}
          </button>
          <button
            onClick={() => onToggleBlocked(u)}
            disabled={saving === u.id + '_b'}
            title={u.is_blocked ? 'Desbloquear' : 'Bloquear'}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition disabled:opacity-40"
            style={{
              background: u.is_blocked ? 'color-mix(in srgb, var(--color-success) 15%, transparent)' : 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
              color: u.is_blocked ? 'var(--color-success)' : 'var(--color-warning)',
            }}>
            {u.is_blocked ? <><Unlock size={12} /> Desbloquear</> : <><Lock size={12} /> Bloquear</>}
          </button>
        </div>
      </div>
    </div>
  )
}
