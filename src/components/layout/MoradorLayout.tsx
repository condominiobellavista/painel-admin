import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { User, Car, Wrench, CalendarRange, LogOut } from 'lucide-react'
import { useMorador } from '@/context/MoradorContext'

const navItems = [
  { to: '/morador/area', label: 'Dados', icon: User, end: true },
  { to: '/morador/area/veiculos', label: 'Veículos', icon: Car },
  { to: '/morador/area/prestadores', label: 'Prestadores', icon: Wrench },
  { to: '/morador/area/reservas', label: 'Fazer Reserva', icon: CalendarRange },
]

const roleLabel: Record<string, string> = {
  proprietario_morador: 'Proprietário',
  proprietario_nao_morador: 'Proprietário',
  inquilino: 'Inquilino',
  dependente: 'Dependente',
  dependente_inquilino: 'Dependente',
}

export default function MoradorLayout() {
  const { morador, signOut } = useMorador()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/morador')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-base)]">
      <header className="sticky top-0 z-10 bg-[var(--color-surface)] border-b border-[var(--color-border-1)] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-[var(--color-text-3)] uppercase tracking-[0.12em] font-semibold">
            Condomínio Bella Vista
          </div>
          <div className="text-sm font-bold text-[var(--color-text-1)] leading-tight mt-0.5">
            {morador?.name}
          </div>
          <div className="text-xs text-[var(--color-accent)] font-medium">
            Apto {morador?.unit}
            {morador?.role ? ` · ${roleLabel[morador.role] ?? morador.role}` : ''}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-[var(--color-text-3)] hover:text-[var(--color-danger)] text-xs font-medium transition-colors py-1.5 px-2 rounded-lg hover:bg-[var(--color-danger-light)]"
        >
          <LogOut size={14} />
          Sair
        </button>
      </header>

      <main className="flex-1 px-4 py-5 w-full max-w-md mx-auto pb-28">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border-1)] flex items-center justify-around px-1 py-2 z-10">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors min-w-[52px] ${
                isActive
                  ? 'text-[var(--color-accent)] bg-[var(--color-accent-light)]'
                  : 'text-[var(--color-text-3)]'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
