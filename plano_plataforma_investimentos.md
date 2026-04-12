# Plano Completo de Desenvolvimento — Plataforma de Gerenciamento de Investimentos

## 1. Visão do produto

Este documento apresenta um plano cronológico, sequencial e detalhado para desenvolver uma plataforma completa de gerenciamento de investimentos, utilizando:

- **Backend:** Django
- **Banco de dados:** PostgreSQL
- **Frontend web:** Next.js
- **Mobile:** React Native

O objetivo é construir uma solução **rápida, fluida, eficiente, escalável e segura**, com capacidade de evoluir para o nível das grandes plataformas do mercado.

Antes de tudo, existe uma distinção crítica que impacta diretamente o projeto:

- Se a plataforma for apenas de **consolidação, acompanhamento, análise, carteira, rentabilidade, metas, alertas e rebalanceamento**, o caminho técnico e regulatório é um.
- Se a plataforma também permitir **execução de ordens, distribuição de produtos, custódia, consultoria regulada ou intermediação**, a complexidade aumenta bastante e surgem exigências regulatórias específicas.

A CVM diferencia claramente os participantes autorizados no mercado, e a B3 mantém ambientes e APIs próprias para integrações institucionais e serviços ligados ao mercado de capitais.

Por isso, a recomendação é estruturar a plataforma em três níveis de maturidade.

### Nível 1 — Gestão patrimonial e acompanhamento
O usuário acompanha patrimônio, rentabilidade, posição consolidada, metas, proventos, extratos, alocação, risco e alertas.

### Nível 2 — Plataforma de inteligência de investimentos
Entram recursos de recomendação de carteira, simuladores, rebalanceamento, comparativos, score de perfil, suitability, insights por evento de mercado e automações.

### Nível 3 — Plataforma transacional completa
Entram execução de ordens, integração com corretoras/parceiros, movimentação financeira, distribuição de produtos, onboarding regulatório e trilhas de auditoria mais robustas.

A recomendação prática é iniciar com **Nível 1 + Nível 2**, deixando a arquitetura pronta para evoluir ao Nível 3 sem reescrita estrutural.

---

## 2. Escopo funcional completo

### 2.1. Módulos principais do produto

#### Modulo A — Conta e identidade
Ordem de desenvolvimento:
- [x] 1. cadastro
- [x] 2. login
- [x] 3. recuperacao de senha
- [x] 4. MFA
- [x] 5. gestao de sessoes
- [x] 6. dispositivos confiaveis
- [x] 7. perfil do usuario
- [x] 8. preferencias
- [x] 9. consentimentos e termos
- [x] 10. trilha de aceite de documentos

#### Modulo B — Onboarding financeiro
- [x] 1. wizard de onboarding
- [x] 2. perfil do investidor
- [x] 3. suitability
- [x] 4. objetivo financeiro
- [x] 5. horizonte de investimento
- [x] 6. tolerancia a risco
- [x] 7. classificacao de perfil
- [ ] 8. documentacao obrigatoria
- [ ] 9. aprovacao interna/manual quando necessario

#### Modulo C — Consolidação patrimonial
- [x] 1. contas
- [x] 2. corretoras
- [x] 3. investimentos
- [x] 4. posicao consolidada
- [x] 5. saldo total
- [x] 6. patrimonio liquido
- [x] 7. evolucao patrimonial
- [x] 8. composicao por classe
- [x] 9. composicao por instituicao
- [x] 10. composicao por moeda
- [x] 11. visao por conta e por titularidade

#### Modulo D — Carteira e posicao
- [x] 1. renda fixa
- [x] 2. renda variavel
- [x] 3. fundos
- [x] 4. ETFs
- [x] 5. acoes
- [x] 6. FIIs
- [x] 7. cripto
- [x] 8. previdencia
- [x] 9. caixa
- [x] 10. ativos internacionais
- [x] 11. posicao atual
- [x] 12. preco medio
- [x] 13. quantidade
- [x] 14. custo de aquisicao
- [x] 15. ganho/perda realizado
- [x] 16. ganho/perda nao realizado
- [x] 17. dividendos e proventos

#### Modulo E — Movimentacoes e importacoes
- [x] 1. aportes
- [x] 2. resgates
- [x] 3. compras
- [x] 4. vendas
- [x] 5. dividendos
- [x] 6. juros
- [x] 7. amortizacoes
- [x] 8. taxas
- [x] 9. impostos
- [x] 10. transferencias entre contas
- [x] 11. importacao manual
- [x] 12. importacao por arquivo
- [ ] 13. importacao por integracao
- [ ] 14. reconciliacao automatica
- [ ] 15. reconciliacao manual

