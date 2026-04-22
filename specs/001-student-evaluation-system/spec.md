# Feature Specification: Sistema de Gerenciamento de Alunos e Avaliações

**Feature Branch**: `001-student-evaluation-system`
**Created**: 2026-04-19
**Status**: Draft
**Input**: User description: "Sistema de Gerenciamento de Alunos e Avaliações"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lançar e Editar Avaliações em Grade (Priority: P1)

O professor acessa a tela de avaliações de uma turma e visualiza uma grade onde cada
linha representa um aluno matriculado e cada coluna representa uma meta associada à
turma. O professor preenche ou altera os conceitos (MANA, MPA ou MA) célula a célula e,
ao final, salva todas as alterações de uma única vez. O sistema registra o histórico de
cada mudança e garante que a operação inteira seja atômica.

**Why this priority**: A grade de avaliações é o fluxo central do sistema — sem ela
nenhum dos demais fluxos (notificações, histórico, relatórios) tem valor.

**Independent Test**: O professor consegue abrir uma turma com alunos e metas já
cadastrados, editar múltiplos conceitos na grade e clicar em "Salvar". O sistema
persiste todas as alterações e o professor vê a confirmação imediatamente.

**Acceptance Scenarios**:

1. **Given** uma turma com pelo menos dois alunos matriculados e duas metas associadas,
   **When** o professor edita três células da grade e clica em "Salvar",
   **Then** os três conceitos são persistidos, o histórico registra cada mudança com
   data, valor anterior e valor novo, e uma mensagem de sucesso é exibida.

2. **Given** a grade com alterações não salvas,
   **When** o professor tenta navegar para outra página,
   **Then** o sistema exibe um alerta de confirmação antes de descartar as mudanças.

3. **Given** um conceito inválido inserido em uma célula (valor fora de MANA/MPA/MA),
   **When** o professor tenta salvar,
   **Then** o sistema bloqueia o salvamento, destaca a célula inválida e exibe mensagem
   de erro descrevendo os valores aceitos.

4. **Given** uma falha parcial no servidor durante o salvamento em lote,
   **When** o erro ocorre,
   **Then** nenhuma das alterações do lote é persistida (operação transacional) e o
   professor é informado sobre a falha.

---

### User Story 2 - Gerenciar Cadastros e Matrículas (Priority: P2)

O professor mantém o cadastro de alunos, turmas e metas, e gerencia as matrículas que
vinculam alunos a turmas. Cada entidade pode ser criada, editada, listada, filtrada e
removida. A associação de metas às turmas determina as colunas que aparecem na grade de
avaliações.

**Why this priority**: Os cadastros são pré-requisito para que a grade de avaliações
exista. No entanto, são operações pontuais de configuração, não o fluxo contínuo de uso.

**Independent Test**: O professor consegue criar um aluno, criar uma turma, criar uma
meta, associar a meta à turma, matricular o aluno na turma e verificar que o aluno
aparece na grade de avaliações da turma com a meta como coluna.

**Acceptance Scenarios**:

1. **Given** o formulário de cadastro de aluno,
   **When** o professor preenche nome, CPF válido (11 dígitos numéricos) e email e
   confirma,
   **Then** o aluno é criado e aparece na listagem de alunos.

2. **Given** um CPF já cadastrado no sistema,
   **When** o professor tenta cadastrar outro aluno com o mesmo CPF,
   **Then** o sistema bloqueia a operação e exibe mensagem de CPF duplicado.

3. **Given** um aluno já matriculado em uma turma,
   **When** o professor tenta matriculá-lo novamente na mesma turma,
   **Then** o sistema bloqueia a operação com mensagem de matrícula duplicada.

4. **Given** uma turma com metas associadas e alunos matriculados,
   **When** o professor desmatricula um aluno,
   **Then** o aluno deixa de aparecer na grade de avaliações da turma.

5. **Given** uma listagem de alunos,
   **When** o professor aplica filtro por nome ou CPF,
   **Then** apenas os alunos correspondentes são exibidos.

---

### User Story 3 - Receber Notificação Diária de Alterações de Avaliação (Priority: P3)

Quando avaliações de um aluno são alteradas em qualquer turma durante o dia, o sistema
consolida todas as mudanças e envia um único email ao aluno com o resumo completo. O
sistema garante no máximo um email por aluno por dia, independentemente de quantas
turmas ou metas foram alteradas.

**Why this priority**: Notificação é valor percebido pelo aluno, mas o sistema já
entrega valor ao professor sem ela. Pode ser implementada e testada de forma
independente após os cadastros e a grade.

