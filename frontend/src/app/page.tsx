import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
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
            <span className={styles.statLabel}>Patrimônio Líquido</span>
            <span className={styles.statValue}>R$ 1.284.590,00</span>
            <div>
              <span className={`${styles.statChange} ${styles.positive}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                +2.45%
              </span>
              <span className={styles.statLabel} style={{ marginLeft: '8px' }}>esse mês</span>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel animate-fade-in`} style={{ animationDelay: '0.2s' }}>
            <span className={styles.statLabel}>Rentabilidade Acumulada</span>
            <span className={styles.statValue}>+14.2%</span>
            <div>
              <span className={`${styles.statChange} ${styles.positive}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                Acima do CDI (+120%)
              </span>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel animate-fade-in`} style={{ animationDelay: '0.3s' }}>
            <span className={styles.statLabel}>Proventos do Mês</span>
            <span className={styles.statValue}>R$ 4.250,50</span>
            <div>
              <span className={`${styles.statChange} ${styles.negative}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
                -1.2%
              </span>
              <span className={styles.statLabel} style={{ marginLeft: '8px' }}>vs mês passado</span>
            </div>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <div className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.4s' }}>
            <div className={styles.sectionHeader}>
              <h2>Evolução Patrimonial</h2>
              <button className={styles.viewAll}>Detalhes</button>
            </div>
            <div className={styles.chartPlaceholder}>
              Gráfico Dinâmico de Patrimônio
              <div className={styles.chartLine}></div>
            </div>
          </div>

          <div className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.5s' }}>
            <div className={styles.sectionHeader}>
              <h2>Top Alocações</h2>
              <button className={styles.viewAll}>Ver Carteira</button>
            </div>
            
            <div className={styles.assetList}>
              <div className={styles.assetItem}>
                <div className={styles.assetInfo}>
                  <div className={styles.assetIcon}>IT</div>
                  <div>
                    <div className={styles.assetName}>Itaú Unibanco</div>
                    <div className={styles.assetTicker}>ITUB4</div>
                  </div>
                </div>
                <div className={styles.assetValues}>
                  <div className={styles.assetPrice}>R$ 45.200,00</div>
                  <div className={`${styles.assetChange} ${styles.positive}`}>+1.2%</div>
                </div>
              </div>
              
              <div className={styles.assetItem}>
                <div className={styles.assetInfo}>
                  <div className={styles.assetIcon}>WE</div>
                  <div>
                    <div className={styles.assetName}>WEG S.A.</div>
                    <div className={styles.assetTicker}>WEGE3</div>
                  </div>
                </div>
                <div className={styles.assetValues}>
                  <div className={styles.assetPrice}>R$ 38.450,00</div>
                  <div className={`${styles.assetChange} ${styles.positive}`}>+0.8%</div>
                </div>
              </div>

              <div className={styles.assetItem}>
                <div className={styles.assetInfo}>
                  <div className={styles.assetIcon} style={{ background: '#f59e0b', color: '#000' }}>₿</div>
                  <div>
                    <div className={styles.assetName}>Bitcoin</div>
                    <div className={styles.assetTicker}>BTC</div>
                  </div>
                </div>
                <div className={styles.assetValues}>
                  <div className={styles.assetPrice}>R$ 125.000,00</div>
                  <div className={`${styles.assetChange} ${styles.negative}`}>-2.4%</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
