import { useEffect, useState } from 'react'
import { Search, CalendarDays, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

interface Reservation {
  id: string
  unit_number: string
  hall: string
  use_date: string
  resident_name: string
  resident_email: string | null
  fee: number | null
  status: 'confirmada' | 'pendente' | 'cancelada'
  notes: string | null
  billing_status: string | null
  exemption: boolean
  created_at: string
}

const STATUS_ORDER = { pendente: 0, confirmada: 1, cancelada: 2 }
const STATUS_LABEL = { pendente: 'Pendente', confirmada: 'Confirmada', cancelada: 'Cancelada' }
const STATUS_COLOR = {
  pendente: 'var(--color-warning)',
  confirmada: 'var(--color-success)',
  cancelada: 'var(--color-danger)',
}
const STATUS_BG = {
  pendente: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
  confirmada: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
  cancelada: 'color-mix(in srgb, var(--color-danger) 12%, transparent)',
}

const DEMO: Reservation[] = [
  { id: '1', unit_number: '101', hall: 'Salão de Festas', use_date: '2025-10-15', resident_name: 'Demo Morador', resident_email: null, fee: 150, status: 'confirmada', notes: null, billing_status: 'Pago', exemption: false, created_at: '' },
  { id: '2', unit_number: '202', hall: 'Salão Gourmet', use_date: '2025-10-22', resident_name: 'Demo Inquilino', resident_email: null, fee: null, status: 'pendente', notes: 'Aniversário 50 anos', billing_status: null, exemption: true, created_at: '' },
]

function fmt(date: string) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export default function AdminReservas() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    if (isDemo) { setReservations(DEMO); setLoading(false); return }
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .order('use_date', { ascending: false })
    const sorted = ((data ?? []) as Reservation[]).sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    )
    setReservations(sorted)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: 'confirmada' | 'cancelada') {
    if (isDemo) {
      setReservations(rs => rs.map(r => r.id === id ? { ...r, status } : r))
      return
    }
    setActing(id)
    await supabase.from('reservations').update({ status }).eq('id', id)
    setActing(null)
    load()
  }

  const q = busca.toLowerCase()
  const filtered = reservations.filter(r =>
    !q ||
    r.unit_number.includes(q) ||
    r.resident_name.toLowerCase().includes(q) ||
    r.hall.toLowerCase().includes(q) ||
    fmt(r.use_date).includes(q)
  )

  const pendentes = reservations.filter(r => r.status === 'pendente').length

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--color-text-1)]">Reservas do Salão</h1>
        {!loading && (
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-[var(--color-text-3)]">{reservations.length} reserva{reservations.length !== 1 ? 's' : ''}</span>
            {pendentes > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: STATUS_BG.pendente, color: STATUS_COLOR.pendente }}>
                {pendentes} pendente{pendentes !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-3)]" />
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por apto, morador, salão, data..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition" />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-3)]">
          <CalendarDays size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{busca ? 'Nenhum resultado.' : 'Nenhuma reserva cadastrada.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const open = expanded === r.id
            return (
              <div key={r.id} className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden">
                {/* Header */}
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90 transition"
                  onClick={() => setExpanded(open ? null : r.id)}>
                  <div className="w-12 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{ background: 'var(--color-elevated)', color: 'var(--color-text-1)' }}>
                    {r.unit_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[var(--color-text-1)] truncate">{r.hall} — {fmt(r.use_date)}</div>
                    <div className="text-xs text-[var(--color-text-3)] mt-0.5 truncate">{r.resident_name}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: STATUS_BG[r.status], color: STATUS_COLOR[r.status] }}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    {open ? <ChevronUp size={14} className="text-[var(--color-text-3)]" /> : <ChevronDown size={14} className="text-[var(--color-text-3)]" />}
                  </div>
                </button>

                {/* Expanded */}
                {open && (
                  <div className="border-t border-[var(--color-border-0)] px-4 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        ['Salão', r.hall],
                        ['Data do evento', fmt(r.use_date)],
                        ['Morador', r.resident_name],
                        ['Taxa', r.fee != null ? `R$ ${r.fee.toFixed(2)}` : 'Gratuita'],
                        ['Cobrança', r.billing_status || '—'],
                        ['Isenção solicitada', r.exemption ? 'Sim' : 'Não'],
                        ['Reservado em', fmt(r.created_at?.slice(0,10))],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <div className="text-[11px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">{k}</div>
                          <div className="text-sm text-[var(--color-text-1)] font-semibold mt-0.5">{v}</div>
                        </div>
                      ))}
                    </div>
                    {r.notes && (
                      <div className="px-3 py-2 rounded-xl text-xs text-[var(--color-text-2)]"
                        style={{ background: 'var(--color-elevated)' }}>
                        📝 {r.notes}
                      </div>
                    )}
                    {r.status === 'pendente' && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => updateStatus(r.id, 'confirmada')}
                          disabled={acting === r.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition"
                          style={{ background: 'var(--color-success)' }}>
                          <Check size={13} /> Confirmar
                        </button>
                        <button onClick={() => updateStatus(r.id, 'cancelada')}
                          disabled={acting === r.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition"
                          style={{ background: 'var(--color-danger)' }}>
                          <X size={13} /> Cancelar
                        </button>
                      </div>
                    )}
                    {r.status === 'confirmada' && (
                      <button onClick={() => updateStatus(r.id, 'cancelada')}
                        disabled={acting === r.id}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-xl border disabled:opacity-50 transition"
                        style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', background: STATUS_BG.cancelada }}>
                        <X size={13} /> Cancelar reserva
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