**Independent Test**: Após alterar o conceito de um aluno em duas turmas diferentes no
mesmo dia, acionar a consolidação e verificar que exatamente um email é gerado para
esse aluno contendo as alterações de ambas as turmas.

**Acceptance Scenarios**:

1. **Given** um aluno com avaliações alteradas em duas turmas no mesmo dia,
   **When** a rotina de consolidação é executada,
   **Then** exatamente um email é gerado para o aluno contendo todas as alterações das
   duas turmas, com meta, conceito anterior e conceito novo para cada mudança.

2. **Given** a rotina de consolidação executada duas vezes no mesmo dia para o mesmo
   aluno,
   **When** a segunda execução ocorre,
   **Then** nenhum email adicional é gerado (operação idempotente).

3. **Given** um email de resumo com status PENDENTE,
   **When** o envio falha,
   **Then** o status muda para ERRO, o número de tentativas é incrementado e o erro é
   registrado para diagnóstico.

4. **Given** um email enviado com sucesso,
   **When** a consulta ao histórico é feita,
   **Then** o status exibe ENVIADO com data e hora do envio.

---

### User Story 4 - Monitorar Fila de Notificações (Priority: P4)

O professor ou administrador acessa a tela de notificações para acompanhar o status da
fila de envios diários. É possível ver quais emails estão pendentes, quais foram
enviados com sucesso e quais apresentaram erro, com detalhe das tentativas e da
mensagem de falha.

**Why this priority**: Suporte operacional que não bloqueia nenhuma outra jornada. Pode
ser entregue após as funcionalidades core estarem estáveis.

**Independent Test**: Com ao menos um email nos status PENDENTE, ENVIADO e ERRO na base,
o monitor exibe os três corretamente com filtro por status funcional.

**Acceptance Scenarios**:

1. **Given** emails em diferentes status na fila,
   **When** o professor acessa a tela de notificações,
   **Then** a lista exibe aluno, data de referência, status, número de tentativas e data
   de envio (quando aplicável).

2. **Given** a tela de notificações,
   **When** o professor filtra por status ERRO,
   **Then** apenas os emails com falha são exibidos, com a mensagem do último erro
   visível.

---

### Edge Cases

- O que acontece quando um aluno é desmatriculado de uma turma após ter avaliações
  lançadas? As avaliações existentes e o histórico devem ser preservados para auditoria,
  mas novos lançamentos para essa matrícula são bloqueados.
- Como o sistema trata duas alterações do mesmo conceito no mesmo dia para o mesmo
  aluno/meta? Ambas geram registros no histórico; o email consolida mostrando o estado
  final versus o estado original do dia.
- O que acontece se a rotina de consolidação for executada antes de qualquer avaliação
  ser alterada no dia? Nenhum email é gerado; a operação é idempotente e segura.
- Uma turma pode existir sem metas associadas? Sim, mas a grade de avaliações aparece
  vazia e o professor é informado de que é preciso associar metas antes de lançar
  conceitos.
- O que acontece ao tentar remover um aluno que possui matrículas ativas? O sistema
  bloqueia a remoção e orienta o professor a desmatriculá-lo primeiro ou a marcar como
  inativo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir inclusão, edição, listagem e remoção de alunos
  com nome, CPF e email.
- **FR-002**: O sistema DEVE garantir que CPF seja único, armazenado sem pontuação
  (11 dígitos), e que email seja único e válido.
- **FR-003**: O sistema DEVE permitir inclusão, edição, listagem e remoção de turmas
  com tópico, ano e semestre (1 ou 2).
- **FR-004**: O sistema DEVE garantir unicidade da combinação tópico + ano + semestre.
- **FR-005**: O sistema DEVE permitir inclusão, edição, listagem, ativação,
  desativação e reordenação de metas, com código único.
- **FR-006**: O sistema DEVE permitir associar e desassociar metas a turmas, definindo
  a ordem de exibição de cada meta na grade.
- **FR-007**: O sistema DEVE permitir matricular e desmatricular alunos em turmas, sem
  permitir duplicidade de matrícula (mesmo aluno na mesma turma).
- **FR-008**: O sistema DEVE exibir, por turma, uma grade com alunos nas linhas e
  metas ativas nas colunas, ordenadas pela ordem de exibição configurada.
- **FR-009**: O sistema DEVE permitir editar o conceito de qualquer célula da grade,
  aceitando apenas os valores MANA, MPA ou MA.
- **FR-010**: O sistema DEVE persistir múltiplas alterações de avaliação em uma única
  operação atômica (salvamento em lote).
- **FR-011**: O sistema DEVE registrar, para cada alteração de avaliação, o valor
  anterior, o valor novo, a data e hora da alteração e a data de referência para
  consolidação.
