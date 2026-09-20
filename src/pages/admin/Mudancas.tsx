import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Search } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import { sendEmail, emailMudancaAprovada, emailMudancaCancelada } from '@/lib/notifications'

interface MoveRequest {
  id: string
  unit_number: string
  resident_name: string
  email?: string
  type: 'entrada' | 'saida'
  move_date: string
  period: 'manha' | 'tarde'
  status: 'pendente' | 'aprovada' | 'cancelada'
  notes?: string
}

const STATUS_STYLE = {
  pendente: { bg: 'color-mix(in srgb, var(--color-warning) 12%, transparent)', color: 'var(--color-warning)', label: 'Pendente' },
  aprovada: { bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)', label: 'Aprovada' },
  cancelada: { bg: 'color-mix(in srgb, var(--color-danger) 12%, transparent)', color: 'var(--color-danger)', label: 'Cancelada' },
}

const PERIOD_LABEL = { manha: 'Manhã (08h–12h)', tarde: 'Tarde (13h–17h)' }

const DEMO_MOVES: MoveRequest[] = [
  { id: '1', unit_number: '302', resident_name: 'Demo Inquilino', type: 'entrada', move_date: '2026-10-03', period: 'manha', status: 'pendente' },
  { id: '2', unit_number: '405', resident_name: 'Demo Morador', type: 'saida', move_date: '2026-10-10', period: 'tarde', status: 'aprovada' },
  { id: '3', unit_number: '501', resident_name: 'Demo Saindo', type: 'saida', move_date: '2026-09-20', period: 'manha', status: 'cancelada' },
]

function formatDate(s: string) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export default function AdminMudancas() {
  const [moves, setMoves] = useState<MoveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) { setMoves(DEMO_MOVES); setLoading(false); return }
    supabase
      .from('move_requests')
      .select('*')
      .order('move_date')
      .then(({ data }) => { setMoves((data ?? []) as MoveRequest[]); setLoading(false) })
  }, [])

  async function updateStatus(id: string, newStatus: 'aprovada' | 'cancelada') {
    setSaving(id)
    const m = moves.find(x => x.id === id)
    if (!isDemo) await supabase.from('move_requests').update({ status: newStatus }).eq('id', id)
    setMoves(prev => prev.map(x => x.id === id ? { ...x, status: newStatus } : x))
    if (m?.email) {
      const data = m.move_date.split('-')
      const dateStr = `${data[2]}/${data[1]}/${data[0]}`
      if (newStatus === 'aprovada') {
        const tpl = emailMudancaAprovada({ nome: m.resident_name, apto: m.unit_number, data: dateStr, tipo: m.type, periodo: m.period })
        await sendEmail({ to: m.email, ...tpl })
      } else {
        const tpl = emailMudancaCancelada({ nome: m.resident_name, apto: m.unit_number, data: dateStr })
        await sendEmail({ to: m.email, ...tpl })
      }
    }
    setSaving(null)
  }

  const filtered = moves.filter(m =>
    m.unit_number.includes(busca) ||
    m.resident_name.toLowerCase().includes(busca.toLowerCase()) ||
    formatDate(m.move_date).includes(busca)
  )

  const groups = [
    { label: 'Pendentes', items: filtered.filter(m => m.status === 'pendente') },
    { label: 'Aprovadas', items: filtered.filter(m => m.status === 'aprovada') },
    { label: 'Canceladas', items: filtered.filter(m => m.status === 'cancelada') },
  ]

  if (loading) return <div className="text-sm text-[var(--color-text-3)] p-4">Carregando mudanças...</div>

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[var(--color-text-1)]">Mudanças</h1>
        <p className="text-xs text-[var(--color-text-3)] mt-1">{moves.length} agendamentos</p>
      </div>

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

      {groups.map(g => g.items.length === 0 ? null : (
        <div key={g.label} className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-3)] mb-2">{g.label} ({g.items.length})</div>
          <div className="space-y-2">
            {g.items.map(m => {
              const st = STATUS_STYLE[m.status]
              const isOpen = expanded === m.id
              return (
                <div key={m.id} className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
                    onClick={() => setExpanded(isOpen ? null : m.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                        style={{ background: m.type === 'entrada' ? 'color-mix(in srgb, var(--color-success) 15%, transparent)' : 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: m.type === 'entrada' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {m.type === 'entrada' ? '↓' : '↑'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--color-text-1)]">Apto {m.unit_number}</span>
                          <span className="text-xs text-[var(--color-text-3)]">·</span>
                          <span className="text-xs text-[var(--color-text-3)]">{formatDate(m.move_date)}</span>
                        </div>
                        <div className="text-xs text-[var(--color-text-3)] truncate mt-0.5">
                          {m.type === 'entrada' ? 'Entrada' : 'Saída'} · {m.resident_name}
                        </div>
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
                          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-0.5">Período</div>
                          <div className="text-sm font-bold text-[var(--color-text-1)]">{PERIOD_LABEL[m.period] ?? m.period}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-0.5">Tipo</div>
                          <div className="text-sm font-bold" style={{ color: m.type === 'entrada' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {m.type === 'entrada' ? 'Entrada' : 'Saída'}
                          </div>
                        </div>
                      </div>

                      {m.status === 'pendente' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(m.id, 'aprovada')}
                            disabled={saving === m.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition"
                            style={{ background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }}>
                            <CheckCircle size={14} /> Aprovar
                          </button>
                          <button
                            onClick={() => updateStatus(m.id, 'cancelada')}
                            disabled={saving === m.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition"
                            style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
                            <XCircle size={14} /> Cancelar
                          </button>
                        </div>
                      )}
                      {m.status === 'aprovada' && (
                        <button
                          onClick={() => updateStatus(m.id, 'cancelada')}
                          disabled={saving === m.id}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition"
                          style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}>
                          <XCircle size={14} /> Cancelar mudança
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
        <p className="text-sm text-center text-[var(--color-text-3)] py-10">Nenhuma mudança encontrada.</p>
      )}
    </div>
  )
}
