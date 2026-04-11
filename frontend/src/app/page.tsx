"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null); // State da API

  useEffect(() => {
    // Checagem basica Client-side de seguranca por Token
    const token = localStorage.getItem('nexo_access');
    if (!token) {
      router.push('/login');
    } else {
      setMounted(true);
      
      // Bate no Backend Mágico do NEXO
      fetch('http://localhost:8001/api/portfolio/summary/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setSummary(data);
        setLoading(false);
      });
    }
  }, [router]);

  if (!mounted || loading) return null; // Previne glitch na tela

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="NEXO Logo" width={36} height={36} />
          <span>NEXO</span>
        </div>
        
        <nav className={styles.nav}>
          <button className={`${styles.navItem} ${styles.active}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Dashboard
          </button>
          <button className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            Carteira
          </button>
          <button className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Movimentações
          </button>
          <button className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Metas
          </button>
          <button className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Alertas
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className="text-gradient animate-fade-in">Visão Geral</h1>
            <p className={styles.subtitle}>Acompanhe o seu patrimônio consolidado</p>
          </div>
          <div className={styles.userInfo}>
            <button className={`${styles.navItem} ${styles.glassPanel}`} style={{ padding: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </button>
            <div className={styles.avatar}>JG</div>
          </div>
        </header>

        <section className={styles.dashboardGrid}>
          <div className={`${styles.statCard} glass-panel animate-fade-in`} style={{ animationDelay: '0.1s' }}>
            <span className={styles.statLabel}>Patrimônio Líquido Real</span>
            <span className={styles.statValue}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary?.total_balance || 0)}
            </span>
            <div>
              <span className={`${styles.statChange} ${styles.positive}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                Ativo
              </span>
              <span className={styles.statLabel} style={{ marginLeft: '8px' }}>via API do Django</span>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel animate-fade-in`} style={{ animationDelay: '0.2s' }}>
            <span className={styles.statLabel}>Rentabilidade da Carteira</span>
            <span className={styles.statValue}>Variavel</span>
            <div>
              <span className={`${styles.statChange} ${styles.positive}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                Calculando ao vivo
              </span>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel animate-fade-in`} style={{ animationDelay: '0.3s' }}>
            <span className={styles.statLabel}>Market Data</span>
            <span className={styles.statValue}>Offline</span>
            <div>
              <span className={`${styles.statChange} ${styles.negative}`}>Aguardando Módulo 6</span>
            </div>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <div className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.4s' }}>
            <div className={styles.sectionHeader}>
              <h2>Alocação Inteligente</h2>
              <button className={styles.viewAll}>Rebalancear</button>
            </div>
            
            {/* O Pulo do Gato: Gráfico Donut de CSS usando state */}
            {(() => {
              const pA = summary?.allocations_pct?.ACAO || 0;
              const pF = summary?.allocations_pct?.FII || 0;
              const pC = summary?.allocations_pct?.CRIPTO || 0;
              
              // Colors logic mapping
              const pA_end = pA;
              const pF_end = pA + pF;
              // ACAO=Blue, FII=Purple, CRIPTO=Yellow/Orange
              const conicStr = `conic-gradient(#3b82f6 0% ${pA_end}%, #8b5cf6 ${pA_end}% ${pF_end}%, #f59e0b ${pF_end}% 100%)`;

              return (
                <div className={styles.donutWrapper}>
                  <div className={styles.donutChart} style={{ background: conicStr }}>
                    <div className={styles.donutHole}>
                      <span className={styles.donutLabel}>Total</span>
                      <span className={styles.donutTotal}>100%</span>
                    </div>
                  </div>
                  
                  <div className={styles.legendList}>
                    <div className={styles.legendItem}>
                      <div className={styles.legendKey}><div className={styles.legendColor} style={{background:'#3b82f6'}}></div>Ações Nacionais</div>
                      <span>{pA.toFixed(1)}%</span>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={styles.legendKey}><div className={styles.legendColor} style={{background:'#8b5cf6'}}></div>FII (Imóveis)</div>
                      <span>{pF.toFixed(1)}%</span>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={styles.legendKey}><div className={styles.legendColor} style={{background:'#f59e0b'}}></div>Criptomoedas</div>
                      <span>{pC.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })()}
            
          </div>

          <div className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.5s' }}>
            <div className={styles.sectionHeader}>
              <h2>Top Alocações</h2>
              <button className={styles.viewAll}>Ver Carteira Completa</button>
            </div>
            
            <div className={styles.assetList}>
              {(summary?.positions || []).map((pos: any) => {
                const totalValue = pos.quantity * pos.current_price;
                const profitPct = ((pos.current_price - pos.average_price) / pos.average_price) * 100;
                const isPositive = profitPct >= 0;
                const iconMap:Record<string,{bg:string, color:string, short:string}> = {
                  'CRIPTO': { bg: '#f59e0b', color: '#000', short: '₿' },
                  'FII': { bg: '#8b5cf6', color: '#fff', short: 'FII' },
                  'ACAO': { bg: 'rgba(255,255,255,0.1)', color: '#fff', short: pos.asset.ticker.substring(0,2) }
                };
                const config = iconMap[pos.asset.asset_type] || iconMap['ACAO'];

                return (
                  <div className={styles.assetItem} key={pos.id}>
                    <div className={styles.assetInfo}>
                      <div className={styles.assetIcon} style={{ background: config.bg, color: config.color }}>
                        {config.short}
                      </div>
                      <div>
                        <div className={styles.assetName}>{pos.asset.name}</div>
                        <div className={styles.assetTicker}>{pos.asset.ticker} &bull; {pos.quantity} cotas</div>
                      </div>
                    </div>
                    <div className={styles.assetValues}>
                      <div className={styles.assetPrice}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                      </div>
                      <div className={`${styles.assetChange} ${isPositive ? styles.positive : styles.negative}`}>
                        {isPositive ? '+' : ''}{profitPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
