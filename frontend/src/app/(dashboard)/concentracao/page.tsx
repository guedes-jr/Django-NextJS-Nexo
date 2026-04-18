"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface ConcentrationData {
  by_ticker?: Array<{ ticker: string; value: number; percentage: number }>;
  top_concentration?: Array<{ ticker: string; value: number; percentage: number }>;
  issuer_concentration?: Array<{ issuer: string; value: number; percentage: number }>;
  alerts?: Array<{ type: string; severity: string; message: string }>;
  total_positions?: number;
  diversified?: boolean;
  message?: string;
}

export default function ConcentracaoPage() {
  const router = useRouter();
  const [data, setData] = useState<ConcentrationData | null>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/portfolio/concentration/`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const getPercentageColor = (pct: number) => {
    if (pct > 20) return '#ef4444';
    if (pct > 10) return '#f59e0b';
    return '#22c55e';
  };

  const concentrationData = data?.by_ticker || data?.top_concentration || [];
  const issuerData = data?.issuer_concentration || [];
  const alertsData = data?.alerts || [] as any[];

  if (loading) {
    return (
      <div className="container">
        <SharedSidebar />
        <main className="main"><div className="loading">Carregando...</div></main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <SharedSidebar />
        <main className="main">
          <div className="empty">
            <span className="empty-icon">📊</span>
            <h3>Carteira vazia</h3>
            <p>Adicione ativos para analisar a concentração</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <SharedSidebar />
      <main className="main">
        <div className="header">
          <div>
            <h1 className="text-gradient">Análise de Concentração</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Identifique riscos de concentração na sua carteira</p>
          </div>
          <div className={`diversified-badge ${data.diversified ? 'diversified' : 'concentrated'}`}>
            {data.diversified ? '✓ Diversificada' : '⚠️ Concentrada'}
          </div>
        </div>

        {alertsData.length > 0 && (
          <div className="alerts-section">
            <h3>Alertas de Risco</h3>
            <div className="alerts-list">
              {alertsData.map((alert: any, i: number) => (
                <div key={i} className="alert-card" style={{ borderLeftColor: getSeverityColor(alert.severity) }}>
                  <span className="alert-severity" style={{ backgroundColor: getSeverityColor(alert.severity) }}>
                    {alert.severity}
                  </span>
                  <span className="alert-message">{alert.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="content-grid">
          <div className="card">
            <h3>Top 10 Ativos por Ticker</h3>
            <div className="chart-container">
              {(data.by_ticker || data.top_concentration || []).slice(0, 10).map((item: any, i: number) => (
                <div key={item.ticker} className="bar-item">
                  <div className="bar-label">
                    <span className="bar-ticker">{item.ticker}</span>
                    <span className="bar-value">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className="bar-fill"
                      style={{ 
                        width: `${Math.min(item.percentage * 5, 100)}%`,
                        backgroundColor: getPercentageColor(item.percentage)
                      }}
                    />
                  </div>
                  <span className="bar-percent" style={{ color: getPercentageColor(item.percentage) }}>
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Concentração por Emissor</h3>
            <div className="chart-container">
              {!issuerData || issuerData.length === 0 ? (
                <p className="empty-text">Dados de emissor não disponíveis</p>
              ) : (
                issuerData.map((item: any, i: number) => (
                  <div key={item.issuer} className="bar-item">
                    <div className="bar-label">
                      <span className="bar-ticker">{item.issuer}</span>
                      <span className="bar-value">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="bar-track">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${Math.min(item.percentage * 5, 100)}%`,
                          backgroundColor: getPercentageColor(item.percentage)
                        }}
                      />
                    </div>
                    <span className="bar-percent" style={{ color: getPercentageColor(item.percentage) }}>
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-value">{data.total_positions}</span>
            <span className="stat-label">Total de Posições</span>
          </div>
          <div className="stat-box">
            <span className="stat-value" style={{ color: data.diversified ? '#22c55e' : '#ef4444' }}>
              {data.diversified ? 'Alta' : 'Baixa'}
            </span>
            <span className="stat-label">Diversificação</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">
              {concentrationData[0]?.ticker || '-'}
            </span>
            <span className="stat-label">Maior Concentração</span>
          </div>
        </div>

        <div className="recommendations">
          <h3>Recomendações</h3>
          <ul>
            {!data.diversified && (
              <>
                <li>Considere diversificar entre mais ativos para reduzir risco específico</li>
                <li>Evite concentrar mais de 20% do patrimônio em um único ativo</li>
              </>
            )}
            {concentrationData[0]?.percentage > 20 && (
              <li>Alta concentração em {concentrationData[0].ticker}. Considere reduzir posição.</li>
            )}
            {data.diversified && (
              <li>Sua carteira está bem diversificada. Continue monitorando periodicamente.</li>
            )}
          </ul>
        </div>

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          
          .diversified-badge { padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; }
          .diversified-badge.diversified { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
          .diversified-badge.concentrated { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
          
          .alerts-section h3 { margin: 0 0 12px; font-size: 1rem; }
          .alerts-list { display: flex; flex-direction: column; gap: 8px; }
          .alert-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--bg-secondary); border: 1px solid var(--glass-border); border-left-width: 4px; border-radius: 8px; }
          .alert-severity { font-size: 0.625rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; color: white; }
          .alert-message { font-size: 0.875rem; }
          
          .content-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .card { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 24px; }
          .card h3 { margin: 0 0 20px; font-size: 1rem; }
          
          .chart-container { display: flex; flex-direction: column; gap: 12px; }
          .bar-item { display: grid; grid-template-columns: 1fr 2fr 50px; align-items: center; gap: 12px; }
          .bar-label { display: flex; flex-direction: column; }
          .bar-ticker { font-weight: 600; font-size: 0.875rem; }
          .bar-value { font-size: 0.75rem; color: var(--text-secondary); }
          .bar-track { height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; }
          .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
          .bar-percent { font-size: 0.875rem; font-weight: 600; text-align: right; }
          .empty-text { color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: 20px; }
          
          .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .stat-box { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; text-align: center; }
          .stat-value { display: block; font-size: 1.5rem; font-weight: 700; margin-bottom: 4px; }
          .stat-label { font-size: 0.875rem; color: var(--text-secondary); }
          
          .recommendations { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 24px; }
          .recommendations h3 { margin: 0 0 16px; font-size: 1rem; }
          .recommendations ul { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
          .recommendations li { color: var(--text-secondary); }
          
          .empty { text-align: center; padding: 64px; }
          .empty-icon { font-size: 4rem; display: block; margin-bottom: 16px; }
          .empty h3 { margin: 0 0 8px; }
          .empty p { color: var(--text-secondary); margin: 0; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
          
          @media (max-width: 1024px) {
            .content-grid, .stats-row { grid-template-columns: 1fr; }
          }
        `}</style>
      </main>
    </div>
  );
}