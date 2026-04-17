"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface FeatureFlag {
  id: number;
  name: string;
  description: string;
  value: Record<string, any>;
  is_active: boolean;
  is_global: boolean;
}

export default function ConfigPage() {
  const router = useRouter();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newFlag, setNewFlag] = useState({ name: '', description: '', value: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) router.push('/login');
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    fetchFlags();
  }, [token]);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/monitor/config/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFlags(data.flags || []);
    } catch (err) {
      console.error('Erro:', err);
    }
    setLoading(false);
  };

  const createFlag = async () => {
    try {
      let parsedValue = {};
      try {
        parsedValue = JSON.parse(newFlag.value || '{}');
      } catch {
        parsedValue = { enabled: true };
      }
      
      await fetch(`${API_URL}/api/monitor/config/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create',
          name: newFlag.name,
          description: newFlag.description,
          value: parsedValue
        })
      });
      
      setShowCreate(false);
      setNewFlag({ name: '', description: '', value: '' });
      fetchFlags();
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const updateFlag = async (id: number) => {
    try {
      let parsedValue = {};
      try {
        parsedValue = JSON.parse(editValue || '{}');
      } catch {
        parsedValue = { enabled: true };
      }
      
      await fetch(`${API_URL}/api/monitor/config/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id,
          value: parsedValue
        })
      });
      
      setEditingId(null);
      fetchFlags();
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const toggleActive = async (id: number, current: boolean) => {
    try {
      await fetch(`${API_URL}/api/monitor/config/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id,
          is_active: !current
        })
      });
      fetchFlags();
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const deleteFlag = async (id: number) => {
    if (!confirm('Deseja deletar esta flag?')) return;
    
    try {
      await fetch(`${API_URL}/api/monitor/config/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      fetchFlags();
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
            <h1 className="text-gradient animate-fade-in">Feature Flags</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Gerenciamento de configurações e feature flags ({flags.length})</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setShowCreate(!showCreate)}
              style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
            >
              {showCreate ? 'Cancelar' : 'Nova Flag'}
            </button>
            <button 
              onClick={fetchFlags}
              style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
            >
              Atualizar
            </button>
          </div>
        </header>

        {showCreate && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Criar Nova Flag</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Nome da flag"
                value={newFlag.name}
                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc' }}
              />
              <input
                type="text"
                placeholder="Descrição"
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc' }}
              />
            </div>
            <textarea
              placeholder="Valor (JSON)"
              value={newFlag.value}
              onChange={(e) => setNewFlag({ ...newFlag, value: e.target.value })}
              style={{ width: '100%', height: '80px', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc', marginBottom: '12px' }}
            />
            <button 
              onClick={createFlag}
              style={{ padding: '8px 24px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
            >
              Criar Flag
            </button>
          </div>
        )}

        <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', overflow: 'auto' }}>
          {loading ? (
            <div style={{ color: '#666' }}>Carregando...</div>
          ) : flags.length === 0 ? (
            <div style={{ color: '#666' }}>Nenhuma flag configurada</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Nome</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Descrição</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#888', fontSize: '14px' }}>Valor</th>
                  <th style={{ textAlign: 'center', padding: '12px', color: '#888', fontSize: '14px' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px', color: '#888', fontSize: '14px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((flag, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: 600, color: '#58a6ff' }}>{flag.name}</span>
                      {flag.is_global && <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f59e0b', borderRadius: '4px', color: '#fff' }}>Global</span>}
                    </td>
                    <td style={{ padding: '12px', color: '#888', fontSize: '13px' }}>{flag.description || '-'}</td>
                    <td style={{ padding: '12px', color: '#ccc', fontSize: '12px', fontFamily: 'monospace' }}>
                      {editingId === flag.id ? (
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          style={{ width: '100%', height: '60px', padding: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', color: '#ccc', fontSize: '12px' }}
                        />
                      ) : (
                        JSON.stringify(flag.value)
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleActive(flag.id, flag.is_active)}
                        style={{
                          padding: '4px 12px',
                          background: flag.is_active ? '#22c55e' : '#ef4444',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {flag.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {editingId === flag.id ? (
                        <>
                          <button
                            onClick={() => updateFlag(flag.id)}
                            style={{ padding: '4px 12px', background: 'var(--accent)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '12px', marginRight: '8px' }}
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ padding: '4px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', color: '#ccc', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(flag.id); setEditValue(JSON.stringify(flag.value, null, 2)); }}
                            style={{ padding: '4px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: '#ccc', cursor: 'pointer', fontSize: '12px', marginRight: '8px' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteFlag(flag.id)}
                            style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Deletar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}