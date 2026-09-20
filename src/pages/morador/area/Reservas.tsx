import { useEffect, useState } from 'react'
import { CalendarRange, Plus, X, CheckCircle, PartyPopper, Truck, AlertTriangle } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import { useMorador } from '@/context/MoradorContext'
import { sendEmail, ADMIN_EMAIL, emailAdminNovaReserva, emailAdminNovaMudanca, emailAdminDesistencia } from '@/lib/notifications'

/* ── tipos ── */
type SolicitacaoTipo = 'salao' | 'mudanca'

interface Reservation {
  id: string
  hall: string
  use_date: string
  fee: number
  status: string
  notes: string
  exemption: boolean
}

interface Move {
  id: string
  type: 'entrada' | 'saida'
  move_date: string
  period: string
  status: string
  notes: string
}

type Item =
  | ({ kind: 'salao' } & Reservation)
  | ({ kind: 'mudanca' } & Move)

/* ── demo ── */
const DEMO_RESERVATIONS: Reservation[] = [
  { id: '1', hall: 'Salão Superior', use_date: '2026-10-15', fee: 150, status: 'confirmada', notes: '', exemption: false },
]
const DEMO_MOVES: Move[] = [
  { id: 'm1', type: 'entrada', move_date: '2026-10-20', period: 'manha', status: 'aprovada', notes: '' },
]

/* ── helpers ── */
const STATUS_COLOR: Record<string, string> = {
  confirmada: 'var(--color-success)',
  pendente:   'var(--color-warning)',
  cancelada:  'var(--color-danger)',
  aprovada:   'var(--color-success)',
}
const STATUS_LABEL: Record<string, string> = {
  confirmada: 'Confirmada',
  pendente:   'Aguardando aprovação',
  cancelada:  'Cancelada',
  aprovada:   'Aprovada',
}
function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
const TAXA = 150
const today = new Date().toISOString().split('T')[0]

