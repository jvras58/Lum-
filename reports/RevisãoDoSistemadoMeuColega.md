# Revisão do Sistema — Lum

## Contexto da revisão

Esta revisão foi feita com foco em:
- analisar se o sistema implementa as funcionalidades solicitadas no trabalho;
- avaliar a qualidade técnica do código, dos testes e da arquitetura;
- refletir sobre o uso do agente (Claude Code) no processo de desenvolvimento e comparar com a experiência observada em outros projetos da disciplina.

---

## 1) O sistema está funcionando com as funcionalidades solicitadas?

De forma geral, **sim**.

Evidências práticas observadas:

- `pnpm install && pnpm db:migrate && pnpm dev` sobe a aplicação sem erro crítico em `http://localhost:3000`;
- CRUD completo de **alunos** funciona: criação com validação de CPF (11 dígitos, único), edição, listagem com filtro por nome/CPF e controle de status ativo/inativo;
- CRUD completo de **turmas** funciona: criação com unicidade de `(tópico, ano, semestre)`, detalhe com alunos matriculados e metas associadas;
- **Matrículas** funcionam: associar e desassociar alunos de turmas, com bloqueio de duplicidade;
- **Metas avaliativas** funcionam: catálogo com código único, associação ordenada a turmas;
- **Grade de avaliações** funciona: células MANA/MPA/MA editáveis, salvamento em lote atômico (Drizzle transaction), registro de histórico com valor anterior e posterior;
- **Consolidação de emails** funciona: endpoint `/api/cron/consolidate-emails` gera resumos diários por aluno de forma idempotente, atualiza status `PENDENTE → ENVIADO/ERRO`;
- **Monitor de notificações** funciona: listagem filtrada por status com cancelamento individual;
- **Modo escuro/claro** funciona via `next-themes` com persistência de preferência.

Conclusão funcional: todos os pilares exigidos pelo trabalho estão implementados — gestão de alunos, turmas, metas, grade de conceitos, histórico de auditoria e notificação diária em lote com garantia de idempotência.

---

## 2) Quais os problemas de qualidade do código e dos testes?

### Pontos positivos

- **TypeScript strict** em todo o projeto: `strict: true`, sem `any` não justificado, tipagem inferida via Drizzle (`$inferSelect`) e Zod;
- **Server Actions** como única camada de mutação: sem rotas REST desnecessárias, boundary seguro entre cliente e servidor reforçado por `"server-only"`;
- **Testes de integração com banco real**: Vitest + PostgreSQL de teste real (sem mocks de DB), com rollback por transação entre testes — garante fidelidade ao comportamento de produção;
- **Idempotência via constraint de banco**: `UNIQUE (aluno_id, data_referencia)` + `onConflictDoNothing` garante no máximo um email por aluno por dia mesmo sob execução concorrente;
- **Zod em ambas as fronteiras**: schemas compartilhados validam tanto no cliente (react-hook-form) quanto no servidor (Server Action);
- **Drizzle migrations rastreadas**: `drizzle-kit generate/migrate` gera SQL versionado, sem migrations manuais;
- **Design system coeso**: paleta tech-blue com variáveis CSS (`--primary`, `--muted`…), dark mode via CSS class, badges semânticos com pares de dark mode;
- **Padrão de retorno uniforme**: `ActionResult<T> = { success: true, data } | { success: false, error }` em todas as Server Actions elimina tratamento de exceção inconsistente no cliente.

### Pontos de atenção

- **Autenticação ausente**: `assertAuthenticated()` é um placeholder sem lógica real — qualquer usuário pode acessar todas as rotas e executar mutations. Aceitável para v1 do trabalho, mas seria o primeiro item a resolver antes de um deploy real;
- **Sem fallback de email para desenvolvimento**: após a migração Nodemailer → Resend, o modo console (`ConsoleProvider`) foi removido. Em dev sem uma `RESEND_API_KEY` válida, o envio simplesmente falha em vez de logar no terminal;
- **Rotas tipadas requerem `as const`**: o `typedRoutes: true` do Next.js 16 exigiu workarounds com `as const` nas arrays de navegação — funciona, mas aumenta a fricção ao adicionar novas rotas;
- **Filtros de alunos/notificações em memória**: a página de notificações filtra os 200 registros retornados em JavaScript em vez de delegar ao banco com `WHERE` — aceitável com volume pequeno, mas não escala;
- **Ausência de paginação nas listagens**: todas as telas carregam todos os registros de uma vez; com 10k registros (limite declarado no spec) a performance pode degradar sem índices e paginação adequados.

---

## 3) Como a funcionalidade e a qualidade desse sistema pode ser comparada com as do outro sistema revisado?

Comparando o Lum com o sistema revisado (Node.js + Express + Docker + Selenium + Cucumber):

**Funcionalidade:** ambos cobrem o escopo central do trabalho (alunos, turmas, avaliações, email). O sistema revisado entrega via API REST + frontend separado; o Lum usa uma abordagem monolítica com Next.js App Router e Server Actions, que elimina a camada de API para mutations e simplifica a consistência de dados.

**Qualidade técnica:** o Lum apresenta validação mais rigorosa (TypeScript strict + Zod em ambas as fronteiras, migrations rastreadas, idempotência via constraint de banco). O sistema revisado tem como vantagem a separação explícita de camadas e o uso de Cucumber/Gherkin para especificação executável dos cenários de negócio — abordagem que facilita validação por stakeholders não-técnicos.

