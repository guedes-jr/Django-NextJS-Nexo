"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';
import styles from './movimentacoes.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Transaction {
  id: number;
  transaction_type: string;
  asset_ticker?: string;
  account_description?: string;
  quantity?: number;
  unit_price?: number;
  total_value: number;
  transaction_date: string;
  notes?: string;
  created_at: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  'COMPRA': { label: 'Compra', color: '#3b82f6' },
  'VENDA': { label: 'Venda', color: '#f59e0b' },
  'APORTE': { label: 'Aporte', color: '#10b981' },
  'RESGATE': { label: 'Resgate', color: '#8b5cf6' },
  'DIVIDENDO': { label: 'Dividendo/Juros', color: '#ec4899' },
  'AMORTIZACAO': { label: 'Amortizacao', color: '#a855f7' },
  'TRANSFERENCIA': { label: 'Transferencia', color: '#0ea5e9' },
};

export default function MovimentacoesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    transaction_type: 'APORTE',
    asset_ticker: '',
    quantity: '',
    unit_price: '',
    total_value: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${API_URL}/api/portfolio/transactions/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (res.status === 401) {
        localStorage.removeItem('nexo_access');
        router.push('/login');
        return null;
      }
      return res.json();
    })
    .then(data => {
      if (data) setTransactions(data);
    })
    .finally(() => {
      setLoading(false);
      setMounted(true);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('nexo_access');
    if (!token) return;

    const payload = {
      transaction_type: formData.transaction_type,
      total_value: parseFloat(formData.total_value),
      transaction_date: formData.transaction_date,
      notes: formData.notes,
      quantity: formData.quantity ? parseFloat(formData.quantity) : null,
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
    };

    try {
      const res = await fetch(`${API_URL}/api/portfolio/transactions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await fetch(`${API_URL}/api/portfolio/transactions/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await updated.json();
        setTransactions(data);
        setShowModal(false);
        setFormData({
          transaction_type: 'APORTE',
          asset_ticker: '',
          quantity: '',
          unit_price: '',
          total_value: '',
          transaction_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!mounted || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  let filteredTransactions = transactions;
  if (filterType !== 'all') {
    filteredTransactions = transactions.filter(t => t.transaction_type === filterType);
  }

  const totalIn = transactions
    .filter(t => ['APORTE', 'DIVIDENDO', 'RESGATE'].includes(t.transaction_type))
    .reduce((acc, t) => acc + t.total_value, 0);
  
  const totalOut = transactions
    .filter(t => ['COMPRA', 'RESGATE'].includes(t.transaction_type))
    .reduce((acc, t) => acc + t.total_value, 0);

  return (
    <div className={styles.container}>
      <SharedSidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className="text-gradient">Movimentacoes</h1>
            <p className={styles.subtitle}>Historico de entradas e saidas</p>
          </div>
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nova Movimentacao
          </button>
        </header>

        <div className={styles.summaryCards}>
          <div className={`${styles.summaryCard} glass-panel`}>
            <span className={styles.summaryLabel}>Total Entradas</span>
            <span className={styles.summaryValue} style={{ color: 'var(--success)' }}>{formatCurrency(totalIn)}</span>
          </div>
          <div className={`${styles.summaryCard} glass-panel`}>
            <span className={styles.summaryLabel}>Total Saidas</span>
            <span className={styles.summaryValue} style={{ color: 'var(--danger)' }}>{formatCurrency(totalOut)}</span>
          </div>
          <div className={`${styles.summaryCard} glass-panel`}>
            <span className={styles.summaryLabel}>Saldo Liquido</span>
            <span className={styles.summaryValue} style={{ color: totalIn - totalOut >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {formatCurrency(totalIn - totalOut)}
            </span>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Tipo</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Todas</option>
              <option value="APORTE">Aporte</option>
              <option value="RESGATE">Resgate</option>
              <option value="COMPRA">Compra</option>
              <option value="VENDA">Venda</option>
              <option value="DIVIDENDO">Dividendo</option>
              <option value="AMORTIZACAO">Amortizacao</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>
        </div>

        <div className={styles.transactionList}>
          {filteredTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhuma movimentacao encontrada</p>
            </div>
          ) : (
            filteredTransactions.map(tx => {
              const typeInfo = typeLabels[tx.transaction_type] || { label: tx.transaction_type, color: '#666' };
              const isPositive = ['APORTE', 'DIVIDENDO', 'VENDA', 'RESGATE'].includes(tx.transaction_type);
              
              return (
                <div className={`${styles.transactionItem} glass-panel`} key={tx.id}>
                  <div className={styles.txIcon} style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
                    {tx.transaction_type === 'COMPRA' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
                    {tx.transaction_type === 'VENDA' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
                    {tx.transaction_type === 'APORTE' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>}
                    {tx.transaction_type === 'RESGATE' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>}
                    {tx.transaction_type === 'DIVIDENDO' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>}
                    {tx.transaction_type === 'AMORTIZACAO' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>}
                    {tx.transaction_type === 'TRANSFERENCIA' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>}
                  </div>
                  
                  <div className={styles.txDetails}>
                    <span className={styles.txType}>{typeInfo.label}</span>
                    {tx.asset_ticker && <span className={styles.txAsset}>{tx.asset_ticker}</span>}
                    <span className={styles.txDate}>{formatDate(tx.transaction_date)}</span>
                    {tx.notes && <span className={styles.txNotes}>{tx.notes}</span>}
                  </div>
                  
                  <div className={styles.txValue}>
                    <span className={isPositive ? styles.positive : styles.negative}>
                      {isPositive ? '+' : '-'}{formatCurrency(tx.total_value)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={`${styles.modal} glass-panel`} onClick={e => e.stopPropagation()}>
              <h2>Nova Movimentacao</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Tipo</label>
                  <select value={formData.transaction_type} onChange={e => setFormData({...formData, transaction_type: e.target.value})}>
                    <option value="APORTE">Aporte</option>
                    <option value="RESGATE">Resgate</option>
                    <option value="COMPRA">Compra</option>
                    <option value="VENDA">Venda</option>
                    <option value="DIVIDENDO">Dividendo</option>
                    <option value="AMORTIZACAO">Amortizacao</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Valor Total</label>
                  <input type="number" step="0.01" value={formData.total_value} onChange={e => setFormData({...formData, total_value: e.target.value})} required />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Data</label>
                  <input type="date" value={formData.transaction_date} onChange={e => setFormData({...formData, transaction_date: e.target.value})} required />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Notas (opcional)</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} />
                </div>
                
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className={styles.submitBtn}>Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}