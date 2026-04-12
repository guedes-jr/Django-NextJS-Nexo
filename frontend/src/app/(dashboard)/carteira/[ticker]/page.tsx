"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './detalhes.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Asset {
  ticker: string;
  name: string;
  asset_type: string;
}

interface Position {
  id: number;
  asset: Asset;
  quantity: number;
  average_price: number;
  current_price: number;
  total_value: number;
  profit_pct: number;
  profit_value: number;
}

interface QuoteData {
  ticker: string;
  price: number;
  currency: string;
  exchange: string;
}

interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const typeColors: Record<string, { bg: string; color: string }> = {
  'CRIPTO': { bg: '#f59e0b', color: '#000' },
  'FII': { bg: '#8b5cf6', color: '#fff' },
  'ACAO': { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
  'ETF': { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
  'RF': { bg: 'rgba(234, 179, 8, 0.2)', color: '#eab308' },
  'TESOURO': { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' },
  'FUNDO': { bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899' },
};

const typeLabels: Record<string, string> = {
  'ACAO': 'Acao',
  'FII': 'Fundo Imobiliario',
  'ETF': 'ETF',
  'RF': 'Renda Fixa',
  'TESOURO': 'Tesouro Direto',
  'CRIPTO': 'Criptomoeda',
  'FUNDO': 'Fundo de Investimento',
  'PREVIDENCIA': 'Previdencia Privada',
};

export default function DetalhesAtivoPage() {
  const router = useRouter();
  const params = useParams();
  const ticker = params?.ticker as string;
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<Position | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [period, setPeriod] = useState('1mo');
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token || !ticker) {
      router.push('/carteira');
      return;
    }

    Promise.all([
      fetch(`${API_URL}/api/portfolio/summary/`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/api/market/quote/?ticker=${ticker}`, { headers: { 'Authorization': `Bearer ${token}` } })
    ])
    .then(([res1, res2]) => Promise.all([res1.json(), res2.json()]))
    .then(([summaryData, quoteData]) => {
      const pos = summaryData.positions?.find((p: Position) => p.asset.ticker === ticker);
      if (pos) {
        setPosition(pos);
        setQuote(quoteData.ticker ? quoteData : null);
      }
    })
    .finally(() => {
      setLoading(false);
      setMounted(true);
    });
  }, [router, ticker]);

  useEffect(() => {
    if (!mounted || !ticker) return;
    
    const token = localStorage.getItem('nexo_access');
    setLoadingChart(true);
    
    fetch(`${API_URL}/api/market/history/?ticker=${ticker}&period=${period}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.history) {
        setHistory(data.history);
      }
    })
    .finally(() => setLoadingChart(false));
  }, [mounted, ticker, period]);

  if (!mounted || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Ativo nao encontrado</h2>
          <p>O ativo {ticker} nao foi encontrado na sua carteira.</p>
          <Link href="/carteira" className={styles.backBtn}>Voltar para Carteira</Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const config = typeColors[position.asset.asset_type] || typeColors['ACAO'];
  const isPositive = position.profit_pct >= 0;
  
  const minPrice = history.length > 0 ? Math.min(...history.map(h => h.low)) : 0;
  const maxPrice = history.length > 0 ? Math.max(...history.map(h => h.high)) : 0;
  const range = maxPrice - minPrice || 1;

  const svgHeight = 200;
  const svgWidth = 600;
  const padding = 10;
  
  const points = history.map((point, i) => {
    const x = padding + (i / (history.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((point.close - minPrice) / range) * (svgHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo} onClick={() => router.push('/')}>
          <img src="/logo.png" alt="NEXO Logo" width={36} height={36} />
          <span>NEXO</span>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Dashboard
          </Link>
          <Link href="/carteira" className={`${styles.navItem} ${styles.active}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            Carteira
          </Link>
          <Link href="/movimentacoes" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Movimentacoes
          </Link>
          <Link href="/metas" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Metas
          </Link>
          <Link href="/alertas" className={styles.navItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            Alertas
          </Link>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/carteira" className={styles.backLink}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Voltar
            </Link>
            <div className={styles.assetHeader}>
              <div className={styles.assetIcon} style={{ background: config.bg, color: config.color }}>
                {position.asset.ticker.substring(0, 2)}
              </div>
              <div>
                <h1 className="text-gradient">{position.asset.name}</h1>
                <span className={styles.assetTicker}>{position.asset.ticker} - {typeLabels[position.asset.asset_type]}</span>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.priceSection}>
          <div className={styles.currentPrice}>
            <span className={styles.priceLabel}>Cotacao Atual</span>
            <span className={styles.priceValue}>
              {quote?.price ? formatCurrency(quote.price) : formatCurrency(position.current_price)}
            </span>
            <span className={styles.exchange}>{quote?.exchange || 'B3'}</span>
          </div>
          
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} glass-panel`}>
              <span className={styles.statLabel}>Quantidade</span>
              <span className={styles.statValue}>{position.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</span>
            </div>
            <div className={`${styles.statCard} glass-panel`}>
              <span className={styles.statLabel}>Preco Medio</span>
              <span className={styles.statValue}>{formatCurrency(position.average_price)}</span>
            </div>
            <div className={`${styles.statCard} glass-panel`}>
              <span className={styles.statLabel}>Valor Total</span>
              <span className={styles.statValue}>{formatCurrency(position.total_value)}</span>
            </div>
            <div className={`${styles.statCard} glass-panel`}>
              <span className={styles.statLabel}>Rentabilidade</span>
              <span className={`${styles.statValue} ${isPositive ? styles.positive : styles.negative}`}>
                {isPositive ? '+' : ''}{position.profit_pct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.chartSection} glass-panel`}>
          <div className={styles.chartHeader}>
            <h2>Historico de Precos</h2>
            <div className={styles.periodSelector}>
              {['1d', '5d', '1mo', '3mo', '6mo', '1y'].map(p => (
                <button 
                  key={p}
                  className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          {loadingChart ? (
            <div className={styles.chartLoading}>
              <div className={styles.spinner}></div>
            </div>
          ) : history.length > 0 ? (
            <div className={styles.chartWrapper}>
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className={styles.chart}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? '#10b981' : '#f85149'} stopOpacity="0.3"/>
                    <stop offset="100%" stopColor={isPositive ? '#10b981' : '#f85149'} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <polyline 
                  fill="none" 
                  stroke={isPositive ? '#10b981' : '#f85149'} 
                  strokeWidth="2" 
                  points={points}
                />
              </svg>
              
              <div className={styles.chartInfo}>
                <div>
                  <span className={styles.chartLabel}>Min</span>
                  <span className={styles.chartValue}>{formatCurrency(minPrice)}</span>
                </div>
                <div>
                  <span className={styles.chartLabel}>Max</span>
                  <span className={styles.chartValue}>{formatCurrency(maxPrice)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.chartEmpty}>
              <p>Dados nao disponiveis para este periodo</p>
            </div>
          )}
        </div>

        <div className={styles.tableSection}>
          <h2>Dados Historicos</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Abertura</th>
                  <th>Maxima</th>
                  <th>Minima</th>
                  <th>Fechamento</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((point, idx) => (
                  <tr key={idx}>
                    <td>{new Date(point.date).toLocaleDateString('pt-BR')}</td>
                    <td>{formatCurrency(point.open)}</td>
                    <td>{formatCurrency(point.high)}</td>
                    <td>{formatCurrency(point.low)}</td>
                    <td>{formatCurrency(point.close)}</td>
                    <td>{point.volume?.toLocaleString('pt-BR') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}