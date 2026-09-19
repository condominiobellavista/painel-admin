import { useEffect, useState } from 'react'
import { Search, Car } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'

interface Vehicle {
  id: string
  unit_id: string
  responsible: string
  type: string | null
  model: string | null
  color: string | null
  plate: string | null
  status: string
  units: { number: string } | null
}

const DEMO: Vehicle[] = [
  { id: '1', unit_id: 'u1', responsible: 'Demo Morador', type: 'Automóvel', model: 'Gol', color: 'Prata', plate: 'ABC1D23', status: 'ativo', units: { number: '101' } },
  { id: '2', unit_id: 'u2', responsible: 'Demo Inquilino', type: 'Moto', model: 'CB 300', color: 'Preto', plate: 'XYZ9A87', status: 'ativo', units: { number: '202' } },
]

const TYPE_ICON: Record<string, string> = {
  Moto: '🏍️',
  Van: '🚐',
  Camionete: '🛻',
  Picape: '🛻',
}

export default function AdminVeiculos() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    async function load() {
      if (isDemo) { setVehicles(DEMO); setLoading(false); return }
      const { data } = await supabase
        .from('vehicles')
        .select('*, units(number)')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
      setVehicles((data ?? []) as Vehicle[])
      setLoading(false)
    }
    load()
  }, [])

  const q = busca.toLowerCase()
  const filtered = vehicles.filter(v =>
    !q ||
    v.model?.toLowerCase().includes(q) ||
    v.plate?.toLowerCase().includes(q) ||
    v.responsible?.toLowerCase().includes(q) ||
    (v.units as any)?.number?.includes(q)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-1)]">Veículos</h1>
          {!loading && (
            <p className="text-xs text-[var(--color-text-3)] mt-0.5">{vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''} cadastrado{vehicles.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-3)]" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por placa, modelo, apto, responsável..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-xl text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] focus:outline-none focus:border-[var(--color-accent)] transition"
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-3)]">
          <Car size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{busca ? 'Nenhum resultado encontrado.' : 'Nenhum veículo cadastrado.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(v => (
            <div key={v.id}
              className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl flex items-center gap-4 px-4 py-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: 'var(--color-elevated)' }}>
                {TYPE_ICON[v.type ?? ''] ?? '🚗'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[var(--color-text-1)] truncate">{v.model || '—'}</div>
                <div className="text-xs text-[var(--color-text-3)] mt-0.5">
                  {[v.type, v.color].filter(Boolean).join(' · ')}
                  {v.responsible ? <span> · {v.responsible}</span> : null}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-center">
                  <div className="text-[10px] text-[var(--color-text-3)] uppercase tracking-wider font-semibold">Apto</div>
                  <div className="text-sm font-bold text-[var(--color-text-1)]">{(v.units as any)?.number ?? '—'}</div>
                </div>
                <div className="font-mono text-xs font-bold px-2.5 py-1.5 rounded-lg"
                  style={{ background: 'var(--color-elevated)', color: 'var(--color-text-1)', letterSpacing: '0.05em' }}>
                  {v.plate || '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
