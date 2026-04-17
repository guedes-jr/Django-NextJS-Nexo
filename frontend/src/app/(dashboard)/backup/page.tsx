"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface BackupSummary {
  positions_count: number;
  transactions_count: number;
  goals_count: number;
  automations_count: number;
}

export default function BackupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [options, setOptions] = useState({
    positions: true,
    transactions: true,
    goals: true,
    automations: true,
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    checkBackup();
  }, [router]);

  const checkBackup = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/portfolio/backup/export/?format=json&positions=true&transactions=true&goals=true&automations=true`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async (format: 'json' | 'csv') => {
    try {
      setDownloading(true);
      const params = new URLSearchParams({ format });
      if (options.positions) params.append('positions', 'true');
      if (options.transactions) params.append('transactions', 'true');
      if (options.goals) params.append('goals', 'true');
      if (options.automations) params.append('automations', 'true');
      
      const res = await fetch(`${API_URL}/api/portfolio/backup/export/?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (format === 'json') {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexo_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexo_backup_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
      
      alert('Backup baixado com sucesso!');
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao fazer backup');
    } finally {
      setDownloading(false);
    }
  };

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
            <h1 className="text-gradient">Backup e Exportação</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Exporte todos os seus dados da plataforma NEXO</p>
          </div>
        </div>

        <div className="info-section">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <strong>Sobre o backup</strong>
            <p>Você pode exportar todos os seus dados incluindo posições, transações, metas e automações. O backup pode ser usado para迁移 de conta ou como резервная копия de segurança.</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{summary?.positions_count || 0}</span>
            <span className="stat-label">Posições</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{summary?.transactions_count || 0}</span>
            <span className="stat-label">Transações</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{summary?.goals_count || 0}</span>
            <span className="stat-label">Metas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{summary?.automations_count || 0}</span>
            <span className="stat-label">Automações</span>
          </div>
        </div>

        <div className="options-section">
          <h2>O que incluir no backup</h2>
          <div className="options-grid">
            <label className="option-item">
              <input 
                type="checkbox" 
                checked={options.positions}
                onChange={(e) => setOptions({...options, positions: e.target.checked})}
              />
              <span className="option-label">Posições da carteira</span>
              <span className="option-desc">Ativos, quantidade, preço médio, corretora</span>
            </label>
            <label className="option-item">
              <input 
                type="checkbox" 
                checked={options.transactions}
                onChange={(e) => setOptions({...options, transactions: e.target.checked})}
              />
              <span className="option-label">Histórico de transações</span>
              <span className="option-desc">Aportes, vendas, dividendos</span>
            </label>
            <label className="option-item">
              <input 
                type="checkbox" 
                checked={options.goals}
                onChange={(e) => setOptions({...options, goals: e.target.checked})}
              />
              <span className="option-label">Metas de investimento</span>
              <span className="option-desc">Valores alvo, horizontes, aportes</span>
            </label>
            <label className="option-item">
              <input 
                type="checkbox" 
                checked={options.automations}
                onChange={(e) => setOptions({...options, automations: e.target.checked})}
              />
              <span className="option-label">Automações</span>
              <span className="option-desc">Gatilhos e configurações</span>
            </label>
          </div>
        </div>

        <div className="download-section">
          <h2>Formato de exportação</h2>
          <div className="download-buttons">
            <button 
              className="download-btn primary"
              onClick={() => downloadBackup('json')}
              disabled={downloading}
            >
              📦 {downloading ? 'Baixando...' : 'Baixar JSON (Completo)'}
            </button>
            <button 
              className="download-btn secondary"
              onClick={() => downloadBackup('csv')}
              disabled={downloading}
            >
              📊 {downloading ? 'Baixando...' : 'Baixar CSV (Resumo)'}
            </button>
          </div>
          <p className="download-note">
            O formato JSON inclui todos os dados e é ideal para backup completo ou migração.<br/>
            O formato CSV é mais simples e compatível com Excel/Numbers.
          </p>
        </div>

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          
          .info-section { display: flex; gap: 16px; padding: 20px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; }
          .info-icon { font-size: 1.5rem; }
          .info-content strong { display: block; margin-bottom: 4px; }
          .info-content p { margin: 0; color: var(--text-secondary); font-size: 0.875rem; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
          .stat-card { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; text-align: center; }
          .stat-value { display: block; font-size: 2rem; font-weight: 700; }
          .stat-label { font-size: 0.875rem; color: var(--text-secondary); }
          
          .options-section { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; }
          .options-section h2 { font-size: 1rem; margin: 0 0 16px; color: var(--text-secondary); }
          .options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .option-item { display: flex; flex-direction: column; gap: 4px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; cursor: pointer; }
          .option-item input { width: 20px; height: 20px; }
          .option-label { font-weight: 600; }
          .option-desc { font-size: 0.75rem; color: var(--text-secondary); }
          
          .download-section { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; }
          .download-section h2 { font-size: 1rem; margin: 0 0 16px; color: var(--text-secondary); }
          .download-buttons { display: flex; gap: 16px; margin-bottom: 16px; }
          .download-btn { flex: 1; padding: 16px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
          .download-btn.primary { background: var(--accent-primary); color: white; }
          .download-btn.primary:hover { background: #2563eb; }
          .download-btn.secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--glass-border); }
          .download-btn.secondary:hover { background: var(--bg-primary); }
          .download-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .download-note { font-size: 0.75rem; color: var(--text-secondary); text-align: center; margin: 0; }
          
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
          
          @media (max-width: 768px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .options-grid { grid-template-columns: 1fr; }
            .download-buttons { flex-direction: column; }
          }
        `}</style>
      </main>
    </div>
  );
}