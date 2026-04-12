"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Issue {
  id: number;
  issue_type: string;
  description: string;
  related_data: Record<string, any>;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export default function ReconciliacaoPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/portfolio/reconciliation/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const runReconciliation = async () => {
    try {
      setRunning(true);
      const res = await fetch(`${API_URL}/api/portfolio/reconciliation/run/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const result = await res.json();
        alert(result.message);
        fetchIssues();
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setRunning(false);
    }
  };

  const resolveIssue = async (id: number, action: 'resolve' | 'ignore') => {
    try {
      const res = await fetch(`${API_URL}/api/portfolio/reconciliation/${id}/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        fetchIssues();
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ORPHAN_POSITION': 'Posição órfã',
      'MISSING_PRICE': 'Preço faltando',
      'NEGATIVE_QUANTITY': 'Quantidade negativa',
      'DUPLICATE_POSITION': 'Posição duplicada',
      'MISSING_ASSET': 'Ativo não encontrado',
      'PRICE_MISMATCH': 'Divergência de preço',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'ORPHAN_POSITION': '#ef4444',
      'MISSING_PRICE': '#f59e0b',
      'NEGATIVE_QUANTITY': '#ef4444',
      'DUPLICATE_POSITION': '#8b5cf6',
      'MISSING_ASSET': '#ec4899',
      'PRICE_MISMATCH': '#06b6d4',
    };
    return colors[type] || '#888';
  };

  const pendingIssues = issues.filter(i => i.status === 'PENDING');
  const resolvedIssues = issues.filter(i => i.status !== 'PENDING');

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
            <h1 className="text-gradient animate-fade-in">Reconciliação de Dados</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Ajustes e correções de integridade da carteira</p>
          </div>
          <button className="btn-primary" onClick={runReconciliation} disabled={running}>
            {running ? 'Executando...' : 'Executar Reconciliação'}
          </button>
        </div>

        <div className="stats">
          <div className="stat-card">
            <span className="stat-value">{pendingIssues.length}</span>
            <span className="stat-label">Pendentes</span>
          </div>
          <div className="stat-card resolved">
            <span className="stat-value">{resolvedIssues.length}</span>
            <span className="stat-label">Resolvidos</span>
          </div>
        </div>

        <div className="issues-section">
          <h2>Itens Pendentes</h2>
          {pendingIssues.length === 0 ? (
            <div className="empty">Nenhum problema encontrado</div>
          ) : (
            <div className="issues-list">
              {pendingIssues.map(issue => (
                <div key={issue.id} className="issue-card">
                  <div className="issue-header">
                    <span className="issue-type" style={{ backgroundColor: getTypeColor(issue.issue_type) }}>
                      {getTypeLabel(issue.issue_type)}
                    </span>
                    <span className="issue-date">{new Date(issue.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="issue-description">{issue.description}</p>
                  {issue.related_data && Object.keys(issue.related_data).length > 0 && (
                    <pre className="issue-data">{JSON.stringify(issue.related_data, null, 2)}</pre>
                  )}
                  <div className="issue-actions">
                    <button className="btn-resolve" onClick={() => resolveIssue(issue.id, 'resolve')}>
                      Resolver
                    </button>
                    <button className="btn-ignore" onClick={() => resolveIssue(issue.id, 'ignore')}>
                      Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {resolvedIssues.length > 0 && (
          <div className="issues-section">
            <h2>Itens Resolvidos</h2>
            <div className="issues-list resolved">
              {resolvedIssues.map(issue => (
                <div key={issue.id} className="issue-card resolved">
                  <span className="issue-type" style={{ backgroundColor: '#22c55e' }}>
                    {issue.status === 'RESOLVED' ? 'Resolvido' : 'Ignorado'}
                  </span>
                  <span>{getTypeLabel(issue.issue_type)}</span>
                  <span className="issue-date">{issue.resolved_at ? new Date(issue.resolved_at).toLocaleDateString('pt-BR') : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); margin-bottom: 0; }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          .btn-primary { background: var(--accent-primary); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
          .btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
          .btn-primary:disabled { background: var(--text-muted); cursor: not-allowed; }
          .stats { display: flex; gap: 1rem; margin-top: 8px; }
          .stat-card { background: var(--bg-secondary); padding: 1.5rem; border: 1px solid var(--glass-border); border-radius: 12px; text-align: center; flex: 1; transition: transform 0.2s; }
          .stat-card:hover { transform: translateY(-2px); }
          .stat-value { display: block; font-size: 2rem; font-weight: 800; color: var(--text-primary); }
          .stat-label { color: var(--text-secondary); font-size: 0.875rem; font-weight: 500; }
          .issues-section { margin-bottom: 2rem; }
          .issues-section h2 { color: #888; font-size: 0.875rem; margin-bottom: 1rem; }
          .issues-list { display: flex; flex-direction: column; gap: 0.75rem; }
          .issue-card { background: #1a1a1a; padding: 1rem; border-radius: 8px; }
          .issue-card.resolved { opacity: 0.6; }
          .issue-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
          .issue-type { color: #fff; font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 9999px; }
          .issue-date { color: #666; font-size: 0.75rem; }
          .issue-description { color: #ccc; margin: 0.5rem 0; }
          .issue-data { background: #111; padding: 0.75rem; border-radius: 4px; font-size: 0.75rem; color: #888; overflow-x: auto; }
          .issue-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
          .btn-resolve { background: #22c55e; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
          .btn-ignore { background: #333; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
          .empty { color: #666; text-align: center; padding: 2rem; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
        `}</style>
      </main>
    </div>
  );
}