- **FR-012**: O sistema DEVE consolidar, por aluno e por data de referência, todas as
  alterações de avaliação pendentes de envio, incluindo alterações em turmas distintas.
- **FR-013**: O sistema DEVE gerar no máximo um email de resumo por aluno por data de
  referência, garantindo idempotência da consolidação.
- **FR-014**: O sistema DEVE registrar o status de cada email (PENDENTE, ENVIADO,
  ERRO, CANCELADO), número de tentativas e mensagem de falha.
- **FR-015**: O sistema DEVE disponibilizar filtros e buscas nas telas de alunos
  (por nome, CPF), turmas (por tópico, período) e notificações (por status, data).
- **FR-016**: O sistema DEVE exibir um painel operacional com totais de alunos,
  turmas ativas e notificações pendentes.

### Key Entities

- **Aluno**: Pessoa a ser avaliada; possui nome, CPF (único), email (único) e status
  ativo/inativo. Destinatário dos emails de notificação.
- **Turma**: Oferta acadêmica de um tópico em um período (ano + semestre); possui
  descrição e status ativo/inativo.
- **Meta**: Item avaliativo reutilizável entre turmas; possui código único, nome e
  status ativo/inativo. Define o que será avaliado.
- **Turma-Meta**: Associação entre uma turma e uma meta, com ordem de exibição na
  grade. Define as colunas da grade de uma turma específica.
- **Matrícula**: Vínculo entre um aluno e uma turma; possui status (ATIVA, CANCELADA,
  CONCLUIDA). Condiciona a existência de avaliações.
- **Avaliação**: Conceito (MANA, MPA ou MA) atribuído a uma matrícula específica para
  uma meta específica da turma. É a célula da grade.
- **Histórico de Avaliação**: Registro imutável de cada alteração de conceito, com
  valores anterior e novo, data de alteração e data de referência. Base para
  consolidação de emails.
- **Resumo Diário de Email**: Cabeçalho do email consolidado de um aluno para uma data
  de referência; possui status de envio, tentativas e corpo gerado.
- **Item do Resumo**: Linha do email, vinculando um item de histórico ao seu resumo
  diário; impede reenvio duplicado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O professor consegue completar o lançamento de avaliações para uma turma
  de 30 alunos e 5 metas (150 células) em menos de 5 minutos, incluindo o salvamento
  em lote.
- **SC-002**: 100% das alterações salvas em lote são refletidas no histórico; zero
  registros parcialmente persistidos em caso de falha transacional.
- **SC-003**: Cada aluno recebe no máximo um email por dia, independentemente de
  quantas turmas tiveram avaliações alteradas.
- **SC-004**: A consolidação de emails é idempotente — executar o processo duas vezes
  no mesmo dia não gera emails duplicados.
- **SC-005**: Os filtros nas telas de alunos, turmas e notificações retornam resultados
  corretos em menos de 2 segundos com até 10.000 registros.
- **SC-006**: Zero erros de duplicidade de matrícula, avaliação ou resumo diário
  chegam ao banco de dados — as regras de unicidade são aplicadas tanto na interface
  quanto no servidor.
- **SC-007**: O monitor de notificações exibe o status atualizado de todos os envios
  do dia, com detalhe de falhas visível em no máximo um clique.

## Assumptions

- O sistema é utilizado exclusivamente em desktop; interface mobile não faz parte do
  escopo desta entrega.
- Há um único papel de usuário autenticado (Professor); controle de acesso por perfis
  múltiplos ou hierarquia de permissões está fora do escopo desta versão.
- O envio de email é realizado exclusivamente via Resend (SDK oficial); a chave de API
  (`RESEND_API_KEY`) é configurada externamente. O escopo cobre somente a geração,
  enfileiramento e rastreamento dos emails.
- A rotina de consolidação e envio de emails é disparada por agendamento externo
  (cron ou similar); o sistema não inclui scheduler interno nesta versão.
- Alunos não possuem acesso ao sistema; recebem apenas os emails gerados pelo processo
  de consolidação.
- Os conceitos válidos são fixos: MANA, MPA e MA — extensão do catálogo de conceitos
  está fora do escopo.
- A remoção de registros é lógica (soft delete ou bloqueio via regras de negócio) para
  preservar integridade referencial e histórico de auditoria.
- A visão de auditoria/histórico é somente leitura; edição retroativa de histórico não
  é permitida.

## Clarifications

### Session 2026-04-19

- Q: Existe autenticação de usuário (login) no escopo desta versão? → A: Não; a
  autenticação está fora do escopo desta entrega. O sistema assume um único usuário
  autenticado (Professor) sem tela de login.
