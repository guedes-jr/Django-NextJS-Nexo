<p align="center">
  <img src="./logo.png" alt="NEXO Logo" width="220" />
</p>

# NEXO — Terminal de Inteligência Patrimonial

NEXO é um ecossistema **Fullstack (Django + Next.js)** projetado para consolidação patrimonial, análise quantitativa e gestão de portfólios multi-ativos. Criada para investidores de alta renda e plataformas de Wealth Management, a NEXO une o rigor matemático do mercado financeiro a uma interface focada em alta performance e estética **Glassmorphism**.

---

## 🎨 Interface Premium
*(Substitua estas imagens pelos prints reais da pasta root)*

### Dashboard Analítico
![Dashboard NEXO](./readme_dashboard.png)
*Visualização dinâmica de alocação por classe de ativos e rentabilidade via Gráfico Donut.*

### Autenticação Inteligente
![Login NEXO](./readme_login.png)
*Fluxo de Login seguro com JWT e background geométrico interativo com rastreamento de mouse.*

---

## ✨ Funcionalidades Atuais (Etapa 5/6)

- **[x] Autenticação Robusta:** Sistema JWT completo com login, registro e tokens de renovação.
- **[x] Onboarding Interativo:** Fluxo guiado para perfil do investidor (Suitability) e configuração de corretoras parceiras.
- **[x] Gestão Multi-Ativos:** Suporte nativo para Ações (B3), FIIs e Criptoativos.
- **[x] Dashboard Dinâmico:** Gráficos de alocação renderizados via CSS puro e tabelas de posições calculadas em tempo real.
- **[x] Camada de Market Data:** Arquitetura de provedores preparada para integração com Yahoo Finance e Open Finance.

---

## 🚀 Como Iniciar (Ambiente Local)

A estrutura do projeto conta com pequenos atalhos prontos para ligar todo o ecossistema a partir de um único terminal:

**1. Instalar as Dependências:**
```bash
make setup
```

**2. Executar em Conjunto (API + Frontend):**
```bash
make dev
```

*O frontend rodará em `http://localhost:3000` e a API em `http://localhost:8001` (porta atualizada para evitar conflitos de sistema).*

---

## 🛠 Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | Next.js (App Router), TypeScript, CSS Modules |
| **Backend** | Django 4.2+, DRF, SimpleJWT, yfinance |
| **Banco de Dados** | PostgreSQL, Redis, SQLite (Dev Fallback) |
| **DevOps** | Docker, Makefile, Shell Scripting |

---

## 🏗 Arquitetura Modular

Estruturada para escala maciça usando o padrão *Modular Monolith*:

```
NEXO/
├── frontend/             # Next.js SPA
│   ├── src/app/onboarding # Wizard de Suitability
│   └── src/app/(auth)     # Telas de Acesso
├── backend/              # Django API Engine
│   ├── apps/
│   │   ├── identity/     # Users & Auth & Profiles
│   │   ├── portfolio/    # Assets & Positions & Calculus
│   │   └── market_data/  # Yahoo Finance Providers
└── start.sh              # Orquestrador de processos
```

---

### 🛡 Observação Técnica (IA Agents)
> Os arquivos de contexto na raiz (`plano_plataforma_investimentos.md` e artefatos `.ai`) guiam a evolução sequencial do produto. Mantenha essa estrutura para continuidade do desenvolvimento assistido.
