import { useEffect, useState } from 'react'
import { Search, Truck, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

interface MoveRequest {
  id: string
  unit_number: string
  resident_name: string
  email: string | null
  type: 'entrada' | 'saida'
  move_date: string
  period: string | null
  status: 'pendente' | 'aprovada' | 'cancelada'
  notes: string | null
  created_at: string
}

const STATUS_ORDER = { pendente: 0, aprovada: 1, cancelada: 2 }
const STATUS_LABEL = { pendente: 'Pendente', aprovada: 'Aprovada', cancelada: 'Cancelada' }
const STATUS_COLOR = {
  pendente: 'var(--color-warning)',
  aprovada: 'var(--color-success)',
  cancelada: 'var(--color-danger)',
}
const STATUS_BG = {
  pendente: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
  aprovada: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
  cancelada: 'color-mix(in srgb, var(--color-danger) 12%, transparent)',
}

const DEMO: MoveRequest[] = [
  { id: '1', unit_number: '305', resident_name: 'Demo Inquilino', email: null, type: 'entrada', move_date: '2025-10-20', period: 'Manhã', status: 'pendente', notes: 'Mudança de São Paulo', created_at: '' },
  { id: '2', unit_number: '102', resident_name: 'Demo Morador', email: null, type: 'saida', move_date: '2025-10-10', period: 'Tarde', status: 'aprovada', notes: null, created_at: '' },
]

function fmt(date: string) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export default function AdminMudancas() {
  const [moves, setMoves] = useState<MoveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    if (isDemo) { setMoves(DEMO); setLoading(false); return }
    const { data } = await supabase
      .from('move_requests')
      .select('*')
      .order('move_date', { ascending: false })
    const sorted = ((data ?? []) as MoveRequest[]).sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    )
    setMoves(sorted)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: 'aprovada' | 'cancelada') {
    if (isDemo) {
      setMoves(ms => ms.map(m => m.id === id ? { ...m, status } : m))
      return
    }
    setActing(id)
    await supabase.from('move_requests').update({ status }).eq('id', id)
    setActing(null)
    load()
  }

  const q = busca.toLowerCase()
  const filtered = moves.filter(m =>
    !q ||
    m.unit_number.includes(q) ||
    m.resident_name.toLowerCase().includes(q) ||
    fmt(m.move_date).includes(q) ||
    m.type.includes(q)
  )

  const pendentes = moves.filter(m => m.status === 'pendente').length

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--color-text-1)]">Mudanças</h1>
        {!loading && (
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-[var(--color-text-3)]">{moves.length} solicitaç{moves.length !== 1 ? 'ões' : 'ão'}</span>
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
          placeholder="Buscar por apto, morador, data..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition" />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-3)]">
          <Truck size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{busca ? 'Nenhum resultado.' : 'Nenhuma mudança agendada.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => {
            const open = expanded === m.id
            const typeLabel = m.type === 'entrada' ? '🚚 Entrada' : '📦 Saída'
            return (
              <div key={m.id} className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl overflow-hidden">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90 transition"
                  onClick={() => setExpanded(open ? null : m.id)}>
                  <div className="w-12 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{ background: 'var(--color-elevated)', color: 'var(--color-text-1)' }}>
                    {m.unit_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[var(--color-text-1)] truncate">{typeLabel} — {fmt(m.move_date)}</div>
                    <div className="text-xs text-[var(--color-text-3)] mt-0.5 truncate">
                      {m.resident_name}{m.period ? ` · ${m.period}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: STATUS_BG[m.status], color: STATUS_COLOR[m.status] }}>
                      {STATUS_LABEL[m.status]}
                    </span>
                    {open ? <ChevronUp size={14} className="text-[var(--color-text-3)]" /> : <ChevronDown size={14} className="text-[var(--color-text-3)]" />}
                  </div>
                </button>

                {open && (
                  <div className="border-t border-[var(--color-border-0)] px-4 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        ['Tipo', m.type === 'entrada' ? 'Entrada' : 'Saída'],
                        ['Data', fmt(m.move_date)],
                        ['Período', m.period || '—'],
                        ['Morador', m.resident_name],
                        ['E-mail', m.email || '—'],
                        ['Solicitado em', fmt(m.created_at?.slice(0,10))],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <div className="text-[11px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">{k}</div>
                          <div className="text-sm text-[var(--color-text-1)] font-semibold mt-0.5">{v}</div>
                        </div>
                      ))}
                    </div>
                    {m.notes && (
                      <div className="px-3 py-2 rounded-xl text-xs text-[var(--color-text-2)]"
                        style={{ background: 'var(--color-elevated)' }}>
                        📝 {m.notes}
                      </div>
                    )}
                    {m.status === 'pendente' && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => updateStatus(m.id, 'aprovada')}
                          disabled={acting === m.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition"
                          style={{ background: 'var(--color-success)' }}>
                          <Check size={13} /> Aprovar
                        </button>
                        <button onClick={() => updateStatus(m.id, 'cancelada')}
                          disabled={acting === m.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition"
                          style={{ background: 'var(--color-danger)' }}>
                          <X size={13} /> Cancelar
                        </button>
                      </div>
                    )}
                    {m.status === 'aprovada' && (
                      <button onClick={() => updateStatus(m.id, 'cancelada')}
                        disabled={acting === m.id}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-xl border disabled:opacity-50 transition"
                        style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', background: STATUS_BG.cancelada }}>
                        <X size={13} /> Cancelar mudança
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