export default function MoradorReservas() {
  const { morador, code } = useMorador()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  /* form state */
  const [showForm, setShowForm] = useState(false)
  const [tipo, setTipo] = useState<SolicitacaoTipo>('salao')

  /* salão */
  const [hall, setHall] = useState('')
  const [date, setDate] = useState('')
  const [exemption, setExemption] = useState(false)

  /* mudança */
  const [moveType, setMoveType] = useState<'entrada' | 'saida'>('entrada')
  const [moveDate, setMoveDate] = useState('')
  const [period, setPeriod] = useState<'manha' | 'tarde'>('manha')

  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function load() {
    if (isDemo) {
      const all: Item[] = [
        ...DEMO_RESERVATIONS.map(r => ({ kind: 'salao' as const, ...r })),
        ...DEMO_MOVES.map(m => ({ kind: 'mudanca' as const, ...m })),
      ]
      setItems(all.sort((a, b) => {
        const da = a.kind === 'salao' ? a.use_date : a.move_date
        const db = b.kind === 'salao' ? b.use_date : b.move_date
        return db.localeCompare(da)
      }))
      setLoading(false)
      return
    }
    const [resv, mv] = await Promise.all([
      supabase.rpc('morador_get_reservations', { p_code: code }),
      supabase.rpc('morador_get_moves', { p_code: code }),
    ])
    const all: Item[] = [
      ...((resv.data ?? []) as Reservation[]).map(r => ({ kind: 'salao' as const, ...r })),
      ...((mv.data ?? []) as Move[]).map(m => ({ kind: 'mudanca' as const, ...m })),
    ]
    all.sort((a, b) => {
      const da = a.kind === 'salao' ? a.use_date : a.move_date
      const db = b.kind === 'salao' ? b.use_date : b.move_date
      return db.localeCompare(da)
    })
    setItems(all)
    setLoading(false)
  }

  useEffect(() => { load() }, [morador])

  function openForm() {
    setShowForm(true)
    setSuccess(false)
    setError('')
    setHall('')
    setDate('')
    setMoveDate('')
    setExemption(false)
    setMoveType('entrada')
    setPeriod('manha')
    setTipo('salao')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (tipo === 'salao') {
      if (!hall) { setError('Selecione o salão.'); return }
      if (!date) { setError('Selecione uma data.'); return }
      if (new Date(date + 'T12:00:00') <= new Date()) { setError('A data deve ser futura.'); return }

      setSubmitting(true)
      if (!isDemo) {
        const { error: rpcErr } = await supabase.rpc('morador_create_reservation', {
          p_code: code, p_date: date, p_hall: hall,
          p_fee: TAXA, p_exemption: exemption,
        })
        setSubmitting(false)
        if (rpcErr) {
          if (rpcErr.message.includes('inadimplente')) setError('Sua unidade está inadimplente e não pode fazer reservas.')
          else if (rpcErr.message.includes('bloqueada')) setError('Sua unidade está bloqueada. Entre em contato com a administração.')
          else if (rpcErr.message.includes('já está reservado')) setError(`${hall} já está reservado nesta data. Escolha outra data ou o outro salão.`)
          else setError('Erro ao solicitar reserva. Tente novamente.')
          return
        }
        await sendEmail({ to: ADMIN_EMAIL, ...emailAdminNovaReserva({ nome: morador?.name ?? '', apto: morador?.unit ?? '', data: formatDate(date), hall, taxa: TAXA, isencao: exemption }) })
      } else { setSubmitting(false) }
    } else {
      if (!moveDate) { setError('Selecione uma data.'); return }
      if (new Date(moveDate + 'T12:00:00') <= new Date()) { setError('A data deve ser futura.'); return }

      setSubmitting(true)
      if (!isDemo) {
        const { error: rpcErr } = await supabase.rpc('morador_create_move', {
          p_code: code, p_date: moveDate, p_type: moveType, p_period: period,
        })
        setSubmitting(false)
        if (rpcErr) {
          if (rpcErr.message.includes('inadimplente')) setError('Sua unidade está inadimplente.')
          else if (rpcErr.message.includes('bloqueada')) setError('Sua unidade está bloqueada.')
          else if (rpcErr.message.includes('já existe')) setError('Já existe uma mudança agendada nesta data.')
          else setError('Erro ao solicitar mudança. Tente novamente.')
          return
        }
        await sendEmail({ to: ADMIN_EMAIL, ...emailAdminNovaMudanca({ nome: morador?.name ?? '', apto: morador?.unit ?? '', data: formatDate(moveDate), tipo: moveType, periodo: period }) })
      } else { setSubmitting(false) }
    }

    setSuccess(true)
    setShowForm(false)
    load()
  }

  function canCancel(eventDate: string) {
    const diff = (new Date(eventDate + 'T12:00:00').getTime() - Date.now()) / 86400000
    return diff > 2
  }

  async function handleCancel(item: Item) {
    const id = item.id
    setCancelling(id)
    if (!isDemo) {
      if (item.kind === 'salao') {
        await supabase.rpc('morador_cancel_reservation', { p_code: code, p_id: id })
        await sendEmail({ to: ADMIN_EMAIL, ...emailAdminDesistencia({ nome: morador?.name ?? '', apto: morador?.unit ?? '', data: formatDate(item.use_date), tipo: 'salao', hall: item.hall }) })
      } else {
        await supabase.rpc('morador_cancel_move', { p_code: code, p_id: id })
        await sendEmail({ to: ADMIN_EMAIL, ...emailAdminDesistencia({ nome: morador?.name ?? '', apto: morador?.unit ?? '', data: formatDate(item.move_date), tipo: 'mudanca' }) })
      }
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'cancelada' } : i))
    setCancelling(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-black text-[var(--color-text-1)]">Fazer Reserva</h1>
        {!showForm && (
          <button onClick={openForm}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--color-accent)' }}>
            <Plus size={15} /> Nova solicitação
          </button>
        )}
      </div>
      <p className="text-sm text-[var(--color-text-3)] mb-5">Apto {morador?.unit}</p>

      {/* Banner sucesso */}
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
            <span className="text-sm font-bold text-[var(--color-text-1)]">Nova solicitação</span>
            <button onClick={() => setShowForm(false)} style={{ color: 'var(--color-text-3)' }}><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Tipo de solicitação */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>Tipo *</label>
              <div className="grid grid-cols-2 gap-2">
                {([['salao', 'Reserva de Salão', PartyPopper], ['mudanca', 'Mudança', Truck]] as const).map(([val, label, Icon]) => (
                  <button key={val} type="button"
                    onClick={() => { setTipo(val); setError('') }}
                    className="py-3 px-2 rounded-xl text-sm font-bold transition flex flex-col items-center gap-1.5"
                    style={{
                      background: tipo === val ? 'var(--color-accent)' : 'var(--color-elevated)',
                      color: tipo === val ? '#fff' : 'var(--color-text-2)',
                      border: `1px solid ${tipo === val ? 'var(--color-accent)' : 'var(--color-border-1)'}`,
                    }}>
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* === SALÃO === */}
            {tipo === 'salao' && (<>
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>Salão *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Salão Superior', 'Salão Inferior'].map(h => (
                    <button key={h} type="button"
                      onClick={() => { setHall(h); setError('') }}
                      className="py-2.5 rounded-xl text-sm font-bold transition"
                      style={{
                        background: hall === h ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)' : 'var(--color-elevated)',
                        color: hall === h ? 'var(--color-accent)' : 'var(--color-text-2)',
                        border: `1px solid ${hall === h ? 'var(--color-accent)' : 'var(--color-border-1)'}`,
                      }}>
                      {h === 'Salão Superior' ? '⬆ Superior' : '⬇ Inferior'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>Data do evento *</label>
                <input type="date" min={today} value={date}
                  onChange={e => { setDate(e.target.value); setError('') }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }} />
              </div>

              <div className="px-3 py-3 rounded-xl flex items-center justify-between"
                style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)' }}>
                <div>
                  <div className="text-sm font-bold text-[var(--color-text-1)]">Taxa de uso</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-3)' }}>
                    {exemption
                      ? <span style={{ color: 'var(--color-success)' }}>Solicitando isenção</span>
                      : `R$ ${TAXA.toFixed(2)}`}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs" style={{ color: 'var(--color-text-3)' }}>Solicitar isenção</span>
                  <div onClick={() => setExemption(v => !v)}
                    className="w-10 h-5 rounded-full relative cursor-pointer transition-colors"
                    style={{ background: exemption ? 'var(--color-accent)' : 'var(--color-border-2)' }}>
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all"
                      style={{ left: exemption ? '22px' : '2px' }} />
                  </div>
                </label>
              </div>
            </>)}

            {/* === MUDANÇA === */}
            {tipo === 'mudanca' && (<>
              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>Tipo de mudança *</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['entrada', '📦 Entrada'], ['saida', '🚛 Saída']] as const).map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => { setMoveType(val); setError('') }}
                      className="py-2.5 rounded-xl text-sm font-bold transition"
                      style={{
                        background: moveType === val ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)' : 'var(--color-elevated)',
                        color: moveType === val ? 'var(--color-accent)' : 'var(--color-text-2)',
                        border: `1px solid ${moveType === val ? 'var(--color-accent)' : 'var(--color-border-1)'}`,
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>Data da mudança *</label>
                <input type="date" min={today} value={moveDate}
                  onChange={e => { setMoveDate(e.target.value); setError('') }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }} />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>Período *</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['manha', '🌅 Manhã'], ['tarde', '🌇 Tarde']] as const).map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => setPeriod(val)}
                      className="py-2.5 rounded-xl text-sm font-bold transition"
                      style={{
                        background: period === val ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)' : 'var(--color-elevated)',
                        color: period === val ? 'var(--color-accent)' : 'var(--color-text-2)',
                        border: `1px solid ${period === val ? 'var(--color-accent)' : 'var(--color-border-1)'}`,
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>)}

            {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-40"
              style={{ background: 'var(--color-accent)' }}>
              {submitting ? 'Enviando...' : 'Solicitar'}
            </button>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-[var(--color-text-3)]">
          <CalendarRange size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma solicitação ainda.</p>
          <p className="text-xs mt-1">Clique em "Nova solicitação" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const isSalao = item.kind === 'salao'
            const eventDate = isSalao ? item.use_date : item.move_date
            const dateStr = formatDate(eventDate)
            const statusColor = STATUS_COLOR[item.status] ?? 'var(--color-text-3)'
            const active = item.status !== 'cancelada'
            const cancellable = active && canCancel(eventDate)
            const tooCLose = active && !cancellable
            return (
              <div key={`${item.kind}-${item.id}`} className="rounded-2xl p-4"
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isSalao
                        ? <PartyPopper size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                        : <Truck size={13} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                      }
                      <div className="font-bold text-sm text-[var(--color-text-1)]">
                        {isSalao ? item.hall : `Mudança — ${item.type === 'entrada' ? 'Entrada' : 'Saída'}`}
                      </div>
                    </div>
                    <div className="text-xs mt-0.5 ml-5" style={{ color: 'var(--color-text-3)' }}>
                      {dateStr}
                      {!isSalao && ` · ${item.period === 'manha' ? 'Manhã' : 'Tarde'}`}
                    </div>
                    {isSalao && (
                      <div className="text-xs mt-1 ml-5" style={{ color: 'var(--color-text-3)' }}>
                        {item.fee === 0
                          ? <span style={{ color: 'var(--color-success)' }}>Isento</span>
                          : `Taxa: R$ ${Number(item.fee).toFixed(2)}`}
                        {item.exemption && item.fee > 0 &&
                          <span className="ml-1" style={{ color: 'var(--color-warning)' }}>(isenção pendente)</span>}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                    style={{ color: statusColor, background: `color-mix(in srgb, ${statusColor} 12%, transparent)` }}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                </div>

                {/* Cancelamento */}
                {cancellable && (
                  <button
                    onClick={() => handleCancel(item)}
                    disabled={cancelling === item.id}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-bold transition disabled:opacity-40"
                    style={{ background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', color: 'var(--color-danger)', border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)' }}>
                    {cancelling === item.id ? 'Cancelando...' : 'Desistir da reserva'}
                  </button>
                )}
                {tooCLose && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'color-mix(in srgb, var(--color-warning) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warning) 20%, transparent)' }}>
                    <AlertTriangle size={12} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: 'var(--color-warning)' }}>
                      Cancelamento sem custo só até 2 dias antes. Entre em contato com a administração.
                    </p>
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
