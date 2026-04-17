"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface AuditLog {
  id: number;
  username: string;
  action: string;
  resource: string;
  resource_id: string | null;
  ip_address: string | null;
  status: string;
  created_at: string;
}

export default function AuditoriaPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) { router.push('/login'); return; }
    
    fetch(`${API_URL}/api/audit/?page=${page}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [router, page]);

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'CREATE': '#22c55e',
      'UPDATE': '#3b82f6',
      'DELETE': '#ef4444',
      'LOGIN': '#22c55e',
      'LOGOUT': '#6b7280',
      'EXPORT': '#8b5cf6',
      'IMPORT': '#f59e0b',
      'VIEW': '#6b7280',
      'APPROVE': '#22c55e',
      'REJECT': '#ef4444',
    };
    return colors[action] || '#6b7280';
  };

  const getStatusColor = (status: string) => {
    return status === 'SUCCESS' ? '#22c55e' : '#ef4444';
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#666' }}>Carregando...</div>;

  return (
    <div style={{ display: 'flex' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--glass-border)', marginBottom: '8px' }}>
          <div>
            <h1 className="text-gradient animate-fade-in">Trilha de Auditoria</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Log de todas as ações no sistema ({total} registros)</p>
          </div>
        </header>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Data</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Usuário</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Ação</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Recurso</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>IP</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#ccc' }}>
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#fff' }}>{log.username}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      color: '#fff',
                      background: getActionColor(log.action)
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#ccc' }}>
                    {log.resource}{log.resource_id ? ` #${log.resource_id}` : ''}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#888' }}>{log.ip_address || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      color: '#fff',
                      background: getStatusColor(log.status)
                    }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc', cursor: 'pointer' }}
          >
            Anterior
          </button>
          <span style={{ padding: '8px 16px', color: '#888' }}>Página {page}</span>
          <button 
            onClick={() => setPage(p => p + 1)}
            disabled={page * 50 >= total}
            style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc', cursor: 'pointer' }}
          >
            Próxima
          </button>
        </div>
      </main>
    </div>
  );
}