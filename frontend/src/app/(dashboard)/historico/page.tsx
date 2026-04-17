"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Snapshot {
  id: number;
  date: string;
  total_value: number;
  cash_value: number;
  position_value: number;
  variation: number;
  variation_percent: number;
  allocation: Record<string, number>;
  positions_count: number;
  accounts_count: number;
}

export default function HistoricoPage() {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    fetchSnapshots();
  }, [router]);

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/portfolio/snapshots/`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setSnapshots(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSnapshot = async () => {
    try {
      setGenerating(true);
      const res = await fetch(`${API_URL}/api/portfolio/snapshots/generate/`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchSnapshots();
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercent = (value: number) => {
    return value.toFixed(2).replace('.', ',') + '%';
  };

  const sortedSnapshots = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartData = sortedSnapshots.map(s => ({
    date: new Date(s.date).toLocaleDateString('pt-BR'),
    value: s.total_value
  }));

  const maxValue = Math.max(...chartData.map(d => d.value), 1);
  const minValue = Math.min(...chartData.map(d => d.value), 0);

  const latest = snapshots[0];
  const first = sortedSnapshots[0];

  const totalVariation = latest && first ? ((latest.total_value - first.total_value) / first.total_value) * 100 : 0;

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
            <h1 className="text-gradient">Evolução Patrimonial</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Histórico de snapshots do seu portfólio ao longo do tempo</p>
          </div>
          <button 
            className="btn-primary"
            onClick={generateSnapshot}
            disabled={generating}
          >
            {generating ? 'Gerando...' : 'Gerar Snapshot'}
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">📊</span>
            <h3>Nenhum snapshot encontrado</h3>
            <p>Gere o primeiro snapshot para começar a rastrear a evolução do seu patrimônio</p>
            <button className="btn-primary" onClick={generateSnapshot}>
              Gerar Primeiro Snapshot
            </button>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">💰</span>
                <div className="stat-content">
                  <span className="stat-value">{formatCurrency(latest?.total_value || 0)}</span>
                  <span className="stat-label">Patrimônio Atual</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📈</span>
                <div className="stat-content">
                  <span className="stat-value">{formatCurrency(latest?.variation || 0)}</span>
                  <span className="stat-label">Variação do Período</span>
                </div>
              </div>
              <div className="stat-card highlight">
                <span className="stat-icon">📊</span>
                <div className="stat-content">
                  <span className="stat-value" style={{ color: totalVariation >= 0 ? '#22c55e' : '#ef4444' }}>
                    {formatPercent(totalVariation)}
                  </span>
                  <span className="stat-label">Variação Total</span>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <h3>Evolução do Patrimônio</h3>
              <div className="chart">
                {chartData.map((d, i) => (
                  <div key={i} className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      style={{ height: `${((d.value - minValue) / (maxValue - minValue)) * 100}%` }}
                      title={formatCurrency(d.value)}
                    />
                    <span className="chart-label">{d.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="timeline">
              <h3>Histórico de Snapshots</h3>
              <div className="timeline-list">
                {snapshots.slice().reverse().map((snapshot, index) => {
                  const prev = index < snapshots.length - 1 ? snapshots[snapshots.length - 1 - index - 1] : null;
                  const diff = prev ? snapshot.total_value - prev.total_value : 0;
                  
                  return (
                    <div key={snapshot.id} className="timeline-item">
                      <div className="timeline-date">
                        <span className="date-day">{new Date(snapshot.date).getDate()}</span>
                        <span className="date-month">{new Date(snapshot.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-value">
                          <span className="value-amount">{formatCurrency(snapshot.total_value)}</span>
                          {diff !== 0 && (
                            <span className={`value-diff ${diff >= 0 ? 'positive' : 'negative'}`}>
                              {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                            </span>
                          )}
                        </div>
                        <div className="timeline-details">
                          <span>{snapshot.positions_count} posições</span>
                          <span>•</span>
                          <span>{snapshot.accounts_count} contas</span>
                        </div>
                        <div className="allocation-bar">
                          {Object.entries(snapshot.allocation || {}).map(([type, value]) => {
                            const pct = (value / snapshot.total_value) * 100;
                            const colors: Record<string, string> = {
                              'ACAO': '#3b82f6',
                              'FII': '#8b5cf6',
                              'ETF': '#06b6d4',
                              'RF': '#22c55e',
                              'TESOURO': '#f59e0b',
                              'CRIPTO': '#ef4444',
                              'FUNDO': '#ec4899',
                              'PREVIDENCIA': '#6366f1',
                            };
                            return (
                              <div 
                                key={type}
                                className="allocation-segment"
                                style={{ 
                                  width: `${pct}%`,
                                  backgroundColor: colors[type] || '#666'
                                }}
                                title={`${type}: ${formatCurrency(value)} (${pct.toFixed(1)}%)`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          
          .btn-primary { background: var(--accent-primary); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
          .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
          .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .stat-card { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; }
          .stat-card.highlight { background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3); }
          .stat-icon { font-size: 1.5rem; }
          .stat-content { display: flex; flex-direction: column; }
          .stat-value { font-size: 1.5rem; font-weight: 700; }
          .stat-label { font-size: 0.875rem; color: var(--text-secondary); }
          
          .chart-container { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 24px; }
          .chart-container h3 { margin: 0 0 24px; font-size: 1rem; }
          .chart { display: flex; align-items: flex-end; gap: 8px; height: 200px; padding: 0 8px; }
          .chart-bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
          .chart-bar { width: 100%; background: linear-gradient(180deg, var(--accent-primary), var(--accent-secondary)); border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.3s ease; }
          .chart-label { font-size: 0.625rem; color: var(--text-secondary); margin-top: 8px; transform: rotate(-45deg); white-space: nowrap; }
          
          .timeline h3 { margin: 0 0 16px; font-size: 1rem; }
          .timeline-list { display: flex; flex-direction: column; gap: 12px; }
          .timeline-item { display: flex; gap: 16px; background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 16px; }
          .timeline-date { display: flex; flex-direction: column; align-items: center; min-width: 50px; padding: 8px; background: var(--bg-tertiary); border-radius: 8px; }
          .date-day { font-size: 1.25rem; font-weight: 700; }
          .date-month { font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize; }
          .timeline-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
          .timeline-value { display: flex; align-items: center; gap: 12px; }
          .value-amount { font-size: 1.25rem; font-weight: 700; }
          .value-diff { font-size: 0.875rem; font-weight: 500; }
          .value-diff.positive { color: #22c55e; }
          .value-diff.negative { color: #ef4444; }
          .timeline-details { display: flex; gap: 8px; font-size: 0.875rem; color: var(--text-secondary); }
          .allocation-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: var(--bg-tertiary); }
          .allocation-segment { height: 100%; transition: width 0.3s; }
          
          .empty { text-align: center; padding: 64px; background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; }
          .empty-icon { font-size: 4rem; display: block; margin-bottom: 16px; }
          .empty h3 { margin: 0 0 8px; }
          .empty p { color: var(--text-secondary); margin: 0 0 24px; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
          
          @media (max-width: 768px) {
            .stats-grid { grid-template-columns: 1fr; }
            .header { flex-direction: column; align-items: flex-start; gap: 16px; }
          }
        `}</style>
      </main>
    </div>
  );
}