#### Modulo F — Mercado e dados financeiros
- [x] 1. cotacoes
- [x] 2. historico de precos
- [x] 3. indicadores (tecnicos: RSI, MACD, SMA, EMA, Bollinger, ATR)
- [x] 4. fundamentos (P/L, Dividend Yield, ROE, Beta, Market Cap)
- [x] 5. eventos corporativos (dividendos, splits)
- [x] 6. calendarios
- [x] 7. noticias
- [x] 8. comparativos entre ativos
- [x] 9. benchmarks (IBOV, S&P500, CDI)
- [x] 10. indicadores macro (CDI, Selic, IPCA, IGPM, Fed, Treasury)
- [x] 11. curvas e indexadores

#### Modulo G — Inteligencia da carteira
- [x] 1. alocacao ideal
- [x] 2. rebalanceamento sugerido
- [x] 3. analise de concentracao
- [x] 4. risco por classe
- [x] 5. volatilidade
- [x] 6. correlacao
- [x] 7. drawdown
- [x] 8. comparacao com benchmark
- [x] 9. score de saude da carteira
- [x] 10. alertas de desvio de alocacao
- [x] 11. alertas de vencimento
- [x] 12. alertas de oportunidade

#### Modulo H — Objetivos e planejamento
- [x] 1. metas financeiras
- [x] 2. plano de aporte
- [x] 3. simulacao de acumulacao
- [x] 4. simulacao de aposentadoria
- [x] 5. reserva de emergencia
- [x] 6. objetivos com prazo
- [x] 7. projecoes com cenarios
- [x] 8. sugestao de esforco mensal

#### Modulo I — Notificacoes e comunicacao
- [x] 1. push
- [x] 2. e-mail
- [x] 3. alertas dentro da plataforma
- [x] 4. centro de notificacoes
- [x] 5. preferencias de notificacao
- [x] 6. gatilhos por evento
- [x] 7. campanhas segmentadas
- [x] 8. lembretes de aporte
- [ ] 9. avisos regulatorios

#### Módulo J — Documentos e compliance
- [x] 1. termos
- [x] 2. contratos
- [ ] 3. notas
- [x] 4. extratos
- [ ] 5. informes
- [ ] 6. comprovantes
- [x] 7. logs de aceite
- [x] 8. retenção documental
- [x] 9. trilha de auditoria
- [x] 10. versionamento de políticas

#### Módulo K — Área administrativa
- [x] 1. gestão de usuários
- [x] 2. gestão de perfis
- [x] 3. permissões
- [x] 4. suporte
- [x] 5. monitoramento de integrações
- [x] 6. reconciliações pendentes
- [ ] 7. filas e jobs
- [x] 8. conexao de corretoras
- [x] 9. gatilhos automaticos
- [ ] 9. conteúdo institucional
- [x] 10. CMS para banners, cards, FAQs e mensagens

#### Módulo L — Parceiros e integrações
- [ ] 1. corretoras
- [ ] 2. Open Finance/Open Banking
- [ ] 3. provedores de market data
- [ ] 4. notificações
- [ ] 5. antifraude
- [ ] 6. KYC/KYB
- [ ] 7. pagamentos
- [ ] 8. storage
- [ ] 9. analytics
- [ ] 10. observabilidade

---

## 3. Arquitetura recomendada

### 3.1. Stack principal

- **Backend:** Django + Django REST Framework
- **Banco:** PostgreSQL
- **Frontend web:** Next.js
- **Mobile:** React Native
- **Cache:** Redis
- **Jobs assíncronos:** Celery
- **Mensageria/eventos:** Redis Streams ou RabbitMQ/Kafka, dependendo do volume
- **Storage de arquivos:** S3 compatível
- **Busca:** OpenSearch/Elasticsearch, se houver pesquisa avançada
- **Observabilidade:** Sentry + OpenTelemetry + Prometheus/Grafana
- **CI/CD:** GitHub Actions ou GitLab CI
- **Infra:** Docker + Kubernetes ou ECS equivalente

### 3.2. Estratégia arquitetural

A recomendação é começar com **monólito modular em Django**, e não com microserviços puros.

