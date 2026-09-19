import { createContext, useContext, useState, type ReactNode } from 'react'
import { supabase, isDemo } from '@/lib/supabase'

export interface MoradorProfile {
  id: string
  name: string
  unit: string
  role: string
  email?: string
  phone?: string
}

interface MoradorState {
  morador: MoradorProfile | null
  loading: boolean
  signIn: (code: string) => Promise<string | null>
  signOut: () => void
}

const MoradorContext = createContext<MoradorState | null>(null)

export function MoradorProvider({ children }: { children: ReactNode }) {
  const [morador, setMorador] = useState<MoradorProfile | null>(null)
  const [loading, setLoading] = useState(false)

  async function signIn(code: string): Promise<string | null> {
    if (code.trim().length !== 6) return 'O código deve ter exatamente 6 dígitos'

    if (isDemo) {
      setMorador({ id: 'demo', name: 'Demo Morador', unit: '101', role: 'proprietario_morador', email: 'morador@bellavista.app' })
      return null
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('residents')
      .select('id, full_name, unit_id, role, email, phone, units(number)')
      .eq('access_code', code.trim())
      .eq('status', 'aprovado')
      .maybeSingle()
    setLoading(false)

    if (error) return 'Erro ao verificar o código. Tente novamente.'
    if (!data) return 'Código não encontrado ou acesso não aprovado.'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = data as any
    setMorador({
      id: d.id,
      name: d.full_name,
      unit: d.units?.number ?? '',
      role: d.role,
      email: d.email ?? undefined,
      phone: d.phone ?? undefined,
    })
    return null
  }

  function signOut() {
    setMorador(null)
  }

  return (
    <MoradorContext.Provider value={{ morador, loading, signIn, signOut }}>
      {children}
    </MoradorContext.Provider>
  )
}

export function useMorador() {
  const ctx = useContext(MoradorContext)
  if (!ctx) throw new Error('useMorador must be inside MoradorProvider')
  return ctx
}
