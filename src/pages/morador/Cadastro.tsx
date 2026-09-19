import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isDemo } from '@/lib/supabase'
import { Shield } from 'lucide-react'

type Tipo = 'proprietario' | 'prop_nao_morador' | 'inquilino' | 'dep_proprietario' | 'dep_inquilino' | 'prestador' | null

const TIPOS = [
  { key: 'proprietario', icon: '🏠', label: 'Proprietário morador', desc: 'Mora no apartamento que é seu' },
  { key: 'prop_nao_morador', icon: '🏘️', label: 'Proprietário não morador', desc: 'Dono do imóvel mas não reside' },
  { key: 'inquilino', icon: '🔑', label: 'Inquilino', desc: 'Locatário do apartamento' },
  { key: 'dep_proprietario', icon: '👨‍👩‍👧', label: 'Dependente (proprietário)', desc: 'Familiar do proprietário' },
  { key: 'dep_inquilino', icon: '👨‍👩‍👦', label: 'Dependente (inquilino)', desc: 'Familiar do inquilino' },
  { key: 'prestador', icon: '🔧', label: 'Prestador de serviço', desc: 'Diarista, cuidador, etc.' },
] as const

const SERVICE_TYPES = ['Diarista', 'Cuidador(a)', 'Babá', 'Personal trainer', 'Enfermeiro(a)', 'Outro']

const ROLE_MAP: Record<string, string> = {
  proprietario: 'proprietario_morador',
  prop_nao_morador: 'proprietario_nao_morador',
  inquilino: 'inquilino',
  dep_proprietario: 'dependente',
  dep_inquilino: 'dependente_inquilino',
}

const TERMO = `TERMO DE CIÊNCIA, CONSENTIMENTO E PROTEÇÃO DE DADOS PESSOAIS
Condomínio Bella Vista

1. Finalidade do tratamento de dados
Os dados pessoais coletados (nome, data de nascimento, CPF, telefone e e-mail) são utilizados exclusivamente para identificação e controle de acesso às dependências do Condomínio Bella Vista, em conformidade com o art. 7º, inciso IX da Lei Federal nº 13.709/2018 — LGPD.

2. Responsável pelo tratamento
O controlador dos dados é a Administração do Condomínio Bella Vista, que se compromete a tratar as informações com sigilo e segurança, vedado o compartilhamento com terceiros sem autorização expressa do titular.

3. Senhas de acesso pessoal
A senha gerada é pessoal, intransferível e de uso exclusivo do titular. É expressamente proibido o repasse a qualquer outra pessoa.

4. Direitos do titular
Nos termos dos arts. 17 a 22 da LGPD, você tem direito a acessar, corrigir ou solicitar a exclusão de seus dados a qualquer momento pelo e-mail: condominiobellavistasbs@gmail.com.

5. Prazo de retenção
Os dados serão mantidos enquanto perdurar o vínculo do titular com o Condomínio Bella Vista e pelo prazo legal aplicável após o encerramento deste vínculo.

6. Disponibilização da senha
A senha de acesso somente será disponibilizada após o recebimento formal deste aceite pela administração do condomínio.`

interface FormData {
  apto: string
  nome: string
  nasc: string
  cpf: string
  telefone: string
  email: string
  // prestador extras
  serviceType: string
  serviceDays: string
}

type Step = 'tipo' | 'termo' | 'dados' | 'sucesso'

