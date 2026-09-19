import { useEffect, useState } from 'react'
import { CalendarRange, Plus, X, CheckCircle } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import { useMorador } from '@/context/MoradorContext'

interface Reservation {
  id: string
  hall: string
  use_date: string
  fee: number
  status: string
  notes: string
  exemption: boolean
}

const DEMO_RESERVATIONS: Reservation[] = [
  { id: '1', hall: 'Salão de Festas', use_date: '2026-10-15', fee: 150, status: 'confirmada', notes: '', exemption: false },
  { id: '2', hall: 'Salão de Festas', use_date: '2026-11-01', fee: 150, status: 'pendente', notes: '', exemption: false },
]

const STATUS_COLOR: Record<string, string> = {
  confirmada: 'var(--color-success)',
  pendente: 'var(--color-warning)',
  cancelada: 'var(--color-danger)',
}
const STATUS_LABEL: Record<string, string> = {
  confirmada: 'Confirmada',
  pendente: 'Aguardando aprovação',
  cancelada: 'Cancelada',
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const TAXA = 150

export default function MoradorReservas() {
  const { morador, code } = useMorador()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState('')
  const [hall, setHall] = useState('')
  const [exemption, setExemption] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function loadReservations() {
    if (isDemo) { setReservations(DEMO_RESERVATIONS); setLoading(false); return }
    const { data } = await supabase.rpc('morador_get_reservations', { p_code: code })
    setReservations((data ?? []) as Reservation[])
    setLoading(false)
  }

  useEffect(() => { loadReservations() }, [morador])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hall) { setError('Selecione o salão.'); return }
    if (!date) { setError('Selecione uma data.'); return }
    const selected = new Date(date + 'T12:00:00')
    if (selected <= new Date()) { setError('A data deve ser futura.'); return }

    setSubmitting(true)
    setError('')

    if (isDemo) {
      setSuccess(true)
      setSubmitting(false)
      setShowForm(false)
      return
    }

    const { error: rpcErr } = await supabase.rpc('morador_create_reservation', {
      p_code: code,
      p_date: date,
      p_hall: hall,
      p_fee: exemption ? 0 : TAXA,
      p_exemption: exemption,
    })

    setSubmitting(false)
    if (rpcErr) {
      if (rpcErr.message.includes('inadimplente')) setError('Sua unidade está inadimplente e não pode fazer reservas.')
      else if (rpcErr.message.includes('bloqueada')) setError('Sua unidade está bloqueada. Entre em contato com a administração.')
      else setError('Erro ao solicitar reserva. Tente novamente.')
      return
    }

    setSuccess(true)
    setShowForm(false)
    setDate('')
    setHall('')
    setExemption(false)
    loadReservations()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-black text-[var(--color-text-1)]">Fazer Reserva</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setSuccess(false); setError('') }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition"
            style={{ background: 'var(--color-accent)' }}>
            <Plus size={15} /> Nova reserva
          </button>
        )}
      </div>
      <p className="text-sm text-[var(--color-text-3)] mb-5">Salão de festas — Apto {morador?.unit}</p>

      {/* Sucesso */}
      {success && (
        <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'color-mix(in srgb, var(--color-success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)' }}>
          <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          <p className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>
            Solicitação enviada! Aguarde a confirmação da administração.
          </p>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="mb-5 p-4 rounded-2xl" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-[var(--color-text-1)]">Solicitar reserva do salão</span>
            <button onClick={() => setShowForm(false)} style={{ color: 'var(--color-text-3)' }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>
                Salão *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Salão Superior', 'Salão Inferior'].map(h => (
                  <button key={h} type="button"
                    onClick={() => { setHall(h); setError('') }}
                    className="py-3 rounded-xl text-sm font-bold transition"
                    style={{
                      background: hall === h ? 'var(--color-accent)' : 'var(--color-elevated)',
                      color: hall === h ? '#fff' : 'var(--color-text-2)',
                      border: `1px solid ${hall === h ? 'var(--color-accent)' : 'var(--color-border-1)'}`,
                    }}>
                    {h === 'Salão Superior' ? '⬆ Superior' : '⬇ Inferior'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>
                Data do evento *
              </label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={e => { setDate(e.target.value); setError('') }}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }}
              />
            </div>

            <div className="px-3 py-3 rounded-xl flex items-center justify-between"
              style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)' }}>
              <div>
                <div className="text-sm font-bold text-[var(--color-text-1)]">Taxa de uso</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-3)' }}>
                  {exemption ? <span style={{ color: 'var(--color-success)' }}>Solicitando isenção</span> : `R$ ${TAXA.toFixed(2)}`}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs" style={{ color: 'var(--color-text-3)' }}>Solicitar isenção</span>
                <div
                  onClick={() => setExemption(v => !v)}
                  className="w-10 h-5 rounded-full transition-colors relative cursor-pointer"
                  style={{ background: exemption ? 'var(--color-accent)' : 'var(--color-border-2)' }}>
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all"
                    style={{ left: exemption ? '22px' : '2px' }} />
                </div>
              </label>
            </div>

            {exemption && (
              <p className="text-xs px-1" style={{ color: 'var(--color-text-3)' }}>
                A isenção será analisada pela administração. Você só será confirmado após aprovação.
              </p>
            )}

            {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting || !date || !hall}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-40"
              style={{ background: 'var(--color-accent)' }}>
              {submitting ? 'Enviando...' : 'Solicitar reserva'}
            </button>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : reservations.length === 0 ? (
        <div className="text-center py-10 text-[var(--color-text-3)]">
          <CalendarRange size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma reserva ainda.</p>
          <p className="text-xs mt-1">Clique em "Nova reserva" para solicitar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map(r => (
            <div key={r.id} className="rounded-2xl p-4"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[var(--color-text-1)]">{r.hall}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-3)' }}>{formatDate(r.use_date)}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-text-3)' }}>
                    {r.fee === 0 ? <span style={{ color: 'var(--color-success)' }}>Isento</span> : `Taxa: R$ ${Number(r.fee).toFixed(2)}`}
                    {r.exemption && r.fee > 0 && <span className="ml-1" style={{ color: 'var(--color-warning)' }}>(isenção pendente)</span>}
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                  style={{ color: STATUS_COLOR[r.status], background: `color-mix(in srgb, ${STATUS_COLOR[r.status]} 12%, transparent)` }}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
              {r.notes && <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-text-3)' }}>{r.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