Os principais contextos internos devem ser separados desde o início:

- identity
- onboarding
- portfolio
- market_data
- transactions
- analytics
- notifications
- compliance
- billing
- admin
- integrations

Isso traz velocidade no começo e reduz complexidade. Depois, módulos mais pesados podem ser extraídos, como:

- market data
- pricing engine
- recommendation engine
- notification engine
- order execution

### 3.3. Padrão de comunicação

- APIs síncronas para a experiência do usuário
- filas e jobs para tarefas pesadas
- webhooks para integrações externas
- eventos internos para atualização de carteira, cálculo de rentabilidade, alertas e reconciliações

---

## 4. Estrutura cronológica do projeto

### Fase 0 — Definição estratégica

#### Entregáveis
- [x] 1. visão do produto
- [x] 2. definição do público
- [x] 3. proposta de valor
- [x] 4. diferenciais
- [x] 5. benchmark de mercado
- [x] 6. recorte do MVP
- [x] 7. definição do modelo operacional:
   - agregador
   - consultivo
   - transacional
   - híbrido
- [x] 8. mapa regulatório inicial
- [x] 9. definição de monetização
- [x] 10. matriz de riscos

#### Perguntas obrigatórias
- A plataforma será B2C, B2B ou B2B2C? (B2C)
- Haverá execução de ordens ou apenas consolidação? (apenas consolidação)
- O foco inicial é Brasil ou multi-país? (Brasil)
- O usuário poderá conectar corretoras automaticamente? (sim, mock)
- Haverá recomendação automatizada? (sim, Level 2)
- Haverá consultoria humana? (nao por agora)
- A receita virá de assinatura, comissão, fee de assessoria, distribuição ou white-label? (assinatura)

---

### Fase 1 — Descoberta funcional detalhada

#### Ordem de execução
- [x] 1. mapear jornadas
- [x] 2. mapear personas
- [x] 3. definir casos de uso
- [x] 4. definir regras de negócio
- [x] 5. definir métricas do produto
- [x] 6. definir níveis de acesso
- [x] 7. definir arquitetura de permissões
- [x] 8. definir requisitos regulatórios
- [x] 9. transformar tudo em épicos e user stories
- [x] 10. priorizar backlog

#### Jornadas obrigatórias
- [x] cadastro e login
- [x] onboarding
- [x] conexão de contas e corretoras (mock)
- [x] visão consolidada do patrimônio
- [x] cadastro/importação de ativos
- [x] acompanhamento de carteira
- [x] criação de meta
- [ ] rebalanceamento
- [x] recebimento de alertas
- [ ] consulta de documentos
- [ ] suporte
- [ ] cancelamento e encerramento de conta

#### Métricas principais
- CAC
- ativação
- tempo até primeira carteira
- taxa de conexão de contas
- taxa de retenção
- frequência semanal
- taxa de rebalanceamento
- adesão a metas
- conversão para plano pago
- tempo de sincronização
- latência por tela
- erro por integração

---

### Fase 2 — Requisitos não funcionais

#### Itens obrigatórios
- [x] 1. segurança
- [x] 2. disponibilidade
- [x] 3. escalabilidade
- [x] 4. performance
- [x] 5. rastreabilidade
- [x] 6. auditoria
- [x] 7. privacidade
- [x] 8. observabilidade
- [ ] 9. tolerância a falhas
- [ ] 10. recuperação de desastre

#### Metas práticas
- APIs críticas abaixo de 200–300 ms em consultas simples
- telas críticas com carregamento progressivo
- processamento pesado fora da thread da requisição
- suporte a multi-tenant, se houver white-label
- trilha de auditoria para eventos sensíveis
- versionamento de carteira e operações

---

### Fase 3 — UX, UI e Design System

#### Ordem
- [x] 1. mapa de navegação
- [x] 2. wireframes
- [x] 3. protótipo clicável
- [x] 4. design system
- [x] 5. biblioteca de componentes
- [x] 6. guidelines de acessibilidade
- [x] 7. guidelines mobile
- [x] 8. estados de loading, erro e vazio
- [x] 9. motion guidelines
- [x] 10. design tokens

#### Telas prioritárias
- [x] login
- [x] cadastro
- [x] onboarding
- conexão de contas e corretoras
- visão consolidada do patrimônio
- cadastro/importação de ativos
- acompanhamento de carteira
- criação de meta
- rebalanceamento
- recebimento de alertas
- consulta de documentos
- suporte
- cancelamento e encerramento de conta

