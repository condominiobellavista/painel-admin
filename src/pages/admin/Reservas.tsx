import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Info, AlertTriangle, Lock, Search } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import { sendEmail, emailReservaConfirmada, emailReservaCancelada } from '@/lib/notifications'

interface Reservation {
  id: string
  unit_number: string
  hall: string
  use_date: string
  resident_name: string
  resident_email?: string
  fee: number
  status: 'pendente' | 'confirmada' | 'cancelada'
  exemption: boolean
  eligible_exempt: boolean
  notes?: string
}

interface UnitStatus {
  number: string
  is_delinquent: boolean
  is_blocked: boolean
}

const STATUS_STYLE = {
  pendente: { bg: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', color: 'var(--color-warning)', label: 'Pendente' },
  confirmada: { bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)', label: 'Confirmada' },
  cancelada: { bg: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', color: 'var(--color-danger)', label: 'Cancelada' },
}

const DEMO_UNITS: UnitStatus[] = [
  { number: '101', is_delinquent: true, is_blocked: false },
  { number: '203', is_delinquent: false, is_blocked: true },
  { number: '305', is_delinquent: false, is_blocked: false },
  { number: '407', is_delinquent: false, is_blocked: false },
]

const DEMO_RESERVATIONS: Reservation[] = [
  { id: '1', unit_number: '305', hall: 'Salão de Festas', use_date: '2026-09-28', resident_name: 'Demo Morador', fee: 150, status: 'pendente', exemption: false, eligible_exempt: false },
  { id: '2', unit_number: '407', hall: 'Salão de Festas', use_date: '2026-10-05', resident_name: 'Demo Morador 2', fee: 150, status: 'pendente', exemption: true, eligible_exempt: true },
  { id: '3', unit_number: '101', hall: 'Salão de Festas', use_date: '2026-10-12', resident_name: 'Demo Inadimplente', fee: 150, status: 'pendente', exemption: false, eligible_exempt: false },
  { id: '4', unit_number: '203', hall: 'Salão de Festas', use_date: '2026-10-19', resident_name: 'Demo Bloqueado', fee: 150, status: 'pendente', exemption: false, eligible_exempt: false },
  { id: '5', unit_number: '305', hall: 'Salão de Festas', use_date: '2026-09-14', resident_name: 'Demo Confirmado', fee: 150, status: 'confirmada', exemption: false, eligible_exempt: false },
  { id: '6', unit_number: '407', hall: 'Salão de Festas', use_date: '2026-09-07', resident_name: 'Demo Cancelado', fee: 150, status: 'cancelada', exemption: false, eligible_exempt: false },
]

function formatDate(s: string) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export default function AdminReservas() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [unitStatuses, setUnitStatuses] = useState<Record<string, UnitStatus>>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) {
      setReservations(DEMO_RESERVATIONS)
      const map: Record<string, UnitStatus> = {}
      DEMO_UNITS.forEach(u => { map[u.number] = u })
      setUnitStatuses(map)
      setLoading(false)
      return
    }
    Promise.all([
      supabase.from('reservations').select('*').order('use_date'),
      supabase.from('units').select('number, is_delinquent, is_blocked'),
    ]).then(([resv, units]) => {
      setReservations((resv.data ?? []) as Reservation[])
      const map: Record<string, UnitStatus> = {}
      ;((units.data ?? []) as UnitStatus[]).forEach(u => { map[u.number] = u })
      setUnitStatuses(map)
      setLoading(false)
    })
  }, [])

  async function updateStatus(id: string, newStatus: 'confirmada' | 'cancelada') {
    setSaving(id)
    const r = reservations.find(x => x.id === id)
    if (!isDemo) {
      await supabase.from('reservations').update({ status: newStatus }).eq('id', id)
    }
    setReservations(prev => prev.map(x => x.id === id ? { ...x, status: newStatus } : x))
    if (r?.resident_email) {
      const data = r.use_date.split('-')
      const dateStr = `${data[2]}/${data[1]}/${data[0]}`
      if (newStatus === 'confirmada') {
        const tpl = emailReservaConfirmada({ nome: r.resident_name, apto: r.unit_number, data: dateStr, hall: r.hall, taxa: r.fee })
        await sendEmail({ to: r.resident_email, ...tpl })
      } else {
        const tpl = emailReservaCancelada({ nome: r.resident_name, apto: r.unit_number, data: dateStr, hall: r.hall })
        await sendEmail({ to: r.resident_email, ...tpl })
      }
    }
    setSaving(null)
  }

  async function decideExemption(id: string, approved: boolean) {
    setSaving(id)
    if (!isDemo) {
      await supabase.from('reservations').update({
        exemption: approved,
        fee: approved ? 0 : undefined,
      }).eq('id', id)
    }
    setReservations(prev => prev.map(r =>
      r.id === id ? { ...r, exemption: approved, fee: approved ? 0 : r.fee } : r
    ))
    setSaving(null)
  }

  function isEligible(r: Reservation) {
    const u = unitStatuses[r.unit_number]
    if (!u) return true
    return !u.is_delinquent && !u.is_blocked
  }

  const filtered = reservations.filter(r =>
    r.unit_number.includes(busca) ||
    r.resident_name.toLowerCase().includes(busca.toLowerCase()) ||
    formatDate(r.use_date).includes(busca)
  )

  const groups: Array<{ label: string; items: Reservation[] }> = [
    { label: 'Pendentes', items: filtered.filter(r => r.status === 'pendente') },
    { label: 'Confirmadas', items: filtered.filter(r => r.status === 'confirmada') },
    { label: 'Canceladas', items: filtered.filter(r => r.status === 'cancelada') },
  ]

  if (loading) return <div className="text-sm text-[var(--color-text-3)] p-4">Carregando reservas...</div>

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text-1)]">Reservas do Salão</h1>
        <p className="text-xs text-[var(--color-text-3)] mt-1">{reservations.length} reservas no total</p>
      </div>

      {/* Regras */}
      <div className="mb-5 px-4 py-3 rounded-xl flex items-start gap-3"
        style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)' }}>
        <Info size={15} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 1 }} />
        <div className="text-xs text-[var(--color-text-2)] leading-relaxed">
          <span className="font-bold text-[var(--color-text-1)]">Regras de elegibilidade: </span>
          Unidades <span style={{ color: 'var(--color-danger)' }}>inadimplentes</span> ou{' '}
          <span style={{ color: 'var(--color-warning)' }}>bloqueadas</span> não podem reservar o salão de festas.
          Moradores com isenção pendente precisam de decisão do administrador.
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-3)]" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por apto, morador, data..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] outline-none transition"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}
        />
      </div>

      {/* Grupos */}
      {groups.map(g => g.items.length === 0 ? null : (
        <div key={g.label} className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-3)] mb-2">{g.label} ({g.items.length})</div>
          <div className="space-y-2">
            {g.items.map(r => {
              const eligible = isEligible(r)
              const u = unitStatuses[r.unit_number]
              const isOpen = expanded === r.id
              const st = STATUS_STYLE[r.status]
              return (
                <div key={r.id} className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--color-card)', border: `1px solid ${eligible ? 'var(--color-border-1)' : 'color-mix(in srgb, var(--color-danger) 30%, transparent)'}` }}>
                  {/* Header do card */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Indicador de elegibilidade */}
                      {!eligible && (
                        <div className="flex-shrink-0">
                          {u?.is_delinquent
                            ? <AlertTriangle size={14} style={{ color: 'var(--color-danger)' }} />
                            : <Lock size={14} style={{ color: 'var(--color-warning)' }} />
                          }
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[var(--color-text-1)]">Apto {r.unit_number}</span>
                          <span className="text-xs text-[var(--color-text-3)]">·</span>
                          <span className="text-xs text-[var(--color-text-3)]">{formatDate(r.use_date)}</span>
                          {r.exemption && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}>
                              Isenção
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--color-text-3)] truncate mt-0.5">{r.resident_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      {isOpen ? <ChevronUp size={14} style={{ color: 'var(--color-text-3)' }} /> : <ChevronDown size={14} style={{ color: 'var(--color-text-3)' }} />}
                    </div>
                  </button>

                  {/* Detalhes expandidos */}
                  {isOpen && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--color-border-0)' }}>
                      <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-0.5">Salão</div>
                          <div className="text-sm font-bold text-[var(--color-text-1)]">{r.hall}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-0.5">Taxa</div>
                          <div className="text-sm font-bold text-[var(--color-text-1)]">
                            {r.fee === 0 ? <span style={{ color: 'var(--color-success)' }}>Isento</span> : `R$ ${r.fee.toFixed(2)}`}
                          </div>
                        </div>
                      </div>

                      {/* Aviso de inelegibilidade */}
                      {!eligible && (
                        <div className="mb-3 px-3 py-2 rounded-lg flex items-start gap-2"
                          style={{ background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)' }}>
                          <AlertTriangle size={13} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: 1 }} />
                          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
                            {u?.is_delinquent
                              ? 'Esta unidade está inadimplente e não pode utilizar o salão.'
                              : 'Esta unidade está bloqueada pelo administrador.'}
                          </p>
                        </div>
                      )}

                      {/* Isenção pendente */}
                      {r.exemption && r.status === 'pendente' && r.eligible_exempt && (
                        <div className="mb-3 px-3 py-2 rounded-lg"
                          style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)' }}>
                          <p className="text-xs text-[var(--color-text-2)] mb-2">Morador solicitou isenção de taxa. Deseja deferir?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => decideExemption(r.id, true)}
                              disabled={saving === r.id}
                              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition"
                              style={{ background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }}>
                              Deferir isenção
                            </button>
                            <button
                              onClick={() => decideExemption(r.id, false)}
                              disabled={saving === r.id}
                              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition"
                              style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
                              Negar isenção
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Ações */}
                      {r.status === 'pendente' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(r.id, 'confirmada')}
                            disabled={saving === r.id || !eligible}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition disabled:opacity-40"
                            style={{ background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }}>
                            <CheckCircle size={14} /> Confirmar
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, 'cancelada')}
                            disabled={saving === r.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition"
                            style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
                            <XCircle size={14} /> Cancelar
                          </button>
                        </div>
                      )}
                      {r.status === 'confirmada' && (
                        <button
                          onClick={() => updateStatus(r.id, 'cancelada')}
                          disabled={saving === r.id}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition"
                          style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
                          <XCircle size={14} /> Cancelar reserva
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-center text-[var(--color-text-3)] py-10">Nenhuma reserva encontrada.</p>
      )}
    </div>
  )
}
