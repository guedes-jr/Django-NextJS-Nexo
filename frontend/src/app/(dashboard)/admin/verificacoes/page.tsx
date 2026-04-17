"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Verification {
  id: number;
  user: string;
  user_username: string;
  status: string;
  documents_complete: boolean;
  verification_level: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string;
}

interface UserDoc {
  id: number;
  document_type: string;
  status: string;
  original_name: string;
  uploaded_at: string;
}

export default function VerificacoesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [documents, setDocuments] = useState<UserDoc[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) { router.push('/login'); return; }
    
    fetch(`${API_URL}/api/verification/list/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setVerifications(data))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSelectVerification = async (verif: Verification) => {
    setSelectedVerification(verif);
    const token = localStorage.getItem('nexo_access');
    
    const res = await fetch(`${API_URL}/api/verification/admin/${verif.user}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setDocuments(data.documents || []);
  };

  const handleReview = async (status: string) => {
    if (!selectedVerification) return;
    setProcessing(true);
    
    const token = localStorage.getItem('nexo_access');
    await fetch(`${API_URL}/api/verification/admin/${selectedVerification.user}/`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, notes: '' })
    });
    
    setVerifications(prev => prev.map(v => 
      v.id === selectedVerification.id ? { ...v, status } : v
    ));
    setSelectedVerification(null);
    setProcessing(false);
  };

  const pendingVerifications = verifications.filter(v => v.status === 'IN_REVIEW');
  const approvedVerifications = verifications.filter(v => v.status === 'APPROVED');
  const rejectedVerifications = verifications.filter(v => v.status === 'REJECTED');

  const statusColors: Record<string, string> = {
    'PENDING': 'var(--warning)',
    'IN_REVIEW': 'var(--accent)',
    'APPROVED': 'var(--success)',
    'REJECTED': 'var(--danger)',
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--glass-border)', marginBottom: '8px' }}>
          <div>
            <h1 className="text-gradient animate-fade-in">Verificação de Contas</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Aprovação de documentos e contas</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ padding: '8px 16px', background: 'rgba(255,153,0,0.1)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{pendingVerifications.length}</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>Pendentes</span>
            </div>
            <div style={{ padding: '8px 16px', background: 'rgba(0,255,0,0.1)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{approvedVerifications.length}</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>Aprovados</span>
            </div>
            <div style={{ padding: '8px 16px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{rejectedVerifications.length}</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>Rejeitados</span>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: selectedVerification ? '1fr 1fr' : '1fr', gap: '24px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Pendentes de Análise</h2>
            {pendingVerifications.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Nenhuma verificação pendente</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingVerifications.map(verif => (
                  <div 
                    key={verif.id} 
                    onClick={() => handleSelectVerification(verif)}
                    style={{ 
                      padding: '16px', 
                      background: selectedVerification?.id === verif.id ? 'var(--surface-hover)' : 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--glass-border)', 
                      borderRadius: '8px', 
                      cursor: 'pointer' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{verif.user_username}</span>
                      <span style={{ 
                        color: statusColors[verif.status], 
                        fontSize: '12px',
                        padding: '4px 8px',
                        background: `${statusColors[verif.status]}20`,
                        borderRadius: '4px'
                      }}>
                        {verif.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Tipo: {verif.verification_level} | Documentos: {verif.documents_complete ? '✓ Completo' : '✗ Incompleto'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedVerification && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Documentos de {selectedVerification.user_username}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {documents.map(doc => (
                  <div key={doc.id} style={{
                    padding: '16px',
                    background: 'var(--surface-hover)',
                    borderRadius: '8px',
                    border: doc.status === 'APPROVED' ? '1px solid var(--success)' : doc.status === 'REJECTED' ? '1px solid var(--danger)' : '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{doc.document_type}</span>
                      <span style={{ 
                        color: doc.status === 'APPROVED' ? 'var(--success)' : doc.status === 'REJECTED' ? 'var(--danger)' : 'var(--text-secondary)',
                        fontSize: '12px'
                      }}>
                        {doc.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {doc.original_name}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleReview('APPROVED')}
                  disabled={processing}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    background: 'var(--success)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: 'white', 
                    cursor: processing ? 'not-allowed' : 'pointer',
                    opacity: processing ? 0.5 : 1
                  }}
                >
                  {processing ? 'Processando...' : 'Aprovar Conta'}
                </button>
                <button 
                  onClick={() => handleReview('REJECTED')}
                  disabled={processing}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    background: 'var(--danger)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: 'white', 
                    cursor: processing ? 'not-allowed' : 'pointer',
                    opacity: processing ? 0.5 : 1
                  }}
                >
                  {processing ? 'Processando...' : 'Rejeitar Conta'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}