#### Métricas principais
- CAC
- ativação
- tempo até primeira carteira
- taxa de conexão de contas
- taxa de retenção
- frequência semanal
- taxa de rebalanceamento
- adesão a metas
- conversão para plano pago
- tempo de sincronização
- latência por tela
- erro por integração

---

### Fase 2 — Requisitos não funcionais

#### Itens obrigatórios
- [ ] 1. segurança
- [ ] 2. disponibilidade
- [ ] 3. escalabilidade
- [ ] 4. performance
- [ ] 5. rastreabilidade
- [ ] 6. auditoria
- [ ] 7. privacidade
- [ ] 8. observabilidade
- [ ] 9. tolerância a falhas
- [ ] 10. recuperação de desastre

#### Metas práticas
- APIs críticas abaixo de 200–300 ms em consultas simples
- telas críticas com carregamento progressivo
- processamento pesado fora da thread da requisição
- suporte a multi-tenant, se houver white-label
- trilha de auditoria para eventos sensíveis
- versionamento de carteira e operações

---

### Fase 3 — UX, UI e Design System

#### Ordem
- [ ] 1. mapa de navegação
- [ ] 2. wireframes
- [ ] 3. protótipo clicável
- [ ] 4. design system
- [ ] 5. biblioteca de componentes
- [ ] 6. guidelines de acessibilidade
- [ ] 7. guidelines mobile
- [ ] 8. estados de loading, erro e vazio
- [ ] 9. motion guidelines
- [ ] 10. design tokens

#### Telas prioritárias
- login
- cadastro
- onboarding
- dashboard
- carteira
- detalhes do ativo
- rentabilidade
- metas
- rebalanceamento
- movimentações
- documentos
- notificações
- suporte
- configurações

#### Regras para fluidez
- skeleton loading
- paginação e lazy loading
- cache local no mobile
- pré-busca de dados
- atualizações parciais
- charts otimizados
- evitar telas que dependem de muitas APIs simultaneamente

---

### Fase 4 — Arquitetura técnica detalhada

#### Backend Django
Estrutura sugerida:
- apps/core
- apps/identity
- apps/users
- apps/onboarding
- apps/portfolio
- apps/assets
- apps/transactions
- apps/market_data
- apps/pricing
- apps/benchmarks
- apps/goals
- apps/notifications
- apps/compliance
- apps/documents
- apps/support
- apps/admin_panel
- apps/integrations
- apps/billing
- apps/audit

#### Banco PostgreSQL
Principais grupos de tabelas:
- users
- profiles
- roles
- permissions
- institutions
- accounts
- broker_connections
- assets
- asset_prices
- holdings
- transactions
- dividends
- benchmarks
- goals
- goal_contributions
- portfolio_snapshots
- alerts
- notifications
- documents
- consent_logs
- audit_logs
- integration_logs
- sync_jobs
- import_batches
- reconciliation_items

#### Frontend Next.js
Sugestão:
- App Router
- SSR nas áreas institucionais
- client rendering nas áreas transacionais
- BFF opcional
- TanStack Query para cache
- Zustand ou Redux Toolkit apenas onde realmente precisar
- gráficos performáticos
- autenticação com tokens curtos + refresh seguro

#### Mobile React Native
Sugestão:
- navegação por stacks + tabs
- cache offline parcial
- sincronização inteligente
- biometria
- push notifications
- proteção de tela sensível
- analytics e crash reporting

---

## 5. APIs e integrações recomendadas

### 5.1. Agregação bancária e financeira

#### Melhor caminho para Brasil
O **Open Finance Brasil** deve ser tratado como pilar estratégico se o objetivo é conexão com contas, consentimento e compartilhamento regulado de dados financeiros. O ecossistema oficial mantém estrutura, regras e certificação funcional.

#### Alternativa prática via parceiro
A **Belvo** é uma opção forte para Brasil e América Latina para acelerar integrações de dados bancários e pagamentos. A documentação oficial destaca cobertura de banking data e pagamentos no Brasil.

#### Consideração internacional
A **Plaid** é muito forte para América do Norte, especialmente em investimentos e banking, mas a documentação oficial mostra foco principal em EUA e Canadá.

#### Recomendação objetiva
- Brasil: **Open Finance + Belvo**
- Internacional futuro: **Plaid**

---

### 5.2. Market data

