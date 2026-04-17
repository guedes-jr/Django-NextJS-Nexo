"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Task {
  id: string;
  name: string | null;
  status: string;
  result: string | null;
  date_done: string | null;
  runtime: number | null;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ status: '' });
  const [manualJobs, setManualJobs] = useState<string[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) router.push('/login');
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    fetchTasks();
  }, [token, filter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/monitor/jobs/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Erro:', err);
    }
    setLoading(false);
  };

  const triggerJob = async (job: string) => {
    if (!confirm(`Executar job "${job}"?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/monitor/jobs/trigger/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ job })
      });
      const data = await res.json();
      alert(data.message || 'Job iniciado');
      fetchTasks();
    } catch (err) {
      console.error('Erro:', err);
    }
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    STARTED: '#3b82f6',
    SUCCESS: '#22c55e',
    FAILURE: '#ef4444',
    RETRY: '#8b5cf6',
    REVOKED: '#6b7280',
  };

  const availableJobs = [
    { name: 'update_b3_prices', label: 'Atualizar Preços B3' },
    { name: 'update_b3_indices', label: 'Atualizar Índices B3' },
    { name: 'update_all_market_data', label: 'Atualizar Dados de Mercado' },
    { name: 'run_portfolio_reconciliation', label: 'Reconciliar Carteira' },
    { name: 'auto_resolve_issues', label: 'Resolver Issues Automático' },
    { name: 'cleanup_old_reconciliation_issues', label: 'Limpar Issues Antigos' },
  ];

  const filteredTasks = filter.status 
    ? tasks.filter(t => t.status === filter.status)
    : tasks;

  return (
    <div style={{ display: 'flex' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)', marginBottom: '16px' }}>
          <div>
            <h1 className="text-gradient animate-fade-in">Task Monitor</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Monitoramento de tasks Celery ({tasks.length} tasks)</p>
          </div>
          <button 
            onClick={fetchTasks}
            style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
          >
            Atualizar
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Executar Jobs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableJobs.map((job, i) => (
                  <button
                    key={i}
                    onClick={() => triggerJob(job.name)}
                    disabled={loading}
                    style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', textAlign: 'left' }}
                  >
                    {job.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Filtrar por Status</h3>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                style={{ width: '100%', padding: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc' }}
              >
                <option value="">Todos</option>
                <option value="PENDING">PENDING</option>
                <option value="STARTED">STARTED</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
                <option value="RETRY">RETRY</option>
              </select>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Estatísticas</h3>
              <div style={{ fontSize: '13px', color: '#ccc' }}>
                <div>Pendentes: {tasks.filter(t => t.status === 'PENDING').length}</div>
                <div>Em Execução: {tasks.filter(t => t.status === 'STARTED').length}</div>
                <div>Sucesso: {tasks.filter(t => t.status === 'SUCCESS').length}</div>
                <div>Falhas: {tasks.filter(t => t.status === 'FAILURE').length}</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', overflow: 'auto' }}>
            {loading ? (
              <div style={{ color: '#666' }}>Carregando...</div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ color: '#666' }}>Nenhuma task encontrada</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Task ID</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Nome</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Duração</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', color: '#888', fontSize: '12px', fontFamily: 'monospace' }}>
                        {task.id?.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '12px', color: '#ccc', fontSize: '13px' }}>{task.name || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px', 
                          background: statusColors[task.status] || '#666',
                          color: '#fff'
                        }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#888', fontSize: '13px' }}>
                        {task.runtime ? `${task.runtime.toFixed(2)}s` : '-'}
                      </td>
                      <td style={{ padding: '12px', color: '#888', fontSize: '12px' }}>
                        {task.date_done ? new Date(task.date_done).toLocaleString('pt-BR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}