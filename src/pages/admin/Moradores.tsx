import { useEffect, useState } from 'react'
import { Search, Plus, AlertTriangle, X } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import type { Resident, ResidentRole } from '@/types'

const ROLE_LABEL: Record<ResidentRole, string> = {
  proprietario_morador: 'Proprietário morador',
  proprietario_nao_morador: 'Proprietário não morador',
  inquilino: 'Inquilino',
  dependente: 'Dependente',
  dependente_inquilino: 'Dependente inquilino',
}

const ROLE_COLOR: Record<ResidentRole, string> = {
  proprietario_morador: 'var(--color-accent)',
  proprietario_nao_morador: 'var(--color-text-3)',
  inquilino: 'var(--color-success)',
  dependente: 'var(--color-warning)',
  dependente_inquilino: 'var(--color-warning)',
}

const STATUS_LABEL = { aprovado: 'Aprovado', aguardando: 'Aguardando', inativo: 'Inativo' }
const STATUS_COLOR = {
  aprovado: 'var(--color-success)',
  aguardando: 'var(--color-warning)',
  inativo: 'var(--color-danger)',
}

const DEMO_RESIDENTS: (Resident & { unit_number: string })[] = [
  { id: '1', unit_id: 'u1', unit_number: '101', role: 'proprietario_morador', full_name: 'Demo Morador', birth_date: '01/01/1980', cpf: null, phone: '(47) 99000-0001', email: 'demo@example.com', access_code: '000001', lgpd_consent: true, status: 'aprovado', notes: null, created_at: '' },
  { id: '2', unit_id: 'u2', unit_number: '501', role: 'inquilino', full_name: 'Demo Inquilino', birth_date: '01/01/1990', cpf: null, phone: '(47) 99000-0002', email: 'demo2@example.com', access_code: '000002', lgpd_consent: true, status: 'aprovado', notes: '⚠️ REVISAR: código de acesso duplicado — mesmo código da proprietária (000002). Atribuir código exclusivo para um dos dois.', created_at: '' },
  { id: '3', unit_id: 'u2', unit_number: '501', role: 'proprietario_nao_morador', full_name: 'Demo Proprietária', birth_date: '01/01/1985', cpf: null, phone: '(47) 99000-0003', email: 'demo3@example.com', access_code: '000002', lgpd_consent: true, status: 'aprovado', notes: '⚠️ REVISAR: código de acesso duplicado — mesmo código do inquilino (000002). Atribuir código exclusivo para um dos dois.', created_at: '' },
]

interface ResidentRow extends Resident {
  unit_number: string
}

export default function Moradores() {
  const [residents, setResidents] = useState<ResidentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [alertNote, setAlertNote] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) {
      setResidents(DEMO_RESIDENTS)
      setLoading(false)
      return
    }
    async function load() {
      const { data } = await supabase
        .from('residents')
        .select('*, units(number)')
        .order('full_name')
      if (data) {
        setResidents(data.map((r: any) => ({ ...r, unit_number: r.units?.number ?? '' })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = residents.filter(r => {
    const q = busca.toLowerCase()
    return (
      r.full_name.toLowerCase().includes(q) ||
      r.unit_number.includes(q) ||
      (r.phone ?? '').includes(q)
    )
  })

  const alertCount = residents.filter(r => r.notes).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Moradores</h1>
          {alertCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: 'var(--color-warning)', background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' }}>
              <AlertTriangle size={12} />
              {alertCount} para revisar
            </span>
          )}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:opacity-90 text-white text-sm font-semibold rounded-lg transition">
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-3)]" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, apto, telefone..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-lg text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition"
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-text-3)]">Nenhum resultado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div
              key={r.id}
              className="bg-[var(--color-card)] border rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ borderColor: r.notes ? 'color-mix(in srgb, var(--color-warning) 40%, var(--color-border-1))' : 'var(--color-border-1)' }}
            >
              {/* Apto badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black bg-[var(--color-elevated)] text-[var(--color-text-2)]">
                {r.unit_number}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[var(--color-text-1)] truncate">{r.full_name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: ROLE_COLOR[r.role], background: `color-mix(in srgb, ${ROLE_COLOR[r.role]} 15%, transparent)` }}>
                    {ROLE_LABEL[r.role]}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: STATUS_COLOR[r.status], background: `color-mix(in srgb, ${STATUS_COLOR[r.status]} 15%, transparent)` }}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-3)] flex-wrap">
                  {r.phone && <span>{r.phone}</span>}
                  {r.access_code && <span className="font-mono">código: {r.access_code}</span>}
                </div>
              </div>

              {/* Alert icon */}
              {r.notes && (
                <button
                  onClick={() => setAlertNote(r.notes)}
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                  style={{ color: 'var(--color-warning)', background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' }}
                  title="Ver nota de revisão"
                >
                  <AlertTriangle size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de nota */}
      {alertNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setAlertNote(null)}>
          <div
            className="bg-[var(--color-card)] border rounded-2xl p-5 max-w-sm w-full shadow-xl"
            style={{ borderColor: 'color-mix(in srgb, var(--color-warning) 50%, var(--color-border-1))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--color-warning)' }}>
                <AlertTriangle size={16} />
                Revisão pendente
              </div>
              <button onClick={() => setAlertNote(null)} className="text-[var(--color-text-3)] hover:text-[var(--color-text-1)] transition">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-[var(--color-text-2)] leading-relaxed">{alertNote}</p>
          </div>
        </div>
      )}
    </div>
  )
}
