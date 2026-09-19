import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Info, AlertTriangle, Lock, Search, Settings, Download } from 'lucide-react'
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

interface MoveRequest {
  id: string
  unit_number: string
  resident_name: string
  type: 'entrada' | 'saida'
  move_date: string
  period?: string
  status: 'pendente' | 'aprovada' | 'cancelada'
}

const STATUS_STYLE = {
  pendente:   { bg: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', color: 'var(--color-warning)', label: 'Pendente' },
  confirmada: { bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)', label: 'Confirmada' },
  cancelada:  { bg: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', color: 'var(--color-danger)', label: 'Cancelada' },
  aprovada:   { bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)', label: 'Aprovada' },
}

const HALLS = ['Salão Superior', 'Salão Inferior']

const DEMO_UNITS: UnitStatus[] = [
  { number: '101', is_delinquent: true, is_blocked: false },
  { number: '203', is_delinquent: false, is_blocked: true },
  { number: '305', is_delinquent: false, is_blocked: false },
]

const DEMO_RESERVATIONS: Reservation[] = [
  { id: '1', unit_number: '305', hall: 'Salão Superior', use_date: '2026-09-28', resident_name: 'Demo Morador', fee: 150, status: 'pendente', exemption: false, eligible_exempt: false },
  { id: '2', unit_number: '101', hall: 'Salão Inferior', use_date: '2026-10-05', resident_name: 'Demo Inadimplente', fee: 120, status: 'pendente', exemption: false, eligible_exempt: false },
  { id: '3', unit_number: '305', hall: 'Salão Superior', use_date: '2026-09-14', resident_name: 'Demo Confirmado', fee: 150, status: 'confirmada', exemption: false, eligible_exempt: false },
]

const DEMO_MOVES: MoveRequest[] = [
  { id: 'm1', unit_number: '407', resident_name: 'Demo Mudança', type: 'entrada', move_date: '2026-10-01', period: 'manha', status: 'aprovada' },
]

function formatDate(s: string) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

function exportCSV(reservations: Reservation[], moves: MoveRequest[], taxas: Record<string, number>) {
  const lines: string[] = []
  lines.push('RELATÓRIO MENSAL — SERVIÇOS COBRÁVEIS NO BOLETO')
  lines.push(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`)
  lines.push('')
  lines.push('=== RESERVAS DO SALÃO ===')
  lines.push('Apto,Morador,Salão,Data,Taxa,Status')
  const resvsCobraveis = reservations.filter(r => r.status !== 'cancelada')
  resvsCobraveis.forEach(r => {
    lines.push(`${r.unit_number},"${r.resident_name}","${r.hall}",${formatDate(r.use_date)},R$ ${Number(r.fee).toFixed(2).replace('.', ',')},${r.status === 'confirmada' ? 'Confirmada' : 'Pendente'}`)
  })
  const totalReservas = resvsCobraveis.reduce((s, r) => s + Number(r.fee), 0)
  lines.push(`,,,,TOTAL: R$ ${totalReservas.toFixed(2).replace('.', ',')}`)
  lines.push('')
  lines.push('=== MUDANÇAS ===')
  lines.push('Apto,Morador,Tipo,Data,Período,Status')
  const mudsCobraveis = moves.filter(m => m.status !== 'cancelada')
  mudsCobraveis.forEach(m => {
    lines.push(`${m.unit_number},"${m.resident_name}",${m.type === 'entrada' ? 'Entrada' : 'Saída'},${formatDate(m.move_date)},${m.period === 'manha' ? 'Manhã' : 'Tarde'},${m.status === 'aprovada' ? 'Aprovada' : 'Pendente'}`)
  })
  lines.push('')
  lines.push('=== TAXA CONFIGURADA ===')
  ;[...HALLS, 'Mudança'].forEach(h => lines.push(`${h}: R$ ${(taxas[h] ?? 0).toFixed(2).replace('.', ',')}`))

  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-servicos-${new Date().toISOString().slice(0, 7)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminReservas() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [moves, setMoves] = useState<MoveRequest[]>([])
  const [unitStatuses, setUnitStatuses] = useState<Record<string, UnitStatus>>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [showTaxas, setShowTaxas] = useState(false)
  const [taxas, setTaxas] = useState<Record<string, number>>({ 'Salão Superior': 150, 'Salão Inferior': 150, 'Mudança': 0 })
  const [savingTaxa, setSavingTaxa] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('bv_taxas_salao')
    if (saved) {
      const parsed = JSON.parse(saved)
      setTaxas(prev => ({ ...prev, ...parsed }))
    }

    if (isDemo) {
      setReservations(DEMO_RESERVATIONS)
      setMoves(DEMO_MOVES)
      const map: Record<string, UnitStatus> = {}
      DEMO_UNITS.forEach(u => { map[u.number] = u })
      setUnitStatuses(map)
      setLoading(false)
      return
    }
    Promise.all([
      supabase.from('reservations').select('*').order('use_date'),
      supabase.from('units').select('number, is_delinquent, is_blocked'),
      supabase.from('move_requests').select('id, unit_number, resident_name, type, move_date, period, status').order('move_date'),
    ]).then(([resv, units, mv]) => {
      setReservations((resv.data ?? []) as Reservation[])
      setMoves((mv.data ?? []) as MoveRequest[])
      const map: Record<string, UnitStatus> = {}
      ;((units.data ?? []) as UnitStatus[]).forEach(u => { map[u.number] = u })
      setUnitStatuses(map)
      setLoading(false)
    })
  }, [])

  function saveTaxas() {
    setSavingTaxa(true)
    localStorage.setItem('bv_taxas_salao', JSON.stringify(taxas))
    setTimeout(() => { setSavingTaxa(false); setShowTaxas(false) }, 600)
  }

  async function updateStatus(id: string, newStatus: 'confirmada' | 'cancelada') {
    setSaving(id)
    const r = reservations.find(x => x.id === id)
    if (!isDemo) await supabase.from('reservations').update({ status: newStatus }).eq('id', id)
    setReservations(prev => prev.map(x => x.id === id ? { ...x, status: newStatus } : x))
    if (r?.resident_email) {
      const dateStr = formatDate(r.use_date)
      if (newStatus === 'confirmada') {
        await sendEmail({ to: r.resident_email, ...emailReservaConfirmada({ nome: r.resident_name, apto: r.unit_number, data: dateStr, hall: r.hall, taxa: r.fee }) })
      } else {
        await sendEmail({ to: r.resident_email, ...emailReservaCancelada({ nome: r.resident_name, apto: r.unit_number, data: dateStr, hall: r.hall }) })
      }
    }
    setSaving(null)
  }

  async function decideExemption(id: string, approved: boolean) {
    setSaving(id)
    if (!isDemo) await supabase.from('reservations').update({ exemption: approved, fee: approved ? 0 : undefined }).eq('id', id)
    setReservations(prev => prev.map(r => r.id === id ? { ...r, exemption: approved, fee: approved ? 0 : r.fee } : r))
    setSaving(null)
  }

  function isEligible(r: Reservation) {
    const u = unitStatuses[r.unit_number]
    return !u?.is_delinquent && !u?.is_blocked
  }

  const filtered = reservations.filter(r =>
    r.unit_number.includes(busca) ||
    r.resident_name.toLowerCase().includes(busca.toLowerCase()) ||
    formatDate(r.use_date).includes(busca) ||
    r.hall.toLowerCase().includes(busca.toLowerCase())
  )

  const groups = [
    { label: 'Pendentes',   items: filtered.filter(r => r.status === 'pendente') },
    { label: 'Confirmadas', items: filtered.filter(r => r.status === 'confirmada') },
    { label: 'Canceladas',  items: filtered.filter(r => r.status === 'cancelada') },
  ]

  if (loading) return <div className="text-sm text-[var(--color-text-3)] p-4">Carregando reservas...</div>

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-1)]">Reservas do Salão</h1>
          <p className="text-xs text-[var(--color-text-3)] mt-1">{reservations.length} reservas no total</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => exportCSV(reservations, moves, taxas)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
            style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)', border: '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)' }}>
            <Download size={13} /> Exportar
          </button>
          <button
            onClick={() => setShowTaxas(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
            style={{ background: showTaxas ? 'var(--color-accent)' : 'var(--color-elevated)', color: showTaxas ? '#fff' : 'var(--color-text-2)', border: '1px solid var(--color-border-1)' }}>
            <Settings size={13} /> Taxas
          </button>
        </div>
      </div>

      {/* Painel de taxas */}
      {showTaxas && (
        <div className="mb-5 p-4 rounded-2xl" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}>
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-3)] mb-3">Taxa de uso por salão</div>
          <div className="space-y-3">
            {[...HALLS, 'Mudança'].map(h => (
              <div key={h} className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[var(--color-text-1)]">{h}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-3)]">R$</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={taxas[h] ?? 0}
                    onChange={e => setTaxas(prev => ({ ...prev, [h]: Number(e.target.value) }))}
                    className="w-24 px-3 py-1.5 rounded-xl text-sm text-right font-bold outline-none"
                    style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={saveTaxas}
            disabled={savingTaxa}
            className="mt-4 w-full py-2 rounded-xl text-sm font-bold transition disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {savingTaxa ? 'Salvo!' : 'Salvar taxas'}
          </button>
          <p className="text-[10px] text-[var(--color-text-3)] mt-2 text-center">
            Valor usado como padrão ao exibir o relatório. O valor da taxa em cada reserva é definido no momento da solicitação.
          </p>
        </div>
      )}

      {/* Regras */}
      <div className="mb-5 px-4 py-3 rounded-xl flex items-start gap-3"
        style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)' }}>
        <Info size={15} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 1 }} />
        <div className="text-xs text-[var(--color-text-2)] leading-relaxed">
          <span className="font-bold text-[var(--color-text-1)]">Regras de elegibilidade: </span>
          Unidades <span style={{ color: 'var(--color-danger)' }}>inadimplentes</span> ou{' '}
          <span style={{ color: 'var(--color-warning)' }}>bloqueadas</span> não podem reservar o salão.
          Moradores com isenção pendente precisam de decisão do administrador.
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-3)]" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por apto, morador, salão, data..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }}
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
                  <button className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
                    onClick={() => setExpanded(isOpen ? null : r.id)}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {!eligible && (
                        u?.is_delinquent
                          ? <AlertTriangle size={14} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                          : <Lock size={14} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[var(--color-text-1)]">Apto {r.unit_number}</span>
                          <span className="text-xs text-[var(--color-text-3)]">·</span>
                          <span className="text-xs text-[var(--color-text-3)]">{formatDate(r.use_date)}</span>
                          <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>{r.hall}</span>
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
                            {r.fee === 0 ? <span style={{ color: 'var(--color-success)' }}>Isento</span> : `R$ ${Number(r.fee).toFixed(2)}`}
                          </div>
                        </div>
                      </div>

                      {!eligible && (
                        <div className="mb-3 px-3 py-2 rounded-lg flex items-start gap-2"
                          style={{ background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)' }}>
                          <AlertTriangle size={13} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: 1 }} />
                          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
                            {u?.is_delinquent ? 'Unidade inadimplente — não pode utilizar o salão.' : 'Unidade bloqueada pelo administrador.'}
                          </p>
                        </div>
                      )}

                      {r.exemption && r.status === 'pendente' && r.eligible_exempt && (
                        <div className="mb-3 px-3 py-2 rounded-lg"
                          style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)' }}>
                          <p className="text-xs text-[var(--color-text-2)] mb-2">Morador solicitou isenção de taxa. Deseja deferir?</p>
                          <div className="flex gap-2">
                            <button onClick={() => decideExemption(r.id, true)} disabled={saving === r.id}
                              className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                              style={{ background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }}>
                              Deferir isenção
                            </button>
                            <button onClick={() => decideExemption(r.id, false)} disabled={saving === r.id}
                              className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                              style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
                              Negar isenção
                            </button>
                          </div>
                        </div>
                      )}

                      {r.status === 'pendente' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(r.id, 'confirmada')} disabled={saving === r.id || !eligible}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
                            style={{ background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }}>
                            <CheckCircle size={14} /> Confirmar
                          </button>
                          <button onClick={() => updateStatus(r.id, 'cancelada')} disabled={saving === r.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold"
                            style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
                            <XCircle size={14} /> Cancelar
                          </button>
                        </div>
                      )}
                      {r.status === 'confirmada' && (
                        <button onClick={() => updateStatus(r.id, 'cancelada')} disabled={saving === r.id}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold"
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
