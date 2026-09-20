import { useEffect, useState } from 'react'
import { Users, Car, Wrench, Building2, CalendarDays, DollarSign, HardHat, Truck, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, isDemo } from '@/lib/supabase'

interface CalEvent {
  date: string   // YYYY-MM-DD
  label: string
  type: 'reserva' | 'mudanca'
}

interface Counts {
  moradores: number
  veiculos: number
  prestadores: number
  reservasPendentes: number
  inadimplentes: number
  funcionarios: number
  mudancasPendentes: number
}

const DEMO_EVENTS: CalEvent[] = [
  { date: '2026-09-28', label: 'Apto 305 — Salão de Festas', type: 'reserva' },
  { date: '2026-10-03', label: 'Apto 302 — Mudança entrada', type: 'mudanca' },
  { date: '2026-10-05', label: 'Apto 407 — Salão de Festas', type: 'reserva' },
  { date: '2026-10-10', label: 'Apto 405 — Mudança saída', type: 'mudanca' },
]

const DEMO_COUNTS: Counts = {
  moradores: 42, veiculos: 28, prestadores: 7,
  reservasPendentes: 2, inadimplentes: 3,
  funcionarios: 2, mudancasPendentes: 1,
}

const MONTH_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DOW_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts | null>(null)
  const [events, setEvents] = useState<CalEvent[]>([])
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) {
      setCounts(DEMO_COUNTS)
      setEvents(DEMO_EVENTS)
      return
    }
    Promise.all([
      supabase.from('residents').select('id', { count: 'exact', head: true }).eq('status', 'aprovado'),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'aprovado'),
      supabase.from('service_providers').select('id', { count: 'exact', head: true }).eq('status', 'aprovado'),
      supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
      supabase.from('units').select('id', { count: 'exact', head: true }).eq('is_delinquent', true),
      supabase.from('building_staff').select('id', { count: 'exact', head: true }).eq('status', 'aprovado'),
      supabase.from('move_requests').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
      supabase.from('reservations').select('unit_number, hall, use_date').eq('status', 'confirmada').gte('use_date', today.toISOString().slice(0, 10)),
      supabase.from('move_requests').select('unit_number, type, move_date').eq('status', 'aprovada').gte('move_date', today.toISOString().slice(0, 10)),
    ]).then(([mor, veh, pres, resv, inad, func, mud, resvDates, mudDates]) => {
      setCounts({
        moradores: mor.count ?? 0,
        veiculos: veh.count ?? 0,
        prestadores: pres.count ?? 0,
        reservasPendentes: resv.count ?? 0,
        inadimplentes: inad.count ?? 0,
        funcionarios: func.count ?? 0,
        mudancasPendentes: mud.count ?? 0,
      })
      const evts: CalEvent[] = []
      ;(resvDates.data ?? []).forEach((r: any) => evts.push({ date: r.use_date, label: `Apto ${r.unit_number} — ${r.hall}`, type: 'reserva' }))
      ;(mudDates.data ?? []).forEach((m: any) => evts.push({ date: m.move_date, label: `Apto ${m.unit_number} — Mudança ${m.type}`, type: 'mudanca' }))
      setEvents(evts)
    })
  }, [])

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const eventsByDate: Record<string, CalEvent[]> = {}
  events.forEach(e => { if (!eventsByDate[e.date]) eventsByDate[e.date] = []; eventsByDate[e.date].push(e) })

  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate())
  const selEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : []

  function prevMonth() { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) } else setViewMonth(m => m-1) }
  function nextMonth() { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) } else setViewMonth(m => m+1) }

  const STATS = [
    { label: 'Moradores', icon: Users, value: counts?.moradores, to: '/admin/moradores', color: 'var(--color-success)' },
    { label: 'Veículos', icon: Car, value: counts?.veiculos, to: '/admin/veiculos', color: '#a78bfa' },
    { label: 'Prestadores', icon: Wrench, value: counts?.prestadores, to: '/admin/prestadores', color: '#2dd4bf' },
    { label: 'Unidades', icon: Building2, value: '35', to: '/admin/unidades', color: 'var(--color-accent)' },
    { label: 'Reservas pend.', icon: CalendarDays, value: counts?.reservasPendentes, to: '/admin/reservas', color: 'var(--color-warning)', alert: (counts?.reservasPendentes ?? 0) > 0 },
    { label: 'Inadimplentes', icon: DollarSign, value: counts?.inadimplentes, to: '/admin/financeiro', color: 'var(--color-danger)', alert: (counts?.inadimplentes ?? 0) > 0 },
    { label: 'Zeladoria', icon: HardHat, value: counts?.funcionarios, to: '/admin/zeladoria', color: 'var(--color-text-2)' },
    { label: 'Mudanças pend.', icon: Truck, value: counts?.mudancasPendentes, to: '/admin/mudancas', color: '#2dd4bf', alert: (counts?.mudancasPendentes ?? 0) > 0 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[var(--color-text-1)]">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(({ label, icon: Icon, value, to, color, alert }) => (
          <Link key={label} to={to}
            className="rounded-xl p-4 hover:opacity-80 transition group relative"
            style={{ background: 'var(--color-card)', border: `1px solid ${alert ? color : 'var(--color-border-1)'}` }}>
            {alert && <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />}
            <Icon size={18} className="mb-2" style={{ color }} />
            <div className="text-2xl font-black text-[var(--color-text-1)]">{value ?? '—'}</div>
            <div className="text-xs text-[var(--color-text-3)] group-hover:text-[var(--color-text-2)] transition">{label}</div>
          </Link>
        ))}
      </div>

      {/* Calendário */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition"
            style={{ background: 'var(--color-elevated)', color: 'var(--color-text-3)' }}>
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-bold text-[var(--color-text-1)]">{MONTH_PT[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition"
            style={{ background: 'var(--color-elevated)', color: 'var(--color-text-3)' }}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DOW_PT.map(d => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider py-1"
              style={{ color: 'var(--color-text-3)' }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const iso = isoDate(viewYear, viewMonth, day)
            const evts = eventsByDate[iso] ?? []
            const isToday = iso === todayIso
            const isSel = iso === selectedDay
            const hasReserva = evts.some(e => e.type === 'reserva')
            const hasMudanca = evts.some(e => e.type === 'mudanca')
            return (
              <button key={i} onClick={() => setSelectedDay(isSel ? null : iso)}
                className="flex flex-col items-center py-1.5 rounded-xl transition"
                style={{
                  background: isSel ? 'var(--color-accent)' : isToday ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
                  border: isToday && !isSel ? '1px solid var(--color-accent)' : '1px solid transparent',
                }}>
                <span className="text-xs font-bold leading-none"
                  style={{ color: isSel ? '#fff' : isToday ? 'var(--color-accent)' : 'var(--color-text-2)' }}>
                  {day}
                </span>
                {evts.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {hasReserva && <div className="w-1.5 h-1.5 rounded-full" style={{ background: isSel ? '#fff' : 'var(--color-warning)' }} />}
                    {hasMudanca && <div className="w-1.5 h-1.5 rounded-full" style={{ background: isSel ? '#fff' : 'var(--color-success)' }} />}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-0)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-warning)' }} />
            <span className="text-[10px] text-[var(--color-text-3)]">Reserva confirmada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-success)' }} />
            <span className="text-[10px] text-[var(--color-text-3)]">Mudança aprovada</span>
          </div>
        </div>

        {/* Eventos do dia selecionado */}
        {selectedDay && (
          <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--color-border-0)' }}>
            {selEvents.length === 0 ? (
              <p className="text-xs text-[var(--color-text-3)] text-center py-2">Nenhum evento neste dia.</p>
            ) : selEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'var(--color-elevated)' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: e.type === 'reserva' ? 'var(--color-warning)' : 'var(--color-success)' }} />
                <span className="text-xs text-[var(--color-text-2)]">{e.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
