"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface BrokerConnection {
  id: number;
  broker_name: string;
  broker_code: string;
  status: string;
  last_sync: string | null;
  created_at: string;
}

interface SyncLog {
  sync_date: string;
  status: string;
  positions_synced: number;
  transactions_synced: number;
  error_message: string;
}

const AVAILABLE_BROKERS = [
  { code: 'XP', name: 'XP Investimentos' },
  { code: 'CLEAR', name: 'Clear Corretora' },
  { code: 'B3', name: 'B3 Direct' },
  { code: 'RICO', name: 'Rico Corretora' },
  { code: 'MODAL', name: 'ModalMais' },
  { code: 'NUBANK', name: 'Nubank' },
  { code: 'INTER', name: 'Banco Inter' },
  { code: 'CITI', name: 'Citi' },
  { code: 'UBS', name: 'UBS' },
];

export default function CorretorasPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedConn, setSelectedConn] = useState<BrokerConnection | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/automations/brokers/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const addConnection = async (brokerCode: string, brokerName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/automations/brokers/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          broker_name: brokerName,
          broker_code: brokerCode
        })
      });
      
      if (res.ok) {
        fetchConnections();
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const removeConnection = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta conexão?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/automations/brokers/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchConnections();
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const simulateSync = async (conn: BrokerConnection) => {
    try {
      const res = await fetch(`${API_URL}/api/automations/brokers/${conn.id}/sync/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchConnections();
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const viewSyncLogs = async (conn: BrokerConnection) => {
    try {
      const res = await fetch(`${API_URL}/api/automations/brokers/${conn.id}/sync/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSelectedConn(conn);
        setSyncLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'CONNECTED': '#22c55e',
      'PENDING': '#f59e0b',
      'ERROR': '#ef4444',
      'DISABLED': '#6b7280',
    };
    return colors[status] || '#888';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'CONNECTED': 'Conectado',
      'PENDING': 'Pendente',
      'ERROR': 'Erro',
      'DISABLED': 'Desativado',
    };
    return labels[status] || status;
  };

  const connectedCodes = connections.map(c => c.broker_code);
  const availableBrokers = AVAILABLE_BROKERS.filter(b => !connectedCodes.includes(b.code));

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
            <h1 className="text-gradient">Conexão de Corretoras</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Conecte suas corretoras para sincronizarautomaticamente sua carteira</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Adicionar Corretora</button>
        </div>

        <div className="info-banner">
          <span className="info-icon">ℹ️</span>
          <div className="info-content">
            <strong>Integração via Open Finance</strong>
            <p>A conexão é feita através do Open Finance Brasil. Seus dados são criptografados e nunca são compartilhados sem seu consentimento explícito.</p>
          </div>
        </div>

        <div className="section">
          <h2>Corretoras Conectadas ({connections.length})</h2>
          {connections.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🏦</div>
              <h3>Nenhuma corretora conectada</h3>
              <p>Adicione uma corretora para sincronizar automaticamente sua carteira</p>
            </div>
          ) : (
            <div className="connections-grid">
              {connections.map(conn => (
                <div key={conn.id} className="connection-card">
                  <div className="connection-header">
                    <div className="broker-logo">
                      {conn.broker_name.charAt(0)}
                    </div>
                    <div className="connection-info">
                      <h3>{conn.broker_name}</h3>
                      <span className="connection-code">{conn.broker_code}</span>
                    </div>
                    <span className="connection-status" style={{ backgroundColor: getStatusColor(conn.status) }}>
                      {getStatusLabel(conn.status)}
                    </span>
                  </div>
                  
                  <div className="connection-meta">
                    <div className="meta-item">
                      <span className="meta-label">Última Sincronização</span>
                      <span className="meta-value">
                        {conn.last_sync ? new Date(conn.last_sync).toLocaleString('pt-BR') : 'Nunca'}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Criado em</span>
                      <span className="meta-value">
                        {new Date(conn.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="connection-actions">
                    <button className="btn-sync" onClick={() => simulateSync(conn)}>
                      🔄 Sincronizar
                    </button>
                    <button className="btn-logs" onClick={() => viewSyncLogs(conn)}>
                      📋 Logs
                    </button>
                    <button className="btn-remove" onClick={() => removeConnection(conn.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedConn && (
          <div className="section">
            <h2>Histórico de Sincronização - {selectedConn.broker_name}</h2>
            <div className="logs-table">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Posições</th>
                    <th>Transações</th>
                    <th>Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {syncLogs.map((log, i) => (
                    <tr key={i}>
                      <td>{new Date(log.sync_date).toLocaleString('pt-BR')}</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(log.status) }}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.positions_synced}</td>
                      <td>{log.transactions_synced}</td>
                      <td className="error-cell">{log.error_message || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn-secondary" onClick={() => setSelectedConn(null)}>Fechar</button>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Adicionar Corretora</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
              </div>
              
              <div className="broker-list">
                {availableBrokers.map(broker => (
                  <div 
                    key={broker.code} 
                    className="broker-option"
                    onClick={() => { addConnection(broker.code, broker.name); setShowModal(false); }}
                  >
                    <div className="broker-icon">{broker.name.charAt(0)}</div>
                    <div className="broker-info">
                      <span className="broker-name">{broker.name}</span>
                      <span className="broker-code">{broker.code}</span>
                    </div>
                    <span className="add-icon">+</span>
                  </div>
                ))}
              </div>
              
              <p className="modal-note">
                Em ambiente de produção, você será redirecionado para o login da corretora através do Open Finance.
              </p>
            </div>
          </div>
        )}

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          .btn-primary { background: var(--accent-primary); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
          .btn-primary:hover { background: #2563eb; }
          
          .info-banner { display: flex; gap: 16px; padding: 20px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; }
          .info-icon { font-size: 1.5rem; }
          .info-content strong { display: block; margin-bottom: 4px; }
          .info-content p { margin: 0; color: var(--text-secondary); font-size: 0.875rem; }
          
          .section { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; }
          .section h2 { color: var(--text-secondary); font-size: 0.875rem; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 0.05em; }
          
          .empty { text-align: center; padding: 40px; }
          .empty-icon { font-size: 3rem; margin-bottom: 16px; }
          .empty h3 { margin: 0 0 8px; }
          .empty p { color: var(--text-secondary); margin: 0; }
          
          .connections-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
          .connection-card { background: var(--bg-tertiary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; }
          .connection-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
          .broker-logo { width: 48px; height: 48px; background: var(--accent-primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; }
          .connection-info { flex: 1; }
          .connection-info h3 { margin: 0; font-size: 1rem; }
          .connection-code { font-size: 0.75rem; color: var(--text-secondary); }
          .connection-status { padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; color: white; }
          
          .connection-meta { display: flex; gap: 24px; margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; }
          .meta-item { display: flex; flex-direction: column; }
          .meta-label { font-size: 0.75rem; color: var(--text-secondary); }
          .meta-value { font-size: 0.875rem; }
          
          .connection-actions { display: flex; gap: 8px; }
          .btn-sync, .btn-logs { flex: 1; padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-size: 0.875rem; }
          .btn-sync { background: var(--accent-primary); color: white; }
          .btn-logs { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--glass-border); }
          .btn-remove { background: transparent; border: none; cursor: pointer; font-size: 1rem; opacity: 0.6; }
          .btn-remove:hover { opacity: 1; }
          
          .logs-table { margin-bottom: 16px; }
          .logs-table table { width: 100%; border-collapse: collapse; }
          .logs-table th { text-align: left; padding: 12px; background: var(--bg-tertiary); font-size: 0.75rem; color: var(--text-secondary); }
          .logs-table td { padding: 12px; border-bottom: 1px solid var(--glass-border); font-size: 0.875rem; }
          .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; color: white; }
          .error-cell { color: var(--danger); }
          .btn-secondary { background: var(--bg-tertiary); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 10px 20px; border-radius: 8px; cursor: pointer; }
          
          .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
          .modal { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 16px; padding: 24px; width: 100%; max-width: 480px; }
          .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .modal-header h2 { margin: 0; }
          .close-btn { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-secondary); }
          
          .broker-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
          .broker-option { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--bg-tertiary); border: 1px solid var(--glass-border); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
          .broker-option:hover { border-color: var(--accent-primary); }
          .broker-icon { width: 40px; height: 40px; background: var(--accent-primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
          .broker-info { flex: 1; }
          .broker-name { display: block; font-weight: 500; }
          .broker-code { font-size: 0.75rem; color: var(--text-secondary); }
          .add-icon { font-size: 1.5rem; color: var(--accent-primary); }
          
          .modal-note { font-size: 0.75rem; color: var(--text-secondary); text-align: center; margin: 0; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
        `}</style>
      </main>
    </div>
  );
}