export default function MoradorCadastro() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState<Tipo>(null)
  const [step, setStep] = useState<Step>('tipo')
  const [termoAceito, setTermoAceito] = useState(false)
  const [form, setForm] = useState<FormData>({ apto: '', nome: '', nasc: '', cpf: '', telefone: '', email: '', serviceType: 'Diarista', serviceDays: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isPrestador = tipo === 'prestador'

  function handleTipoContinue() {
    if (!tipo) return
    setStep('termo')
  }

  function handleTermoContinue() {
    if (!termoAceito) return
    setStep('dados')
  }

  function set(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.apto.trim() || !form.nome.trim() || !form.email.trim() || !form.telefone.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    if (isDemo) { setStep('sucesso'); return }

    setSubmitting(true)

    const { data: unitData } = await supabase
      .from('units')
      .select('id')
      .eq('number', form.apto.trim())
      .maybeSingle()

    if (!unitData?.id) {
      setError('Apartamento não encontrado. Verifique o número e tente novamente.')
      setSubmitting(false)
      return
    }

    if (isPrestador) {
      const { error: insertErr } = await supabase.from('service_providers').insert({
        unit_id: unitData.id,
        name: form.nome.trim(),
        service_type: form.serviceType,
        days: form.serviceDays.trim() || null,
        phone: form.telefone.trim(),
        email: form.email.trim(),
        lgpd_consent: true,
        status: 'aguardando',
      })
      setSubmitting(false)
      if (insertErr) { setError('Erro ao enviar cadastro: ' + insertErr.message); return }
    } else {
      const { error: insertErr } = await supabase.from('residents').insert({
        unit_id: unitData.id,
        full_name: form.nome.trim(),
        birth_date: form.nasc || null,
        cpf: form.cpf.trim() || null,
        phone: form.telefone.trim(),
        email: form.email.trim(),
        role: ROLE_MAP[tipo!] ?? 'dependente',
        lgpd_consent: true,
        status: 'aguardando',
      })
      setSubmitting(false)
      if (insertErr) { setError('Erro ao enviar cadastro: ' + insertErr.message); return }
    }

    setStep('sucesso')
  }

  if (step === 'sucesso') {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--color-base)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-black text-[var(--color-text-1)] mb-2">Cadastro enviado!</h2>
          <p className="text-sm text-[var(--color-text-3)] leading-relaxed mb-6">
            {isPrestador
              ? 'Seu cadastro foi recebido. Após aprovação da administração, você receberá sua senha de acesso por e-mail.'
              : 'Seu cadastro foi recebido pela administração. Após a aprovação, você receberá sua senha de acesso por e-mail.'}
          </p>
          <div className="rounded-xl p-4 mb-6 text-sm text-left"
            style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)', color: 'var(--color-accent)' }}>
            <div className="font-bold mb-1">📬 Próximos passos</div>
            <ul className="space-y-1 text-xs leading-relaxed">
              <li>• A administração revisará seu cadastro</li>
              <li>• Você receberá a senha de 6 dígitos por e-mail</li>
              <li>• Com a senha em mãos, faça login na sua área</li>
            </ul>
          </div>
          <button onClick={() => navigate('/morador')}
            className="w-full font-bold py-4 rounded-2xl text-white"
            style={{ background: 'var(--color-accent)' }}>
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6" style={{ background: 'var(--color-base)' }}>
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => (step === 'tipo' ? navigate('/morador') : setStep(step === 'dados' ? 'termo' : 'tipo'))}
          className="flex items-center gap-1.5 text-sm font-semibold mb-6"
          style={{ color: 'var(--color-accent)' }}>
          ← Voltar
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 text-xs text-[var(--color-text-3)]">
          {(['tipo', 'termo', 'dados'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: s === step ? 'var(--color-accent)' : (['tipo', 'termo', 'dados'] as Step[]).indexOf(step) > i ? 'var(--color-success)' : 'var(--color-elevated)',
                  color: s === step || (['tipo', 'termo', 'dados'] as Step[]).indexOf(step) > i ? '#fff' : 'var(--color-text-3)',
                }}>
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-px" style={{ background: 'var(--color-border-1)' }} />}
            </div>
          ))}
          <span className="ml-2">{step === 'tipo' ? 'Tipo' : step === 'termo' ? 'Termo' : 'Dados'}</span>
        </div>

        {/* STEP 1: Tipo */}
        {step === 'tipo' && (
          <div>
            <div className="rounded-xl p-3 flex gap-2 mb-5 text-sm"
              style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)', color: 'var(--color-accent)' }}>
              <Shield size={16} className="flex-shrink-0 mt-0.5" />
              Seus dados são protegidos conforme a LGPD — Lei 13.709/2018.
            </div>
            <p className="text-lg font-black text-[var(--color-text-1)] mb-1">Qual é o seu vínculo com o condomínio?</p>
            <p className="text-sm text-[var(--color-text-3)] mb-5">Selecione uma opção para iniciar seu cadastro.</p>

            <div className="space-y-2">
              {TIPOS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTipo(t.key as Tipo)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-colors"
                  style={{
                    border: `2px solid ${tipo === t.key ? 'var(--color-accent)' : 'var(--color-border-1)'}`,
                    background: tipo === t.key ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'var(--color-card)',
                  }}>
                  <span className="text-2xl flex-shrink-0">{t.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[var(--color-text-1)]">{t.label}</div>
                    <div className="text-xs text-[var(--color-text-3)] mt-0.5">{t.desc}</div>
                  </div>
                  {tipo === t.key && <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: 'var(--color-accent)' }} />}
                </button>
              ))}
            </div>

            <button onClick={handleTipoContinue} disabled={!tipo}
              className="w-full mt-5 text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-40"
              style={{ background: 'var(--color-accent)' }}>
              Continuar →
            </button>
          </div>
        )}

        {/* STEP 2: Termo */}
        {step === 'termo' && (
          <div>
            <h2 className="text-lg font-black text-[var(--color-text-1)] mb-4">Termo de ciência</h2>
            <div className="rounded-xl p-4 h-56 overflow-y-auto mb-4 text-xs leading-relaxed whitespace-pre-wrap font-mono"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-3)' }}>
              {TERMO}
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-5 p-3 rounded-xl"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)' }}>
              <input type="checkbox" checked={termoAceito} onChange={e => setTermoAceito(e.target.checked)}
                className="mt-0.5 w-4 h-4 flex-shrink-0" style={{ accentColor: 'var(--color-accent)' }} />
              <span className="text-sm text-[var(--color-text-2)] leading-relaxed">
                Li, estou ciente e concordo com os termos acima, incluindo as disposições da LGPD relativas ao tratamento dos meus dados pessoais
              </span>
            </label>
            <button onClick={handleTermoContinue} disabled={!termoAceito}
              className="w-full text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-40"
              style={{ background: 'var(--color-accent)' }}>
              Continuar →
            </button>
          </div>
        )}

        {/* STEP 3: Dados */}
        {step === 'dados' && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-black text-[var(--color-text-1)] mb-5">
              {isPrestador ? 'Dados do prestador' : 'Seus dados pessoais'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>
                  {isPrestador ? 'Apartamento que atende' : 'Número do apartamento'} <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input type="text" inputMode="numeric" placeholder="Ex: 101"
                  value={form.apto} onChange={e => set('apto', e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }} />
                {isPrestador && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-3)' }}>Informe o apartamento do contratante.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>
                  Nome completo <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input type="text" autoComplete="name" placeholder="Seu nome completo"
                  value={form.nome} onChange={e => set('nome', e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }} />
              </div>

              {isPrestador ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>
                      Tipo de serviço <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <select value={form.serviceType} onChange={e => set('serviceType', e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                      style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }}>
                      {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>
                      Dias de acesso
                    </label>
                    <input type="text" placeholder="Ex: Segunda e Quarta"
                      value={form.serviceDays} onChange={e => set('serviceDays', e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                      style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }} />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>
                      Data de nascimento
                    </label>
                    <input type="date" value={form.nasc} onChange={e => set('nasc', e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                      style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>
                      CPF
                    </label>
                    <input type="text" inputMode="numeric" placeholder="000.000.000-00" maxLength={14}
                      value={form.cpf} onChange={e => set('cpf', e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                      style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>
                  WhatsApp <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input type="tel" inputMode="tel" placeholder="(47) 99999-0000"
                  value={form.telefone} onChange={e => set('telefone', e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-3)' }}>
                  E-mail <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input type="email" autoComplete="email" placeholder="seu@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-1)', color: 'var(--color-text-1)' }} />
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-3)' }}>
                  Você receberá sua senha de acesso neste e-mail após aprovação.
                </p>
              </div>
            </div>

            {error && <p className="mt-4 text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full mt-6 text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-40"
              style={{ background: 'var(--color-accent)' }}>
              {submitting ? 'Enviando...' : 'Enviar cadastro'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
