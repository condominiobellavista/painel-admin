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
  cpf?: string
  birth_date?: string
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
      .rpc('morador_login', { p_code: inputCode.trim() })
    setLoading(false)

    if (error) return 'Erro ao verificar o código. Tente novamente.'
    if (!data || (data as any[]).length === 0) return 'Código não encontrado ou acesso não aprovado.'

    const d = (data as any[])[0]
    setCode(inputCode.trim())
    setMorador({
      id: d.id,
      unit_id: d.unit_id,
      name: d.full_name,
      unit: d.unit_number ?? '',
      role: d.role,
      email: d.email ?? undefined,
      phone: d.phone ?? undefined,
      cpf: d.cpf ?? undefined,
      birth_date: d.birth_date ?? undefined,
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
