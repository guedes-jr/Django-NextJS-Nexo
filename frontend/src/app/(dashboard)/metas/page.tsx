"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Goal {
  id: number;
  name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution?: number;
  progress_percentage: number;
  remaining_amount: number;
}

const typeLabels: Record<string, string> = {
  'APOSENTADORIA': 'Aposentadoria',
  'IMOVEL': 'Compra de Imovel',
  'VIAGEM': 'Viagem',
  'EDUCACAO': 'Educacao',
  'EMERGENCIA': 'Reserva de Emergencia',
  'CRESCIMENTO': 'Crescimento Patrimonial',
  'OUTRO': 'Outro',
};

const typeColors: Record<string, string> = {
  'APOSENTADORIA': '#8b5cf6',
  'IMOVEL': '#3b82f6',
  'VIAGEM': '#10b981',
  'EDUCACAO': '#f59e0b',
  'EMERGENCIA': '#ec4899',
  'CRESCIMENTO': '#0ea5e9',
  'OUTRO': '#6b7280',
};

function SimulatorSection() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    initial: '10000',
    monthly: '1000',
    annual_rate: '10',
    months: '120'
  });

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('nexo_access');
    try {
      const res = await fetch(`${API_URL}/api/portfolio/simulator/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial: parseFloat(formData.initial.replace(',', '.')),
          monthly: parseFloat(formData.monthly.replace(',', '.')),
          annual_rate: parseFloat(formData.annual_rate),
          months: parseInt(formData.months)
        })
      });
      const data = await res.json();
      if (data.projections) setResults(data.projections);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px' }}>
      <form onSubmit={handleSimulate} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div><label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Inicial</label><input type="text" value={formData.initial} onChange={e => setFormData({...formData, initial: e.target.value})} style={{ padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} /></div>
        <div><label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mensal</label><input type="text" value={formData.monthly} onChange={e => setFormData({...formData, monthly: e.target.value})} style={{ padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} /></div>
        <div><label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Taxa%</label><input type="text" value={formData.annual_rate} onChange={e => setFormData({...formData, annual_rate: e.target.value})} style={{ padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} /></div>
        <div><label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Meses</label><input type="text" value={formData.months} onChange={e => setFormData({...formData, months: e.target.value})} style={{ padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} /></div>
        <button type="submit" disabled={loading} style={{ padding: '10px 24px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>{loading ? '...' : 'Simular'}</button>
      </form>
      {results.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', fontSize: '12px', color: 'var(--text-secondary)', paddingBottom: '8px', borderBottom: '1px solid var(--glass-border)' }}>
            <span>Ano</span><span>Valor</span><span>Investido</span><span>Lucro</span>
          </div>
          {results.slice(0, 10).map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', padding: '8px 0', fontSize: '14px' }}>
              <span>{r.year}o</span><span>{formatCurrency(r.value)}</span><span>{formatCurrency(r.total_invested)}</span><span style={{ color: 'var(--success)' }}>+{formatCurrency(r.profit)}</span>
            </div>
          ))}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Final:</span><span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(results[results.length-1]?.value || 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MetasPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', goal_type: 'CRESCIMENTO', target_amount: '', target_date: '', monthly_contribution: '' });

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) { router.push('/login'); return; }
    fetch(`${API_URL}/api/portfolio/goals/`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data) setGoals(data); })
      .finally(() => { setLoading(false); setMounted(true); });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('nexo_access');
    await fetch(`${API_URL}/api/portfolio/goals/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, target_amount: parseFloat(formData.target_amount), monthly_contribution: formData.monthly_contribution ? parseFloat(formData.monthly_contribution) : null })
    });
    setShowModal(false);
    window.location.reload();
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '';

  if (!mounted || loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div style={{ width: 40, height: 40, border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;

  const totalTarget = goals.reduce((a, g) => a + g.target_amount, 0);
  const totalCurrent = goals.reduce((a, g) => a + g.current_amount, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--glass-border)' }}>
          <div>
            <h1 style={{ fontSize: '28px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Metas e Objetivos</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Planeje seu futuro financeiro</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nova Meta
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px' }}><span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total de Metas</span><span style={{ fontSize: '28px', fontWeight: 700 }}>{goals.length}</span></div>
          <div style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px' }}><span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Valor Planejado</span><span style={{ fontSize: '28px', fontWeight: 700 }}>{formatCurrency(totalTarget)}</span></div>
          <div style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px' }}><span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Ja Accumulado</span><span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(totalCurrent)}</span></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {goals.length === 0 ? (
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px', color: 'var(--text-secondary)', gap: '16px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <p>Nenhuma meta cadastrada</p>
              <button onClick={() => setShowModal(true)} style={{ padding: '12px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Criar Primeira Meta</button>
            </div>
          ) : goals.map(goal => {
            const color = typeColors[goal.goal_type] || '#6b7280';
            return (
              <div key={goal.id} style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: color + '20', color }}>{typeLabels[goal.goal_type] || goal.goal_type}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Prazo: {formatDate(goal.target_date)}</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>{goal.name}</h3>
                <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ width: goal.progress_percentage + '%', height: '100%', background: color, borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span>{goal.progress_percentage.toFixed(1)}% concluido</span>
                  <span>{formatCurrency(goal.target_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '14px' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Atual</span><div>{formatCurrency(goal.current_amount)}</div></div>
                  <div style={{ textAlign: 'right' }}><span style={{ color: 'var(--text-secondary)' }}>Falta</span><div>{formatCurrency(goal.remaining_amount)}</div></div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Simulador de Investimento</h2>
          <SimulatorSection />
        </div>
      </main>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px' }}>Nova Meta</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Nome</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} required /></div>
              <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Tipo</label><select value={formData.goal_type} onChange={e => setFormData({...formData, goal_type: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}><option value="CRESCIMENTO">Crescimento</option><option value="APOSENTADORIA">Aposentadoria</option><option value="IMOVEL">Imovel</option><option value="VIAGEM">Viagem</option><option value="EMERGENCIA">Emergencia</option></select></div>
              <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Valor Alvo</label><input type="number" step="0.01" value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} required /></div>
              <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Data Alvo</label><input type="date" value={formData.target_date} onChange={e => setFormData({...formData, target_date: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} required /></div>
              <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Aporte Mensal</label><input type="number" step="0.01" value={formData.monthly_contribution} onChange={e => setFormData({...formData, monthly_contribution: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}