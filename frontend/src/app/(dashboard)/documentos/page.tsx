"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Doc {
  id: number;
  title: string;
  document_type: string;
  version: string;
}

export default function DocumentosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [docContent, setDocContent] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) { router.push('/login'); return; }
    fetch(`${API_URL}/api/documents/`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.documents) { setDocuments(data.documents); setConsents(data.user_consents || {}); }
      })
      .finally(() => { setLoading(false); });
  }, [router]);

  const handleViewDoc = async (doc: Doc) => {
    const token = localStorage.getItem('nexo_access');
    const res = await fetch(`${API_URL}/api/documents/${doc.id}/`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setSelectedDoc(doc); setDocContent(data.content || '');
  };

  const handleAccept = async (type: string, accepted: boolean) => {
    const token = localStorage.getItem('nexo_access');
    await fetch(`${API_URL}/api/documents/accept/`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent_type: type, is_accepted: accepted })
    });
    setConsents((prev: any) => ({ ...prev, [type]: accepted }));
  };

  const consentLabels: Record<string, string> = { 'TERMO': 'Termos de Uso', 'PRIVACY': 'Privacidade', 'MARKETING': 'Marketing' };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--glass-border)', marginBottom: '8px' }}>
          <div>
            <h1 className="text-gradient animate-fade-in">Documentos</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Termos, contratos e consentimentos de uso</p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Documentos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {documents.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Nenhum documento</p> : documents.map(d => (
                <div key={d.id} onClick={() => handleViewDoc(d)} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 600 }}>{d.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>v{d.version}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Consentimentos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(consentLabels).map(([key, label]) => (
                <div key={key} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{label}</span>
                    <span style={{ color: consents[key] ? 'var(--success)' : 'var(--warning)', fontSize: '12px' }}>{consents[key] ? 'Aceito' : 'Pendente'}</span>
                  </div>
                  {!consents[key] && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => handleAccept(key, true)} style={{ flex: 1, padding: '8px', background: 'var(--success)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Aceitar</button>
                      <button onClick={() => handleAccept(key, false)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Recusar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedDoc && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedDoc(null)}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '32px', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: '16px' }}>{selectedDoc.title}</h3>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{docContent || 'Conteudo do documento.'}</p>
              <button onClick={() => setSelectedDoc(null)} style={{ marginTop: '16px', padding: '8px 16px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Fechar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}