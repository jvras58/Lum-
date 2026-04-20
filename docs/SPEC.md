# Documento de Requisitos: Sistema de Gerenciamento de Alunos e Avaliações


## 1. Visão geral
O sistema tem como objetivo permitir o gerenciamento de alunos, turmas e avaliações por meta, com visualização separada por turma e envio consolidado de notificações por email aos alunos quando suas avaliações forem alteradas. Este documento traduz o enunciado em requisitos de software, define as telas principais, consolida as regras de negócio e propõe um schema de banco de dados relacional completo para implementação.

## 2. Escopo
* Cadastrar, editar, listar e remover alunos. 
* Cadastrar, editar, listar e remover turmas. 
* Cadastrar metas de avaliação e associá-las às turmas. 
* Matricular e desmatricular alunos em turmas. 
* Lançar e alterar avaliações por aluno e por meta dentro de cada turma. 
* Registrar histórico de alterações de avaliações. 
* Consolidar as alterações do dia e enviar no máximo um email diário por aluno. 
* Disponibilizar visão operacional de notificações e status de envio. 

## 3. Atores e premissas 

| Ator | Descrição | Responsabilidades |
|---|---|---|
| Professor | Usuário principal do sistema. | Mantém cadastros, matrículas e avaliações.  |
| Aluno | Destinatário passivo das notificações. | Recebe email diário com alterações de avaliação.  |
| Processo de envio | Rotina automática de consolidação. | Agrupa alterações do dia e realiza o envio único por aluno.  |

**Premissas principais:** 
* O professor é o responsável por preencher e manter as avaliações. 
* Cada avaliação pertence a uma turma, a um aluno matriculado e a uma meta da turma. 
* Os conceitos válidos são exclusivamente MANA, MPA e MA. 
* O envio consolidado deve considerar todas as turmas em que o aluno teve avaliação alterada no mesmo dia. 

## 4. Requisitos funcionais 

| Código | Requisito | Descrição |
|---|---|---|
| RF01 | Manter alunos | Permitir inclusão, edição, exclusão e listagem de alunos com nome, CPF e email.  |
| RF02 | Validar alunos | Garantir CPF único, email válido e impedimento de duplicidade cadastral.  |
| RF03 | Manter turmas | Permitir inclusão, edição, exclusão e listagem de turmas com tópico, ano e semestre.  |
| RF04 | Visualizar turma | Exibir cada turma separadamente com seus alunos matriculados e avaliações.  |
| RF05 | Manter metas | Permitir cadastro de metas e sua ativação, desativação e ordenação.  |
| RF06 | Associar metas à turma | Definir quais metas pertencem a cada turma e a ordem de exibição na grade.  |
| RF07 | Gerenciar matrículas | Permitir matricular e desmatricular alunos em turmas, sem duplicidade.  |
| RF08 | Exibir grade de avaliações | Mostrar tabela por turma com alunos na primeira coluna e metas nas colunas seguintes.  |
| RF09 | Editar avaliações | Permitir criação e alteração de conceitos MANA, MPA ou MA por célula da grade.  |
| RF10 | Salvar em lote | Permitir persistir várias alterações de avaliação em uma única operação de salvamento.  |
| RF11 | Auditar mudanças | Registrar histórico de toda alteração de avaliação com data, valor anterior e novo valor.  |
| RF12 | Consolidar notificações | Agrupar, por aluno e por data, todas as alterações realizadas em quaisquer turmas.  |
| RF13 | Enviar email diário único | Enviar no máximo um email por dia para cada aluno, contendo todas as alterações daquele dia.  |
| RF14 | Monitorar notificações | Disponibilizar tela com fila, status e tentativas de envio das notificações.  |
| RF15 | Consultar dados | Disponibilizar filtros e buscas nas telas de alunos, turmas e avaliações.  |
| RF16 | Persistir dados | Persistir o domínio em banco relacional, incluindo logs de alteração e de envio.  |

## 5. Requisitos não funcionais 

| Código | Descrição |
|---|---|
| RNF01 | A interface deve permitir operação fluida em desktop, priorizando a edição da grade de avaliações.  |
| RNF02 | As validações críticas devem existir tanto no front-end quanto no back-end.  |
| RNF03 | As operações de salvamento em lote devem ser transacionais para evitar inconsistência parcial.  |
| RNF04 | O processo de envio de email deve ser idempotente por aluno e por data de referência.  |
| RNF05 | O sistema deve manter rastreabilidade mínima das alterações para auditoria e depuração.  |
| RNF06 | A modelagem deve impedir duplicidades de matrícula, avaliação e resumo diário por aluno/data.  |

## 6. Regras de negócio 
* **RN01.** Cada aluno deve possuir nome, CPF e email obrigatórios. 
* **RN02.** O CPF deve ser único no sistema e armazenado em formato normalizado, sem pontuação. 
* **RN03.** Cada turma deve possuir tópico, ano e semestre válidos. 
* **RN04.** Um aluno não pode possuir mais de uma matrícula na mesma turma. 
* **RN05.** Uma avaliação somente pode existir para aluno efetivamente matriculado na turma. 
* **RN06.** Uma avaliação refere-se a exatamente uma meta da turma e aceita apenas MANA, MPA ou MA. 
* **RN07.** A combinação matrícula + meta da turma deve ser única. 
* **RN08.** Toda alteração de avaliação deve gerar registro de histórico com data de referência para consolidação diária. 
* **RN09.** O email consolidado do aluno deve considerar todas as alterações ocorridas no mesmo dia, inclusive em turmas diferentes. 
* **RN10.** O sistema não pode gerar mais de um resumo diário para o mesmo aluno e para a mesma data de referência. 

