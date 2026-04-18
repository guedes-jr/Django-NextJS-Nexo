"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';
import styles from './page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('nexo_access');
    localStorage.removeItem('nexo_refresh');
    router.push('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([
      fetch('http://localhost:8001/api/portfolio/summary/', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('http://localhost:8001/api/auth/user/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ])
    .then(async (responses) => {
      const [summaryRes, userRes] = responses;
      if (summaryRes.status === 401 || userRes.status === 401) {
        localStorage.removeItem('nexo_access');
        router.push('/login');
        return;
      }
      const summaryData = await summaryRes.json();
      const userData = await userRes.json();
      if (summaryData) setData(summaryData);
      if (userData) setUser(userData);
    })
    .finally(() => {
      setMounted(true);
    });
  }, [router]);

  if (!mounted) return <div className={styles.loading}>Carregando...</div>;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const formatPercent = (value: number) => {
    if (value === null || value === undefined) return '0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className={styles.container}>
      <SharedSidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="text-gradient">Dashboard</h1>
            <p className={styles.subtitle}>Visão geral do seu patrimônio</p>
          </div>
          <div className="header-actions">
            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Adicionar
            </button>
            <div className="user-menu-container">
              <button className="user-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <span className="user-name">{user?.username || 'Usuário'}</span>
                    <span className="user-email">{user?.email || ''}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {data && (
          <>
            <div className="summary-cards">
              <div className="summary-card glass-panel">
                <span className="summary-label">Patrimônio Total</span>
                <span className="summary-value">{formatCurrency(data.total_balance)}</span>
                <span className="summary-change" style={{ color: (data.daily_variation_pct || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {formatPercent(data.daily_variation_pct)} hoje
                </span>
              </div>
              <div className="summary-card glass-panel">
                <span className="summary-label">Total Investido</span>
                <span className="summary-value">{formatCurrency(data.total_cost)}</span>
                <span className="summary-change" style={{ color: (data.total_profit_pct || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {formatPercent(data.total_profit_pct)} retorno
                </span>
              </div>
              <div className="summary-card glass-panel">
                <span className="summary-label">Dividendos</span>
                <span className="summary-value" style={{ color: 'var(--success)' }}>{formatCurrency(data.dividends_received)}</span>
                <span className="summary-change">recebidos (30d)</span>
              </div>
              <div className="summary-card glass-panel">
                <span className="summary-label">Posições</span>
                <span className="summary-value">{data.positions_count || 0}</span>
                <span className="summary-change">ativos em carteira</span>
              </div>
            </div>

            <div className="section glass-panel">
              <h2 className="section-title">Evolução Patrimonial</h2>
              <div className="chart-container">
                {data.portfolio_growth && data.portfolio_growth.length > 0 ? (
                  <div className="growth-chart">
                    {data.portfolio_growth.slice(-30).map((item: any, idx: number) => {
                      const height = (item.value / (data.total_balance || 1)) * 100;
                      return <div key={idx} className="chart-bar" style={{ height: height + '%' }} />;
                    })}
                  </div>
                ) : (
                  <p className="empty-text">Sem dados históricos ainda. Continue usando a plataforma!</p>
                )}
              </div>
            </div>

            <div className="two-column">
              <div className="section glass-panel">
                <h2 className="section-title">Últimos Lançamentos</h2>
                <div className="transaction-list">
                  {data.recent_transactions && data.recent_transactions.length > 0 ? (
                    data.recent_transactions.slice(0, 8).map((t: any) => (
                      <div key={t.id} className="transaction-item">
                        <div className="transaction-icon">
                          {t.transaction_type === 'COMPRA' ? '📥' : t.transaction_type === 'VENDA' ? '📤' : t.transaction_type === 'DIVIDENDO' ? '💰' : '📦'}
                        </div>
                        <div className="transaction-info">
                          <span className="transaction-type">{t.transaction_type}</span>
                          <span className="transaction-asset">{t.asset_ticker || 'Caixa'}</span>
                        </div>
                        <div className="transaction-value">
                          <span>{formatCurrency(t.total_value)}</span>
                          <span className="transaction-date">{formatDate(t.transaction_date)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">Nenhum lançamento ainda.</p>
                  )}
                </div>
              </div>

              <div className="section glass-panel">
                <h2 className="section-title">Eventos Corporativos</h2>
                <div className="event-list">
                  {data.corporate_events && data.corporate_events.length > 0 ? (
                    data.corporate_events.map((e: any) => (
                      <div key={e.id} className="event-item">
                        <div className="event-icon">
                          {e.action_type === 'DIVIDENDO' ? '💰' : e.action_type === 'SPLIT' ? '✂️' : '📋'}
                        </div>
                        <div className="event-info">
                          <span className="event-type">{e.action_type === 'DIVIDENDO' ? 'Dividendo' : e.action_type === 'SPLIT' ? 'Split' : 'Evento'}</span>
                          <span className="event-asset">{e.asset_ticker}</span>
                        </div>
                        <div className="event-value">
                          {e.amount_per_share && <span>R$ {e.amount_per_share}/ação</span>}
                          <span className="event-date">{formatDate(e.date)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">Nenhum evento recente.</p>
                  )}
                </div>
              </div>
            </div>

            {data.goals && data.goals.length > 0 && (
              <div className="section glass-panel">
                <h2 className="section-title">Metas Financeiras</h2>
                <div className="goals-grid">
                  {data.goals.map((g: any, idx: number) => (
                    <div key={idx} className="goal-card">
                      <div className="goal-header">
                        <span className="goal-name">{g.name}</span>
                        <span className="goal-progress">{g.progress.toFixed(0)}%</span>
                      </div>
                      <div className="goal-progress-bar">
                        <div className="goal-progress-fill" style={{ width: `${Math.min(g.progress, 100)}%` }} />
                      </div>
                      <div className="goal-values">
                        <span>{formatCurrency(g.current_amount)}</span>
                        <span>de {formatCurrency(g.target_amount)}</span>
                      </div>
                      <span className="goal-date">Meta: {formatDate(g.target_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.allocations_pct && Object.keys(data.allocations_pct).length > 0 && (
              <div className="section glass-panel">
                <h2 className="section-title">Alocação por Classe</h2>
                <div className="allocation-grid">
                  {Object.entries(data.allocations_pct).map(([type, pct]: [string, any]) => (
                    <div key={type} className="allocation-item">
                      <span className="allocation-type">{type}</span>
                      <span className="allocation-pct">{pct.toFixed(1)}%</span>
                      <div className="allocation-bar">
                        <div className="allocation-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .add-btn:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
        }
        .user-menu-container {
          position: relative;
        }
        .user-avatar-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 12px;
          transition: background 0.2s;
        }
        .user-avatar-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .user-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--accent-primary), var(--primary-dark));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          color: white;
        }
        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          width: 240px;
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          z-index: 100;
        }
        .user-info {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .user-name {
          font-weight: 600;
          font-size: 14px;
        }
        .user-email {
          font-size: 12px;
          color: var(--text-muted);
        }
        .dropdown-divider {
          height: 1px;
          background: var(--glass-border);
          margin: 8px 0;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: transparent;
          border: none;
          border-radius: 12px;
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--danger);
        }
        .dashboard-main {
          flex: 1;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .summary-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-radius: 20px;
        }
        .summary-label {
          font-size: 13px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .summary-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .summary-change {
          font-size: 13px;
          opacity: 0.8;
        }
        .section {
          padding: 24px;
          border-radius: 20px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        .chart-container {
          height: 200px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
        }
        .growth-chart {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 100%;
          width: 100%;
        }
        .chart-bar {
          flex: 1;
          background: linear-gradient(180deg, var(--accent-primary), rgba(99, 102, 241, 0.3));
          border-radius: 6px 6px 0 0;
          min-height: 4px;
          transition: height 0.3s ease;
        }
        .chart-bar:hover {
          background: var(--accent-primary);
        }
        .two-column {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .transaction-list, .event-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .transaction-item, .event-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 14px;
          transition: background 0.2s;
        }
        .transaction-item:hover, .event-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .transaction-icon, .event-icon {
          font-size: 20px;
        }
        .transaction-info, .event-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .transaction-type, .event-type {
          font-size: 12px;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .transaction-asset, .event-asset {
          font-weight: 600;
          color: var(--text-primary);
        }
        .transaction-value, .event-value {
          text-align: right;
          display: flex;
          flex-direction: column;
        }
        .transaction-value span:first-child, .event-value span:first-child {
          font-weight: 600;
          color: var(--text-primary);
        }
        .transaction-date, .event-date {
          font-size: 12px;
          color: var(--text-muted);
        }
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .goal-card {
          padding: 24px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
        }
        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .goal-name {
          font-weight: 600;
        }
        .goal-progress {
          font-size: 20px;
          font-weight: 700;
          color: var(--accent-primary);
        }
        .goal-progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin-bottom: 12px;
        }
        .goal-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary), var(--success));
          border-radius: 4px;
        }
        .goal-values {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .goal-date {
          font-size: 12px;
          color: var(--text-muted);
        }
        .allocation-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .allocation-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .allocation-type {
          font-size: 14px;
          font-weight: 500;
        }
        .allocation-pct {
          font-size: 18px;
          font-weight: 700;
        }
        .allocation-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .allocation-fill {
          height: 100%;
          background: var(--accent-primary);
          border-radius: 3px;
        }
        .empty-text {
          color: var(--text-muted);
          font-size: 14px;
          text-align: center;
          padding: 24px;
        }
        @media (max-width: 1200px) {
          .summary-cards, .two-column, .goals-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .dashboard-main { padding: 16px; }
          .dashboard-header { flex-direction: column; gap: 16px; align-items: flex-start; }
          .summary-cards, .two-column, .goals-grid, .allocation-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}