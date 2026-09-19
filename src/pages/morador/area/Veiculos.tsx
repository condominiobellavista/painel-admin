import { useEffect, useState } from 'react'
import { Car } from 'lucide-react'
import { supabase, isDemo } from '@/lib/supabase'
import { useMorador } from '@/context/MoradorContext'

interface Vehicle {
  id: string
  model: string
  color: string
  plate: string
  type: string
  status: string
}

const DEMO_VEHICLES: Vehicle[] = [
  { id: '1', model: 'VW Gol 2019', color: 'Prata', plate: 'ABC-1D23', type: 'carro', status: 'ativo' },
]

export default function MoradorVeiculos() {
  const { morador } = useMorador()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setVehicles(DEMO_VEHICLES)
      setLoading(false)
      return
    }
    async function load() {
      const { data } = await supabase
        .from('vehicles')
        .select('id, model, color, plate, type, status')
        .eq('unit_id', morador?.id ?? '')
        .eq('status', 'ativo')
        .order('model')
      setVehicles((data ?? []) as Vehicle[])
      setLoading(false)
    }
    load()
  }, [morador])

  return (
    <div>
      <h1 className="text-lg font-black text-[var(--color-text-1)] mb-1">Meus veículos</h1>
      <p className="text-sm text-[var(--color-text-3)] mb-6">Veículos cadastrados na sua unidade.</p>

      {loading ? (
        <p className="text-sm text-[var(--color-text-3)]">Carregando...</p>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-3)]">
          <Car size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum veículo cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <div key={v.id} className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-elevated)] flex items-center justify-center text-[var(--color-text-3)] flex-shrink-0">
                <Car size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[var(--color-text-1)] text-sm truncate">{v.model}</div>
                <div className="text-xs text-[var(--color-text-3)] mt-0.5">{v.color}</div>
              </div>
              <div className="bg-[var(--color-elevated)] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[var(--color-text-2)] flex-shrink-0">
                {v.plate}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-4">
        <p className="text-sm text-[var(--color-text-3)] leading-relaxed">
          Para adicionar ou remover veículos, entre em contato com a administração.
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
