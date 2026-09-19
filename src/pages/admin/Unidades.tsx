import { useEffect, useState } from 'react'
import { X, Users, Car, Wrench, AlertTriangle, Lock } from 'lucide-react'
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

interface Resident {
  id: string
  full_name: string
  role: string
  status: string
}

// All 35 units: 5 floors × 7 units
const FLOORS = [5, 4, 3, 2, 1]
const UNITS_PER_FLOOR = [1, 2, 3, 4, 5, 6, 7]

const ROLE_LABEL: Record<string, string> = {
  proprietario_morador: 'Proprietário morador',
  proprietario_nao_morador: 'Proprietário não morador',
  inquilino: 'Inquilino',
  dependente: 'Dependente',
  dependente_inquilino: 'Dependente (inquilino)',
}

const ROLE_COLOR: Record<string, string> = {
  proprietario_morador: 'var(--color-accent)',
  proprietario_nao_morador: 'var(--color-text-3)',
  inquilino: 'var(--color-warning)',
  dependente: 'var(--color-success)',
  dependente_inquilino: 'var(--color-success)',
}

// Demo data
const DEMO_UNITS: Unit[] = [
  ...FLOORS.flatMap(f => UNITS_PER_FLOOR.map(n => {
    const num = `${f}0${n}`
    const types: Array<'proprio' | 'alugado'> = ['proprio', 'proprio', 'alugado', 'proprio', 'proprio', 'alugado', 'proprio']
    return {
      id: num, number: num, type: types[n - 1],
      responsible: n === 3 ? '' : `Demo Morador ${num}`,
      phone: null, email: null,
      resident_count: n === 3 ? 0 : (n === 5 ? 2 : 1),
      vehicle_count: 1, provider_count: 0,
      status: (f === 3 && n === 2) ? 'aguardando' as const : 'aprovado' as const,
      is_delinquent: (f === 2 && n === 1), is_blocked: false, notes: null,
    }
  }))
]

const DEMO_RESIDENTS: Record<string, Resident[]> = {
  '206': [
    { id: '1', full_name: 'Demo Proprietário', role: 'proprietario_morador', status: 'aprovado' },
    { id: '2', full_name: 'Demo Dependente', role: 'dependente', status: 'aprovado' },
  ],
}

type UnitStatus = 'proprio' | 'alugado' | 'vago' | 'pendente' | 'bloqueado'

function getStatus(u: Unit): UnitStatus {
  if (u.status === 'aguardando') return 'pendente'
  if (u.is_blocked) return 'bloqueado'
  if (u.resident_count === 0) return 'vago'
  if (u.type === 'alugado') return 'alugado'
  return 'proprio'
}

const STATUS_STYLES: Record<UnitStatus, { bg: string; border: string; dot: string; text: string }> = {
  proprio: {
    bg: 'linear-gradient(145deg, rgba(52,211,153,.14) 0%, rgba(52,211,153,.06) 100%)',
    border: 'rgba(52,211,153,.4)',
    dot: 'var(--color-success)',
    text: 'var(--color-success)',
  },
  alugado: {
    bg: 'linear-gradient(145deg, rgba(251,191,36,.14) 0%, rgba(251,191,36,.06) 100%)',
    border: 'rgba(251,191,36,.4)',
    dot: 'var(--color-warning)',
    text: 'var(--color-warning)',
  },
  vago: {
    bg: 'var(--color-card)',
    border: 'var(--color-border-1)',
    dot: 'var(--color-border-1)',
    text: 'var(--color-text-3)',
  },
  pendente: {
    bg: 'linear-gradient(145deg, rgba(248,113,113,.15) 0%, rgba(248,113,113,.07) 100%)',
    border: 'rgba(248,113,113,.45)',
    dot: 'var(--color-danger)',
    text: 'var(--color-danger)',
  },
  bloqueado: {
    bg: 'linear-gradient(145deg, rgba(167,139,250,.12) 0%, rgba(167,139,250,.06) 100%)',
    border: 'rgba(167,139,250,.4)',
    dot: 'var(--color-warning)',
    text: 'var(--color-warning)',
  },
}

