import { useEffect, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import { useMorador } from '@/context/MoradorContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Reservation {
  id: string
  hall: string
  use_date: string
  status: string
  notes: string
}

const DEMO_RESERVATIONS: Reservation[] = [
  { id: '1', hall: 'Salão de Festas', use_date: '2026-10-15', status: 'confirmada', notes: '' },
]

const statusColor: Record<string, string> = {
  confirmada: 'var(--color-success)',
  pendente: 'var(--color-warning)',
  cancelada: 'var(--color-danger)',
}

const statusLabel: Record<string, string> = {
  confirmada: 'Confirmada',
  pendente: 'Pendente',
  cancelada: 'Cancelada',
}

export default function MoradorReservas() {
  const { morador } = useMorador()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setReservations(DEMO_RESERVATIONS)
      setLoading(false)
      return
    }
    async function load() {
      const { data } = await supabase
        .from('reservations')
        .select('id, hall, use_date, status, notes')
        .eq('unit_number', morador?.unit ?? '')
        .order('use_date', { ascending: false })
      setReservations((data ?? []) as Reservation[])
      setLoading(false)
    }
    load()
  }, [morador])

  return (
    <div>
      <h1 className="text-lg font-black text-[var(--color-text-1)] mb-1">Minhas reservas</h1>
      <p className="text-sm text-[var(--color-text-3)] mb-6">Reservas do salão de festas da sua unidade.</p>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : reservations.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-3)]">
          <CalendarRange size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma reserva encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map(r => (
            <div key={r.id} className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-[var(--color-text-1)] text-sm">{r.hall}</div>
                  <div className="text-xs text-[var(--color-text-3)] mt-1">
                    {format(new Date(r.use_date + 'T12:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{
                  color: statusColor[r.status],
                  background: `${statusColor[r.status]}1a`,
                }}>
                  {statusLabel[r.status] ?? r.status}
                </span>
              </div>
              {r.notes && (
                <p className="text-xs text-[var(--color-text-3)] mt-2 leading-relaxed">{r.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-4">
        <p className="text-sm text-[var(--color-text-3)] leading-relaxed">
          Para solicitar uma nova reserva do salão, entre em contato com a administração.
        </p>
        <a
          href="mailto:condominiobellavistasbs@gmail.com"
          className="mt-2 flex items-center gap-2 text-sm text-[var(--color-accent)] font-semibold"
        >
          ✉️ condominiobellavistasbs@gmail.com
        </a>
      </div>
    </div>
  )
}
