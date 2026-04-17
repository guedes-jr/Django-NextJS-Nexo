"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Broker {
  code: string;
  name: string;
  logo: string;
  fee_min: number;
  fee_max: number;
  fee_type: string;
  fee_description: string;
  features: string[];
  has_pfp: boolean;
  has_advice: boolean;
  has_banking: boolean;
  rating: number;
}

const ASSET_TYPES = [
  { value: 'actions', label: 'Ações' },
  { value: 'fii', label: 'FIIs' },
  { value: 'options', label: 'Opções' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'treasury', label: 'Tesouro Direto' },
];

const SORT_OPTIONS = [
  { value: 'fee', label: 'Menor Taxa' },
  { value: 'rating', label: 'Melhor Avaliação' },
  { value: 'features', label: 'Mais Recursos' },
];

export default function CorretorasComparativoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [assetType, setAssetType] = useState('actions');
  const [sortBy, setSortBy] = useState('fee');
  const [calculator, setCalculator] = useState({
    broker: '',
    assetType: 'actions',
    value: 10000,
    operations: 1,
  });
  const [calcResult, setCalcResult] = useState<any>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    fetchBrokers();
  }, [assetType, sortBy, router]);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/automations/brokers/compare/?asset_type=${assetType}&sort=${sortBy}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setBrokers(data.brokers);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = async () => {
    try {
      const res = await fetch(`${API_URL}/api/automations/brokers/calculate-fees/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calculator)
      });
      if (res.ok) {
        const data = await res.json();
        setCalcResult(data);
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const getRatingStars = (rating: number) => {
    const stars = Math.round(rating);
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
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
            <h1 className="text-gradient">Comparativo de Corretoras</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Compare taxas, recursos e avaliação entre corretoras</p>
          </div>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Tipo de Ativo</label>
            <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
              {ASSET_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Ordenar por</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="brokers-grid">
          {brokers.map(broker => (
            <div key={broker.code} className="broker-card">
              <div className="broker-header">
                <div className="broker-logo">{broker.logo}</div>
                <div className="broker-info">
                  <h3>{broker.name}</h3>
                  <span className="rating">{getRatingStars(broker.rating)} ({broker.rating})</span>
                </div>
              </div>
              
              <div className="fee-section">
                <span className="fee-label">Taxa por operação</span>
                <span className="fee-value">{broker.fee_description}</span>
              </div>
              
              <div className="features-section">
                <span className="features-label">Recursos</span>
                <div className="features-list">
                  {broker.has_pfp && <span className="feature-tag">PFP</span>}
                  {broker.has_advice && <span className="feature-tag">Assessoria</span>}
                  {broker.has_banking && <span className="feature-tag">Bank</span>}
                </div>
              </div>
              
              <div className="broker-features">
                {broker.features.slice(0, 4).map(f => (
                  <span key={f} className="feature-item">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="calculator-section">
          <h2>🧮 Calculadora de Custos</h2>
          <div className="calc-form">
            <div className="calc-inputs">
              <div className="calc-group">
                <label>Corretora</label>
                <select 
                  value={calculator.broker} 
                  onChange={(e) => setCalculator({...calculator, broker: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {brokers.map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="calc-group">
                <label>Tipo de Ativo</label>
                <select 
                  value={calculator.assetType} 
                  onChange={(e) => setCalculator({...calculator, assetType: e.target.value})}
                >
                  {ASSET_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="calc-group">
                <label>Valor por operação (R$)</label>
                <input 
                  type="number" 
                  value={calculator.value}
                  onChange={(e) => setCalculator({...calculator, value: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="calc-group">
                <label>Operações/mês</label>
                <input 
                  type="number" 
                  value={calculator.operations}
                  onChange={(e) => setCalculator({...calculator, operations: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <button className="calc-btn" onClick={calculateFees}>Calcular</button>
          </div>
          
          {calcResult && (
            <div className="calc-result">
              <h3>Custos estimados - {calcResult.broker}</h3>
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-label">Por operação</span>
                  <span className="result-value">R$ {calcResult.fee_per_operation.toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Por mês</span>
                  <span className="result-value">R$ {calcResult.monthly_fee.toFixed(2)}</span>
                </div>
                <div className="result-item highlight">
                  <span className="result-label">Por ano</span>
                  <span className="result-value">R$ {calcResult.annual_fee.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          
          .filters { display: flex; gap: 16px; }
          .filter-group { display: flex; flex-direction: column; gap: 8px; }
          .filter-group label { font-size: 0.875rem; color: var(--text-secondary); }
          .filter-group select { background: var(--bg-secondary); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 10px 16px; border-radius: 8px; min-width: 150px; }
          
          .brokers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
          .broker-card { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; }
          .broker-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
          .broker-logo { width: 48px; height: 48px; background: var(--accent-primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.25rem; }
          .broker-info h3 { margin: 0; font-size: 1rem; }
          .rating { font-size: 0.75rem; color: var(--text-secondary); }
          
          .fee-section { margin-bottom: 12px; }
          .fee-label { display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px; }
          .fee-value { font-size: 0.875rem; font-weight: 600; }
          
          .features-section { margin-bottom: 12px; }
          .features-label { display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px; }
          .features-list { display: flex; gap: 6px; }
          .feature-tag { background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 0.625rem; text-transform: uppercase; }
          
          .broker-features { display: flex; flex-wrap: wrap; gap: 6px; }
          .feature-item { background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; color: var(--text-secondary); }
          
          .calculator-section { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; }
          .calculator-section h2 { margin: 0 0 16px; font-size: 1.25rem; }
          .calc-form { display: flex; gap: 16px; align-items: flex-end; }
          .calc-inputs { display: flex; gap: 12px; flex: 1; flex-wrap: wrap; }
          .calc-group { display: flex; flex-direction: column; gap: 6px; }
          .calc-group label { font-size: 0.75rem; color: var(--text-secondary); }
          .calc-group select, .calc-group input { background: var(--bg-tertiary); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 10px; border-radius: 8px; min-width: 120px; }
          .calc-btn { background: var(--accent-primary); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; }
          .calc-btn:hover { background: #2563eb; }
          
          .calc-result { margin-top: 20px; padding: 20px; background: var(--bg-tertiary); border-radius: 8px; }
          .calc-result h3 { margin: 0 0 16px; font-size: 1rem; }
          .result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .result-item { text-align: center; }
          .result-item.highlight { background: var(--accent-primary); padding: 12px; border-radius: 8px; }
          .result-item.highlight .result-value { color: white; }
          .result-label { display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px; }
          .result-value { font-size: 1.25rem; font-weight: 700; }
          
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
          
          @media (max-width: 768px) {
            .filters { flex-direction: column; }
            .calc-form { flex-direction: column; }
            .calc-inputs { flex-direction: column; }
            .result-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </main>
    </div>
  );
}