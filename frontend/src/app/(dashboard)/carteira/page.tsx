"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';
import styles from './carteira.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface PreviewRow {
  ticker: string;
  name: string;
  asset_type: string;
  quantity: number;
  average_price: number;
  current_price: number;
  total_value: number;
  row_index: number;
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  const handleFileSelect = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx'].includes(ext || '')) {
      alert('Apenas arquivos CSV ou XLSX são aceitos');
      return;
    }
    setFile(selectedFile);
    await fetchPreview(selectedFile);
  };

  const fetchPreview = async (selectedFile: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${API_URL}/api/portfolio/positions/import/preview/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.preview_rows) {
        setPreview(data.preview_rows);
        setTotalRows(data.total_rows);
        setErrors(data.errors || []);
        setStep('preview');
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      alert('Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/portfolio/positions/import/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        window.location.reload();
      } else {
        alert(data.error || 'Erro na importação');
      }
    } catch (err) {
      alert('Erro ao importar');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const res = await fetch(`${API_URL}/api/portfolio/positions/import/template/?format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexo_importacao_template.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('Erro ao baixar template');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.importModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>Importar Posições</h2>
            <p>Importe seus ativos de arquivos CSV ou Excel</p>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {step === 'upload' && (
          <>
            <div className={styles.templateActions}>
              <button className={styles.templateBtn} onClick={() => downloadTemplate('csv')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Baixar CSV
              </button>
              <button className={styles.templateBtn} onClick={() => downloadTemplate('xlsx')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Baixar Excel
              </button>
            </div>

            <div
              className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFileSelect(f);
              }}
            >
              <div className={styles.dropZoneIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <p className={styles.dropZoneText}>
                <strong>Clique para selecionar</strong> ou arraste o arquivo aqui<br />
                <small>CSV ou XLSX até 10MB</small>
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv,.xlsx"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
          </>
        )}

        {step === 'preview' && (
          <>
            <div className={styles.previewSummary}>
              <span>Total de linhas:</span> <strong>{totalRows}</strong>
              <span style={{ marginLeft: 24 }}>Pré-visualização:</span> <strong>{preview.length}</strong>
            </div>

            {errors.length > 0 && (
              <div className={styles.errorList}>
                <h4>⚠️ Erros encontrados</h4>
                <ul>
                  {errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className={styles.previewTable}>
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Qtd</th>
                    <th>Preço Médio</th>
                    <th>Preço Atual</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      <td><strong>{row.ticker}</strong></td>
                      <td>{row.name}</td>
                      <td>{row.asset_type}</td>
                      <td>{row.quantity}</td>
                      <td>{formatCurrency(row.average_price)}</td>
                      <td>{formatCurrency(row.current_price)}</td>
                      <td>{formatCurrency(row.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => { setStep('upload'); setFile(null); setPreview([]); }}>
                Cancelar
              </button>
              <button className={styles.confirmBtn} onClick={handleConfirmImport} disabled={loading}>
                {loading ? 'Importando...' : `Importar ${totalRows} posições`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AddAssetModal({ onClose }: { onClose: () => void }) {
  const [ticker, setTicker] = useState('');
  const [searchResults, setSearchResults] = useState<{ticker: string; name: string; type: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    average_price: '',
    current_price: '',
  });
  const [selectedAsset, setSelectedAsset] = useState<{ticker: string; name: string; type: string} | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!ticker || ticker.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const timer = setTimeout(() => {
      fetch(`${API_URL}/api/market/search/?q=${ticker}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.results) {
          setSearchResults(data.results);
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [ticker]);

  const handleSelectAsset = (asset: {ticker: string; name: string; type: string}) => {
    setSelectedAsset(asset);
    setTicker(asset.ticker);
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
  account: {
    id: number;
    institution: { name: string };
    description: string;
  };
}

interface Summary {
  total_balance: number;
  allocations_value: Record<string, number>;
  allocations_pct: Record<string, number>;
  positions: Position[];
}

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

export default function CarteiraPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('value');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${API_URL}/api/portfolio/summary/`, {
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
      if (data) setSummary(data);
    })
    .finally(() => {
      setLoading(false);
      setMounted(true);
    });
  }, [router]);

  if (!mounted || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  let positions = summary?.positions || [];
  
  if (filterType !== 'all') {
    positions = positions.filter(p => p.asset.asset_type === filterType);
  }
  
  if (sortBy === 'value') {
    positions.sort((a, b) => b.total_value - a.total_value);
  } else if (sortBy === 'profit') {
    positions.sort((a, b) => b.profit_pct - a.profit_pct);
  } else if (sortBy === 'name') {
    positions.sort((a, b) => a.asset.name.localeCompare(b.asset.name));
  }

  const totalValue = positions.reduce((acc, p) => acc + p.total_value, 0);

  return (
    <div className={styles.container}>
      <SharedSidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className="text-gradient">Minha Carteira</h1>
            <p className={styles.subtitle}>Gerencie todos os seus ativos</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className={styles.addBtn} onClick={() => setShowImportModal(true)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Importar CSV
            </button>
            <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Adicionar Ativo
            </button>
          </div>
        </header>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Classe</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Todas</option>
              <option value="ACAO">Acoes</option>
              <option value="FII">FIIs</option>
              <option value="ETF">ETFs</option>
              <option value="CRIPTO">Criptomoedas</option>
              <option value="RF">Renda Fixa</option>
              <option value="TESOURO">Tesouro Direto</option>
              <option value="FUNDO">Fundos</option>
              <option value="PREVIDENCIA">Previdencia</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Ordenar por</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="value">Valor</option>
              <option value="profit">Rentabilidade</option>
              <option value="name">Nome</option>
            </select>
          </div>
        </div>

        <div className={styles.summaryCards}>
          <div className={`${styles.summaryCard} glass-panel`}>
            <span className={styles.summaryLabel}>Total Carteira</span>
            <span className={styles.summaryValue}>{formatCurrency(summary?.total_balance || 0)}</span>
          </div>
          <div className={`${styles.summaryCard} glass-panel`}>
            <span className={styles.summaryLabel}>Ativos Filtrados</span>
            <span className={styles.summaryValue}>{positions.length}</span>
          </div>
          <div className={`${styles.summaryCard} glass-panel`}>
            <span className={styles.summaryLabel}>Valor Filtrado</span>
            <span className={styles.summaryValue}>{formatCurrency(totalValue)}</span>
          </div>
        </div>

        <div className={styles.assetTable}>
          <div className={styles.tableHeader}>
            <span>Ativo</span>
            <span>Quantidade</span>
            <span>Preco Medio</span>
            <span>Preco Atual</span>
            <span>Valor Total</span>
            <span>Rentabilidade</span>
          </div>
          
          <div className={styles.tableBody}>
            {positions.map(pos => {
              const config = typeColors[pos.asset.asset_type] || typeColors['ACAO'];
              const iconText = config.short || pos.asset.ticker.substring(0, 2);
              const isPositive = pos.profit_pct >= 0;
              
              return (
                <div className={styles.tableRow} key={pos.id}>
                  <div className={styles.assetCell}>
                    <div className={styles.assetIcon} style={{ background: config.bg, color: config.color }}>
                      {iconText}
                    </div>
                    <div className={styles.assetInfo}>
                      <span className={styles.assetName}>{pos.asset.name}</span>
                      <span className={styles.assetTicker}>{pos.asset.ticker} - {typeLabels[pos.asset.asset_type]}</span>
                    </div>
                  </div>
                  <span className={styles.valueCell}>{pos.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</span>
                  <span className={styles.valueCell}>{formatCurrency(pos.average_price)}</span>
                  <span className={styles.valueCell}>{formatCurrency(pos.current_price)}</span>
                  <span className={styles.valueCell}>{formatCurrency(pos.total_value)}</span>
                  <span className={`${styles.valueCell} ${isPositive ? styles.positive : styles.negative}`}>
                    {isPositive ? '+' : ''}{pos.profit_pct.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showAddModal && <AddAssetModal onClose={() => setShowAddModal(false)} />}
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}
    </div>
  );
}