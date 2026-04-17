"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Banner {
  id: number;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  order: number;
}

interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  order: number;
}

export default function CmsPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'banners' | 'faqs'>('banners');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Banner | Faq | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/cms/`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setBanners(data.banners || []);
      setFaqs(data.faqs || []);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    alert('Funcionalidade de edição será implementada na API');
    setShowForm(false);
    setEditingItem(null);
  };

  const toggleStatus = async (type: 'banner' | 'faq', id: number, currentStatus: boolean) => {
    alert('Funcionalidade de toggle será implementada na API');
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
            <h1 className="text-gradient">CMS - Conteúdo Institucional</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Gerencie banners, FAQs e conteúdos da plataforma</p>
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'banners' ? 'active' : ''}`}
            onClick={() => setActiveTab('banners')}
          >
            Banners ({banners.length})
          </button>
          <button 
            className={`tab ${activeTab === 'faqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('faqs')}
          >
            FAQs ({faqs.length})
          </button>
        </div>

        {activeTab === 'banners' && (
          <div className="content-section">
            <div className="section-header">
              <h2>Banners</h2>
              <button className="btn-primary" onClick={() => setShowForm(true)}>+ Novo Banner</button>
            </div>
            <div className="items-grid">
              {banners.map(banner => (
                <div key={banner.id} className={`item-card ${!banner.is_active ? 'inactive' : ''}`}>
                  <div className="item-image" style={{ background: 'var(--bg-tertiary)', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {banner.image_url ? <img src={banner.image_url} alt={banner.title} /> : '🖼️'}
                  </div>
                  <div className="item-content">
                    <h3>{banner.title}</h3>
                    <p>{banner.description}</p>
                    <div className="item-meta">
                      <span className={`status ${banner.is_active ? 'active' : 'inactive'}`}>
                        {banner.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span>Ordem: {banner.order}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => { setEditingItem(banner); setShowForm(true); }}>✏️</button>
                    <button onClick={() => toggleStatus('banner', banner.id, banner.is_active)}>
                      {banner.is_active ? '⏸️' : '▶️'}
                    </button>
                  </div>
                </div>
              ))}
              {banners.length === 0 && <div className="empty">Nenhum banner cadastrado</div>}
            </div>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="content-section">
            <div className="section-header">
              <h2>Perguntas Frequentes</h2>
              <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nova FAQ</button>
            </div>
            <div className="faq-list">
              {faqs.map(faq => (
                <div key={faq.id} className={`faq-item ${!faq.is_active ? 'inactive' : ''}`}>
                  <div className="faq-question">
                    <span className="faq-category">{faq.category}</span>
                    <h3>{faq.question}</h3>
                  </div>
                  <p className="faq-answer">{faq.answer}</p>
                  <div className="faq-meta">
                    <span className={`status ${faq.is_active ? 'active' : 'inactive'}`}>
                      {faq.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                    <span>Ordem: {faq.order}</span>
                    <div className="faq-actions">
                      <button onClick={() => { setEditingItem(faq); setShowForm(true); }}>✏️</button>
                      <button onClick={() => toggleStatus('faq', faq.id, faq.is_active)}>
                        {faq.is_active ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {faqs.length === 0 && <div className="empty">Nenhuma FAQ cadastrada</div>}
            </div>
          </div>
        )}

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          
          .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--glass-border); padding-bottom: 16px; }
          .tab { background: transparent; border: 1px solid var(--glass-border); color: var(--text-secondary); padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
          .tab.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
          
          .content-section { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 20px; }
          .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .section-header h2 { color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase; margin: 0; }
          
          .btn-primary { background: var(--accent-primary); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
          .btn-primary:hover { background: #2563eb; }
          
          .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
          .item-card { background: var(--bg-tertiary); border: 1px solid var(--glass-border); border-radius: 8px; overflow: hidden; }
          .item-card.inactive { opacity: 0.5; }
          .item-content { padding: 16px; }
          .item-content h3 { margin: 0 0 8px; font-size: 1rem; }
          .item-content p { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
          .item-meta { display: flex; gap: 12px; margin-top: 12px; font-size: 0.75rem; color: var(--text-secondary); }
          .item-actions { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--glass-border); }
          .item-actions button { background: transparent; border: none; cursor: pointer; font-size: 1rem; }
          
          .faq-list { display: flex; flex-direction: column; gap: 12px; }
          .faq-item { background: var(--bg-tertiary); border: 1px solid var(--glass-border); border-radius: 8px; padding: 20px; }
          .faq-item.inactive { opacity: 0.5; }
          .faq-question { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
          .faq-category { background: var(--accent-primary); color: white; font-size: 0.625rem; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
          .faq-question h3 { margin: 0; font-size: 1rem; }
          .faq-answer { color: var(--text-secondary); font-size: 0.875rem; margin: 0 0 12px; }
          .faq-meta { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; color: var(--text-secondary); }
          .faq-actions { margin-left: auto; display: flex; gap: 8px; }
          .faq-actions button { background: transparent; border: none; cursor: pointer; font-size: 1rem; }
          
          .status { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; }
          .status.active { background: #dcfce7; color: #166534; }
          .status.inactive { background: #fee2e2; color: #991b1b; }
          
          .empty { text-align: center; color: var(--text-secondary); padding: 40px; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
        `}</style>
      </main>
    </div>
  );
}