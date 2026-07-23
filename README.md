# 🏢 Condomínio Bella Vista — Sistema de Gestão de Acesso

Sistema completo de cadastramento de moradores, controle de acesso, reservas de salão e gestão administrativa do Condomínio Bella Vista.

---

## 📱 Links do Sistema

| Ambiente | URL | Descrição |
|---|---|---|
| App público | `cadastrobellavista.netlify.app` | Cadastro de moradores |
| Painel admin | `condominiobellavista.github.io/painel-admin/` | Gestão administrativa |

---

## 🔐 Acessos

### Painel Administrativo
| Perfil | Senha | Permissões |
|---|---|---|
| Administrador | `BellaVista@2024` | Acesso total |
| Zeladora | `zelad2026` | Aprovar cadastros, reservas e relatórios — não vê senhas/CPF |

### App do Morador
O morador acessa a área pessoal com a **senha de 6 dígitos** recebida por e-mail após aprovação do cadastro.

---

## 🏗️ Arquitetura do Sistema

```
App Público (Netlify)          Painel Admin (GitHub Pages)
        │                               │
        └──────────┬────────────────────┘
                   │
         Google Apps Script (API)
                   │
         Google Sheets (Banco de dados)
                   │
         ┌─────────┴──────────┐
         │   Abas da planilha  │
         ├────────────────────┤
         │ Moradores           │
         │ Veículos            │
         │ Prestadores         │
         │ Reservas            │
         │ Unidades            │
         └────────────────────┘
```

---

## 📋 Tipos de Cadastro

| Tipo | Descrição | Recebe senha |
|---|---|---|
| Proprietário (morador) | Dono e residente do apto | ✅ Sim |
| Proprietário (não morador) | Dono que não reside — locador | ✅ Sim (acesso eventual) |
| Inquilino | Locatário responsável pelo apto | ✅ Sim |
| Dependente | Familiar/morador do apto | ✅ Sim |
| Prestador | Diarista, cuidador, babá etc. | ✅ Sim (temporária) |

---

## 🏠 Estrutura do Condomínio

**35 apartamentos fixos** distribuídos em 5 andares:

| Andar | Apartamentos |
|---|---|
| 1º | 101, 102, 103, 104, 105, 106, 107 |
| 2º | 201, 202, 203, 204, 205, 206, 207 |
| 3º | 301, 302, 303, 304, 305, 306, 307 |
| 4º | 401, 402, 403, 404, 405, 406, 407 |
| 5º | 501, 502, 503, 504, 505, 506, 507 |

---

## 🎉 Salões de Festas

| Salão | Localização | Taxa |
|---|---|---|
| Salão Piso Inferior | Térreo | R$ 50,00 |
| Salão Piso Superior | Cobertura | R$ 50,00 |

**Regras:**
- 1ª reserva do ano → pode solicitar isenção (sujeita à aprovação da administração)
- Cancelamento → mínimo 2 dias de antecedência
- Pagamento → cobrado no boleto do mês

---

## 🔄 Fluxo de Cadastro

```
1. Morador acessa o app público
2. Preenche o formulário (aceita termo LGPD)
3. Dados chegam na planilha Google Sheets
4. Admin recebe e-mail de notificação
5. Admin aprova no painel → morador recebe senha por e-mail
6. Morador acessa "Minha área" com a senha
7. Morador pode editar dados, veículos, dependentes e fazer reservas
```

---

## 📊 Painel Administrativo — Abas

| Aba | Função |
|---|---|
| 👤 Moradores | Lista completa com aprovação, edição e exclusão |
| 🚙 Veículos | Cadastro de veículos por apartamento |
| ✏️ Prestadores | Diaristas, cuidadores e outros com horários |
| 🏢 Prédio | Mapa visual com situação de cada apartamento |
| 🎉 Reservas | Gestão de reservas dos salões + isenções |

---

## 📧 Relatório Mensal

O admin gera o relatório de uso dos salões pelo botão **📧 Relatório** na aba Reservas.
O e-mail é enviado para `condominiobellavistasbs@gmail.com` com:
- Resumo: total de reservas, cobranças e isenções
- Detalhamento por apartamento: salão, data, taxa e instrução de cobrança

---

## 🔒 Segurança (LGPD — Lei 13.709/2018)

- Dados coletados exclusivamente para controle de acesso
- Senhas armazenadas em hash — não expostas em texto puro
- Timeout de sessão automático após 30 minutos de inatividade
- Bloqueio após 5 tentativas de login incorretas
- Validação e sanitização de todos os inputs
- Acesso ao painel restrito por senha com dois níveis de permissão
- Dados acessíveis somente pela administração do condomínio

---

## ⚙️ Manutenção

### Atualizar o painel admin
1. Baixe o arquivo `bella_vista_admin_v3.html`
2. Acesse o repositório GitHub `painel-admin`
3. Clique em **Add file → Upload files**
4. Arraste o arquivo e clique em **Commit changes**

### Atualizar o app do morador
1. Baixe o arquivo `bella_vista_app.html`
2. Acesse o Netlify → site `cadastrobellavista`
3. Vá em **Deploys** e arraste o arquivo

### Atualizar o Apps Script
1. Abra a planilha Google Sheets
2. Extensões → Apps Script
3. Cole o conteúdo do arquivo `.gs` → Salva
4. Implantar → Gerenciar implantações → Nova versão → Implantar

---

## 📞 Contato Administração

**E-mail:** condominiobellavistasbs@gmail.com  
**Planilha de dados:** [Google Sheets](https://docs.google.com/spreadsheets/d/13JaiVM3HkYcv8RTSdfdz0MFe7rwY49St6KzbbY4HQbM/edit)

---

*Sistema desenvolvido para o Condomínio Bella Vista — 2024/2025*
