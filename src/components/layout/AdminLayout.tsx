import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  Building2,
  CalendarDays,
  DollarSign,
  HardHat,
  Truck,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/moradores', icon: Users, label: 'Moradores' },
  { to: '/admin/veiculos', icon: Car, label: 'Veículos' },
  { to: '/admin/prestadores', icon: Wrench, label: 'Prestadores' },
  { to: '/admin/unidades', icon: Building2, label: 'Unidades' },
  { to: '/admin/reservas', icon: CalendarDays, label: 'Reservas' },
  { to: '/admin/financeiro', icon: DollarSign, label: 'Financeiro' },
  { to: '/admin/zeladoria', icon: HardHat, label: 'Zeladoria' },
  { to: '/admin/mudancas', icon: Truck, label: 'Mudanças' },
] as const

export default function AdminLayout() {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border-1 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border-1">
          <Building2 className="w-7 h-7 text-accent" />
          <div>
            <div className="font-bold text-sm text-text-1">Bella Vista</div>
            <div className="text-xs text-text-3">Painel Admin</div>
          </div>
          <button className="ml-auto lg:hidden text-text-3" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-light text-accent'
                    : 'text-text-2 hover:bg-card-hover hover:text-text-1',
                )
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={signOut}
          className="flex items-center gap-3 mx-3 mb-4 px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger-light transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sair
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-surface/80 backdrop-blur-md border-b border-border-1 lg:hidden">
          <button onClick={() => setOpen(true)} className="text-text-2">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-sm">Bella Vista</span>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