## 7. Telas do sistema 

| Tela | Objetivo | Dados principais | Ações |
|---|---|---|---|
| Dashboard | Resumo operacional do sistema. | Totais de alunos, turmas e alterações pendentes. | Navegar rapidamente para cadastros e avaliações.  |
| Alunos | Cadastro e manutenção de alunos. | Nome, CPF, email, status. | Criar, editar, remover, buscar e filtrar.  |
| Turmas | Cadastro e manutenção de turmas. | Tópico, ano, semestre, status. | Criar, editar, remover, visualizar detalhe.  |
| Detalhe da turma | Ver composição da turma. | Dados da turma, alunos matriculados, metas. | Matricular, desmatricular e acessar grade.  |
| Metas | Manutenção do catálogo de metas. | Código, nome, descrição, status. | Criar, editar, ativar, desativar, ordenar.  |
| Avaliações da turma | Lançamento e edição em grade. | Alunos na primeira coluna e metas nas demais. | Editar conceitos, salvar em lote, filtrar.  |
| Notificações | Acompanhar envios diários. | Aluno, data de referência, status e tentativas. | Consultar pendências e inspecionar falhas.  |

## 8. Modelo de dados e entidades 

| Tabela | Finalidade | Campos-chave | Observações |
|---|---|---|---|
| alunos | Cadastro base de estudantes. | id, nome, cpf, email | CPF e email únicos.  |
| turmas | Oferta acadêmica por período. | id, topico, ano, semestre | Topico + ano + semestre únicos.  |
| metas | Catálogo de metas avaliativas. | id, codigo, nome | Permite reuso entre turmas.  |
| turma_metas | Associação entre turma e meta. | id, turma_id, meta_id, ordem_exibicao | Controla quais colunas aparecem na grade.  |
| matriculas | Vínculo aluno-turma. | id, turma_id, aluno_id, status | Impede matrícula duplicada.  |
| avaliacoes | Conceito da matrícula por meta. | id, matricula_id, turma_meta_id, conceito | Base transacional da grade.  |
| avaliacoes_historico | Auditoria das mudanças. | id, avaliacao_id, data_referencia | Suporta consolidação de email diário.  |
| email_resumos_diarios | Cabeçalho do envio diário. | id, aluno_id, data_referencia, status | No máximo um por aluno/dia.  |
| email_resumo_itens | Itens do resumo diário. | id, email_resumo_id, avaliacao_historico_id | Relaciona mudanças enviadas no email.  |

## 9. Dicionário de dados resumido 

| Tabela | Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|---|
| alunos | cpf | CHAR(11) | Sim | Único; formato normalizado.  |
| alunos | email | VARCHAR(255) | Sim | Único.  |
| turmas | semestre | SMALLINT | Sim | Valores 1 ou 2.  |
| metas | codigo | VARCHAR(30) | Sim | Único.  |
| turma_metas | ordem_exibicao | SMALLINT | Sim | Maior que zero.  |
| matriculas | status | VARCHAR(20) | Sim | ATIVA, CANCELADA ou CONCLUIDA.  |
| avaliacoes | conceito | VARCHAR(4) | Sim | MANA, MPA ou MA.  |
| avaliacoes_historico | data_referencia | DATE | Sim | Data de consolidação do email.  |
| email_resumos_diarios | status | VARCHAR(20) | Sim | PENDENTE, ENVIADO, ERRO ou CANCELADO.  |
| email_resumo_itens | avaliacao_historico_id | BIGINT | Sim | Único para evitar reenvio duplicado.  |

## 10. Fluxo crítico de notificação diária 
* Ao salvar uma avaliação nova ou alterada, o sistema atualiza a tabela `avaliacoes`. 
* Na mesma transação, o sistema grava um registro em `avaliacoes_historico` com o valor anterior, o valor novo e a data de referência. 
* Uma rotina de consolidação agrupa os registros pendentes por aluno e por data de referência. 
* Para cada grupo, o sistema cria um registro em `email_resumos_diarios` e os respectivos itens em `email_resumo_itens`. 
* Após o envio com sucesso, o resumo diário recebe status `ENVIADO` e os itens ficam vinculados ao resumo processado. 

## 11. Observações de implementação 
* A grade de avaliações pode ser montada no front a partir da lista de metas da turma e da view `vw_avaliacoes_detalhadas`. 
* Os campos `created_at` e `updated_at` devem ser mantidos pela aplicação ou por triggers específicas do SGBD escolhido. 
* O arquivo SQL anexo a este documento contém o DDL completo de criação das tabelas, constraints, índices e view utilitária. 
* Caso a entrega precise aderir estritamente ao enunciado original, substitua a persistência relacional por JSON mantendo o mesmo modelo lógico. 

## 12. Anexo - schema relacional completo 
O schema completo em SQL foi fornecido em arquivo separado, com o nome `schema_banco_sistema_alunos_avaliacoes.sql`. O conteúdo inclui: 
* 9 tabelas relacionais principais; 
* constraints de unicidade, integridade referencial e checks de domínio; 
* índices para consultas por período, turma, aluno e status de envio; 
* view utilitária para leitura detalhada das avaliações. 