Não existe um único provedor perfeito para tudo. O ideal é trabalhar com uma camada de abstração e ter um provedor principal e um secundário.

#### Polygon
A documentação oficial mostra cobertura de ações, forex e cripto, com APIs REST e WebSockets, incluindo dados históricos e em tempo real.

#### Twelve Data
É uma opção muito boa para centralizar ações, forex, cripto, ETFs, fundamentos e indicadores técnicos. A empresa mantém documentação e cobertura de mercado brasileiro.

#### Alpha Vantage
Boa para prototipagem, fundamentos, indicadores e cenários de menor custo inicial, mas com limitações nos planos mais simples.

#### Recomendação objetiva
- **Primária:** Twelve Data ou Polygon, conforme o foco do produto
- **Secundária/fallback:** Alpha Vantage
- **Brasil institucional/B3:** avaliar APIs e serviços da própria B3, que mantém portal oficial para desenvolvedores.

---

### 5.3. Pagamentos e repasses

Se a plataforma tiver assinatura, split, cobrança recorrente ou repasses para parceiros, o **Stripe Connect** é uma opção muito forte. A documentação oficial posiciona o produto para plataformas e marketplaces com múltiplas partes envolvidas.

---

### 5.4. Push notifications

Para web e mobile, o **Firebase Cloud Messaging** é a escolha mais natural. A documentação oficial o apresenta como solução confiável e cross-platform para mensagens e notificações.

---

## 6. Plano cronológico real de desenvolvimento

### Etapa 1 — Fundamentos do produto
Objetivo: fechar o que será construído.

#### Sequência
- [x] 1. definir visão do produto
- [x] 2. definir recorte regulatório
- [x] 3. definir funcionalidades do MVP
- [x] 4. definir funcionalidades pós-MVP
- [x] 5. definir personas
- [x] 6. desenhar jornadas
- [x] 7. definir KPIs
- [x] 8. produzir backlog priorizado
- [x] 9. aprovar arquitetura macro
- [x] 10. aprovar design system base

#### Saída
- PRD completo
- mapa de módulos
- backlog priorizado
- critérios de aceite
- matriz de dependências

---

### Etapa 2 — Fundação técnica
Objetivo: preparar a base para crescer sem retrabalho.

#### Sequência
- [x] 1. criar monorepo ou organização de repositórios
- [ ] 2. configurar padrão de branches
- [ ] 3. configurar CI/CD
- [x] 4. configurar Docker
- [ ] 5. configurar ambientes dev/staging/prod
- [x] 6. subir PostgreSQL
- [x] 7. subir Redis
- [x] 8. configurar Django base
- [x] 9. configurar Next.js base
- [ ] 10. configurar React Native base
- [ ] 11. configurar autenticação base
- [ ] 12. configurar observabilidade
- [ ] 13. configurar logs centralizados
- [ ] 14. configurar monitoramento de erro
- [x] 15. configurar secrets management
- [ ] 16. configurar feature flags
- [ ] 17. configurar testes automatizados base

#### Critérios mínimos
- deploy automatizado
- rollback simples
- ambiente staging funcional
- health checks
- migrations seguras
- padronização de lint, format e testes

---

### Etapa 3 — Identidade e segurança
Objetivo: travar o coração do acesso.

#### Sequência
- [x] 1. cadastro
- [x] 2. login
- [x] 3. refresh token
- [x] 4. logout
- [x] 5. reset de senha
- [ ] 6. verificação de e-mail
- [ ] 7. MFA
- [ ] 8. biometria no mobile
- [x] 9. gestão de sessões
- [ ] 10. revogação de dispositivos
- [x] 11. RBAC
- [ ] 12. trilha de auditoria de login
- [x] 13. política de senha
- [x] 14. rate limiting (padrão DRF)
- [ ] 15. antifraude básico

---

### Etapa 4 — Onboarding e perfil do investidor
Objetivo: fazer o primeiro uso ser útil e guiado.

#### Sequência
- [x] 1. wizard de onboarding
- [x] 2. dados básicos
- [x] 3. objetivo financeiro
- [x] 4. horizonte
- [x] 5. perfil de risco
- [x] 6. suitability
- [x] 7. aceite de termos
- [x] 8. conexão de contas/corretoras (layout/mockup)
- [x] 9. tela final com plano inicial

---

### Etapa 5 — Modelo de dados de investimentos
Objetivo: consolidar a espinha dorsal do produto.

