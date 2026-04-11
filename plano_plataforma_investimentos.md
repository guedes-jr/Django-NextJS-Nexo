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

#### Módulo A — Conta e identidade
Ordem de desenvolvimento:
- [ ] 1. cadastro
- [ ] 2. login
- [ ] 3. recuperação de senha
- [ ] 4. MFA
- [ ] 5. gestão de sessões
- [ ] 6. dispositivos confiáveis
- [ ] 7. perfil do usuário
- [ ] 8. preferências
- [ ] 9. consentimentos e termos
- [ ] 10. trilha de aceite de documentos

#### Módulo B — Onboarding financeiro
- [ ] 1. wizard de onboarding
- [ ] 2. perfil do investidor
- [ ] 3. suitability
- [ ] 4. objetivo financeiro
- [ ] 5. horizonte de investimento
- [ ] 6. tolerância a risco
- [ ] 7. classificação de perfil
- [ ] 8. documentação obrigatória
- [ ] 9. aprovação interna/manual quando necessário

#### Módulo C — Consolidação patrimonial
- [ ] 1. contas
- [ ] 2. corretoras
- [ ] 3. investimentos
- [ ] 4. posição consolidada
- [ ] 5. saldo total
- [ ] 6. patrimônio líquido
- [ ] 7. evolução patrimonial
- [ ] 8. composição por classe
- [ ] 9. composição por instituição
- [ ] 10. composição por moeda
- [ ] 11. visão por conta e por titularidade

#### Módulo D — Carteira e posição
- [ ] 1. renda fixa
- [ ] 2. renda variável
- [ ] 3. fundos
- [ ] 4. ETFs
- [ ] 5. ações
- [ ] 6. FIIs
- [ ] 7. cripto
- [ ] 8. previdência
- [ ] 9. caixa
- [ ] 10. ativos internacionais
- [ ] 11. posição atual
- [ ] 12. preço médio
- [ ] 13. quantidade
- [ ] 14. custo de aquisição
- [ ] 15. ganho/perda realizado
- [ ] 16. ganho/perda não realizado
- [ ] 17. dividendos e proventos

#### Módulo E — Movimentações e importações
- [ ] 1. aportes
- [ ] 2. resgates
- [ ] 3. compras
- [ ] 4. vendas
- [ ] 5. dividendos
- [ ] 6. juros
- [ ] 7. amortizações
- [ ] 8. taxas
- [ ] 9. impostos
- [ ] 10. transferências entre contas
- [ ] 11. importação manual
- [ ] 12. importação por arquivo
- [ ] 13. importação por integração
- [ ] 14. reconciliação automática
- [ ] 15. reconciliação manual

#### Módulo F — Mercado e dados financeiros
- [ ] 1. cotações
- [ ] 2. histórico de preços
- [ ] 3. indicadores
- [ ] 4. fundamentos
- [ ] 5. eventos corporativos
- [ ] 6. calendários
- [ ] 7. notícias
- [ ] 8. comparativos entre ativos
- [ ] 9. benchmarks
- [ ] 10. indicadores macro
- [ ] 11. curvas e indexadores

#### Módulo G — Inteligência da carteira
- [ ] 1. alocação ideal
- [ ] 2. rebalanceamento sugerido
- [ ] 3. análise de concentração
- [ ] 4. risco por classe
- [ ] 5. volatilidade
- [ ] 6. correlação
- [ ] 7. drawdown
- [ ] 8. comparação com benchmark
- [ ] 9. score de saúde da carteira
- [ ] 10. alertas de desvio de alocação
- [ ] 11. alertas de vencimento
- [ ] 12. alertas de oportunidade

#### Módulo H — Objetivos e planejamento
- [ ] 1. metas financeiras
- [ ] 2. plano de aporte
- [ ] 3. simulação de acumulação
- [ ] 4. simulação de aposentadoria
- [ ] 5. reserva de emergência
- [ ] 6. objetivos com prazo
- [ ] 7. projeções com cenários
- [ ] 8. sugestão de esforço mensal

#### Módulo I — Notificações e comunicação
- [ ] 1. push
- [ ] 2. e-mail
- [ ] 3. alertas dentro da plataforma
- [ ] 4. centro de notificações
- [ ] 5. preferências de notificação
- [ ] 6. gatilhos por evento
- [ ] 7. campanhas segmentadas
- [ ] 8. lembretes de aporte
- [ ] 9. avisos regulatórios

