import { createContext, useContext, useState, type ReactNode } from 'react'
import { supabase, isDemo } from '@/lib/supabase'

export interface MoradorProfile {
  id: string
  unit_id: string
  name: string
  unit: string
  role: string
  email?: string
  phone?: string
}

interface MoradorState {
  morador: MoradorProfile | null
  code: string | null
  loading: boolean
  signIn: (code: string) => Promise<string | null>
  signOut: () => void
  updateMorador: (patch: Partial<MoradorProfile>) => void
}

const MoradorContext = createContext<MoradorState | null>(null)

export function MoradorProvider({ children }: { children: ReactNode }) {
  const [morador, setMorador] = useState<MoradorProfile | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function signIn(inputCode: string): Promise<string | null> {
    if (inputCode.trim().length !== 6) return 'O código deve ter exatamente 6 dígitos'

    if (isDemo) {
      setCode('000000')
      setMorador({ id: 'demo', unit_id: 'demo-unit', name: 'Demo Morador', unit: '101', role: 'proprietario_morador', email: 'morador@bellavista.app' })
      return null
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('residents')
      .select('id, full_name, unit_id, role, email, phone, units(number)')
      .eq('access_code', inputCode.trim())
      .eq('status', 'aprovado')
      .maybeSingle()
    setLoading(false)

    if (error) return 'Erro ao verificar o código. Tente novamente.'
    if (!data) return 'Código não encontrado ou acesso não aprovado.'

    const d = data as any
    setCode(inputCode.trim())
    setMorador({
      id: d.id,
      unit_id: d.unit_id,
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
    setCode(null)
  }

  function updateMorador(patch: Partial<MoradorProfile>) {
    setMorador(prev => prev ? { ...prev, ...patch } : prev)
  }

  return (
    <MoradorContext.Provider value={{ morador, code, loading, signIn, signOut, updateMorador }}>
      {children}
    </MoradorContext.Provider>
  )
}

export function useMorador() {
  const ctx = useContext(MoradorContext)
  if (!ctx) throw new Error('useMorador must be inside MoradorProvider')
  return ctx
}
