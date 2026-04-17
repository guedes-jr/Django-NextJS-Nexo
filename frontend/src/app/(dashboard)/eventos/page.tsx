"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface CorporateAction {
  id: number;
  asset_ticker: string;
  asset_name: string;
  action_type: string;
  date: string;
  ratio: number | null;
  amount_per_share: number | null;
  total_amount: number | null;
  status: string;
  created_at: string;
}

const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
  'DIVIDENDO': { color: '#22c55e', icon: '💰', label: 'Dividendo/JCP' },
  'DESDOBRAMENTO': { color: '#3b82f6', icon: '📊', label: 'Desdobramento (Split)' },
  'GRUPAMENTO': { color: '#8b5cf6', icon: '🔄', label: 'Grupamento (Reverse Split)' },
  'BONIFICACAO': { color: '#f59e0b', icon: '🎁', label: 'Bonificação' },
  'AMORTIZACAO': { color: '#ec4899', icon: '💵', label: 'Amortização' },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  'PENDING': { color: '#f59e0b', label: 'Pendente' },
  'APPLIED': { color: '#22c55e', label: 'Aplicado' },
  'CANCELLED': { color: '#6b7280', label: 'Cancelado' },
};

export default function EventosPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CorporateAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    fetchEvents();
  }, [router]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/portfolio/corporate-actions/`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const years = [...new Set(events.map(e => new Date(e.date).getFullYear()))].sort().reverse();

  const filteredEvents = events.filter(e => {
    const matchesType = filter === 'all' || e.action_type === filter;
    const matchesYear = yearFilter === 'all' || new Date(e.date).getFullYear().toString() === yearFilter;
    return matchesType && matchesYear;
  });

  const pendingEvents = events.filter(e => e.status === 'PENDING');
  const appliedEvents = events.filter(e => e.status === 'APPLIED');
  const totalDividends = events
    .filter(e => e.action_type === 'DIVIDENDO' && e.status === 'APPLIED')
    .reduce((sum, e) => sum + (e.total_amount || 0), 0);

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
            <h1 className="text-gradient">Eventos Corporativos</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Dividendos, desdobramentos, grupamentos e outros eventos</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <div className="stat-content">
              <span className="stat-value">{pendingEvents.length}</span>
              <span className="stat-label">Pendentes</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-content">
              <span className="stat-value">{appliedEvents.length}</span>
              <span className="stat-label">Aplicados</span>
            </div>
          </div>
          <div className="stat-card highlight">
            <span className="stat-icon">💰</span>
            <div className="stat-content">
              <span className="stat-value">{formatCurrency(totalDividends)}</span>
              <span className="stat-label">Total em Dividendos</span>
            </div>
          </div>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Tipo de Evento</label>
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">Todos</option>
              {Object.entries(typeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.icon} {config.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Ano</label>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
              <option value="all">Todos</option>
              {years.map(y => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="events-list">
          {filteredEvents.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">📅</span>
              <h3>Nenhum evento corporativo</h3>
              <p>Os eventos corporativos (dividendos, splits, etc) aparecerão aqui automaticamente</p>
            </div>
          ) : (
            <div className="events-table">
              <div className="table-header">
                <span>Ativo</span>
                <span>Tipo</span>
                <span>Data</span>
                <span>Ratio</span>
                <span>Valor/Ativo</span>
                <span>Total</span>
                <span>Status</span>
              </div>
              {filteredEvents.map(event => (
                <div key={event.id} className="table-row">
                  <div className="asset-cell">
                    <span className="asset-ticker">{event.asset_ticker}</span>
                    <span className="asset-name">{event.asset_name}</span>
                  </div>
                  <div className="type-cell">
                    <span className="type-badge" style={{ backgroundColor: typeConfig[event.action_type]?.color + '20', color: typeConfig[event.action_type]?.color }}>
                      {typeConfig[event.action_type]?.icon} {typeConfig[event.action_type]?.label}
                    </span>
                  </div>
                  <span className="date-cell">{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                  <span className="ratio-cell">{event.ratio ? event.ratio + 'x' : '-'}</span>
                  <span className="value-cell">{formatCurrency(event.amount_per_share)}</span>
                  <span className="total-cell">{formatCurrency(event.total_amount)}</span>
                  <div className="status-cell">
                    <span className="status-badge" style={{ backgroundColor: statusConfig[event.status]?.color }}>
                      {statusConfig[event.status]?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .stat-card { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; }
          .stat-card.highlight { background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3); }
          .stat-card.highlight .stat-value { color: #22c55e; }
          .stat-icon { font-size: 1.5rem; }
          .stat-content { display: flex; flex-direction: column; }
          .stat-value { font-size: 1.5rem; font-weight: 700; }
          .stat-label { font-size: 0.875rem; color: var(--text-secondary); }
          
          .filters { display: flex; gap: 16px; }
          .filter-group { display: flex; flex-direction: column; gap: 8px; }
          .filter-group label { font-size: 0.875rem; color: var(--text-secondary); }
          .filter-group select { background: var(--bg-secondary); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 10px 16px; border-radius: 8px; min-width: 200px; }
          
          .events-list { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; overflow: hidden; }
          .events-table { width: 100%; }
          .table-header { display: grid; grid-template-columns: 1.5fr 1.5fr 1fr 0.8fr 1fr 1fr 0.8fr; padding: 16px 20px; background: var(--bg-tertiary); font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
          .table-row { display: grid; grid-template-columns: 1.5fr 1.5fr 1fr 0.8fr 1fr 1fr 0.8fr; padding: 16px 20px; border-bottom: 1px solid var(--glass-border); align-items: center; }
          .table-row:last-child { border-bottom: none; }
          .table-row:hover { background: rgba(255,255,255,0.02); }
          
          .asset-cell { display: flex; flex-direction: column; }
          .asset-ticker { font-weight: 600; }
          .asset-name { font-size: 0.75rem; color: var(--text-secondary); }
          .type-badge { padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; }
          .date-cell { font-size: 0.875rem; color: var(--text-secondary); }
          .ratio-cell { font-size: 0.875rem; font-family: monospace; }
          .value-cell, .total-cell { font-size: 0.875rem; }
          .status-badge { padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; color: white; }
          
          .empty { text-align: center; padding: 64px; }
          .empty-icon { font-size: 4rem; display: block; margin-bottom: 16px; }
          .empty h3 { margin: 0 0 8px; }
          .empty p { color: var(--text-secondary); margin: 0; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
          
          @media (max-width: 1024px) {
            .stats-grid { grid-template-columns: 1fr; }
            .table-header, .table-row { grid-template-columns: 1fr 1fr 1fr; }
            .table-header span:nth-child(4), .table-header span:nth-child(5),
            .table-header span:nth-child(6), .table-header span:nth-child(7),
            .table-row .ratio-cell, .table-row .value-cell, 
            .table-row .total-cell, .table-row .status-cell { display: none; }
          }
        `}</style>
      </main>
    </div>
  );
}