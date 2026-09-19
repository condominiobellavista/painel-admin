import { useEffect, useState } from 'react'
import { Search, Wrench } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

interface Provider {
  id: string
  unit_id: string
  resident_responsible: string
  name: string
  service_type: string | null
  days: string | null
  schedule: string | null
  access_code: string | null
  status: string
  units: { number: string } | null
}

const DEMO: Provider[] = [
  { id: '1', unit_id: 'u1', resident_responsible: 'Demo Morador', name: 'Maria Silva', service_type: 'Diarista', days: 'Quarta', schedule: '08:00–14:00', access_code: '000001', status: 'ativo', units: { number: '101' } },
  { id: '2', unit_id: 'u2', resident_responsible: 'Demo Inquilino', name: 'João Pereira', service_type: 'Encanador', days: null, schedule: null, access_code: null, status: 'ativo', units: { number: '202' } },
]

export default function AdminPrestadores() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    async function load() {
      if (isDemo) { setProviders(DEMO); setLoading(false); return }
      const { data } = await supabase
        .from('service_providers')
        .select('*, units(number)')
        .eq('status', 'ativo')
        .order('name')
      setProviders((data ?? []) as Provider[])
      setLoading(false)
    }
    load()
  }, [])

  const q = busca.toLowerCase()
  const filtered = providers.filter(p =>
    !q ||
    p.name.toLowerCase().includes(q) ||
    p.service_type?.toLowerCase().includes(q) ||
    p.resident_responsible?.toLowerCase().includes(q) ||
    (p.units as any)?.number?.includes(q)
  )

  const semCodigo = providers.filter(p => !p.access_code).length

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-[var(--color-text-1)]">Prestadores</h1>
      </div>
      {!loading && (
        <div className="flex items-center gap-3 mb-5">
          <p className="text-xs text-[var(--color-text-3)]">{providers.length} prestador{providers.length !== 1 ? 'es' : ''} cadastrado{providers.length !== 1 ? 's' : ''}</p>
          {semCodigo > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }}>
              {semCodigo} sem código de acesso
            </span>
          )}
        </div>
      )}

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-3)]" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, serviço, apto, responsável..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition"
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-3)]">
          <Wrench size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{busca ? 'Nenhum resultado encontrado.' : 'Nenhum prestador cadastrado.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id}
              className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--color-elevated)', color: 'var(--color-text-3)' }}>
                  <Wrench size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[var(--color-text-1)]">{p.name}</span>
                    {p.service_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--color-elevated)', color: 'var(--color-text-3)' }}>
                        {p.service_type}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-3)] mt-0.5">
                    Apto {(p.units as any)?.number ?? '—'}
                    {p.resident_responsible ? <span> · {p.resident_responsible}</span> : null}
                  </div>
                  {(p.days || p.schedule) && (
                    <div className="text-xs text-[var(--color-text-3)] mt-1">
                      {p.days && <span>📅 {p.days}</span>}
                      {p.days && p.schedule && <span> · </span>}
                      {p.schedule && <span>🕐 {p.schedule}</span>}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  {p.access_code ? (
                    <div>
                      <div className="text-[10px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold mb-0.5">Código</div>
                      <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background: 'var(--color-elevated)', color: 'var(--color-text-1)' }}>
                        {p.access_code}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold"
                      style={{ color: 'var(--color-warning)' }}>
                      Sem código
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
