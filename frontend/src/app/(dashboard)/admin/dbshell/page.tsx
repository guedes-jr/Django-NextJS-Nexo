"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function DBShellPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ rows: 0, time: 0, status: '' });
  const [exportFormat, setExportFormat] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) router.push('/login');
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/monitor/db/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setHistory(data.history || []));
  }, [token]);

  const executeQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/monitor/db/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, export: exportFormat })
      });
      
      const data = await res.json();
      
      if (data.status === 'ERROR') {
        setStats({ rows: 0, time: 0, status: 'ERROR' });
        setResults([[data.output || data.error || 'Erro']]);
        setColumns(['Erro']);
      } else {
        setStats({ rows: data.rows_affected || 0, time: data.execution_time || 0, status: 'SUCCESS' });
        setResults(data.output || []);
        setColumns(data.columns || (data.output?.[0] || []));
      }
    } catch (err) {
      setStats({ rows: 0, time: 0, status: 'ERROR' });
      setResults([['Erro de conexão']]);
    }
    
    setLoading(false);
  };

  const exampleQueries = [
    { label: 'Lista usuários', query: 'SELECT id, username, email, is_active FROM identity_customuser LIMIT 10' },
    { label: 'Conta posições', query: 'SELECT COUNT(*) FROM portfolio_position' },
    { label: 'Lista ativos', query: 'SELECT ticker, name, asset_type FROM portfolio_asset LIMIT 20' },
  ];

  return (
    <div style={{ display: 'flex' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)', marginBottom: '16px' }}>
          <div>
            <h1 className="text-gradient animate-fade-in">DBShell</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Consulta SQL direta no banco de dados</p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '16px', flex: 1, overflow: 'hidden' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Exemplos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {exampleQueries.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(ex.query)}
                  style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
            
            <h3 style={{ fontSize: '14px', color: '#888', margin: '24px 0 12px' }}>Histórico</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {history.slice(0, 10).map((h, i) => (
                <div 
                  key={i} 
                  onClick={() => setQuery(h.query)}
                  style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#888' }}
                >
                  {h.query?.substring(0, 40)}...
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
            <div style={{ background: '#0d1117', borderRadius: '12px', padding: '16px', border: '1px solid #30363d' }}>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM tabela WHERE..."
                style={{ 
                  width: '100%', 
                  height: '120px', 
                  background: 'transparent', 
                  border: 'none', 
                  outline: 'none',
                  color: '#c9d1d9',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  resize: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    style={{ padding: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc' }}
                  >
                    <option value="">Console</option>
                    <option value="json">Export JSON</option>
                    <option value="csv">Export CSV</option>
                  </select>
                </div>
                <button 
                  onClick={executeQuery}
                  disabled={loading || !query.trim()}
                  style={{ padding: '8px 24px', background: loading ? '#666' : 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Executando...' : 'Executar'}
                </button>
              </div>
            </div>

            <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', overflow: 'auto' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', color: '#888' }}>
                <span>Linhas: {stats.rows}</span>
                <span>Tempo: {stats.time}ms</span>
                <span style={{ color: stats.status === 'ERROR' ? '#ef4444' : '#22c55e' }}>{stats.status || '-'}</span>
              </div>
              
              <div style={{ overflow: 'auto' }}>
                {results.length > 0 && Array.isArray(results[0]) ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #30363d' }}>
                        {columns.map((col, i) => (
                          <th key={i} style={{ textAlign: 'left', padding: '8px', color: '#8b949e' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #21262d' }}>
                          {row.map((val: any, j: number) => (
                            <td key={j} style={{ padding: '8px', color: '#c9d1d9' }}>{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <pre style={{ color: results[0]?.[0]?.includes('Erro') ? '#ef4444' : '#c9d1d9', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                    {results.flat().join('\n')}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}