#### Sequência
- [x] 1. cadastro de instituições
- [x] 2. cadastro de contas
- [x] 3. cadastro de ativos
- [x] 4. classificação por tipo
- [x] 5. estrutura de holdings (parcial)
- [x] 6. estrutura de transações (base Position)
- [ ] 7. estrutura de eventos corporativos
- [ ] 8. snapshots de carteira
- [ ] 9. benchmarks
- [x] 10. metas e objetivos
- [ ] 11. vínculos de documentos

---

### Etapa 6 — Integrações externas
Objetivo: trazer dados reais para dentro da plataforma.

#### Sequência
- [x] 1. desenhar camada de abstraction provider
- [x] 2. integrar market data primário (Yahoo Finance)
- [ ] 3. integrar market data secundário
- [ ] 4. integrar Open Finance/agregador
- [ ] 5. integrar webhooks
- [ ] 6. criar sync jobs
- [ ] 7. criar reconciliação
- [ ] 8. criar controle de idempotência
- [ ] 9. criar monitoramento por integração
- [ ] 10. criar fallback e circuit breaker

#### Regra crítica
Nunca acople o domínio interno diretamente ao payload do fornecedor.  
Sempre use:
- adapter
- normalizer
- validator
- persistence mapper

Isso evita retrabalho quando a API externa muda.

---

### Etapa 7 — Dashboard consolidado
Objetivo: entregar o primeiro grande valor percebido.

#### Sequência
- [x] 1. patrimônio total (UI/API)
- [x] 2. variação diária/mensal/acumulada (Métrica API)
- [x] 3. alocação por classe (Gráfico Donut)
- [x] 4. alocação por instituição
- [x] 5. principais posições (Tabela Assets)
- [x] 6. metas
- [x] 7. alertas
- [x] 8. últimas movimentações
- [x] 9. índices de mercado (IBOV, S&P500, Dólar, Bitcoin)
- [x] 10. métricas de desempenho (rendimento total, custo, %)
- [x] 11. ações rápidas (Adicionar Ativo, Nova Movimentação, Criar Meta)
- [x] 12. modal adicionar ativo
- [ ] 13. cards de insight
- [ ] 14. visão resumida mobile

#### O dashboard precisa responder
- quanto tenho
- onde está
- como está performando
- se estou dentro da estratégia
- o que devo fazer agora

---

### Etapa 8 — Carteira e detalhes avançados
Objetivo: profundidade.

#### Sequência
- [x] 1. lista de ativos
- [x] 2. filtros (por tipo, ordenação)
- [x] 3. busca (search de ativos)
- [x] 4. visão detalhada por ativo (página de detalhes)
- [x] 5. preço médio
- [x] 6. retorno absoluto
- [x] 7. retorno percentual
- [x] 8. gráfico histórico de preços
- [ ] 9. benchmark
- [ ] 10. eventos corporativos
- [ ] 11. histórico de movimentações
- [x] 12. composição da carteira (alocação por classe)
- [ ] 13. concentração e risco
- [x] 14. importação CSV

---

### Etapa 9 — Importação, reconciliação e consistência
Objetivo: reduzir divergência de dados.

#### Sequência
- [ ] 1. importação CSV/XLSX
- [ ] 2. importação por corretora/parceiro
- [ ] 3. validação de schema
- [ ] 4. tratamento de duplicidade
- [ ] 5. idempotência
- [ ] 6. reconciliação automática
- [ ] 7. fila de pendências manuais
- [ ] 8. logs de falha
- [ ] 9. reprocessamento
- [ ] 10. relatórios de consistência

---

### Etapa 10 — Inteligência de portfólio
Objetivo: sair do "mostrar dados" para "orientar ação".

#### Sequência
- [x] 1. cálculo de exposição
- [x] 2. desvio da alocação alvo
- [x] 3. score da carteira
- [x] 4. alertas de concentração
- [x] 5. alertas de risco
- [x] 6. sugestões de rebalanceamento
- [x] 7. simulações antes/depois
- [x] 8. comparação com benchmark
- [x] 9. projeções por cenário
- [x] 10. explicação das recomendações

#### Regra de produto
Toda recomendação precisa explicar:
- o que mudou
- por que mudou
- qual impacto esperado
- qual risco existe

---

### Etapa 11 — Metas, planejamento e simuladores
Objetivo: retenção e recorrência de uso.

