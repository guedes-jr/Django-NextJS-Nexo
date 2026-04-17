"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      const sections = ['hero', 'features', 'benefits', 'how-it-works', 'testimonials', 'pricing', 'faq', 'contact'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const features = [
    {
      icon: '📊',
      title: 'Dashboard Inteligente',
      description: 'Visualize todo o seu patrimônio em tempo real com gráficos interativos e métricas personalizadas.'
    },
    {
      icon: '🤖',
      title: 'Automação Inteligente',
      description: 'Crie regras automáticas para alertas, rebalanceamento e notificaciones baseadas em condições do mercado.'
    },
    {
      icon: '🎯',
      title: 'Metas e Simulações',
      description: 'Defina objetivos financeiros e simule diferentes cenários para alcançar seus sonhos.'
    },
    {
      icon: '🔗',
      title: 'Conexão de Corretoras',
      description: 'Conecte suas contas de múltiplas corretoras em um único lugar de forma segura.'
    },
    {
      icon: '📈',
      title: 'Análise Avançada',
      description: 'Compare com benchmarks, analise concentração e acompanhe a evolução patrimonial.'
    },
    {
      icon: '🔔',
      title: 'Notificações Smart',
      description: 'Receba alertas sobre dividendos, eventos corporativos e oportunidades do mercado.'
    }
  ];

  const benefits = [
    { number: '01', title: 'Visão Consolidada', description: 'Tenha uma visão completa de todos os seus investimentos em um único dashboard.' },
    { number: '02', title: 'Decisões Informadas', description: 'Dados em tempo real para tomar as melhores decisões financeiras.' },
    { number: '03', title: 'Autonomia', description: 'Gerencie seu patrimônio sem depender de consultores ouanalistas.' },
    { number: '04', title: 'Segurança', description: 'Seus dados protegidos com criptografia de nível bancário.' }
  ];

  const steps = [
    { step: '1', title: 'Crie sua conta', description: 'Cadastro rápido e gratuito em menos de 2 minutos.' },
    { step: '2', title: 'Importe seus ativos', description: 'Adicione manualmente ou importe via arquivo CSV/Excel.' },
    { step: '3', title: 'Conecte corretoras', description: 'Integre suas contas para sincronização automática.' },
    { step: '4', title: 'Acompanhe e otimize', description: 'Use insights e recomendações para melhorar seus resultados.' }
  ];

  const testimonials = [
    { name: 'Carlos Silva', role: 'Investidor', text: 'O NEXO transformou a forma como acompanho meus investimentos. Agora tenho tudo em um só lugar.', avatar: 'CS' },
    { name: 'Ana Paula', role: 'Trader', text: 'A análise de concentração e os alertas automáticos me ajudam a manter a carteira equilibrada.', avatar: 'AP' },
    { name: 'Roberto Chen', role: 'Empresário', text: 'Simulações de metas e cenários me ajudam a planejar melhor minha aposentadoria.', avatar: 'RC' }
  ];

  const plans = [
    {
      name: 'Gratuito',
      price: 'R$ 0',
      period: '/mês',
      features: ['Dashboard básico', 'Até 3 contas', 'Alertas manuais', 'Suporte por email'],
      cta: 'Começar Grátis',
      highlight: false
    },
    {
      name: 'Premium',
      price: 'R$ 29',
      period: '/mês',
      features: ['Dashboard completo', 'Contas ilimitadas', 'Automações avançadas', 'Análise de risco', 'Suporte priority', 'Relatórios exportáveis'],
      cta: 'Assinar Premium',
      highlight: true
    },
    {
      name: 'Pro',
      price: 'R$ 59',
      period: '/mês',
      features: ['Tudo do Premium', 'API de integração', 'Consultor dedicado', 'Relatórios customizados', 'White-label', 'SLA garantido'],
      cta: 'Falar com Consultor',
      highlight: false
    }
  ];

  const faqs = [
    { q: 'O NEXO é seguro?', a: 'Sim! Utilizamos criptografia de nível bancário e não armazenamos senhas de suas corretoras.' },
    { q: 'Preciso pagar para usar?', a: 'O plano gratuito oferece funcionalidades básicas. Para recursos avançados, temos planos pagos.' },
    { q: 'Como conecto minha corretora?', a: 'No momento oferecemos conexão manual. Em breve integrações automáticas via Open Finance.' },
    { q: 'Posso importar dados do Excel?', a: 'Sim! Você pode importar posições via arquivo CSV ou Excel facilmente.' }
  ];

  return (
    <div className="landing">
      <style>{`
        :root {
          --primary: #6366f1;
          --primary-dark: #4f46e5;
          --secondary: #22c55e;
          --accent: #f59e0b;
          --dark: #0f172a;
          --dark-2: #1e293b;
          --light: #f8fafc;
          --text: #e2e8f0;
          --text-muted: #94a3b8;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--dark); color: var(--text); }
        
        .landing { min-height: 100vh; overflow-x: hidden; }
        
        /* Navigation */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          background: ${scrolled ? 'rgba(15, 23, 42, 0.9)' : 'transparent'};
          backdrop-filter: ${scrolled ? 'blur(20px)' : 'none'};
          border-bottom: ${scrolled ? '1px solid rgba(99, 102, 241, 0.1)' : 'none'};
        }
        
        .logo { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; font-weight: 700; }
        .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        
        .nav-links { display: flex; gap: 2rem; align-items: center; }
        .nav-link { color: var(--text-muted); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
        .nav-link:hover, .nav-link.active { color: var(--primary); }
        
        .nav-cta { background: var(--primary); color: white; padding: 0.6rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.2s; }
        .nav-cta:hover { background: var(--primary-dark); transform: translateY(-2px); }
        
        /* Hero */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 6rem 2rem 4rem;
          overflow: hidden;
        }
        
        .hero-bg {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at ${mousePosition.x}% ${mousePosition.y}%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 20% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 40%);
        }
        
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 20s linear infinite;
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
        
        .hero-3d {
          position: absolute;
          width: 600px;
          height: 600px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: conic-gradient(from 0deg, transparent 0%, var(--primary) 10%, transparent 20%, var(--secondary) 30%, transparent 40%, var(--accent) 50%, transparent 60%, var(--primary) 70%, transparent 80%, var(--secondary) 90%, transparent 100%);
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: rotate3d 30s linear infinite;
        }
        
        @keyframes rotate3d {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 900px;
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-size: 0.875rem;
          color: var(--primary);
          margin-bottom: 1.5rem;
          animation: fadeInUp 0.6s ease;
        }
        
        .hero h1 {
          font-size: 4.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 50%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: fadeInUp 0.6s ease 0.1s both;
        }
        
        .hero h1 span {
          background: linear-gradient(135deg, var(--secondary), var(--accent));
          -webkit-background-clip: text;
          background-clip: text;
        }
        
        .hero p {
          font-size: 1.25rem;
          color: var(--text-muted);
          margin-bottom: 2.5rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          animation: fadeInUp 0.6s ease 0.2s both;
        }
        
        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          animation: fadeInUp 0.6s ease 0.3s both;
        }
        
        .btn {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white;
          box-shadow: 0 10px 40px rgba(99, 102, 241, 0.3);
        }
        
        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(99, 102, 241, 0.4);
        }
        
        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--primary);
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 4rem;
          margin-top: 4rem;
          animation: fadeInUp 0.6s ease 0.4s both;
        }
        
        .stat-item { text-align: center; }
        .stat-number { font-size: 2.5rem; font-weight: 700; color: var(--primary); }
        .stat-label { font-size: 0.875rem; color: var(--text-muted); }
        
        /* Features */
        .features { padding: 6rem 2rem; position: relative; }
        .section-title { text-align: center; margin-bottom: 4rem; }
        .section-title h2 { font-size: 2.5rem; margin-bottom: 1rem; }
        .section-title p { color: var(--text-muted); font-size: 1.1rem; }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .feature-card {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 20px;
          padding: 2rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--primary), var(--secondary));
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .feature-card:hover { transform: translateY(-10px); border-color: var(--primary); }
        .feature-card:hover::before { opacity: 1; }
        
        .feature-icon { font-size: 3rem; margin-bottom: 1rem; }
        .feature-card h3 { font-size: 1.25rem; margin-bottom: 0.75rem; }
        .feature-card p { color: var(--text-muted); line-height: 1.6; }
        
        /* Benefits */
        .benefits { padding: 6rem 2rem; background: linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.05)); }
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 3rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .benefit-item {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }
        
        .benefit-number {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }
        
        .benefit-content h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
        .benefit-content p { color: var(--text-muted); }
        
        /* How it Works */
        .how-it-works { padding: 6rem 2rem; }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .step-card {
          text-align: center;
          position: relative;
        }
        
        .step-number {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
        }
        
        .step-card h3 { margin-bottom: 0.75rem; }
        .step-card p { color: var(--text-muted); font-size: 0.9rem; }
        .step-connector {
          position: absolute;
          top: 30px;
          right: -50%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, var(--primary), transparent);
        }
        
        /* Testimonials */
        .testimonials { padding: 6rem 2rem; background: linear-gradient(180deg, transparent, rgba(34, 197, 94, 0.03)); }
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .testimonial-card {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 2rem;
        }
        
        .testimonial-card p { font-size: 1rem; line-height: 1.7; margin-bottom: 1.5rem; color: var(--text-muted); }
        
        .testimonial-author { display: flex; align-items: center; gap: 1rem; }
        .testimonial-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        
        .testimonial-info h4 { font-size: 1rem; }
        .testimonial-info span { font-size: 0.875rem; color: var(--text-muted); }
        
        /* Pricing */
        .pricing { padding: 6rem 2rem; }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .pricing-card {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 2.5rem;
          text-align: center;
          transition: all 0.3s;
        }
        
        .pricing-card.highlight {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(34, 197, 94, 0.1));
          border-color: var(--primary);
          transform: scale(1.05);
        }
        
        .pricing-card h3 { font-size: 1.5rem; margin-bottom: 1rem; }
        .pricing-price { font-size: 3rem; font-weight: 800; margin-bottom: 0.5rem; }
        .pricing-price span { font-size: 1rem; color: var(--text-muted); font-weight: 400; }
        .pricing-features { list-style: none; margin: 2rem 0; text-align: left; }
        .pricing-features li { padding: 0.75rem 0; color: var(--text-muted); display: flex; gap: 0.75rem; }
        .pricing-features li::before { content: '✓'; color: var(--secondary); }
        
        /* FAQ */
        .faq { padding: 6rem 2rem; max-width: 800px; margin: 0 auto; }
        .faq-item {
          background: rgba(30, 41, 59, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          margin-bottom: 1rem;
          overflow: hidden;
        }
        
        .faq-question {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-weight: 600;
        }
        
        .faq-answer {
          padding: 0 1.5rem 1.5rem;
          color: var(--text-muted);
          line-height: 1.7;
        }
        
        /* Contact */
        .contact { padding: 6rem 2rem; background: linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.1)); }
        .contact-content {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }
        
        .contact h2 { font-size: 2.5rem; margin-bottom: 1rem; }
        .contact p { color: var(--text-muted); margin-bottom: 2rem; }
        
        .contact-form {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        
        .contact-form input {
          padding: 1rem 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          width: 300px;
          font-size: 1rem;
        }
        
        .contact-form input::placeholder { color: var(--text-muted); }
        
        /* Footer */
        .footer {
          padding: 3rem 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          color: var(--text-muted);
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
          .features-grid, .testimonials-grid, .pricing-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .benefits-grid { grid-template-columns: 1fr; }
          .hero h1 { font-size: 3rem; }
        }
        
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .hero-stats { flex-direction: column; gap: 2rem; }
          .contact-form { flex-direction: column; }
          .contact-form input { width: 100%; }
          .steps-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="nav">
        <div className="logo">
          <div className="logo-icon">💎</div>
          <span>NEXO</span>
        </div>
        <div className="nav-links">
          <a href="#features" className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}>Recursos</a>
          <a href="#benefits" className={`nav-link ${activeSection === 'benefits' ? 'active' : ''}`}>Benefícios</a>
          <a href="#how-it-works" className={`nav-link ${activeSection === 'how-it-works' ? 'active' : ''}`}>Como Funciona</a>
          <a href="#pricing" className={`nav-link ${activeSection === 'pricing' ? 'active' : ''}`}>Planos</a>
          <a href="#faq" className={`nav-link ${activeSection === 'faq' ? 'active' : ''}`}>FAQ</a>
        </div>
        <Link href="/login" className="nav-cta">Entrar</Link>
      </nav>

      {/* Hero */}
      <section id="hero" className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-3d"></div>
        <div className="hero-content">
          <div className="hero-badge">
            ✨ Plataforma #1 de Gestão de Investimentos
          </div>
          <h1>
            Organize suas finanças.<br />
            <span>Construa seu futuro.</span>
          </h1>
          <p>
            A plataforma completa para gerenciar seu patrimônio com inteligência. 
            Acompanhe, analise e otimize seus investimentos em um único lugar.
          </p>
          <div className="hero-buttons">
            <Link href="/register" className="btn btn-primary">
              Começar Gratuitamente
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
              Ver Como Funciona
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Usuários</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">R$ 2B+</div>
              <div className="stat-label">Patrimônio Gerenciado</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">4.9</div>
              <div className="stat-label">Avaliação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features">
        <div className="section-title">
          <h2>Recursos Potentes</h2>
          <p>Tudo que você precisa para gerenciar seus investimentos</p>
        </div>
        <div className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="benefits">
        <div className="section-title">
          <h2>Por que escolher o NEXO?</h2>
          <p>Mais que uma plataforma, um parceiro para suas finanças</p>
        </div>
        <div className="benefits-grid">
          {benefits.map((benefit, i) => (
            <div key={i} className="benefit-item">
              <div className="benefit-number">{benefit.number}</div>
              <div className="benefit-content">
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-title">
          <h2>Como Começar</h2>
          <p>Em poucos minutos você já está no controle</p>
        </div>
        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{step.step}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {i < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials">
        <div className="section-title">
          <h2>O que dizem nossos usuários</h2>
          <p>Depoimentos de quem já transformou a gestão dos investimentos</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="testimonial-card">
              <p>"{testimonial.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{testimonial.avatar}</div>
                <div className="testimonial-info">
                  <h4>{testimonial.name}</h4>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing">
        <div className="section-title">
          <h2>Planos para todos os perfis</h2>
          <p>Escolha o plano que melhor se adapta às suas necessidades</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <div key={i} className={`pricing-card ${plan.highlight ? 'highlight' : ''}`}>
              <h3>{plan.name}</h3>
              <div className="pricing-price">
                {plan.price}<span>{plan.period}</span>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature, j) => (
                  <li key={j}>{feature}</li>
                ))}
              </ul>
              <Link href="/register" className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="faq">
        <div className="section-title">
          <h2>Perguntas Frequentes</h2>
          <p>Tire suas dúvidas sobre o NEXO</p>
        </div>
        {faqs.map((faq, i) => (
          <div key={i} className="faq-item">
            <div className="faq-question">
              {faq.q}
              <span>▼</span>
            </div>
            <div className="faq-answer">{faq.a}</div>
          </div>
        ))}
      </section>

      {/* Contact */}
      <section id="contact" className="contact">
        <div className="contact-content">
          <h2>Pronto para começar?</h2>
          <p>Receba novidades e atualizações sobre o NEXO</p>
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Seu melhor email" />
            <button type="submit" className="btn btn-primary">Inscrever-se</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2024 NEXO. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}