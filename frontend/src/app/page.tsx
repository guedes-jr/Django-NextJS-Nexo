"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';
import styles from './page.module.css';

function AddAssetModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [ticker, setTicker] = useState('');
  const [searchResults, setSearchResults] = useState<{ticker: string; name: string; type: string}[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    average_price: '',
    current_price: '',
    asset_type: 'ACAO',
    name: '',
  });
  const [selectedAsset, setSelectedAsset] = useState<{ticker: string; name: string; type: string} | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!ticker || ticker.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`${API_URL}/api/market/search/?q=${ticker}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.results) {
          setSearchResults(data.results);
        }
      })
      .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [ticker]);

  const handleSelectAsset = (asset: {ticker: string; name: string; type: string}) => {
    setSelectedAsset(asset);
    setTicker(asset.ticker);
    setFormData(prev => ({ ...prev, asset_type: asset.type, name: asset.name }));
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/portfolio/positions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_ticker: selectedAsset.ticker,
          quantity: parseFloat(formData.quantity.replace(',', '.')),
          average_price: parseFloat(formData.average_price.replace(',', '.')),
          current_price: parseFloat(formData.current_price.replace(',', '.')) || parseFloat(formData.average_price.replace(',', '.')),
        })
      });

      if (res.ok) {
        onClose();
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao adicionar ativo');
      }
    } catch (err) {
      alert('Erro ao adicionar ativo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Adicionar Ativo</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Buscar Ativo</label>
            <input
              type="text"
              placeholder="Digite o ticker ou nome..."
              value={ticker}
              onChange={e => {
                setTicker(e.target.value);
                setSelectedAsset(null);
              }}
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                {searchResults.map((asset, i) => (
                  <div key={i} className={styles.searchResultItem} onClick={() => handleSelectAsset(asset)}>
                    <div className={styles.searchResultTicker}>{asset.ticker}</div>
                    <div className={styles.searchResultName}>{asset.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedAsset && (
            <>
              <div className={styles.formGroup}>
                <label>Tipo do Ativo</label>
                <select
                  value={formData.asset_type}
                  onChange={e => setFormData(prev => ({ ...prev, asset_type: e.target.value }))}
                >
                  <option value="ACAO">Ação</option>
                  <option value="FII">Fundo Imobiliário</option>
                  <option value="ETF">ETF</option>
                  <option value="RF">Renda Fixa</option>
                  <option value="CRIPTO">Criptomoeda</option>
                  <option value="FUNDO">Fundo de Investimento</option>
                  <option value="PREVIDENCIA">Previdência</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Quantidade</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Preco Medio</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={formData.average_price}
                    onChange={e => setFormData(prev => ({ ...prev, average_price: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Preco Atual (opcional)</label>
                <input
                  type="text"
                  placeholder="Se vazio, usa preco medio"
                  value={formData.current_price}
                  onChange={e => setFormData(prev => ({ ...prev, current_price: e.target.value }))}
                />
              </div>
            </>
          )}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={!selectedAsset || loading}>
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
}

interface Summary {
  total_balance: number;
  total_cost: number;
  total_profit: number;
  total_profit_pct: number;
  allocations_value: Record<string, number>;
  allocations_pct: Record<string, number>;
  positions: Position[];
  recent_transactions: RecentTransaction[];
}

interface RecentTransaction {
  id: number;
  transaction_type: string;
  asset_ticker: string | null;
  asset_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_value: number;
  transaction_date: string;
}

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  variation: number;
  variation_pct: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [userInitials, setUserInitials] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) {
      router.push('/login');
      return;
    }

    const userStr = localStorage.getItem('nexo_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserInitials((user.username || 'U').substring(0, 2).toUpperCase());
      } catch {
        setUserInitials('U');
      }
    }

    Promise.all([
      fetch(`${API_URL}/api/portfolio/summary/`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/api/market/indices/`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/api/portfolio/insights/`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/api/portfolio/benchmark/?period=6mo`, { headers: { 'Authorization': `Bearer ${token}` } })
    ])
    .then(([res1, res2, res3, res4]) => {
      const results = [res1, res2, res3, res4];
      return Promise.all(results.map(r => r.ok ? r.json() : null));
    })
    .then(([summaryData, indicesData, insightsData, benchmarkData]) => {
      if (summaryData) setSummary(summaryData);
      if (Array.isArray(indicesData)) {
        setIndices(indicesData);
      }
      if (insightsData?.insights) {
        setInsights(insightsData.insights);
      }
      if (benchmarkData?.benchmarks) {
        setBenchmarks(benchmarkData.benchmarks);
      }
    })
    .catch(err => console.error(err))
    .finally(() => {
      setLoading(false);
      setMounted(true);
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('nexo_access');
    localStorage.removeItem('nexo_refresh');
    localStorage.removeItem('nexo_user');
    router.push('/login');
  };

  if (!mounted || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const typeColors: Record<string, { bg: string; color: string; short: string }> = {
    'CRIPTO': { bg: '#f59e0b', color: '#000', short: '₿' },
    'FII': { bg: '#8b5cf6', color: '#fff', short: 'FII' },
    'ACAO': { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', short: '' },
    'ETF': { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', short: 'ETF' },
    'RF': { bg: 'rgba(234, 179, 8, 0.2)', color: '#eab308', short: 'RF' },
    'TESOURO': { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', short: 'TS' },
    'FUNDO': { bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', short: 'FD' },
    'PREVIDENCIA': { bg: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9', short: 'PV' },
  };

  const chartColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#eab308', '#a855f7', '#0ea5e9'];
  const allocationEntries = summary?.allocations_pct ? Object.entries(summary.allocations_pct) : [];
  
  let cumulative = 0;
  const conicGradient = allocationEntries.map(([_, pct], idx) => {
    const start = cumulative;
    cumulative += pct;
    return `${chartColors[idx % chartColors.length]} ${start}% ${cumulative}%`;
  }).join(', ');

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className={styles.container}>
      <SharedSidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className="text-gradient animate-fade-in">Visao Geral</h1>
            <p className={styles.subtitle}>Acompanhe o seu patrimonio consolidado</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Sair
            </button>
            <div className={styles.avatar}>
              {userInitials}
            </div>
          </div>
        </header>

        <section className={styles.dashboardGrid}>
          <div className={`${styles.statCard} glass-panel animate-fade-in`} style={{ animationDelay: '0.1s' }}>
            <span className={styles.statLabel}>Patrimonio Liquido</span>
            <span className={styles.statValue}>
              {formatCurrency(summary?.total_balance || 0)}
            </span>
            <div>
              <span className={`${styles.statChange} ${summary?.total_profit && summary.total_profit >= 0 ? styles.positive : styles.negative}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                {summary?.total_profit_pct?.toFixed(2) || 0}%
              </span>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel animate-fade-in`} style={{ animationDelay: '0.2s' }}>
            <span className={styles.statLabel}>Rendimento Total</span>
            <span className={styles.statValue}>
              {formatCurrency(summary?.total_profit || 0)}
            </span>
            <div>
              <span className={`${styles.statChange} ${summary?.total_profit && summary.total_profit >= 0 ? styles.positive : styles.negative}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                Custo: {formatCurrency(summary?.total_cost || 0)}
              </span>
            </div>
          </div>

          <div className={`${styles.statCard} glass-panel animate-fade-in`} style={{ animationDelay: '0.3s' }}>
            <span className={styles.statLabel}>Total de Ativos</span>
            <span className={styles.statValue}>{summary?.positions?.length || 0}</span>
            <div>
              <span className={`${styles.statChange} ${styles.positive}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                Carteira
              </span>
            </div>
          </div>
        </section>

        <section className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.15s' }}>
          <div className={styles.sectionHeader}>
            <h2>Indices de Mercado</h2>
          </div>
          <div className={styles.indicesGrid}>
            {indices.map((idx, i) => {
              const isPositive = idx.variation >= 0;
              return (
                <div key={i} className={styles.indexCard}>
                  <div className={styles.indexName}>{idx.name}</div>
                  <div className={styles.indexPrice}>{idx.price > 1000 ? idx.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : idx.price.toFixed(2)}</div>
                  <div className={`${styles.indexChange} ${isPositive ? styles.positive : styles.negative}`}>
                    {isPositive ? '+' : ''}{idx.variation_pct.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {insights.length > 0 && (
          <section className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.25s' }}>
            <div className={styles.sectionHeader}>
              <h2>Insights</h2>
            </div>
            <div className={styles.insightsList}>
              {insights.map((insight, i) => (
                <div key={i} className={`${styles.insightCard} ${styles[insight.severity?.toLowerCase() || 'low']}`}>
                  <div className={styles.insightHeader}>
                    <span className={styles.insightType}>{insight.type}</span>
                    <span className={`${styles.insightSeverity} ${styles[insight.severity?.toLowerCase() || 'low']}`}>{insight.severity}</span>
                  </div>
                  <div className={styles.insightTitle}>{insight.title}</div>
                  <div className={styles.insightMessage}>{insight.message}</div>
                  {insight.explanation && (
                    <div className={styles.insightExplanation}>{insight.explanation}</div>
                  )}
                  {insight.action_steps && insight.action_steps.length > 0 && (
                    <div className={styles.actionSteps}>
                      <span className={styles.actionStepsLabel}>Acoes Recomendadas:</span>
                      {insight.action_steps.map((step: string, idx: number) => (
                        <span key={idx} className={styles.actionStep}>• {step}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {benchmarks.length > 0 && (
          <section className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.3s' }}>
            <div className={styles.sectionHeader}>
              <h2>Comparativo com Benchmarks</h2>
            </div>
            <div className={styles.benchmarkGrid}>
              {benchmarks.map((bm, i) => (
                <div key={i} className={styles.benchmarkCard}>
                  <div className={styles.benchmarkName}>{bm.name}</div>
                  <div className={`${styles.benchmarkVariation} ${bm.variation_pct >= 0 ? styles.positive : styles.negative}`}>
                    {bm.variation_pct >= 0 ? '+' : ''}{bm.variation_pct?.toFixed(2)}%
                  </div>
                  <div className={styles.benchmarkPeriod}>{bm.period}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={styles.contentGrid}>
          <div className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.4s' }}>
            <div className={styles.sectionHeader}>
              <h2>Alocacao Inteligente</h2>
              <button className={styles.viewAll} onClick={() => router.push('/carteira')}>Rebalancear</button>
            </div>
            
            {conicGradient ? (
              <div className={styles.donutWrapper}>
                <div className={styles.donutChart} style={{ background: `conic-gradient(${conicGradient})` }}>
                  <div className={styles.donutHole}>
                    <span className={styles.donutLabel}>Total</span>
                    <span className={styles.donutTotal}>100%</span>
                  </div>
                </div>
                
                <div className={styles.legendList}>
                  {allocationEntries.map(([type, pct], idx) => (
                    <div className={styles.legendItem} key={type}>
                      <div className={styles.legendKey}>
                        <div className={styles.legendColor} style={{background: chartColors[idx % chartColors.length]}}></div>
                        {type}
                      </div>
                      <span>{(pct as number).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>Adicione ativos para ver sua alocacao</p>
              </div>
            )}
            
          </div>

          <div className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.5s' }}>
            <div className={styles.sectionHeader}>
              <h2>Top Alocacoes</h2>
              <button className={styles.viewAll} onClick={() => router.push('/carteira')}>Ver Carteira Completa</button>
            </div>
            
            <div className={styles.assetList}>
              {(summary?.positions || []).slice(0, 5).map(pos => {
                const profitPct = pos.profit_pct;
                const isPositive = profitPct >= 0;
                const config = typeColors[pos.asset.asset_type] || typeColors['ACAO'];
                const iconText = config.short || pos.asset.ticker.substring(0, 2);

                return (
                  <div className={styles.assetItem} key={pos.id} onClick={() => router.push(`/carteira/${pos.asset.ticker}`)}>
                    <div className={styles.assetInfo}>
                      <div className={styles.assetIcon} style={{ background: config.bg, color: config.color }}>
                        {iconText}
                      </div>
                      <div>
                        <div className={styles.assetName}>{pos.asset.name}</div>
                        <div className={styles.assetTicker}>{pos.asset.ticker} - {pos.quantity.toLocaleString('pt-BR')} cotas</div>
                      </div>
                    </div>
                    <div className={styles.assetValues}>
                      <div className={styles.assetPrice}>
                        {formatCurrency(pos.total_value)}
                      </div>
                      <div className={`${styles.assetChange} ${isPositive ? styles.positive : styles.negative}`}>
                        {isPositive ? '+' : ''}{profitPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <div className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.45s' }}>
            <div className={styles.sectionHeader}>
              <h2>Movimentacoes Recentes</h2>
              <button className={styles.viewAll} onClick={() => router.push('/movimentacoes')}>Ver Todas</button>
            </div>
            <div className={styles.transactionList}>
              {(summary?.recent_transactions || []).length > 0 ? (
                summary?.recent_transactions?.map(tx => (
                  <div key={tx.id} className={styles.transactionItem}>
                    <div className={styles.transactionInfo}>
                      <span className={styles.transactionType}>{tx.transaction_type}</span>
                      <span className={styles.transactionAsset}>{tx.asset_ticker || tx.asset_name || '-'}</span>
                    </div>
                    <div className={styles.transactionValue}>
                      <span>{formatCurrency(tx.total_value)}</span>
                      <span className={styles.transactionDate}>{new Date(tx.transaction_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>Nenhuma movimentacao recente</p>
                </div>
              )}
            </div>
          </div>

          <div className={`${styles.section} glass-panel animate-fade-in`} style={{ animationDelay: '0.5s' }}>
            <div className={styles.sectionHeader}>
              <h2>Acoes Rapidas</h2>
            </div>
            <div className={styles.quickActions}>
              <button className={styles.quickActionBtn} onClick={() => setShowAddModal(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Adicionar Ativo
              </button>
              <button className={styles.quickActionBtn} onClick={() => router.push('/movimentacoes')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Nova Movimentacao
              </button>
              <button className={styles.quickActionBtn} onClick={() => router.push('/metas')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Criar Meta
              </button>
            </div>
          </div>
        </section>
      </main>

      {showAddModal && (
        <AddAssetModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}