**Cobertura de testes:** o sistema revisado usa supertest + Cucumber para validação de API; o Lum usa Vitest + banco PostgreSQL real para integração e @testing-library/react para componentes. A escolha do Lum favorece fidelidade ao comportamento de produção; a do sistema revisado favorece legibilidade dos cenários de negócio.

**Maturidade de entrega:** ambos são consistentes para o escopo proposto. O sistema revisado demonstra bom uso de Docker para portabilidade; o Lum demonstra melhor coerência arquitetural interna e experiência de usuário mais elaborada.

Em resumo: sistemas funcionalmente equivalentes para o trabalho, com escolhas técnicas distintas e cada um com vantagens na sua abordagem.

---

## Revisão do histórico de desenvolvimento

Baseado no histórico de interações com o agente (Claude Code) ao longo do desenvolvimento do Lum:

### 1. Estratégias de interação utilizadas

- **Planejamento guiado por spec**: uso das ferramentas `/speckit-specify`, `/speckit-plan` e `/speckit-tasks` para gerar `spec.md`, `plan.md` e `data-model.md` antes de escrever código — o agente nunca iniciou implementação sem artefato de design aprovado;
- **Prompts progressivos por camada**: scaffold do projeto → schema Drizzle → Server Actions → componentes → UI/UX — cada etapa só avançou após TypeScript zerado;
- **Prompts de correção cirúrgica**: quando surgiram erros (TypeScript `typedRoutes`, migração Nodemailer → Resend), os prompts foram específicos com o erro exato e o comportamento esperado;
- **Checkpoint de qualidade embutido**: ao final de cada sessão relevante, `pnpm tsc --noEmit` foi executado para garantir zero erros antes de commitar.

### 2. Situações em que o agente funcionou melhor ou pior

**Melhor:**
- geração do schema Drizzle com todos os relacionamentos e constraints de negócio a partir do `data-model.md`;
- refatoração completa da camada de email (Nodemailer → Resend) com atualização consistente de docs, specs e env vars em uma única sessão;
- redesign visual completo (tech-blue palette, dark mode, todos os componentes) sem introduzir erros de TypeScript nem alterar lógica de negócio;
- identificação e correção proativa de problemas de TypeScript (`as const` para typed routes).

**Pior:**
- ao remover a `ConsoleProvider` de email (simplificação legítima), o agente não avisou que o dev sem `RESEND_API_KEY` ficaria sem fallback — descoberto só ao testar;
- na primeira tentativa de instalação (`npm uninstall nodemailer`), o comando falhou silenciosamente por conflito com `.npmignore`; o agente precisou tentar `pnpm` como alternativa.

### 3. Tipos de problemas observados

- **Configuração de ambiente**: o erro Resend ("can only send testing emails to your own address") só apareceu em tempo de execução, não em build — requer documentação explícita e fallback de dev;
- **Erros de tipo com APIs de terceiros**: `typedRoutes: true` do Next.js 16 gerou incompatibilidade inesperada com arrays de objetos contendo `href: string` — corrigido com `as const`;
- **Comentários inline no `.env`**: o arquivo `.env` tinha comentário inline na variável `EMAIL_FROM` que poderia quebrar parsers menos tolerantes — corrigido durante a revisão.

### 4. Avaliação geral da utilidade do agente no desenvolvimento

- utilidade **muito alta** para scaffold, implementação de features e refatoração estrutural;
- o agente manteve consistência arquitetural entre sessões (Server Actions, `server-only`, Zod, Drizzle) sem necessidade de reforço constante nos prompts;
- melhor desempenho quando o prompt incluía **objetivo concreto + restrição explícita** (ex.: "refatore o email para Resend — não altere nenhuma lógica de fetch ou mutação");
- a revisão final humana foi essencial para detectar regressões sutis de UX e inconsistências de documentação que o agente não reportou proativamente.

### 5. Comparação com a experiência de uso do agente no sistema revisado

A experiência com o Lum seguiu padrão semelhante ao observado no sistema revisado: o agente é excelente para velocidade de construção e geração estrutural, mas os pontos sensíveis são idênticos — configuração de ambiente e "falso positivo" de conclusão quando a validação não é estrita.

A principal diferença foi o nível de especificação prévia: o Lum foi desenvolvido com artefatos de design (`spec.md`, `plan.md`, `data-model.md`) que guiaram o agente com contexto rico, reduzindo retrabalho. No sistema revisado, os prompts foram mais incrementais e reativos, o que gerou mais ciclos de correção em tooling (Docker, ESM/CommonJS). A lição: investir em planejamento antes de codificar melhora significativamente a qualidade das respostas do agente.

---

## Veredito final

O sistema **está aprovável e funcional**, cobrindo integralmente o escopo solicitado no trabalho.

Como melhorias incrementais prioritárias, recomenda-se:

- **Autenticação real**: substituir o `assertAuthenticated()` placeholder por validação de sessão (NextAuth.js ou similar) antes de qualquer exposição pública;
- **Fallback de email em desenvolvimento**: reintroduzir um `ConsoleProvider` ativado por `NODE_ENV=development` para que o fluxo de email seja testável sem credenciais Resend;
- **Paginação nas listagens**: adicionar `limit`/`offset` nas queries de alunos, turmas e notificações para suportar o volume declarado de 10k registros;
- **Filtros de notificações no banco**: mover o filtro de status/nome para a query Drizzle em vez de filtrar em memória no servidor.
