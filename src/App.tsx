import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useMorador } from '@/context/MoradorContext'
import AdminLayout from '@/components/layout/AdminLayout'
import MoradorLayout from '@/components/layout/MoradorLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/admin/Dashboard'
import Moradores from '@/pages/admin/Moradores'
import Veiculos from '@/pages/admin/Veiculos'
import Prestadores from '@/pages/admin/Prestadores'
import Unidades from '@/pages/admin/Unidades'
import Reservas from '@/pages/admin/Reservas'
import Financeiro from '@/pages/admin/Financeiro'
import Zeladoria from '@/pages/admin/Zeladoria'
import Mudancas from '@/pages/admin/Mudancas'
import MoradorHome from '@/pages/morador/Home'
import MoradorLogin from '@/pages/morador/Login'
import MoradorCadastro from '@/pages/morador/Cadastro'
import MoradorAjuda from '@/pages/morador/Ajuda'
import MoradorDados from '@/pages/morador/area/Dados'
import MoradorVeiculos from '@/pages/morador/area/Veiculos'
import MoradorPrestadores from '@/pages/morador/area/Prestadores'
import MoradorReservas from '@/pages/morador/area/Reservas'
import MoradorCalendario from '@/pages/morador/area/Calendario'

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen text-[var(--color-text-2)]">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function MoradorProtectedRoute({ children }: { children: React.ReactNode }) {
  const { morador, loading } = useMorador()
  if (loading) return <div className="flex items-center justify-center min-h-screen text-[var(--color-text-2)]">Carregando...</div>
  if (!morador) return <Navigate to="/morador/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Admin routes */}
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="moradores" element={<Moradores />} />
        <Route path="veiculos" element={<Veiculos />} />
        <Route path="prestadores" element={<Prestadores />} />
        <Route path="unidades" element={<Unidades />} />
        <Route path="reservas" element={<Reservas />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="zeladoria" element={<Zeladoria />} />
        <Route path="mudancas" element={<Mudancas />} />
      </Route>

      {/* Morador (resident) routes */}
      <Route path="/morador" element={<MoradorHome />} />
      <Route path="/morador/login" element={<MoradorLogin />} />
      <Route path="/morador/cadastro" element={<MoradorCadastro />} />
      <Route path="/morador/ajuda" element={<MoradorAjuda />} />
      <Route
        path="/morador/area"
        element={
          <MoradorProtectedRoute>
            <MoradorLayout />
          </MoradorProtectedRoute>
        }
      >
        <Route index element={<MoradorDados />} />
        <Route path="veiculos" element={<MoradorVeiculos />} />
        <Route path="prestadores" element={<MoradorPrestadores />} />
        <Route path="reservas" element={<MoradorReservas />} />
        <Route path="calendario" element={<MoradorCalendario />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
