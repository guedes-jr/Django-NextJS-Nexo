"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalAssets: number;
  totalValue: number;
  openTickets: number;
  pendingReconciliation: number;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [usersRes, portfolioRes, ticketsRes, reconciliationRes] = await Promise.all([
        fetch(`${API_URL}/api/profiles/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/portfolio/summary/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/support/tickets/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/portfolio/reconciliation/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const users = await usersRes.json();
      const portfolio = await portfolioRes.json();
      const tickets = await ticketsRes.json();
      const reconciliation = await reconciliationRes.json();

      setStats({
        totalUsers: Array.isArray(users) ? users.length : 0,
        activeUsers: Array.isArray(users) ? users.filter((u: any) => u.is_active).length : 0,
        totalAssets: portfolio?.positions?.length || 0,
        totalValue: portfolio?.total_balance || 0,
        openTickets: Array.isArray(tickets) ? tickets.filter((t: any) => t.status === 'OPEN').length : 0,
        pendingReconciliation: Array.isArray(reconciliation) ? reconciliation.filter((r: any) => r.status === 'PENDING').length : 0
      });

      setActivities([
        { id: 1, type: 'USER', description: 'Novo usuário registrado', timestamp: new Date().toISOString(), user: 'Sistema' },
        { id: 2, type: 'PORTFOLIO', description: 'Carteira atualizada', timestamp: new Date().toISOString(), user: 'Sistema' },
        { id: 3, type: 'TICKET', description: 'Ticket de suporte criado', timestamp: new Date().toISOString(), user: 'Sistema' },
      ]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      'USER': '👤',
      'PORTFOLIO': '💼',
      'TICKET': '🎫',
      'RECONCILIATION': '⚙️',
      'SYSTEM': '🔧'
    };
    return icons[type] || '📌';
  };

  if (loading) {
    return (
      <div className="container">
        <SharedSidebar />
        <main className="main">
          <div className="loading">Carregando...</div>
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
            <h1 className="text-gradient">Painel Administrativo</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Visão geral da plataforma NEXO</p>
          </div>
          <button className="btn-primary" onClick={fetchData}>Atualizar</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.totalUsers || 0}</span>
              <span className="stat-label">Total de Usuários</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.activeUsers || 0}</span>
              <span className="stat-label">Usuários Ativos</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.totalAssets || 0}</span>
              <span className="stat-label">Ativos na Carteira</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-value">{formatCurrency(stats?.totalValue || 0)}</span>
              <span className="stat-label">Patrimônio Total</span>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">🎫</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.openTickets || 0}</span>
              <span className="stat-label">Tickets Abertos</span>
            </div>
          </div>
          <div className="stat-card alert">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <span className="stat-value">{stats?.pendingReconciliation || 0}</span>
              <span className="stat-label">Reconciliações Pendentes</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="quick-actions">
            <h2>Ações Rápidas</h2>
            <div className="actions-grid">
              <button className="action-btn" onClick={() => router.push('/admin/usuarios')}>
                <span className="action-icon">👥</span>
                <span>Gerenciar Usuários</span>
              </button>
              <button className="action-btn" onClick={() => router.push('/admin/suporte')}>
                <span className="action-icon">🎫</span>
                <span>Central de Suporte</span>
              </button>
              <button className="action-btn" onClick={() => router.push('/admin/reconciliacao')}>
                <span className="action-icon">⚙️</span>
                <span>Reconciliação</span>
              </button>
              <button className="action-btn" onClick={() => router.push('/carteira')}>
                <span className="action-icon">💼</span>
                <span>Ver Carteira</span>
              </button>
              <button className="action-btn" onClick={() => router.push('/automations')}>
                <span className="action-icon">🤖</span>
                <span>Automações</span>
              </button>
              <button className="action-btn" onClick={() => router.push('/documentos')}>
                <span className="action-icon">📄</span>
                <span>Documentos</span>
              </button>
            </div>
          </div>

          <div className="recent-activity">
            <h2>Atividades Recentes</h2>
            <div className="activity-list">
              {activities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                  <div className="activity-content">
                    <span className="activity-desc">{activity.description}</span>
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          .btn-primary { background: var(--accent-primary); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
          .btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
          
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .stat-card { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; transition: transform 0.2s; }
          .stat-card:hover { transform: translateY(-2px); }
          .stat-card.warning .stat-value { color: #f59e0b; }
          .stat-card.alert .stat-value { color: #ef4444; }
          .stat-icon { font-size: 2rem; }
          .stat-content { display: flex; flex-direction: column; }
          .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
          .stat-label { font-size: 0.875rem; color: var(--text-secondary); }
          
          .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .quick-actions, .recent-activity { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; }
          .quick-actions h2, .recent-activity h2 { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
          
          .actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .action-btn { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--bg-tertiary); border: 1px solid var(--glass-border); border-radius: 8px; cursor: pointer; transition: all 0.2s; color: var(--text-primary); }
          .action-btn:hover { background: rgba(59, 130, 246, 0.1); border-color: var(--accent-primary); }
          .action-icon { font-size: 1.25rem; }
          
          .activity-list { display: flex; flex-direction: column; gap: 12px; }
          .activity-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; }
          .activity-icon { font-size: 1.25rem; }
          .activity-content { display: flex; flex-direction: column; flex: 1; }
          .activity-desc { font-size: 0.875rem; color: var(--text-primary); }
          .activity-time { font-size: 0.75rem; color: var(--text-secondary); }
          
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
          
          @media (max-width: 1024px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .dashboard-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </main>
    </div>
  );
}