# Bella Vista Admin — CLAUDE.md

Painel administrativo do Condomínio Edifício Bella Vista (São Bento do Sul/SC).

## Instruções permanentes

- **SQL externo**: sempre que uma mudança exigir rodar SQL no Supabase (SQL Editor),
  cole o SQL completo na resposta do chat, pronto para copiar e colar.
- **App legado**: os arquivos do app antigo (HTML monolito + Apps Script) estão em
  `legacy/`. Não mexer neles — o app antigo continua rodando em paralelo até a
  migração definitiva.

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Estilo**: TailwindCSS 4 (via `@tailwindcss/vite`), tema dark "Obsidian"
- **Roteamento**: react-router-dom 7
- **Ícones**: lucide-react
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Deploy**: Vercel (`vercel.json` presente)

## Estrutura de pastas

```
legacy/              App antigo (HTML monolito) — não tocar
supabase/
  schema.sql         DDL completo do banco
src/
  components/
    layout/          AdminLayout (sidebar + outlet)
  context/
    AuthContext.tsx   Sessão do Supabase Auth (+ modo demo)
  lib/
    supabase.ts      Cliente Supabase (modo demo se sem .env)
    utils.ts         cn(), formatPhone(), whatsappUrl()
  pages/
    Login.tsx
    admin/           Dashboard, Moradores, Veículos, Prestadores,
                     Unidades, Reservas, Financeiro, Zeladoria, Mudanças
  types/
    index.ts         Interfaces TypeScript
```

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

Sem essas variáveis, o app roda em **modo demo** (AuthContext faz login fake).

## Schema do banco (resumo)

| Tabela | Função |
|---|---|
| `user_profiles` | Perfis de acesso (admin, síndico, conselho, morador) |
| `units` | Unidades/apartamentos + inadimplência/bloqueio |
| `residents` | Moradores com vínculo, senha de acesso, LGPD |
| `vehicles` | Veículos por unidade |
| `service_providers` | Prestadores (diaristas etc.) por unidade |
| `building_staff` | Funcionários do prédio (zelador, jardineiro) |
| `reservations` | Reservas do salão de festas |
| `move_requests` | Agendamento de mudanças |

RLS ativado em todas as tabelas. Admin acessa tudo via `is_admin()`.

## Branch padrão

`main` — PRs direto para `main` neste estágio.
