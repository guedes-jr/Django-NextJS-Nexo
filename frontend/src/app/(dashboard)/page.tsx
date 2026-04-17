"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';
import styles from '../../page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('http://localhost:8001/api/portfolio/summary/', {
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
      if (data) setData(data);
    })
    .finally(() => {
      setMounted(true);
    });
  }, [router]);

  if (!mounted) return <div className={styles.loading}>Carregando...</div>;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className={styles.container}>
      <SharedSidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className="text-gradient">Dashboard</h1>
            <p className={styles.subtitle}>Visão geral do seu patrimônio</p>
          </div>
          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Adicionar Ativo
          </button>
        </header>
        
        {data && (
          <>
            <div className={styles.summaryCards}>
              <div className={`${styles.summaryCard} glass-panel`}>
                <span className={styles.summaryLabel}>Patrimônio Total</span>
                <span className={styles.summaryValue}>{formatCurrency(data.total_balance || 0)}</span>
              </div>
              <div className={`${styles.summaryCard} glass-panel`}>
                <span className={styles.summaryLabel}>Variação (30d)</span>
                <span className={styles.summaryValue} style={{ color: (data.daily_variation || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {(data.daily_variation || 0) >= 0 ? '+' : ''}{formatCurrency(data.daily_variation || 0)}
                </span>
              </div>
              <div className={`${styles.summaryCard} glass-panel`}>
                <span className={styles.summaryLabel}>Total Investido</span>
                <span className={styles.summaryValue}>{formatCurrency(data.total_cost || 0)}</span>
              </div>
              <div className={`${styles.summaryCard} glass-panel`}>
                <span className={styles.summaryLabel}>Posições</span>
                <span className={styles.summaryValue}>{data.positions?.length || 0}</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}