# 🔐 Condomínio Bella Vista — Painel Administrativo

**URL:** https://condominiobellavista.github.io/painel-admin/

Painel de administração do Condomínio Bella Vista. Acesso restrito à administração e zeladoria.

---

## 🔑 Acessos

| Perfil | Permissões |
|--------|-----------|
| Administrador | Acesso total — vê CPF, e-mail, senhas e todas as abas |
| Zeladora | Aprovar cadastros, reservas e relatórios — não vê CPF, e-mail nem senhas |

*(Senhas fornecidas pela administração)*

---

## 📋 Abas do Painel

### 🗓️ Calendário (tela inicial)
- Visão mensal com todas as reservas de salão e mudanças agendadas
- Dias com eventos destacados por cor:
  - 🟢 Verde — Reserva de Salão
  - 🟣 Roxo — Mudança agendada
  - 🟡 Âmbar — Aguardando aprovação
- Clicar no dia exibe detalhes e ações (confirmar/negar)
- Filtros: Todos | Salão | Mudanças | Aguardando
- Alerta vermelho ⚡ quando há pendências

### 👤 Moradores
- Lista completa com busca e filtro por status/vínculo
- Vínculos: Proprietário Morador, Proprietário Não Morador, Inquilino, Dependente, Dependente (Inquilino), Prestador, Zeladoria
- Aprovar cadastro e enviar senha por e-mail
- Editar: nome, vínculo, nascimento, CPF, telefone, e-mail, status, obs.
- Editar senha (somente admin) — 6 dígitos
- Exportar CSV

### 🚗 Veículos
- Lista de veículos cadastrados por apartamento
- Editar e excluir registros

### 🔧 Prestadores
- Prestadores de serviço das unidades particulares
- Dropdown de tipo: Diarista, Cuidador(a), Babá, Enfermeiro(a), Jardineiro(a), Zelador(a), Leiturista, Outro
- Editar dados e senha de acesso

### 🏢 Zeladoria
- Colaboradores do condomínio (unidade 100)
- Zeladora, jardineiro, leiturista etc.
- Aprovar, editar e excluir registros

### 🏗️ Prédio
- Mapa visual dos 35 apartamentos + unidade 100 (Zeladoria)
- Cores por situação: 🟢 Próprio | 🟡 Alugado | 🟣 Prop. não morador | 🔴 Pendente | ⬜ Vago | ⬛ Zeladoria
- Clicar no apartamento abre detalhes dos moradores
- Clique na unidade 100 abre aba Zeladoria

---

## 🏗️ Estrutura do Condomínio
- **35 apartamentos:** 101–107, 201–207, 301–307, 401–407, 501–507
- **Unidade 100:** Zeladoria

---

## ⚡ Alertas de Pendências
O painel exibe alertas automáticos quando há:
- Cadastros aguardando aprovação
- Mudanças aguardando confirmação

---

## 🔒 Segurança
- Senha com hash djb2 + base64 (nunca em texto puro)
- Timeout de sessão: 30 minutos
- Rate limiting: bloqueio após 5 tentativas incorretas
- Dois níveis de acesso (Admin / Zeladora)

---

## 📄 Documentos
- [Regimento Interno](./regimento_bella_vista.pdf)
- [Manual de Acesso MIP-1000 IP](./manual_acesso_bella_vista.pdf)

---

## 🛠️ Tecnologia
- HTML5 / CSS3 / JavaScript puro
- Backend: Google Apps Script + Google Sheets
- Hospedagem: GitHub Pages (gratuito, sem prazo)
- Versão atual: v4.28
- Desenvolvido por Jeferson Wedderhoff com Claude (Anthropic) — Julho/2026