#### Sequência
- [ ] 1. criar meta
- [ ] 2. vincular horizonte
- [ ] 3. definir valor alvo
- [ ] 4. definir aporte mensal
- [ ] 5. estimar progresso
- [ ] 6. mostrar projeções
- [ ] 7. simular cenários
- [ ] 8. sugerir ajustes
- [ ] 9. disparar alertas
- [ ] 10. acompanhar evolução

---

### Etapa 12 — Notificações, engajamento e retenção
Objetivo: trazer o usuário de volta pelos motivos certos.

#### Sequência
- [ ] 1. central de notificações
- [ ] 2. push
- [ ] 3. e-mail
- [ ] 4. preferências
- [ ] 5. gatilhos de mercado
- [ ] 6. gatilhos de meta
- [ ] 7. gatilhos de risco
- [ ] 8. gatilhos de vencimento
- [ ] 9. lembretes de aporte
- [ ] 10. resumos semanais

---

### Etapa 13 — Admin, suporte e operação interna
Objetivo: operar a plataforma com controle.

#### Sequência
- [ ] 1. painel administrativo
- [ ] 2. usuários
- [ ] 3. perfis
- [ ] 4. permissões
- [ ] 5. integrações
- [ ] 6. logs
- [ ] 7. reprocessamentos
- [ ] 8. atendimento
- [ ] 9. CMS
- [ ] 10. dashboards operacionais

---

### Etapa 14 — Compliance, auditoria e readiness regulatório
Objetivo: evitar crescimento desorganizado.

#### Sequência
- [ ] 1. consentimentos
- [ ] 2. trilha de auditoria
- [ ] 3. retenção de logs
- [ ] 4. versionamento de políticas
- [ ] 5. governança de acessos
- [ ] 6. segregação de funções
- [ ] 7. revisão jurídica dos fluxos
- [ ] 8. revisão regulatória dos serviços ofertados
- [ ] 9. trilha de suitability
- [ ] 10. trilha de recomendações

Se houver consultoria, recomendação personalizada regulada ou execução de ordens, essa etapa deixa de ser apoio e passa a ser bloqueadora. A CVM diferencia claramente atividades autorizadas no mercado.

---

## 7. Roadmap sugerido por releases

### Release 1 — MVP forte
Inclui:
- autenticação
- onboarding
- conexão de contas
- consolidação patrimonial
- dashboard
- carteira
- importação manual
- market data básico
- metas simples
- notificações básicas
- admin básico

### Release 2 — Produto competitivo
Inclui:
- [x] rebalanceamento
- [x] insights (concentração, risco, perda/lucro)
- [x] benchmarking (IBOV, S&P500, CDI)
- [x] simuladores (projeção de rentabilidade)
- [ ] reconciliação avançada
- [x] documentos (termos, contratos, logs de aceite)
- [x] push (via market data)
- [x] analytics (via insights)
- [ ] gestão operacional madura

### Release 3 — Produto premium
Inclui:
- [x] inteligência de carteira avançada (via insights)
- [x] explicações de recomendação (explanation + action_steps)
- [x] metas complexas (cenarios multiplos)
- [x] objetivos avançados (simulador 4 cenarios)
- [x] alertas sofisticados (insights com severidade)
- [x] automações (gatilhos automaticos)
- [x] integrações ampliadas (conexao corretoras)
- [ ] experiência mobile premium

### Release 4 — Expansão institucional
Inclui:
- multi-tenant
- white-label
- operação B2B2C
- camadas regulatórias ampliadas
- integração com parceiros de distribuição/execution
- módulos avançados de auditoria e conciliação

---

## 8. Requisitos de performance para ser rápida, fluida e eficiente

### Backend
- cache de cotações e metadados
- pré-cálculo de métricas de carteira
- snapshots diários e intradiários
- jobs assíncronos para reconciliação
- leitura otimizada com índices e particionamento
- materialized views para dashboards pesados
- APIs enxutas por caso de uso
- paginação cursor-based nas listas grandes

### Frontend web
- carregamento progressivo
- server components onde fizer sentido
- suspense e skeleton loading
- query caching
- otimização de gráficos
- split por rota
- evitar overfetching

### Mobile
- cache local
- sincronização incremental
- telas com dados resumidos primeiro
- download sob demanda de detalhes
- push para eventos importantes
- biometria e sessão segura

---

## 9. Estrutura de equipe recomendada

