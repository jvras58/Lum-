# Lum — Sistema de Gerenciamento de Alunos e Avaliações

Aplicação full-stack para gerenciamento de alunos, turmas, metas avaliativas e grade de conceitos (MANA / MPA / MA), com salvamento em lote atômico, histórico de auditoria e consolidação diária de notificações por email.

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript 5 · Drizzle ORM · PostgreSQL 16 · TanStack Query v5 · react-hook-form + Zod · Shadcn UI

---

## Pré-requisitos

| Ferramenta | Versão mínima | Observação |
|---|---|---|
| Node.js | 20 LTS | Exigido pelo Next.js 16 |
| pnpm | 9.x | Gerenciador de pacotes |
| Docker + Docker Compose | qualquer | Banco de dados de dev e teste |
| PostgreSQL client | qualquer | Opcional — para inspecionar o banco diretamente |

> **Windows**: todos os comandos abaixo funcionam no PowerShell, Git Bash ou WSL.

---

## 1. Clonar e instalar dependências

```bash
git clone <url-do-repositorio>
cd Lum@

pnpm install
```

---

## 2. Configurar variáveis de ambiente

Crie o arquivo `.env.local` na raiz do projeto com o conteúdo abaixo:

```dotenv
# Banco de dados (dev)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lum_dev

# Banco de dados (testes de integração)
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lum_test

# Token de autorização do endpoint de cron
# Gere com: openssl rand -hex 32
SECRET_CRON_TOKEN=troque-por-um-token-seguro

# Email — Resend (único provedor suportado)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
```

> **Segurança**: `RESEND_API_KEY` e `SECRET_CRON_TOKEN` são variáveis exclusivamente server-side. Nunca as exponha no código-fonte nem use o prefixo `NEXT_PUBLIC_`.

---

## 2a. Configurar o Resend (provedor de email)

