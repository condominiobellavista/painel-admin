import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AdminLayout from '@/components/layout/AdminLayout'
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-2">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
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
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
