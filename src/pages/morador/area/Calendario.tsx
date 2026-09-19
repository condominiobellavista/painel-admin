import { useEffect, useState } from 'react'
import { supabase, isDemo } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Reservation {
  id: string
  unit_number: string
  resident_name: string
  use_date: string
  status: string
}

const DEMO_RESERVATIONS: Reservation[] = [
  { id: '1', unit_number: '101', resident_name: 'Demo Morador', use_date: '2026-10-15', status: 'confirmada' },
  { id: '2', unit_number: '203', resident_name: 'Outro Morador', use_date: '2026-10-22', status: 'confirmada' },
]

const statusColor: Record<string, string> = {
  confirmada: '#34d399',
  pendente: '#fbbf24',
  cancelada: '#f87171',
}

export default function MoradorCalendario() {
  const [current, setCurrent] = useState(new Date())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selected, setSelected] = useState<Date | null>(null)

  useEffect(() => {
    if (isDemo) {
      setReservations(DEMO_RESERVATIONS)
      return
    }
    async function load() {
      const start = format(startOfMonth(current), 'yyyy-MM-dd')
      const end = format(endOfMonth(current), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('reservations')
        .select('id, unit_number, resident_name, use_date, status')
        .gte('use_date', start)
        .lte('use_date', end)
        .neq('status', 'cancelada')
        .order('use_date')
      setReservations((data ?? []) as Reservation[])
    }
    load()
  }, [current])

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) })
  const firstDow = (startOfMonth(current).getDay() + 6) % 7 // Mon-based

  function reservationsOnDay(d: Date) {
    const key = format(d, 'yyyy-MM-dd')
    return reservations.filter(r => r.use_date === key)
  }

  const selectedReservations = selected ? reservationsOnDay(selected) : []

  return (
    <div>
      <h1 className="text-lg font-black text-[var(--color-text-1)] mb-1">Calendário do salão</h1>
      <p className="text-sm text-[var(--color-text-3)] mb-5">Reservas confirmadas no salão de festas.</p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-card)] border border-[var(--color-border-1)] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-bold text-[var(--color-text-1)] capitalize">
          {format(current, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button
          onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-card)] border border-[var(--color-border-1)] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden mb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border-1)]">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-[var(--color-text-3)] py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e${i}`} className="h-10" />
          ))}
          {days.map(day => {
            const res = reservationsOnDay(day)
            const isSelected = selected ? isSameDay(day, selected) : false
            const todayClass = isToday(day)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelected(isSelected ? null : day)}
                className={`h-10 flex flex-col items-center justify-center text-xs font-semibold transition-colors relative ${
                  !isSameMonth(day, current) ? 'opacity-30' : ''
                } ${isSelected ? 'bg-[var(--color-accent)] text-white rounded-xl' : todayClass ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-2)] hover:bg-[var(--color-elevated)]'}`}
              >
                {format(day, 'd')}
                {res.length > 0 && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-success)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-4">
          <div className="text-xs font-bold text-[var(--color-text-3)] uppercase tracking-wider mb-3 capitalize">
            {format(selected, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </div>
          {selectedReservations.length === 0 ? (
            <p className="text-sm text-[var(--color-text-3)]">Salão disponível neste dia</p>
          ) : (
            <div className="space-y-2">
              {selectedReservations.map(r => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor[r.status] ?? '#888' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[var(--color-text-1)] font-semibold">Apto {r.unit_number}</span>
                    <span className="text-xs text-[var(--color-text-3)] ml-2">{r.resident_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3 text-xs text-[var(--color-text-3)]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
          Reservado
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full border border-[var(--color-border-2)]" />
          Disponível
        </div>
      </div>
    </div>
  )
}
