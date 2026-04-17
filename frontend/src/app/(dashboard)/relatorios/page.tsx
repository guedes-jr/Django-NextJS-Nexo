"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface ReportSummary {
  total_invested: number;
  current_value: number;
  total_profit: number;
  profit_percentage: number;
  positions_count: number;
}

interface AssetReport {
  ticker: string;
  name: string;
  asset_type: string;
  quantity: number;
  average_price: number;
  current_price: number;
  invested_value: number;
  current_value: number;
  profit: number;
  profit_percentage: number;
}

export default function RelatoriosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    fetchReport();
  }, [year, router]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/portfolio/reports/profitability/?year=${year}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'csv' | 'json') => {
    try {
      const res = await fetch(`${API_URL}/api/portfolio/reports/generate/?format=${format}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_rentabilidade_${year}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_rentabilidade_${year}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao baixar relatório');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const typeLabels: Record<string, string> = {
    'ACAO': 'Ação',
    'FII': 'FII',
    'ETF': 'ETF',
    'CRIPTO': 'Cripto',
    'RF': 'Renda Fixa',
    'TESOURO': 'Tesouro',
    'FUNDO': 'Fundo',
  };

  const filteredAssets = report?.by_asset?.filter((a: AssetReport) => 
    filter === 'all' || a.asset_type === filter
  ) || [];

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
            <h1 className="text-gradient">Relatórios de Rentabilidade</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Análise completa de lucros, impostos e desempenho</p>
          </div>
          <div className="header-actions">
            <select className="year-select" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {[2026, 2025, 2024, 2023].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="actions-bar">
          <button className="btn-download" onClick={() => downloadReport('csv')}>
            📥 CSV
          </button>
          <button className="btn-download" onClick={() => downloadReport('json')}>
            📥 JSON
          </button>
        </div>

        {report && (
          <>
            <div className="summary-cards">
              <div className="summary-card">
                <span className="card-label">Total Investido</span>
                <span className="card-value">{formatCurrency(report.summary.total_invested)}</span>
              </div>
              <div className="summary-card">
                <span className="card-label">Valor Atual</span>
                <span className="card-value">{formatCurrency(report.summary.current_value)}</span>
              </div>
              <div className={`summary-card ${report.summary.total_profit >= 0 ? 'positive' : 'negative'}`}>
                <span className="card-label">Lucro/Prejuízo</span>
                <span className="card-value">{formatCurrency(report.summary.total_profit)}</span>
                <span className="card-percent">{formatPercent(report.summary.profit_percentage)}</span>
              </div>
              <div className="summary-card">
                <span className="card-label">Dividendos Recebidos</span>
                <span className="card-value">{formatCurrency(report.dividends_received || 0)}</span>
              </div>
            </div>

            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-value">{report.summary.positions_count}</span>
                <span className="stat-label">Ativos</span>
              </div>
              {Object.entries(report.by_type || {}).map(([type, value]) => (
                <div key={type} className="stat-item">
                  <span className="stat-value">{formatCurrency(value as number)}</span>
                  <span className="stat-label">{typeLabels[type] || type}</span>
                </div>
              ))}
            </div>

            <div className="filters">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Todos ({report.by_asset?.length})
              </button>
              {Object.keys(report.by_type || {}).map(type => (
                <button
                  key={type}
                  className={`filter-btn ${filter === type ? 'active' : ''}`}
                  onClick={() => setFilter(type)}
                >
                  {typeLabels[type] || type} ({report.by_type[type]})
                </button>
              ))}
            </div>

            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Ativo</th>
                    <th>Tipo</th>
                    <th>Qtd</th>
                    <th>Preço Médio</th>
                    <th>Preço Atual</th>
                    <th>Valor Investido</th>
                    <th>Valor Atual</th>
                    <th>Lucro/Prejuízo</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset: AssetReport, i: number) => (
                    <tr key={i}>
                      <td>
                        <div className="asset-cell">
                          <span className="asset-ticker">{asset.ticker}</span>
                          <span className="asset-name">{asset.name}</span>
                        </div>
                      </td>
                      <td><span className="type-badge">{typeLabels[asset.asset_type] || asset.asset_type}</span></td>
                      <td>{asset.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</td>
                      <td>{formatCurrency(asset.average_price)}</td>
                      <td>{formatCurrency(asset.current_price)}</td>
                      <td>{formatCurrency(asset.invested_value)}</td>
                      <td>{formatCurrency(asset.current_value)}</td>
                      <td className={asset.profit >= 0 ? 'positive' : 'negative'}>
                        {formatCurrency(asset.profit)}
                      </td>
                      <td className={asset.profit_percentage >= 0 ? 'positive' : 'negative'}>
                        {formatPercent(asset.profit_percentage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!report && (
          <div className="empty">
            <span className="empty-icon">📊</span>
            <h3>Nenhum dado encontrado</h3>
            <p>Adicione ativos à sua carteira para ver os relatórios</p>
          </div>
        )}

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          .year-select { background: var(--bg-secondary); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 10px 16px; border-radius: 8px; font-size: 1rem; }
          
          .actions-bar { display: flex; gap: 12px; }
          .btn-download { background: var(--bg-secondary); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.875rem; transition: all 0.2s; }
          .btn-download:hover { background: var(--accent-primary); color: white; }
          
          .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
          .summary-card { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
          .summary-card.positive { border-color: rgba(34, 197, 94, 0.3); background: rgba(34, 197, 94, 0.05); }
          .summary-card.negative { border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); }
          .card-label { font-size: 0.875rem; color: var(--text-secondary); }
          .card-value { font-size: 1.5rem; font-weight: 700; }
          .summary-card.positive .card-value { color: #22c55e; }
          .summary-card.negative .card-value { color: #ef4444; }
          .card-percent { font-size: 0.875rem; color: var(--text-secondary); }
          
          .stats-row { display: flex; gap: 24px; flex-wrap: wrap; padding: 16px; background: var(--bg-secondary); border-radius: 12px; }
          .stat-item { display: flex; flex-direction: column; align-items: center; }
          .stat-value { font-size: 1.25rem; font-weight: 700; }
          .stat-label { font-size: 0.75rem; color: var(--text-secondary); }
          
          .filters { display: flex; gap: 8px; flex-wrap: wrap; }
          .filter-btn { background: var(--bg-secondary); border: 1px solid var(--glass-border); color: var(--text-secondary); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.875rem; }
          .filter-btn.active { background: var(--accent-primary); color: white; }
          
          .table-container { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; overflow: hidden; }
          .report-table { width: 100%; border-collapse: collapse; }
          .report-table th { text-align: left; padding: 16px; background: var(--bg-tertiary); font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
          .report-table td { padding: 16px; border-bottom: 1px solid var(--glass-border); font-size: 0.875rem; }
          .report-table tr:hover { background: rgba(255,255,255,0.02); }
          .asset-cell { display: flex; flex-direction: column; }
          .asset-ticker { font-weight: 600; }
          .asset-name { font-size: 0.75rem; color: var(--text-secondary); }
          .type-badge { background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; }
          .positive { color: #22c55e; }
          .negative { color: #ef4444; }
          
          .empty { text-align: center; padding: 64px; }
          .empty-icon { font-size: 4rem; display: block; margin-bottom: 16px; }
          .empty h3 { margin: 0 0 8px; }
          .empty p { color: var(--text-secondary); margin: 0; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
          
          @media (max-width: 1200px) {
            .summary-cards { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>
      </main>
    </div>
  );
}