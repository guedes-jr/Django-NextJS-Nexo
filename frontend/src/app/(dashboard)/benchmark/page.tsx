"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Benchmark {
  symbol: string;
  name: string;
  variation_pct: number;
  period: string;
}

export default function BenchmarkPage() {
  const router = useRouter();
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [portfolio, setPortfolio] = useState<{ variation_pct: number; total_cost: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6mo');

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    fetchBenchmarks();
  }, [router, period]);

  const fetchBenchmarks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/portfolio/benchmark/?period=${period}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data.benchmarks || []);
        setPortfolio(data.portfolio);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return sign + value.toFixed(2).replace('.', ',') + '%';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const benchmarkColors: Record<string, string> = {
    'IBOV': '#22c55e',
    'SP500': '#3b82f6',
    'CDI': '#f59e0b',
  };

  const benchmarkIcons: Record<string, string> = {
    'IBOV': '📈',
    'SP500': '🌎',
    'CDI': '💵',
  };

  if (loading) {
    return (
      <div className="container">
        <SharedSidebar />
        <main className="main"><div className="loading">Carregando...</div></main>
      </div>
    );
  }

  return (
    <div className="container">
      <SharedSidebar />
      <main className="main">
        <div className="header">
          <div>
            <h1 className="text-gradient">Benchmarks</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Compare a performance do seu portfólio com os principais índices de mercado</p>
          </div>
        </div>

        <div className="period-selector">
          <button className={`period-btn ${period === '1mo' ? 'active' : ''}`} onClick={() => setPeriod('1mo')}>1M</button>
          <button className={`period-btn ${period === '3mo' ? 'active' : ''}`} onClick={() => setPeriod('3mo')}>3M</button>
          <button className={`period-btn ${period === '6mo' ? 'active' : ''}`} onClick={() => setPeriod('6mo')}>6M</button>
          <button className={`period-btn ${period === '1y' ? 'active' : ''}`} onClick={() => setPeriod('1y')}>1A</button>
        </div>

        {benchmarks.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">📊</span>
            <h3>Nenhum dado disponível</h3>
            <p>Adicione ativos à sua carteira para comparar com os benchmarks</p>
          </div>
        ) : (
          <>
            <div className="portfolio-card">
              <div className="portfolio-header">
                <span className="portfolio-icon">💼</span>
                <span className="portfolio-title">Seu Portfólio</span>
              </div>
              <div className="portfolio-value">
                <span className={`variation ${portfolio && portfolio.variation_pct >= 0 ? 'positive' : 'negative'}`}>
                  {portfolio ? formatPercent(portfolio.variation_pct) : '-'}
                </span>
                <span className="period-label">no período</span>
              </div>
              <div className="portfolio-cost">
                Custo total: {portfolio ? formatCurrency(portfolio.total_cost) : '-'}
              </div>
            </div>

            <div className="benchmarks-grid">
              {benchmarks.map((bm, index) => (
                <div key={bm.symbol} className="benchmark-card" style={{ '--delay': index * 0.1 + 's' } as React.CSSProperties}>
                  <div className="benchmark-header">
                    <span className="benchmark-icon">{benchmarkIcons[bm.symbol] || '📊'}</span>
                    <span className="benchmark-name">{bm.name}</span>
                  </div>
                  <div className="benchmark-value" style={{ color: benchmarkColors[bm.symbol] || '#666' }}>
                    {formatPercent(bm.variation_pct)}
                  </div>
                  <div className="benchmark-bar">
                    <div 
                      className="benchmark-fill"
                      style={{ 
                        width: `${Math.min(Math.abs(bm.variation_pct) * 5, 100)}%`,
                        backgroundColor: benchmarkColors[bm.symbol] || '#666'
                      }}
                    />
                  </div>
                  <div className="benchmark-comparison">
                    {portfolio && portfolio.variation_pct !== undefined && (
                      <span className={bm.variation_pct >= portfolio.variation_pct ? 'behind' : 'ahead'}>
                        {bm.variation_pct >= portfolio.variation_pct ? 'Abaixo do benchmark' : 'Acima do benchmark'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="chart-section">
              <h3>Comparativo Visual</h3>
              <div className="comparison-chart">
                <div className="chart-row">
                  <span className="chart-label">Portfólio</span>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar portfolio-bar"
                      style={{ 
                        width: `${Math.min(Math.abs(portfolio?.variation_pct || 0) * 5, 100)}%`,
                        backgroundColor: (portfolio?.variation_pct || 0) >= 0 ? '#8b5cf6' : '#ef4444'
                      }}
                    />
                  </div>
                  <span className="chart-value">{portfolio ? formatPercent(portfolio.variation_pct) : '-'}</span>
                </div>
                {benchmarks.map(bm => (
                  <div key={bm.symbol} className="chart-row">
                    <span className="chart-label">{bm.name}</span>
                    <div className="chart-bar-container">
                      <div 
                        className="chart-bar"
                        style={{ 
                          width: `${Math.min(Math.abs(bm.variation_pct) * 5, 100)}%`,
                          backgroundColor: benchmarkColors[bm.symbol] || '#666'
                        }}
                      />
                    </div>
                    <span className="chart-value">{formatPercent(bm.variation_pct)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-cards">
              <div className="info-card">
                <span className="info-icon">📈</span>
                <div className="info-content">
                  <h4>Ibovespa (IBOV)</h4>
                  <p>Principal índice da bolsa brasileira. Representa as 50 maiores empresas listadas na B3.</p>
                </div>
              </div>
              <div className="info-card">
                <span className="info-icon">🌎</span>
                <div className="info-content">
                  <h4>S&P 500</h4>
                  <p>Índice das 500 maiores empresas dos EUA. Representa o mercado americano.</p>
                </div>
              </div>
              <div className="info-card">
                <span className="info-icon">💵</span>
                <div className="info-content">
                  <h4>CDI</h4>
                  <p>Taxa DI. Rendimento médio dos investimentos de renda fixa pós-fixados.</p>
                </div>
              </div>
            </div>
          </>
        )}

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          
          .period-selector { display: flex; gap: 8px; }
          .period-btn { background: var(--bg-secondary); border: 1px solid var(--glass-border); color: var(--text-secondary); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
          .period-btn:hover { background: var(--bg-tertiary); }
          .period-btn.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
          
          .portfolio-card { background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary)); border: 1px solid var(--glass-border); border-radius: 16px; padding: 24px; text-align: center; }
          .portfolio-header { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px; }
          .portfolio-icon { font-size: 1.5rem; }
          .portfolio-title { font-size: 1rem; color: var(--text-secondary); }
          .portfolio-value { margin-bottom: 8px; }
          .variation { font-size: 2.5rem; font-weight: 700; }
          .variation.positive { color: #22c55e; }
          .variation.negative { color: #ef4444; }
          .period-label { font-size: 0.875rem; color: var(--text-secondary); }
          .portfolio-cost { font-size: 0.875rem; color: var(--text-secondary); }
          
          .benchmarks-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .benchmark-card { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; animation: fadeIn 0.3s ease var(--delay) both; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .benchmark-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
          .benchmark-icon { font-size: 1.25rem; }
          .benchmark-name { font-weight: 600; }
          .benchmark-value { font-size: 2rem; font-weight: 700; margin-bottom: 12px; }
          .benchmark-bar { height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; margin-bottom: 12px; }
          .benchmark-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
          .benchmark-comparison { font-size: 0.75rem; }
          .benchmark-comparison .behind { color: #ef4444; }
          .benchmark-comparison .ahead { color: #22c55e; }
          
          .chart-section { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 24px; }
          .chart-section h3 { margin: 0 0 20px; font-size: 1rem; }
          .comparison-chart { display: flex; flex-direction: column; gap: 12px; }
          .chart-row { display: grid; grid-template-columns: 100px 1fr 80px; align-items: center; gap: 16px; }
          .chart-label { font-size: 0.875rem; font-weight: 500; }
          .chart-bar-container { height: 24px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; }
          .chart-bar { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
          .chart-value { font-size: 0.875rem; font-weight: 600; text-align: right; }
          
          .info-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .info-card { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 16px; display: flex; gap: 12px; }
          .info-icon { font-size: 1.5rem; }
          .info-content h4 { margin: 0 0 4px; font-size: 0.875rem; }
          .info-content p { margin: 0; font-size: 0.75rem; color: var(--text-secondary); }
          
          .empty { text-align: center; padding: 64px; background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; }
          .empty-icon { font-size: 4rem; display: block; margin-bottom: 16px; }
          .empty h3 { margin: 0 0 8px; }
          .empty p { color: var(--text-secondary); margin: 0; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
          
          @media (max-width: 1024px) {
            .benchmarks-grid, .info-cards { grid-template-columns: 1fr; }
            .chart-row { grid-template-columns: 80px 1fr 60px; }
          }
        `}</style>
      </main>
    </div>
  );
}