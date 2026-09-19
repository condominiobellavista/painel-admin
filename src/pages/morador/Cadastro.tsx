import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isDemo } from '@/lib/supabase'
import { Shield } from 'lucide-react'

type Tipo = 'proprietario' | 'prop_nao_morador' | 'inquilino' | 'dep_proprietario' | 'dep_inquilino' | 'prestador' | 'zeladoria' | null

const TIPOS = [
  { key: 'proprietario', icon: '🏠', label: 'Proprietário', desc: 'Morador no apartamento', role: 'proprietario_morador' },
  { key: 'prop_nao_morador', icon: '🏘️', label: 'Proprietário', desc: 'Não morador (locador)', role: 'proprietario_nao_morador' },
  { key: 'inquilino', icon: '🔑', label: 'Inquilino', desc: 'Locatário', role: 'inquilino' },
  { key: 'dep_proprietario', icon: '👨‍👩‍👧', label: 'Dependente', desc: 'Familiar do proprietário', role: 'dependente' },
  { key: 'dep_inquilino', icon: '👨‍👩‍👦', label: 'Dependente', desc: 'Familiar do inquilino', role: 'dependente_inquilino' },
] as const

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
}

type Step = 'tipo' | 'termo' | 'dados' | 'sucesso'

export default function MoradorCadastro() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState<Tipo>(null)
  const [step, setStep] = useState<Step>('tipo')
  const [termoAceito, setTermoAceito] = useState(false)
  const [form, setForm] = useState<FormData>({ apto: '', nome: '', nasc: '', cpf: '', telefone: '', email: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      setError('Preencha todos os campos obrigatórios')
      return
    }

    if (isDemo) {
      setStep('sucesso')
      return
    }

    setSubmitting(true)
    // Find or create unit
    const { data: unitData } = await supabase
      .from('units')
      .select('id')
      .eq('number', form.apto.trim())
      .maybeSingle()

    const unitId = unitData?.id

    if (!unitId) {
      setError('Apartamento não encontrado. Verifique o número e tente novamente.')
      setSubmitting(false)
      return
    }

    const roleMap: Record<string, string> = {
      proprietario: 'proprietario_morador',
      prop_nao_morador: 'proprietario_nao_morador',
      inquilino: 'inquilino',
      dep_proprietario: 'dependente',
      dep_inquilino: 'dependente_inquilino',
    }

    const { error: insertErr } = await supabase.from('residents').insert({
      unit_id: unitId,
      full_name: form.nome.trim(),
      birth_date: form.nasc || null,
      cpf: form.cpf.trim() || null,
      phone: form.telefone.trim(),
      email: form.email.trim(),
      role: roleMap[tipo!] ?? 'dependente',
      lgpd_consent: true,
      status: 'aguardando',
    })

    setSubmitting(false)
    if (insertErr) {
      setError('Erro ao enviar cadastro: ' + insertErr.message)
      return
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
            Seu cadastro foi recebido pela administração do condomínio. Após a aprovação, você receberá sua senha de acesso por e-mail.
          </p>
          <div className="bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 rounded-xl p-4 mb-6 text-sm text-[var(--color-accent)] text-left">
            <div className="font-bold mb-1">📬 Próximos passos</div>
            <ul className="space-y-1 text-xs leading-relaxed">
              <li>• A administração revisará seu cadastro</li>
              <li>• Você receberá a senha de 6 dígitos por e-mail</li>
              <li>• Com a senha em mãos, faça login na sua área</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/morador')}
            className="w-full bg-[var(--color-accent)] text-white font-bold py-4 rounded-2xl"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-base)] px-4 py-6">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => (step === 'tipo' ? navigate('/morador') : setStep(step === 'dados' ? 'termo' : 'tipo'))}
          className="flex items-center gap-1.5 text-[var(--color-accent)] text-sm font-semibold mb-6"
        >
          ← Voltar
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 text-xs text-[var(--color-text-3)]">
          {['tipo', 'termo', 'dados'].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                s === step ? 'bg-[var(--color-accent)] text-white' :
                ['tipo', 'termo', 'dados'].indexOf(step) > i ? 'bg-[var(--color-success)] text-white' :
                'bg-[var(--color-elevated)] text-[var(--color-text-3)]'
              }`}>{i + 1}</div>
              {i < 2 && <div className="w-8 h-px bg-[var(--color-border-1)]" />}
            </div>
          ))}
          <span className="ml-2">
            {step === 'tipo' ? 'Tipo' : step === 'termo' ? 'Termo' : 'Dados'}
          </span>
        </div>

        {/* STEP 1: Tipo */}
        {step === 'tipo' && (
          <div>
            <div className="bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 rounded-xl p-3 flex gap-2 mb-5 text-sm text-[var(--color-accent)]">
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
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors text-left ${
                    tipo === t.key
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                      : 'border-[var(--color-border-1)] bg-[var(--color-card)] hover:border-[var(--color-border-2)]'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{t.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-[var(--color-text-1)]">{t.label}</div>
                    <div className="text-xs text-[var(--color-text-3)] mt-0.5">{t.desc}</div>
                  </div>
                  {tipo === t.key && <div className="ml-auto w-4 h-4 rounded-full bg-[var(--color-accent)] flex-shrink-0" />}
                </button>
              ))}
            </div>

            <button
              onClick={handleTipoContinue}
              disabled={!tipo}
              className="w-full mt-5 bg-[var(--color-accent)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* STEP 2: Termo */}
        {step === 'termo' && (
          <div>
            <h2 className="text-lg font-black text-[var(--color-text-1)] mb-4">Termo de ciência</h2>
            <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-xl p-4 h-56 overflow-y-auto mb-4 text-xs text-[var(--color-text-3)] leading-relaxed whitespace-pre-wrap font-mono">
              {TERMO}
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-5 p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border-1)]">
              <input
                type="checkbox"
                checked={termoAceito}
                onChange={e => setTermoAceito(e.target.checked)}
                className="mt-0.5 accent-[var(--color-accent)] w-4 h-4 flex-shrink-0"
              />
              <span className="text-sm text-[var(--color-text-2)] leading-relaxed">
                Li, estou ciente e concordo com os termos acima, incluindo as disposições da LGPD relativas ao tratamento dos meus dados pessoais
              </span>
            </label>
            <button
              onClick={handleTermoContinue}
              disabled={!termoAceito}
              className="w-full bg-[var(--color-accent)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* STEP 3: Dados */}
        {step === 'dados' && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-black text-[var(--color-text-1)] mb-5">Seus dados pessoais</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-3)] mb-1.5 uppercase tracking-wider">
                  Número do apartamento <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 101"
                  value={form.apto}
                  onChange={e => set('apto', e.target.value)}
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border-1)] focus:border-[var(--color-accent)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-3)] mb-1.5 uppercase tracking-wider">
                  Nome completo <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border-1)] focus:border-[var(--color-accent)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-3)] mb-1.5 uppercase tracking-wider">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    value={form.nasc}
                    onChange={e => set('nasc', e.target.value)}
                    className="w-full bg-[var(--color-card)] border border-[var(--color-border-1)] focus:border-[var(--color-accent)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-1)] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-3)] mb-1.5 uppercase tracking-wider">
                    CPF
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={form.cpf}
                    onChange={e => set('cpf', e.target.value)}
                    className="w-full bg-[var(--color-card)] border border-[var(--color-border-1)] focus:border-[var(--color-accent)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-3)] mb-1.5 uppercase tracking-wider">
                  WhatsApp <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="(47) 99999-0000"
                  value={form.telefone}
                  onChange={e => set('telefone', e.target.value)}
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border-1)] focus:border-[var(--color-accent)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-3)] mb-1.5 uppercase tracking-wider">
                  E-mail <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border-1)] focus:border-[var(--color-accent)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-1)] placeholder:text-[var(--color-text-3)] outline-none transition-colors"
                />
                <p className="text-xs text-[var(--color-text-3)] mt-1.5">
                  Você receberá sua senha de acesso neste e-mail após aprovação.
                </p>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 bg-[var(--color-accent)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors"
            >
              {submitting ? 'Enviando...' : 'Enviar cadastro'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