#### Módulo J — Documentos e compliance
- [ ] 1. termos
- [ ] 2. contratos
- [ ] 3. notas
- [ ] 4. extratos
- [ ] 5. informes
- [ ] 6. comprovantes
- [ ] 7. logs de aceite
- [ ] 8. retenção documental
- [ ] 9. trilha de auditoria
- [ ] 10. versionamento de políticas

#### Módulo K — Área administrativa
- [ ] 1. gestão de usuários
- [ ] 2. gestão de perfis
- [ ] 3. permissões
- [ ] 4. suporte
- [ ] 5. monitoramento de integrações
- [ ] 6. reconciliações pendentes
- [ ] 7. filas e jobs
- [ ] 8. feature flags
- [ ] 9. conteúdo institucional
- [ ] 10. CMS para banners, cards, FAQs e mensagens

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
- [ ] 1. visão do produto
- [ ] 2. definição do público
- [ ] 3. proposta de valor
- [ ] 4. diferenciais
- [ ] 5. benchmark de mercado
- [ ] 6. recorte do MVP
- [ ] 7. definição do modelo operacional:
   - agregador
   - consultivo
   - transacional
   - híbrido
- [ ] 8. mapa regulatório inicial
- [ ] 9. definição de monetização
- [ ] 10. matriz de riscos

#### Perguntas obrigatórias
- A plataforma será B2C, B2B ou B2B2C?
- Haverá execução de ordens ou apenas consolidação?
- O foco inicial é Brasil ou multi-país?
- O usuário poderá conectar corretoras automaticamente?
- Haverá recomendação automatizada?
- Haverá consultoria humana?
- A receita virá de assinatura, comissão, fee de assessoria, distribuição ou white-label?

Sem isso, qualquer backlog nasce errado.

---

### Fase 1 — Descoberta funcional detalhada

#### Ordem de execução
- [ ] 1. mapear jornadas
- [ ] 2. mapear personas
- [ ] 3. definir casos de uso
- [ ] 4. definir regras de negócio
- [ ] 5. definir métricas do produto
- [ ] 6. definir níveis de acesso
- [ ] 7. definir arquitetura de permissões
- [ ] 8. definir requisitos regulatórios
- [ ] 9. transformar tudo em épicos e user stories
- [ ] 10. priorizar backlog

#### Jornadas obrigatórias
- cadastro e login
- onboarding
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
- [ ] 4. logout
- [ ] 5. reset de senha
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
- [ ] 4. horizonte
- [x] 5. perfil de risco
- [x] 6. suitability
- [ ] 7. aceite de termos
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
- [ ] 5. estrutura de holdings
- [x] 6. estrutura de transações (base Position)
- [ ] 7. estrutura de eventos corporativos
- [ ] 8. snapshots de carteira
- [ ] 9. benchmarks
- [ ] 10. metas e objetivos
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
- [ ] 4. alocação por instituição
- [x] 5. principais posições (Tabela Assets)
- [ ] 6. metas
- [ ] 7. alertas
- [ ] 8. últimas movimentações
- [ ] 9. cards de insight
- [ ] 10. visão resumida mobile

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
- [ ] 1. lista de ativos
- [ ] 2. filtros
- [ ] 3. busca
- [ ] 4. visão detalhada por ativo
- [ ] 5. preço médio
- [ ] 6. retorno absoluto
- [ ] 7. retorno percentual
- [ ] 8. benchmark
- [ ] 9. eventos corporativos
- [ ] 10. histórico de movimentações
- [ ] 11. composição da carteira
- [ ] 12. concentração e risco

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
Objetivo: sair do “mostrar dados” para “orientar ação”.

#### Sequência
- [ ] 1. cálculo de exposição
- [ ] 2. desvio da alocação alvo
- [ ] 3. score da carteira
- [ ] 4. alertas de concentração
- [ ] 5. alertas de risco
- [ ] 6. sugestões de rebalanceamento
- [ ] 7. simulações antes/depois
- [ ] 8. comparação com benchmark
- [ ] 9. projeções por cenário
- [ ] 10. explicação das recomendações

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
- rebalanceamento
- insights
- benchmarking
- simuladores
- reconciliação avançada
- documentos
- push
- analytics
- gestão operacional madura

### Release 3 — Produto premium
Inclui:
- inteligência de carteira avançada
- explicações de recomendação
- metas complexas
- objetivos avançados
- alertas sofisticados
- automações
- integrações ampliadas
- experiência mobile premium

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
