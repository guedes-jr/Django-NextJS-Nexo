"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Trigger {
  id: number;
  name: string;
  trigger_type: string;
  condition_value: number;
  asset_ticker: string;
  is_active: boolean;
}

interface Broker {
  id: number;
  broker_name: string;
  broker_code: string;
  status: string;
  last_sync: string;
}

const triggerTypes = [
  { value: 'PRICE_ABOVE', label: 'Preco acima de' },
  { value: 'PRICE_BELOW', label: 'Preco abaixo de' },
  { value: 'PROFIT_ABOVE', label: 'Lucro acima de %' },
];

const brokers = [
  { code: 'XP', name: 'XP Investimentos' },
  { code: 'CLEAR', name: 'Clear' },
  { code: 'BTG', name: 'BTG Pactual' },
];

export default function AutomationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [brokerConnections, setBrokerConnections] = useState<Broker[]>([]);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [triggerForm, setTriggerForm] = useState({ name: '', trigger_type: 'PRICE_ABOVE', condition_value: '', asset_ticker: '' });
  const [brokerForm, setBrokerForm] = useState({ broker_code: '', account_number: '' });

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) { router.push('/login'); return; }
    Promise.all([
      fetch(`${API_URL}/api/automations/triggers/`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/api/automations/brokers/`, { headers: { 'Authorization': `Bearer ${token}` } })
    ])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(([t, b]) => { setTriggers(t); setBrokerConnections(b); })
      .finally(() => { setLoading(false); });
  }, [router]);

  const handleCreateTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('nexo_access');
    await fetch(`${API_URL}/api/automations/triggers/`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...triggerForm, condition_value: parseFloat(triggerForm.condition_value) })
    });
    setShowTriggerModal(false);
    window.location.reload();
  };

  const handleDeleteTrigger = async (id: number) => {
    const token = localStorage.getItem('nexo_access');
    await fetch(`${API_URL}/api/automations/triggers/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    setTriggers(triggers.filter(t => t.id !== id));
  };

  const handleCreateBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('nexo_access');
    const broker = brokers.find(b => b.code === brokerForm.broker_code);
    await fetch(`${API_URL}/api/automations/brokers/`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...brokerForm, broker_name: broker?.name || brokerForm.broker_code })
    });
    setShowBrokerModal(false);
    window.location.reload();
  };

  const handleDeleteBroker = async (id: number) => {
    const token = localStorage.getItem('nexo_access');
    await fetch(`${API_URL}/api/automations/brokers/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    setBrokerConnections(brokerConnections.filter(b => b.id !== id));
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--glass-border)', marginBottom: '8px' }}>
          <div>
            <h1 className="text-gradient animate-fade-in">Automações e Integrações</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Gerencie seus gatilhos, conexões e fluxos inteligentes</p>
          </div>
        </header>

        <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px' }}>Gatilhos Automaticos</h2>
            <button onClick={() => setShowTriggerModal(true)} style={{ padding: '8px 16px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>+ Novo</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {triggers.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Nenhum gatilho</p> : triggers.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                <div><div style={{ fontWeight: 600 }}>{t.name}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{triggerTypes.find(x => x.value === t.trigger_type)?.label} {t.condition_value} {t.asset_ticker}</div></div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ fontSize: '12px', color: t.is_active ? 'var(--success)' : 'var(--text-secondary)' }}>{t.is_active ? 'Ativo' : 'Inativo'}</span><button onClick={() => handleDeleteTrigger(t.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>Excluir</button></div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px' }}>Corretoras Conectadas</h2>
            <button onClick={() => setShowBrokerModal(true)} style={{ padding: '8px 16px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>+ Conectar</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {brokerConnections.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Nenhuma corretora</p> : brokerConnections.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                <div><div style={{ fontWeight: 600 }}>{b.broker_name}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.status}</div></div>
                <button onClick={() => handleDeleteBroker(b.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>Desconectar</button>
              </div>
            ))}
          </div>
        </section>

        {showTriggerModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowTriggerModal(false)}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '32px', width: '400px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ marginBottom: '16px' }}>Novo Gatilho</h2>
              <form onSubmit={handleCreateTrigger}>
                <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Nome</label><input value={triggerForm.name} onChange={e => setTriggerForm({...triggerForm, name: e.target.value})} required style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} /></div>
                <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Tipo</label><select value={triggerForm.trigger_type} onChange={e => setTriggerForm({...triggerForm, trigger_type: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}>{triggerTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Valor</label><input type="number" step="0.01" value={triggerForm.condition_value} onChange={e => setTriggerForm({...triggerForm, condition_value: e.target.value})} required style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} /></div>
                <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Ativo (opcional)</label><input value={triggerForm.asset_ticker} onChange={e => setTriggerForm({...triggerForm, asset_ticker: e.target.value})} placeholder="Ex: PETR4" style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} /></div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowTriggerModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Criar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showBrokerModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowBrokerModal(false)}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '32px', width: '400px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ marginBottom: '16px' }}>Conectar Corretora</h2>
              <form onSubmit={handleCreateBroker}>
                <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Corretora</label><select value={brokerForm.broker_code} onChange={e => setBrokerForm({...brokerForm, broker_code: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}><option value="">Selecione...</option>{brokers.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}</select></div>
                <div style={{ marginBottom: '16px' }}><label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Conta</label><input value={brokerForm.account_number} onChange={e => setBrokerForm({...brokerForm, account_number: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} /></div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowBrokerModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Conectar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}