O sistema usa exclusivamente o [Resend](https://resend.com) como provedor de email transacional (plano gratuito: 3 000 emails/mês, 100/dia).

### Passo 1 — Criar conta e gerar API Key

1. Acesse [resend.com](https://resend.com) e crie uma conta.
2. No painel, vá em **API Keys → Create API Key** e copie a chave gerada (começa com `re_`).
3. Adicione ao `.env.local`:

```dotenv
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

### Passo 2 — Escolher o modo de envio

O Resend opera em dois modos dependendo da verificação de domínio:

| Modo | `EMAIL_FROM` | Destinatários permitidos |
|---|---|---|
| **Teste** (sem domínio) | `onboarding@resend.dev` | Apenas o e-mail da sua conta Resend |
| **Produção** (domínio verificado) | `noreply@seudominio.com` | Qualquer destinatário |

#### Modo teste — desenvolvimento imediato

Sem nenhuma configuração adicional, use o domínio compartilhado do Resend:

```dotenv
EMAIL_FROM=onboarding@resend.dev
```

> **Limitação**: neste modo o Resend só entrega emails para o endereço cadastrado na sua conta (ex.: `jonathas@exemplo.com`). Para testar o fluxo completo, cadastre um aluno com esse endereço ou altere temporariamente o email de um aluno existente no banco.

#### Modo produção — domínio verificado

Para enviar para qualquer destinatário é necessário verificar um domínio:

1. No painel do Resend, acesse **Domains → Add Domain** e informe seu domínio.
2. Adicione os registros DNS fornecidos pelo Resend no painel do seu registrador:

| Tipo | Nome | Valor |
|---|---|---|
| `TXT` | `@` ou `resend._domainkey` | Fornecido pelo Resend (SPF/DKIM) |
| `TXT` | `_dmarc` | `v=DMARC1; p=none;` (mínimo recomendado) |

3. Clique em **Verify DNS Records** no painel do Resend (pode levar alguns minutos).
4. Após verificado, atualize o `.env.local`:

```dotenv
# Formato simples
EMAIL_FROM=noreply@seudominio.com

# Formato com nome do remetente (recomendado)
EMAIL_FROM=Lum <noreply@seudominio.com>
```

---

## 3. Subir os bancos de dados com Docker

```bash
# Inicia dev + test em background
docker compose up -d

# Verifica se estão saudáveis
docker compose ps
```

Dois serviços são criados:

| Serviço | Porta | Banco |
|---|---|---|
| `db` | 5432 | `lum_dev` — desenvolvimento |
| `db_test` | 5433 | `lum_test` — testes de integração (in-memory tmpfs) |

Para parar:

```bash
docker compose down
```

Para parar e apagar os volumes (reset completo):

```bash
docker compose down -v
```

---

## 4. Aplicar as migrations

```bash
pnpm db:migrate
```

Isso aplica todos os arquivos em `drizzle/migrations/` ao banco `lum_dev`.

> Para gerar uma nova migration após alterar `src/db/schema.ts`:
> ```bash
> pnpm db:generate   # gera o SQL em drizzle/migrations/
> pnpm db:migrate    # aplica ao banco
> ```

---

## 5. Popular o banco com dados de exemplo (opcional)

```bash
pnpm db:seed
```

O seed cria:
- 3 turmas (anos 2025–2026)
- 10 alunos
- 5 metas avaliativas
- Associações de metas às turmas
- Matrículas de alunos nas turmas

---

## 6. Iniciar o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

| Rota | Descrição |
|---|---|
| `/` | Dashboard com totais operacionais |
| `/alunos` | Listagem e cadastro de alunos |
| `/turmas` | Listagem e cadastro de turmas |
| `/turmas/[id]` | Detalhe da turma: matrículas e metas |
| `/turmas/[id]/avaliacoes` | Grade de avaliações (edição em lote) |
| `/metas` | Catálogo de metas avaliativas |
| `/notificacoes` | Monitor da fila de emails diários |

---

## 7. Rodar os testes

### Testes de componentes (sem banco de dados)

Testam os componentes React (`AlunoForm`, `GradeEditorClient`) com jsdom + mocks das Server Actions.

```bash
pnpm test:components
```

Saída esperada:

```
✓ tests/components/GradeEditorClient.test.tsx (6 tests)
✓ tests/components/AlunoForm.test.tsx (6 tests)

Test Files  2 passed (2)
     Tests  12 passed (12)
```

### Testes de integração (requerem PostgreSQL)

Testam as Server Actions contra um banco PostgreSQL real (sem mocks de banco). O banco de teste é limpo automaticamente entre os testes.

**Pré-requisito**: o container `db_test` precisa estar rodando (`docker compose up -d`).

```bash
pnpm test:integration
```

Os testes cobrem:

| Arquivo | O que testa |
|---|---|
| `avaliacoes.test.ts` | `saveBatchAvaliacoes`: persistência, histórico, rollback atômico, batch multi-célula |
| `consolidacao.test.ts` | `consolidarEmailsDiarios`: criação de resumo, idempotência, multi-turma, flag `processadoEmail` |

> O `vitest.integration.config.ts` define automaticamente `DATABASE_URL` para `TEST_DATABASE_URL` (porta 5433). Não é necessário setar nada manualmente.

### Rodar todos os testes de uma vez

```bash
pnpm test:components && pnpm test:integration
```

---

## 8. Validações antes de merge (quality gates)

```bash
# 1. TypeScript sem erros
pnpm tsc --noEmit

# 2. ESLint sem warnings
pnpm lint

# 3. Testes de componentes
pnpm test:components

# 4. Testes de integração
pnpm test:integration

# 5. Schema em sincronia com as migrations
pnpm drizzle-kit check
```

Todos os cinco comandos devem terminar com código de saída `0` antes do merge.

---

## 9. Inspecionar o banco com Drizzle Studio (opcional)

```bash
pnpm db:studio
```

Abre o Drizzle Studio em [https://local.drizzle.studio](https://local.drizzle.studio) para navegar e editar os dados do banco de dev.

---

## 10. Acionar a consolidação de emails manualmente

### Como funciona a autorização (`SECRET_CRON_TOKEN`)

O endpoint `/api/cron/consolidate-emails` é protegido por um token Bearer estático. A cada requisição o servidor lê o header `Authorization`, extrai o token e o compara com `SECRET_CRON_TOKEN` (variável server-only do `.env.local`). Se o token estiver ausente ou incorreto, o endpoint responde `401 Unauthorized` e não executa nada.

```
Requisição  →  Authorization: Bearer <token>
                       ↓
               token === SECRET_CRON_TOKEN?
               ├── Sim → executa consolidação → 200 { ok: true, ... }
               └── Não → 401 { error: "Unauthorized" }
```

**Gerar um token seguro:**

```bash
# Linux / macOS / Git Bash / WSL
openssl rand -hex 32

# PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copie o valor gerado para `SECRET_CRON_TOKEN` no `.env.local`. Nunca exponha esse token no código-fonte nem em variáveis prefixadas com `NEXT_PUBLIC_`.

---

### Chamar o endpoint em desenvolvimento

```bash
curl -X POST http://localhost:3000/api/cron/consolidate-emails \
  -H "Authorization: Bearer <SECRET_CRON_TOKEN>" \
  -H "Content-Type: application/json"
```

> PowerShell note: use `curl.exe` instead of `curl`, or use the native PowerShell request syntax below.

```powershell
curl.exe -X POST http://localhost:3000/api/cron/consolidate-emails `
  -H "Authorization: Bearer <SECRET_CRON_TOKEN>" `
  -H "Content-Type: application/json"
```

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/cron/consolidate-emails `
  -Headers @{ 
    Authorization = "Bearer <SECRET_CRON_TOKEN>" 
    "Content-Type" = "application/json" 
  }
```

Resposta esperada:

```json
{ "ok": true, "created": 2, "sent": 2, "errors": 0 }
```

Para consolidar uma data específica, adicione o campo `date` no corpo:

```bash
curl -X POST http://localhost:3000/api/cron/consolidate-emails \
  -H "Authorization: Bearer <SECRET_CRON_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-04-20"}'
```

### Agendar com GitHub Actions (exemplo)

Crie `.github/workflows/consolidate-emails.yml` no repositório:

```yaml
name: Consolidar emails diários

on:
  schedule:
    - cron: "0 22 * * *"   # todo dia às 22 h UTC
  workflow_dispatch:        # permite disparo manual pelo painel do GitHub

jobs:
  consolidate:
    runs-on: ubuntu-latest
    steps:
      - name: Chamar endpoint de consolidação
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/consolidate-emails \
            -H "Authorization: Bearer ${{ secrets.SECRET_CRON_TOKEN }}" \
            -H "Content-Type: application/json" \
            --fail
```

Configure dois **Secrets** no repositório (Settings → Secrets → Actions):

| Secret | Valor |
|--------|-------|
| `APP_URL` | URL pública da aplicação, ex.: `https://lum.exemplo.com` |
| `SECRET_CRON_TOKEN` | O mesmo valor definido no `.env.local` / variáveis de ambiente do host |

---

## 11. Adicionar novos componentes Shadcn UI

```bash
npx shadcn@latest add <nome-do-componente>
```

O componente é copiado para `src/components/ui/` e fica sob controle total do projeto.

---

## Estrutura do projeto

```
src/
├── app/                          # Next.js App Router (RSC por padrão)
│   ├── layout.tsx                # Layout raiz (QueryProvider + Toaster)
│   ├── page.tsx                  # Dashboard
│   ├── alunos/                   # CRUD de alunos
│   ├── turmas/                   # CRUD de turmas + grade de avaliações
│   ├── metas/                    # Catálogo de metas
│   ├── notificacoes/             # Monitor de envios
│   └── api/cron/                 # Route Handler para trigger externo
│
├── actions/                      # Server Actions ("use server")
│   ├── alunos.ts
│   ├── turmas.ts
│   ├── metas.ts
│   ├── matriculas.ts
│   ├── avaliacoes.ts             # saveBatchAvaliacoes (core)
│   └── notificacoes.ts
│
├── components/
│   ├── ui/                       # Primitivos Shadcn UI
│   ├── alunos/AlunoForm.tsx
│   ├── turmas/TurmaMetasManager.tsx
│   ├── avaliacoes/GradeEditorClient.tsx
│   └── notificacoes/NotificacoesTable.tsx
│
├── db/
│   ├── index.ts                  # Singleton db (server-only)
│   └── schema.ts                 # 9 tabelas Drizzle + tipos inferidos
│
└── lib/
    ├── consolidacao.ts           # Lógica de consolidação de emails
    ├── email.ts                  # Abstração de envio de emails
    ├── schemas/                  # Schemas Zod compartilhados
    └── types.ts                  # ActionResult<T> + enums

tests/
├── integration/
│   ├── setup.ts                  # Limpeza de banco entre testes
│   ├── helpers.ts                # Funções seed (seedAluno, seedTurma…)
│   └── actions/
│       ├── avaliacoes.test.ts
│       └── consolidacao.test.ts
└── components/
    ├── setup.ts                  # @testing-library/jest-dom
    ├── AlunoForm.test.tsx
    └── GradeEditorClient.test.tsx

drizzle/
├── drizzle.config.ts
├── migrations/                   # SQL gerado pelo drizzle-kit
└── seed.ts                       # Script de dados de exemplo
```

---

## Solução de problemas

### `DATABASE_URL` não encontrado ao rodar migrations

Certifique-se de que `.env.local` existe e contém `DATABASE_URL`. O `drizzle-kit` lê esse arquivo automaticamente no Next.js.

### Porta 5432 já em uso

Altere a porta no `docker-compose.yml` e atualize `DATABASE_URL` no `.env.local`:

```yaml
ports:
  - "5434:5432"   # use 5434 localmente
```

### Testes de integração falham com "connection refused"

O container `db_test` precisa estar rodando na porta 5433:

```bash
docker compose up -d db_test
docker compose ps   # verifique se o status é "healthy"
```

### `pnpm lint` falha com "Invalid project directory"

O `@` no nome da pasta `Lum@` pode causar problemas com alguns terminais. Use aspas ao navegar:

```bash
cd "C:\Users\seu-usuario\Desktop\Lum@"
```

### Erro Resend: "You can only send testing emails to your own email address"

O Resend bloqueia envios para destinatários externos quando não há domínio verificado. Soluções:

**Desenvolvimento**: altere o email do aluno no banco para o endereço da sua conta Resend:

```sql
UPDATE alunos SET email = 'seu@email.com' WHERE id = <id>;
```

**Produção**: verifique um domínio em [resend.com/domains](https://resend.com/domains) e troque `EMAIL_FROM` para `noreply@seudominio.com` no `.env.local`. Veja a seção [2a](#2a-configurar-o-resend-provedor-de-email) para o passo a passo completo.

---

### Erro `server-only` fora do servidor

Significa que um módulo server-only está sendo importado em um Client Component. Verifique se o componente está marcado com `"use client"` e se não importa diretamente de `src/db/` ou `src/actions/`.
