"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';
import styles from './alocacao.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface AllocationData {
  total_balance: number;
  current_allocation: Record<string, number>;
  target_allocation: Record<string, number>;
  deviations: {
    asset_type: string;
    current_pct: number;
    target_pct: number;
    deviation: number;
    action: string;
  }[];
  score: number;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  'ACAO': { label: 'Ações', color: '#3b82f6' },
  'FII': { label: 'FIIs', color: '#8b5cf6' },
  'ETF': { label: 'ETFs', color: '#10b981' },
  'RF': { label: 'Renda Fixa', color: '#eab308' },
  'CRIPTO': { label: 'Cripto', color: '#f59e0b' },
  'PREVIDENCIA': { label: 'Previdência', color: '#0ea5e9' },
  'TESOURO': { label: 'Tesouro', color: '#a855f7' },
};

export default function AlocacaoPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AllocationData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${API_URL}/api/portfolio/allocation/`, {
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
      if (data?.error) {
        setError(data.error);
      } else {
        setData(data);
      }
    })
    .catch(err => setError('Erro ao carregar dados'))
    .finally(() => {
      setLoading(false);
      setMounted(true);
    });
  }, [router]);

  if (!mounted || loading) {
    return (
      <div className={styles.container}>
        <SharedSidebar />
        <main className={styles.main}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
          </div>
        </main>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const chartColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#eab308', '#a855f7'];

  return (
    <div className={styles.container}>
      <SharedSidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className="text-gradient">Alocação Ideal</h1>
            <p className={styles.subtitle}>Compare sua alocação atual com a recomendada</p>
          </div>
        </header>

        {error ? (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        ) : data ? (
          <>
            <div className={styles.scoreCard}>
              <div className={styles.scoreCircle}>
                <span className={styles.scoreValue}>{data.score}</span>
                <span className={styles.scoreLabel}>Score</span>
              </div>
              <div className={styles.scoreInfo}>
                <h3>_score de Alocação</h3>
                <p>Patrimônio: {formatCurrency(data.total_balance)}</p>
              </div>
            </div>

            <section className={`${styles.section} glass-panel`}>
              <h2>Alocação por Classe</h2>
              <div className={styles.allocationGrid}>
                {Object.entries(data.target_allocation).map(([type, target], idx) => {
                  const current = data.current_allocation[type] || 0;
                  const deviation = data.deviations.find(d => d.asset_type === type);
                  const color = chartColors[idx % chartColors.length];
                  
                  return (
                    <div key={type} className={styles.allocationItem}>
                      <div className={styles.allocationHeader}>
                        <span 
                          className={styles.typeBadge}
                          style={{ background: color + '20', color: color }}
                        >
                          {typeLabels[type]?.label || type}
                        </span>
                        <span className={styles.actionBadge}>
                          {deviation?.action || '-'}
                        </span>
                      </div>
                      
                      <div className={styles.bars}>
                        <div className={styles.barWrapper}>
                          <div className={styles.barLabel}>
                            <span>Atual</span>
                            <span>{current.toFixed(1)}%</span>
                          </div>
                          <div className={styles.barBg}>
                            <div 
                              className={styles.barCurrent}
                              style={{ width: `${Math.min(current, 100)}%`, background: color }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className={styles.barWrapper}>
                          <div className={styles.barLabel}>
                            <span>Meta</span>
                            <span>{target}%</span>
                          </div>
                          <div className={styles.barBg}>
                            <div 
                              className={styles.barTarget}
                              style={{ width: `${target}%`, background: color, opacity: 0.3 }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.deviation}>
                        <span className={deviation && deviation.deviation > 0 ? styles.positive : deviation && deviation.deviation < 0 ? styles.negative : ''}>
                          {deviation?.deviation ? (deviation.deviation > 0 ? '+' : '') + deviation.deviation.toFixed(1) + '%' : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={`${styles.section} glass-panel`}>
              <h2>Sugestões de Ajuste</h2>
              <div className={styles.suggestionsList}>
                {data.deviations
                  .filter(d => d.action !== 'MANTER')
                  .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
                  .map((d, idx) => (
                    <div key={idx} className={`${styles.suggestionItem} ${d.action === 'COMPRAR' ? styles.buy : styles.sell}`}>
                      <div className={styles.suggestionIcon}>
                        {d.action === 'COMPRAR' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        )}
                      </div>
                      <div className={styles.suggestionContent}>
                        <span className={styles.suggestionAction}>{d.action}</span>
                        <span className={styles.suggestionType}>{typeLabels[d.asset_type]?.label || d.asset_type}</span>
                        <span className={styles.suggestionDiff}>
                          {d.deviation > 0 ? '+' : ''}{d.deviation.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                
                {data.deviations.every(d => d.action === 'MANTER') && (
                  <div className={styles.noSuggestions}>
                    <p>Sua carteira já está bem balanceada!</p>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}