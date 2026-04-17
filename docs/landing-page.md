# Landing Page NEXO

## Visão Geral

Página pública de divulgação do sistema NEXO, acessível em `/` (raiz). Design moderno e sofisticado com efeitos 3D e 8 seções completas.

## Estrutura

A landing page é dividida em 8 seções principais:

1. **Hero** - Banner principal com efeito 3D, título animado e CTAs
2. **Features** - Cards com os principais recursos da plataforma
3. **Benefits** - Benefícios e diferenciais do NEXO
4. **How it Works** - Passo a passo para começar
5. **Testimonials** - Depoimentos de usuários
6. **Pricing** - Planos disponíveis (Gratuito, Premium, Pro)
7. **FAQ** - Perguntas frequentes
8. **Contact** - Formulário de newsletter

## Design

### Características
- **Efeitos 3D**: Círculo rotativoanimated com gradiente
- **Background dinâmico**: Grid animado que se move
- **Interação com mouse**: Gradiente que segue o cursor
- **Animações**: Fade-in, transições suaves, hover effects
- **Responsivo**: Totalmente adaptável para mobile

### Cores (tons mais escuros)
- Primary: #4f46e5 (Indigo mais escuro)
- Primary Dark: #3730a3 (Indigo escuro)
- Secondary: #16a34a (Green mais escuro)
- Accent: #d97706 (Amber escuro)
- Dark: #020617 (slate 950 - mais escuro)
- Dark-2: #0f172a (slate 900)
- Dark-3: #1e293b (slate 800)
- Text: #f1f5f9 (slate 100)
- Text Muted: #94a3b8 (slate 400)
- Text Dim: #64748b (slate 500)

## Navegação

- Links para seções: Features, Benefícios, Como Funciona, Planos, FAQ
- Botão "Entrar" redireciona para `/login`
- Botões CTA redirecionam para `/register`

## Acesso

A landing page está disponível na URL raiz: `/`

Os usuários autenticados são redirecionados para o dashboard em `/dashboard`.

## Arquivos Relacionados

- `/frontend/src/app/(marketing)/page.tsx` - Componente principal
- `/frontend/src/app/(marketing)/layout.tsx` - Layout do marketing
- `/frontend/src/app/layout.tsx` - Layout raiz