### Núcleo mínimo
- 1 Product Manager
- 1 Tech Lead
- 2 Backend Django
- 2 Frontend Next.js
- 1 Mobile React Native
- 1 UX/UI
- 1 QA
- 1 DevOps/Cloud
- 1 analista de produto/dados
- apoio jurídico/compliance sob demanda

### Equipe ideal
- 1 PM
- 1 Head/Principal Engineer
- 3 Backend
- 3 Frontend
- 2 Mobile
- 1 Designer de produto
- 1 UX Writer/Content
- 2 QA
- 1 DevOps/SRE
- 1 Data/Analytics Engineer
- 1 especialista de compliance/regulatório

---

## 10. Riscos mais importantes

### Técnicos
- acoplamento forte com APIs externas
- cálculo incorreto de rentabilidade
- dados inconsistentes por múltiplas fontes
- latência alta no dashboard
- reconciliação mal resolvida
- escalabilidade ruim em carteiras grandes

### Produto
- excesso de escopo no MVP
- onboarding longo demais
- dashboard bonito mas pouco útil
- alertas demais e valor de menos
- recomendação sem explicação

### Regulatórios
- ofertar algo que exige autorização sem estruturar isso
- trilha de auditoria insuficiente
- consentimento mal gerido
- documentos e termos mal versionados

---

## 11. Melhor estratégia prática de APIs

Se fosse para montar a plataforma hoje, a estratégia recomendada seria:

### Para Brasil
- **Open Finance Brasil** como direção estrutural para compartilhamento regulado de dados
- **Belvo** para acelerar integrações bancárias e de pagamentos em fase inicial ou híbrida
- **Twelve Data** como provedor principal de market data inicial, pela cobertura ampla e API unificada
- **Alpha Vantage** como fallback e opção de prototipagem
- **FCM** para notificações web e mobile

### Para expansão premium
- **Polygon** se o produto passar a depender fortemente de streaming, baixa latência e dados profundos de mercado
- **B3 APIs** quando o modelo operacional exigir aproximação institucional com o ecossistema da B3
- **Stripe Connect** se a plataforma operar assinatura, repasse ou revenue sharing de forma estruturada

---

## 12. Ordem exata recomendada

- [ ] 1. definir modelo de negócio e limite regulatório  
- [ ] 2. escrever PRD completo  
- [ ] 3. desenhar jornadas e backlog  
- [ ] 4. fechar arquitetura modular  
- [ ] 5. preparar infraestrutura base  
- [ ] 6. implementar autenticação e segurança  
- [ ] 7. implementar onboarding e suitability  
- [ ] 8. modelar domínio financeiro no PostgreSQL  
- [ ] 9. integrar market data  
- [ ] 10. integrar contas, corretoras e Open Finance  
- [ ] 11. construir dashboard consolidado  
- [ ] 12. construir carteira e movimentações  
- [ ] 13. construir importação e reconciliação  
- [ ] 14. construir metas e simuladores  
- [ ] 15. construir motor de alertas  
- [ ] 16. construir painel administrativo  
- [ ] 17. reforçar compliance, auditoria e observabilidade  
- [ ] 18. lançar MVP  
- [ ] 19. medir uso real  
- [ ] 20. evoluir para inteligência avançada, rebalanceamento e transacional

---

## 13. Recomendação final

O caminho correto não é tentar lançar de uma vez todas as funcionalidades das grandes plataformas.

A melhor estratégia é:
- construir a base como uma plataforma grande
- lançar um MVP com foco forte em **consolidação, carteira, metas, alertas e performance**
- deixar a camada transacional como trilha posterior
- manter integrações desacopladas
- tratar compliance desde o começo

O que normalmente quebra esse tipo de produto não é falta de tela.  
É falta de:
- modelagem financeira correta
- sincronização confiável
- performance
- explicabilidade
- governança


---

## Fontes consultadas

- CVM — Consultores de Valores Mobiliários
- CVM/Brasil — assuntos regulados e participantes do mercado
- Open Finance Brasil — portal oficial
- Belvo Developers — documentação oficial
- Plaid — Investments API docs
- Polygon — portal oficial
- Twelve Data — documentação oficial
- Alpha Vantage — documentação oficial
- B3 for Developers — portal oficial
- Stripe Connect — documentação oficial
- Firebase Cloud Messaging — documentação oficial

Observação: as referências acima foram usadas para validar direcionamento regulatório e escolha de APIs/serviços na data desta elaboração.