export default function AdminUnidades() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Unit | null>(null)
  const [residents, setResidents] = useState<Resident[]>([])
  const [loadingRes, setLoadingRes] = useState(false)

  useEffect(() => {
    if (isDemo) { setUnits(DEMO_UNITS); setLoading(false); return }
    supabase
      .from('units')
      .select('id,number,type,responsible,phone,email,resident_count,vehicle_count,provider_count,status,is_delinquent,is_blocked,notes')
      .order('number')
      .then(({ data }) => { setUnits((data ?? []) as Unit[]); setLoading(false) })
  }, [])

  async function openUnit(u: Unit) {
    setSelected(u)
    setResidents([])
    if (isDemo) {
      setResidents(DEMO_RESIDENTS[u.number] ?? [])
      return
    }
    setLoadingRes(true)
    const { data } = await supabase
      .from('residents')
      .select('id, full_name, role, status')
      .eq('unit_id', u.id)
      .neq('status', 'inativo')
      .order('full_name')
    setResidents((data ?? []) as Resident[])
    setLoadingRes(false)
  }

  const byNumber: Record<string, Unit> = {}
  units.forEach(u => { byNumber[u.number] = u })

  const counts = {
    proprio: units.filter(u => getStatus(u) === 'proprio').length,
    alugado: units.filter(u => getStatus(u) === 'alugado').length,
    vago: units.filter(u => getStatus(u) === 'vago').length,
    pendente: units.filter(u => getStatus(u) === 'pendente').length,
  }

  if (loading) return <div className="text-sm text-[var(--color-text-3)] p-4">Carregando mapa...</div>

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text-1)]">Unidades</h1>
        <p className="text-xs text-[var(--color-text-3)] mt-1">
          {units.length} unidades · {counts.proprio} próprias · {counts.alugado} alugadas · {counts.vago} vagas{counts.pendente > 0 ? ` · ${counts.pendente} pendentes` : ''}
        </p>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mb-5">
        {([
          ['proprio', 'Próprio'],
          ['alugado', 'Alugado'],
          ['vago', 'Vago'],
          ['pendente', 'Pendente'],
          ['bloqueado', 'Bloqueado'],
        ] as [UnitStatus, string][]).map(([s, label]) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: STATUS_STYLES[s].dot }} />
            <span className="text-xs text-[var(--color-text-3)]">{label}</span>
          </div>
        ))}
      </div>

      {/* Mapa visual do prédio */}
      <div className="space-y-1.5">
        {FLOORS.map(floor => (
          <div key={floor} className="flex items-center gap-2">
            {/* Label do andar */}
            <div className="w-7 text-[10px] font-black text-[var(--color-text-3)] text-right flex-shrink-0">
              {floor}º
            </div>
            {/* Unidades */}
            <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {UNITS_PER_FLOOR.map(n => {
                const num = `${floor}0${n}`
                const u = byNumber[num]
                const st: UnitStatus = u ? getStatus(u) : 'vago'
                const styles = STATUS_STYLES[st]
                return (
                  <button
                    key={num}
                    onClick={() => u && openUnit(u)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl transition-all hover:scale-105 hover:shadow-lg active:scale-100"
                    style={{
                      minHeight: '52px',
                      background: styles.bg,
                      border: `1px solid ${styles.border}`,
                      padding: '6px 2px',
                      animation: st === 'pendente' ? 'pendente-pulse 2.5s ease-in-out infinite' : undefined,
                    }}
                  >
                    <span className="text-[11px] font-black leading-none" style={{ color: styles.text }}>{num}</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{
                      background: styles.dot,
                      boxShadow: st !== 'vago' ? `0 0 5px ${styles.dot}` : undefined,
                    }} />
                    {u?.is_delinquent && <AlertTriangle size={9} style={{ color: 'var(--color-danger)' }} />}
                    {u?.is_blocked && <Lock size={8} style={{ color: 'var(--color-warning)' }} />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Animação pendente */}
      <style>{`
        @keyframes pendente-pulse {
          0%,100% { box-shadow: 0 0 0 1px rgba(248,113,113,.1), 0 2px 8px rgba(0,0,0,.3) }
          50% { box-shadow: 0 0 0 2px rgba(248,113,113,.3), 0 4px 16px rgba(248,113,113,.2) }
        }
      `}</style>

      {/* Painel lateral — detalhes da unidade */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelected(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', maxHeight: '80vh', overflowY: 'auto' }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border-2)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--color-border-0)' }}>
              <div>
                <div className="text-lg font-black text-[var(--color-text-1)]">Apto {selected.number}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {(() => {
                    const st = getStatus(selected)
                    const styles = STATUS_STYLES[st]
                    const label = { proprio: 'Próprio', alugado: 'Alugado', vago: 'Vago', pendente: 'Pendente', bloqueado: 'Bloqueado' }[st]
                    return (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${styles.dot}22`, color: styles.dot }}>
                        {label}
                      </span>
                    )
                  })()}
                  {selected.is_delinquent && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', color: 'var(--color-danger)' }}>
                      ⚠️ Inadimplente
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition"
                style={{ color: 'var(--color-text-3)', background: 'var(--color-elevated)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Info básica */}
            <div className="px-5 py-4 border-b grid grid-cols-3 gap-3 text-center" style={{ borderColor: 'var(--color-border-0)' }}>
              <div>
                <div className="flex items-center justify-center gap-1 text-[var(--color-text-3)] mb-1"><Users size={12} /></div>
                <div className="text-lg font-black text-[var(--color-text-1)]">{selected.resident_count}</div>
                <div className="text-[10px] text-[var(--color-text-3)] uppercase tracking-wider">Moradores</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-[var(--color-text-3)] mb-1"><Car size={12} /></div>
                <div className="text-lg font-black text-[var(--color-text-1)]">{selected.vehicle_count}</div>
                <div className="text-[10px] text-[var(--color-text-3)] uppercase tracking-wider">Veículos</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-[var(--color-text-3)] mb-1"><Wrench size={12} /></div>
                <div className="text-lg font-black text-[var(--color-text-1)]">{selected.provider_count}</div>
                <div className="text-[10px] text-[var(--color-text-3)] uppercase tracking-wider">Prestadores</div>
              </div>
            </div>

            {/* Moradores */}
            <div className="px-5 py-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-3)] mb-3">Moradores</div>
              {loadingRes ? (
                <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
              ) : residents.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-3)]">
                  <Users size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum morador cadastrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {residents.map(r => (
                    <div key={r.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                      style={{ background: 'var(--color-elevated)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{ background: `${ROLE_COLOR[r.role] ?? 'var(--color-accent)'}22`, color: ROLE_COLOR[r.role] ?? 'var(--color-accent)' }}>
                        {r.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[var(--color-text-1)] truncate">{r.full_name}</div>
                        <div className="text-xs mt-0.5" style={{ color: ROLE_COLOR[r.role] ?? 'var(--color-text-3)' }}>
                          {ROLE_LABEL[r.role] ?? r.role}
                        </div>
                      </div>
                      {r.status === 'aguardando' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }}>
                          Aguardando
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selected.notes && (
                <div className="mt-4 px-3 py-3 rounded-xl flex items-start gap-2"
                  style={{ background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warning) 25%, transparent)' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs text-[var(--color-text-2)] leading-relaxed">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
