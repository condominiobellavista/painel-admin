import { useNavigate } from 'react-router-dom'

export default function MoradorAjuda() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-base)] px-4 py-6">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/morador')}
          className="flex items-center gap-1.5 text-[var(--color-accent)] text-sm font-semibold mb-6"
        >
          ← Voltar ao início
        </button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏢</div>
          <h2 className="text-xl font-black text-[var(--color-text-1)]">Bem-vindo ao Bella Vista!</h2>
          <p className="text-sm text-[var(--color-text-3)] mt-1.5 leading-relaxed">
            Aqui você encontra tudo que precisa para começar no condomínio.
          </p>
        </div>

        {/* Manual de Acesso */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-5 mb-4">
          <div className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-accent)] mb-4">
            📖 Manual de Acesso
          </div>

          <div className="bg-[var(--color-accent-light)] rounded-xl p-3 mb-4 text-sm text-[var(--color-accent)] leading-relaxed">
            Sistema de controle de acesso <strong>MIP 1000 IP — Intelbras</strong><br />
            Cada unidade recebe <strong>2 TAGs</strong> e <strong>2 controles remotos</strong>
          </div>

          <div className="space-y-4 text-sm text-[var(--color-text-2)] leading-relaxed">
            <div>
              <div className="font-bold text-[var(--color-text-1)] mb-1">🏷️ TAG de acesso</div>
              Aproxime a TAG da controladora junto às portas do condomínio para abrir. As TAGs são pessoais — comunique imediatamente qualquer perda ou extravio.
            </div>

            <div>
              <div className="font-bold text-[var(--color-text-1)] mb-1">🔢 Senha pessoal (6 dígitos)</div>
              Para acessar as portas, pressione:
              <code className="block bg-[var(--color-elevated)] rounded-lg px-3 py-2 mt-2 text-xs font-mono text-[var(--color-text-1)]">
                SENHA + nº2 + sua senha de 6 dígitos
              </code>
            </div>

            <div>
              <div className="font-bold text-[var(--color-text-1)] mb-1">🚗 Controle do portão</div>
              Cada controle é vinculado a um veículo específico.
              <div className="bg-[var(--color-elevated)] rounded-xl p-3 mt-2 space-y-1 text-xs">
                <div>🅐 Portão garagem da <strong>frente</strong></div>
                <div>🅑 Portão garagem dos <strong>fundos</strong></div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-[var(--color-warning-light)] border border-[var(--color-warning)]/30 rounded-xl p-3 text-xs text-[var(--color-warning)] leading-relaxed">
            ⚠️ <strong>Inquilinos:</strong> TAGs e controles devem ser devolvidos aos proprietários/imobiliárias ao fim da locação.
          </div>

          <a
            href="https://condominiobellavista.github.io/painel-admin/manual_acesso_bella_vista.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 bg-[var(--color-accent)] text-white font-bold py-3 rounded-xl text-sm"
          >
            📥 Baixar Manual Completo (PDF)
          </a>
        </div>

        {/* Documentos */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-5 mb-4">
          <div className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-accent)] mb-4">
            📋 Documentos do Condomínio
          </div>
          <div className="space-y-2">
            <a
              href="https://condominiobellavista.github.io/painel-admin/regimento_bella_vista.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-[var(--color-elevated)] rounded-xl hover:bg-[var(--color-card-hover)] transition-colors"
            >
              <span className="text-2xl">📜</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-[var(--color-text-1)]">Regimento Interno</div>
                <div className="text-xs text-[var(--color-text-3)] mt-0.5">Regras e normas do condomínio</div>
              </div>
              <span className="text-[var(--color-accent)]">↗</span>
            </a>
            <a
              href="https://condominiobellavista.github.io/painel-admin/manual_acesso_bella_vista.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-[var(--color-elevated)] rounded-xl hover:bg-[var(--color-card-hover)] transition-colors"
            >
              <span className="text-2xl">🔐</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-[var(--color-text-1)]">Manual do Sistema de Acesso</div>
                <div className="text-xs text-[var(--color-text-3)] mt-0.5">TAGs, senhas e controles remotos</div>
              </div>
              <span className="text-[var(--color-accent)]">↗</span>
            </a>
          </div>
        </div>

        {/* Info importantes */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border-1)] rounded-2xl p-5 mb-4">
          <div className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-accent)] mb-4">
            ⚠️ Informações importantes
          </div>
          <ul className="text-sm text-[var(--color-text-2)] leading-loose list-disc pl-4 space-y-0.5">
            <li>Cada unidade recebe <strong className="text-[var(--color-text-1)]">2 TAGs</strong> e <strong className="text-[var(--color-text-1)]">2 controles remotos</strong></li>
            <li>TAGs e controles são <strong className="text-[var(--color-text-1)]">pessoais e intransferíveis</strong></li>
            <li>Perda ou extravio: comunique o condomínio <strong className="text-[var(--color-text-1)]">imediatamente</strong></li>
            <li>Prestadores: acesso com prazo e horário — responsabilidade do morador</li>
            <li>Incluir/excluir membros: solicite por e-mail ao condomínio</li>
            <li>Inquilinos: devolver TAGs e controles ao proprietário ao sair</li>
            <li>Mudanças: seg a sex · 07:30–11:30 ou 13:00–16:30 · Sáb, dom e feriados proibidos</li>
          </ul>
        </div>

        {/* Contato */}
        <div className="bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 rounded-2xl p-5 mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-accent)] mb-3">
            📬 Contato da Administração
          </div>
          <a
            href="mailto:condominiobellavistasbs@gmail.com"
            className="flex items-center gap-2 text-[var(--color-accent)] font-semibold text-sm"
          >
            ✉️ condominiobellavistasbs@gmail.com
          </a>
          <p className="text-xs text-[var(--color-text-3)] mt-2 leading-relaxed">
            Para dúvidas, solicitações de acesso, inclusão/exclusão de membros ou extravio de equipamentos.
          </p>
        </div>

        <button
          onClick={() => navigate('/morador')}
          className="w-full border border-[var(--color-border-2)] text-[var(--color-text-2)] font-semibold py-3 rounded-xl hover:bg-[var(--color-card)] transition-colors"
        >
          ← Voltar ao início
        </button>
      </div>
    </div>
  )
}
