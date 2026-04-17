"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Log {
  id: number;
  logger: string;
  level: string;
  message: string;
  traceback: string | null;
  extra_data: Record<string, any>;
  ip_address: string | null;
  user: string | null;
  created_at: string;
}

const levelColors: Record<string, string> = {
  DEBUG: '#6b7280',
  INFO: '#3b82f6',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  CRITICAL: '#dc2626',
};

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ level: '', logger: '', search: '' });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
  }, [token, router]);

  useEffect(() => {
    if (!token || !autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [token, autoRefresh, filter]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (filter.level) params.append('level', filter.level);
      if (filter.logger) params.append('logger', filter.logger);
      if (filter.search) params.append('search', filter.search);
      params.append('limit', '100');
      
      const res = await fetch(`${API_URL}/api/monitor/logs/?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Erro:', err);
    }
    
    setLoading(false);
  };

  const downloadLogs = () => {
    const content = logs.map(l => 
      `[${l.created_at}] [${l.level}] ${l.logger}: ${l.message}${l.traceback ? '\n' + l.traceback : ''}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString()}.txt`;
    a.click();
  };

  return (
    <div style={{ display: 'flex' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)', marginBottom: '16px' }}>
          <div>
            <h1 className="text-gradient animate-fade-in">Logs em Tempo Real</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Monitoramento de logs da aplicação</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{ padding: '8px 16px', background: autoRefresh ? 'var(--accent)' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
            >
              {autoRefresh ? 'Auto' : 'Pausado'}
            </button>
            <button 
              onClick={downloadLogs}
              style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc', cursor: 'pointer' }}
            >
              Download
            </button>
            <button 
              onClick={fetchLogs}
              style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
            >
              Atualizar
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <select
            value={filter.level}
            onChange={(e) => setFilter({ ...filter, level: e.target.value })}
            style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc' }}
          >
            <option value="">Todos os níveis</option>
            <option value="DEBUG">DEBUG</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          
          <input
            type="text"
            placeholder="Buscar no log..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            style={{ flex: 1, padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc' }}
          />
        </div>

        <div style={{ flex: 1, background: '#0d1117', borderRadius: '12px', padding: '16px', overflow: 'auto', border: '1px solid #30363d', fontFamily: 'monospace', fontSize: '13px' }}>
          {loading && logs.length === 0 ? (
            <div style={{ color: '#666' }}>Carregando...</div>
          ) : logs.length === 0 ? (
            <div style={{ color: '#666' }}>Nenhum log encontrado</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #21262d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: '#8b949e', fontSize: '12px' }}>
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: levelColors[log.level], color: '#fff' }}>
                    {log.level}
                  </span>
                  <span style={{ color: '#58a6ff', fontSize: '12px' }}>{log.logger}</span>
                  {log.user && <span style={{ color: '#8b949e', fontSize: '12px' }}>@{log.user}</span>}
                </div>
                <div style={{ color: '#c9d1d9' }}>{log.message}</div>
                {log.traceback && (
                  <pre style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                    {log.traceback}
                  </pre>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </main>
    </div>
  );
}