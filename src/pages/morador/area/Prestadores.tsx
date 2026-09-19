import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import { useMorador } from '@/context/MoradorContext'

interface Provider {
  id: string
  name: string
  service_type: string
  days: string
  schedule: string
  status: string
  access_code: string
}

const DEMO_PROVIDERS: Provider[] = [
  { id: '1', name: 'Maria Silva', service_type: 'Diarista', days: 'Seg, Qua', schedule: '08:00–14:00', status: 'ativo', access_code: '123456' },
]

const statusColor: Record<string, string> = {
  ativo: 'var(--color-success)',
  aguardando: 'var(--color-warning)',
  inativo: 'var(--color-text-3)',
}

export default function MoradorPrestadores() {
  const { morador } = useMorador()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setProviders(DEMO_PROVIDERS)
      setLoading(false)
      return
    }
    async function load() {
      const { data } = await supabase
        .from('service_providers')
        .select('id, name, service_type, days, schedule, status, access_code')
        .eq('unit_id', morador?.id ?? '')
        .order('name')
      setProviders((data ?? []) as Provider[])
      setLoading(false)
    }
    load()
  }, [morador])

  return (
    <div>
      <h1 className="text-lg font-black text-[var(--color-text-1)] mb-1">Meus prestadores</h1>
      <p className="text-sm text-[var(--color-text-3)] mb-6">Prestadores com acesso à sua unidade.</p>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-3)]">
          <Wrench size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum prestador cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map(p => (
            <div key={p.id} className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-bold text-[var(--color-text-1)] text-sm">{p.name}</div>
                  <div className="text-xs text-[var(--color-text-3)] mt-0.5">{p.service_type}</div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{
                  color: statusColor[p.status],
                  background: `${statusColor[p.status]}1a`,
                }}>
                  {p.status === 'ativo' ? 'Ativo' : p.status === 'aguardando' ? 'Aguardando' : 'Inativo'}
                </span>
              </div>
              {(p.days || p.schedule) && (
                <div className="flex gap-3 text-xs text-[var(--color-text-3)]">
                  {p.days && <span>📅 {p.days}</span>}
                  {p.schedule && <span>🕐 {p.schedule}</span>}
                </div>
              )}
              {p.access_code && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-[var(--color-text-3)]">Código:</span>
                  <span className="font-mono font-bold bg-[var(--color-elevated)] px-2 py-0.5 rounded text-[var(--color-text-1)]">
                    {p.access_code}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-4">
        <p className="text-sm text-[var(--color-text-3)] leading-relaxed">
          Para cadastrar ou remover prestadores, entre em contato com a administração.
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
