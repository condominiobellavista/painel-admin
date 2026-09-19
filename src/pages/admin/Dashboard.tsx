import { Users, Car, Wrench, Building2, CalendarDays, DollarSign, HardHat, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const STATS = [
  { label: 'Unidades', icon: Building2, value: '36', to: '/admin/unidades', color: 'text-accent' },
  { label: 'Moradores', icon: Users, value: '—', to: '/admin/moradores', color: 'text-success' },
  { label: 'Veículos', icon: Car, value: '—', to: '/admin/veiculos', color: 'text-purple' },
  { label: 'Prestadores', icon: Wrench, value: '—', to: '/admin/prestadores', color: 'text-teal' },
  { label: 'Reservas', icon: CalendarDays, value: '—', to: '/admin/reservas', color: 'text-warning' },
  { label: 'Financeiro', icon: DollarSign, value: '—', to: '/admin/financeiro', color: 'text-danger' },
  { label: 'Zeladoria', icon: HardHat, value: '—', to: '/admin/zeladoria', color: 'text-text-2' },
  { label: 'Mudanças', icon: Truck, value: '—', to: '/admin/mudancas', color: 'text-teal' },
] as const

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(({ label, icon: Icon, value, to, color }) => (
          <Link
            key={label}
            to={to}
            className="bg-card border border-border-1 rounded-xl p-4 hover:bg-card-hover transition group"
          >
            <Icon className={cn('w-5 h-5 mb-2', color)} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-text-3 group-hover:text-text-2 transition">{label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
