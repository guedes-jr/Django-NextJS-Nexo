"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Task {
  id: string;
  name: string;
  status: string;
  date_done: string | null;
  runtime: number | null;
  result: string | null;
}

const JOBS = [
  { key: 'update_b3_prices', name: 'Atualizar Preços B3', description: 'Busca cotações das ações da B3' },
  { key: 'update_b3_indices', name: 'Atualizar Índices B3', description: 'Busca valores do Ibovespa e outros índices' },
  { key: 'update_all_market_data', name: 'Atualizar Dados de Mercado', description: 'Atualiza todos os dados de mercado' },
  { key: 'run_portfolio_reconciliation', name: 'Reconciliação de Portfólio', description: 'Executa reconciliação automática da carteira' },
  { key: 'auto_resolve_issues', name: 'Auto-resolver Issues', description: 'Tenta resolver automaticamente issues simples' },
  { key: 'cleanup_old_reconciliation_issues', name: 'Limpar Issues Antigos', description: 'Remove issues resolvidos há mais de 90 dias' },
];

export default function MonitorPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/monitor/jobs/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerJob = async (jobKey: string) => {
    try {
      setRunningJob(jobKey);
      const res = await fetch(`${API_URL}/api/monitor/jobs/trigger/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ job: jobKey })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Job ${data.message} - Task ID: ${data.task_id}`);
        setTimeout(fetchTasks, 2000);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setRunningJob(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'SUCCESS': '#22c55e',
      'FAILURE': '#ef4444',
      'PENDING': '#f59e0b',
      'STARTED': '#3b82f6',
      'RECEIVED': '#8b5cf6',
    };
    return colors[status] || '#888';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'SUCCESS': 'Concluído',
      'FAILURE': 'Falhou',
      'PENDING': 'Pendente',
      'STARTED': 'Em execução',
      'RECEIVED': 'Recebido',
    };
    return labels[status] || status;
  };

  return (
    <div className="container">
      <SharedSidebar />
      <main className="main">
        <div className="header">
          <div>
            <h1 className="text-gradient">Monitoramento & Jobs</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Gerencie tarefas automatizadas e monitore a plataforma</p>
          </div>
          <button className="btn-primary" onClick={fetchTasks}>Atualizar</button>
        </div>

        <div className="section">
          <h2>Jobs Disponíveis</h2>
          <div className="jobs-grid">
            {JOBS.map(job => (
              <div key={job.key} className="job-card">
                <div className="job-info">
                  <h3>{job.name}</h3>
                  <p>{job.description}</p>
                </div>
                <button 
                  className="btn-run" 
                  onClick={() => triggerJob(job.key)}
                  disabled={runningJob === job.key}
                >
                  {runningJob === job.key ? 'Executando...' : 'Executar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h2>Histórico de Tarefas</h2>
          <div className="tasks-list">
            {tasks.length === 0 ? (
              <div className="empty">Nenhuma tarefa encontrada</div>
            ) : (
              tasks.map((task, i) => (
                <div key={task.id || i} className="task-item">
                  <div className="task-info">
                    <span className="task-name">{task.name || 'Tarefa Desconhecida'}</span>
                    <span className="task-id">ID: {task.id?.substring(0, 8)}...</span>
                  </div>
                  <div className="task-meta">
                    <span className="task-status" style={{ backgroundColor: getStatusColor(task.status) }}>
                      {getStatusLabel(task.status)}
                    </span>
                    {task.runtime && <span className="task-runtime">{task.runtime?.toFixed(2)}s</span>}
                    {task.date_done && <span className="task-date">{new Date(task.date_done).toLocaleString('pt-BR')}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          .btn-primary { background: var(--accent-primary); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
          .btn-primary:hover { background: #2563eb; }
          
          .section { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; }
          .section h2 { color: var(--text-secondary); font-size: 0.875rem; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.05em; }
          
          .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
          .job-card { background: var(--bg-tertiary); border: 1px solid var(--glass-border); border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
          .job-info h3 { margin: 0 0 8px; font-size: 1rem; }
          .job-info p { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
          .btn-run { background: var(--accent-primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
          .btn-run:disabled { opacity: 0.5; cursor: not-allowed; }
          
          .tasks-list { display: flex; flex-direction: column; gap: 8px; }
          .task-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; }
          .task-info { display: flex; flex-direction: column; gap: 4px; }
          .task-name { font-weight: 500; }
          .task-id { font-size: 0.75rem; color: var(--text-secondary); }
          .task-meta { display: flex; align-items: center; gap: 16px; font-size: 0.875rem; }
          .task-status { color: white; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; }
          .task-runtime, .task-date { color: var(--text-secondary); font-size: 0.75rem; }
          
          .empty { text-align: center; color: var(--text-secondary); padding: 40px; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
        `}</style>
      </main>
    </div>
  );
}