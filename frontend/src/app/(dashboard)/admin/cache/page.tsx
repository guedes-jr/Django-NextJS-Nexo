"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface CacheKey {
  key: string;
  type: string;
  ttl: number;
}

export default function CachePage() {
  const router = useRouter();
  const [cacheKeys, setCacheKeys] = useState<CacheKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [newTtl, setNewTtl] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) router.push('/login');
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    fetchCacheKeys();
  }, [token]);

  const fetchCacheKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/monitor/cache/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCacheKeys(data.cache_keys || []);
    } catch (err) {
      console.error('Erro:', err);
    }
    setLoading(false);
  };

  const deleteKey = async (key: string) => {
    if (!confirm(`Expirar chave "${key}"?`)) return;
    
    try {
      await fetch(`${API_URL}/api/monitor/cache/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', key })
      });
      setCacheKeys(prev => prev.filter(k => k.key !== key));
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const clearAllCache = async () => {
    if (!confirm('Limpar todo o cache?')) return;
    
    try {
      await fetch(`${API_URL}/api/monitor/cache/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      setCacheKeys([]);
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const updateTtl = async () => {
    if (!selectedKey || !newTtl) return;
    
    try {
      await fetch(`${API_URL}/api/monitor/cache/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_ttl', key: selectedKey, ttl: newTtl })
      });
      setSelectedKey(null);
      setNewTtl('');
      fetchCacheKeys();
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)', marginBottom: '16px' }}>
          <div>
            <h1 className="text-gradient animate-fade-in">Cache Manager</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Gerenciamento de cache da aplicação ({cacheKeys.length} chaves)</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={clearAllCache}
              style={{ padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
            >
              Limpar Tudo
            </button>
            <button 
              onClick={fetchCacheKeys}
              style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
            >
              Atualizar
            </button>
          </div>
        </header>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', overflow: 'auto' }}>
            {loading ? (
              <div style={{ color: '#666' }}>Carregando...</div>
            ) : cacheKeys.length === 0 ? (
              <div style={{ color: '#666' }}>Cache vazio</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Chave</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Tipo</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>TTL</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#888', fontSize: '14px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cacheKeys.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', color: '#ccc', fontFamily: 'monospace', fontSize: '13px' }}>{item.key}</td>
                      <td style={{ padding: '12px', color: '#888', fontSize: '13px' }}>{item.type}</td>
                      <td style={{ padding: '12px', color: item.ttl < 0 ? '#666' : '#f59e0b', fontSize: '13px' }}>
                        {item.ttl < 0 ? '∞' : `${item.ttl}s`}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button 
                          onClick={() => deleteKey(item.key)}
                          style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Expirar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Editar TTL</h3>
              <select
                value={selectedKey || ''}
                onChange={(e) => setSelectedKey(e.target.value || null)}
                style={{ width: '100%', padding: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc', marginBottom: '12px' }}
              >
                <option value="">Selecione uma chave...</option>
                {cacheKeys.map((item, i) => (
                  <option key={i} value={item.key}>{item.key}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="TTL em segundos"
                value={newTtl}
                onChange={(e) => setNewTtl(e.target.value)}
                style={{ width: '100%', padding: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc', marginBottom: '12px' }}
              />
              <button 
                onClick={updateTtl}
                disabled={!selectedKey || !newTtl}
                style={{ width: '100%', padding: '8px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: !selectedKey || !newTtl ? 'not-allowed' : 'pointer' }}
              >
                Atualizar TTL
              </button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Informações</h3>
              <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.8' }}>
                <div>Total de chaves: <strong>{cacheKeys.length}</strong></div>
                <div>Cache backend: <strong>Redis/Database</strong></div>
                <div>TTL = -1 significa <strong>sem expiração</strong></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}