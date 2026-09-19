export interface Unit {
  id: string
  number: string
  type: 'proprio' | 'alugado'
  responsible: string
  responsible_birth: string | null
  phone: string | null
  email: string | null
  resident_count: number
  vehicle_count: number
  provider_count: number
  status: 'aprovado' | 'aguardando' | 'inativo'
  is_delinquent: boolean
  is_blocked: boolean
  created_at: string
}

export type ResidentRole =
  | 'proprietario_morador'
  | 'proprietario_nao_morador'
  | 'inquilino'
  | 'dependente'
  | 'dependente_inquilino'

export interface Resident {
  id: string
  unit_id: string
  unit_number: string
  role: ResidentRole
  full_name: string
  birth_date: string | null
  cpf: string | null
  phone: string | null
  email: string | null
  access_code: string | null
  lgpd_consent: boolean
  status: 'aprovado' | 'aguardando' | 'inativo'
  notes: string | null
  created_at: string
}

export interface Vehicle {
  id: string
  unit_id: string
  unit_number: string
  responsible: string
  type: string
  model: string | null
  color: string | null
  plate: string | null
  status: 'ativo' | 'inativo'
  created_at: string
}

export interface ServiceProvider {
  id: string
  unit_id: string
  unit_number: string
  resident_responsible: string
  name: string
  service_type: string | null
  days: string | null
  schedule: string | null
  period: string | null
  access_code: string | null
  status: 'ativo' | 'aguardando' | 'inativo'
  notes: string | null
  created_at: string
}

export interface Reservation {
  id: string
  unit_number: string
  hall: string
  use_date: string
  resident_name: string
  resident_email: string | null
  fee: number | null
  status: 'confirmada' | 'pendente' | 'cancelada'
  notes: string | null
  billing_status: string | null
  exemption: boolean
  created_at: string
}

export interface MoveRequest {
  id: string
  unit_number: string
  resident_name: string
  email: string | null
  type: 'entrada' | 'saida'
  move_date: string
  period: string | null
  status: 'pendente' | 'aprovada' | 'cancelada'
  notes: string | null
  created_at: string
}

export interface BuildingStaff {
  id: string
  role: string
  full_name: string
  phone: string | null
  email: string | null
  access_code: string | null
  lgpd_consent: boolean
  status: 'aprovado' | 'inativo'
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'sindico' | 'conselho' | 'morador'
}
