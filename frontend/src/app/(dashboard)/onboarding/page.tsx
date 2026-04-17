"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './onboarding.module.css';

const REQUIRED_DOCS = [
  { type: 'RG', label: 'RG ou CNH', desc: 'Foto do documento frente' },
  { type: 'CPF', label: 'CPF', desc: 'CPF ou documento com CPF' },
  { type: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de Residência', desc: 'Conta de luz, água ou telefone (3 meses)' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [verifyingDocs, setVerifyingDocs] = useState<Record<string, boolean>>({});
  
  const [profile, setProfile] = useState({
    risk_level: '',
    primary_broker: '',
    financial_goal: 'Crescimento de Patrimônio'
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSelectRisk = (risk: string) => {
    setProfile({ ...profile, risk_level: risk });
    setTimeout(nextStep, 350);
  };

  const handleSelectBroker = (broker: string) => {
    setProfile({ ...profile, primary_broker: broker });
  };

  const handleUploadDoc = async (docType: string, file: File) => {
    setVerifyingDocs(prev => ({ ...prev, [docType]: true }));
    try {
      const token = localStorage.getItem('nexo_access');
      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('file', file);

      const res = await fetch('http://localhost:8001/api/documents/upload/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Erro ao enviar documento');

      setUploadedDocs(prev => ({ ...prev, [docType]: true }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifyingDocs(prev => ({ ...prev, [docType]: false }));
    }
  };

  const allDocsUploaded = REQUIRED_DOCS.every(doc => uploadedDocs[doc.type]);

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nexo_access');
      
      // Save profile
      const profileRes = await fetch('http://localhost:8001/api/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...profile,
          onboarding_completed: true
        })
      });

      if (!profileRes.ok) throw new Error("Erro ao salvar perfil");

      // Submit verification
      await fetch('http://localhost:8001/api/verification/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <h1>Qual é o seu perfil de investidor?</h1>
              <p>Isso nos ajudará a personalizados os indicadores do seu painel.</p>
            </div>
            <div className={styles.optionsGrid}>
              {[
                { id: 'CONSERVADOR', title: 'Conservador', desc: 'Foco em segurança e renda fixa (Tesouro, CDBs).' },
                { id: 'MODERADO', title: 'Moderado', desc: 'Equilíbrio entre segurança externa e oscilações controladas (FIIs e Bolsa).' },
                { id: 'ARROJADO', title: 'Arrojado', desc: 'Busca por alto rendimento. Tolerância alta a volatilidade e Renda Variável.' }
              ].map(opt => (
                <div 
                  key={opt.id} 
                  className={`${styles.optionCard} ${profile.risk_level === opt.id ? styles.selected : ''}`}
                  onClick={() => handleSelectRisk(opt.id)}
                >
                  <span className={styles.optionTitle}>{opt.title}</span>
                  <span className={styles.optionDesc}>{opt.desc}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <h1>Onde estão seus investimentos locais?</h1>
              <p>Escolha sua corretora principal para basear nossa inteligência.</p>
            </div>
            <div className={styles.optionsGrid}>
              {['XP Investimentos', 'BTG Pactual', 'Nubank / NuInvest', 'Clear', 'Apenas Bancos Tradicionais'].map(broker => (
                <div 
                  key={broker} 
                  className={`${styles.optionCard} ${profile.primary_broker === broker ? styles.selected : ''}`}
                  onClick={() => handleSelectBroker(broker)}
                  style={{ padding: '16px 24px', alignItems: 'center', textAlign: 'center' }}
                >
                  <span className={styles.optionTitle}>{broker}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <h1>Documentação obrigatória</h1>
              <p>Para cumplir requisitos regulatórios, envie os documentos abaixo.</p>
            </div>
            <div className={styles.optionsGrid} style={{ gridTemplateColumns: '1fr' }}>
              {REQUIRED_DOCS.map(doc => (
                <div key={doc.type} style={{
                  padding: '20px',
                  background: 'var(--surface-hover)',
                  borderRadius: '12px',
                  border: uploadedDocs[doc.type] ? '2px solid var(--success)' : '2px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <strong>{doc.label}</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>{doc.desc}</p>
                    </div>
                    {uploadedDocs[doc.type] && (
                      <span style={{ color: 'var(--success)', fontSize: '14px' }}>✓ Enviado</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadDoc(doc.type, file);
                    }}
                    disabled={verifyingDocs[doc.type]}
                    style={{
                      background: 'var(--surface)',
                      padding: '10px',
                      borderRadius: '8px',
                      width: '100%',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '16px', textAlign: 'center' }}>
              Seus dados são mantidos em segurança e nunca são compartilhados.
            </p>
          </div>
        );
      case 4:
        return (
          <div className={styles.stepContent} style={{ textAlign: 'center', margin: '40px 0' }}>
            <div className={styles.header}>
              <h1>Tudo pronto!</h1>
              <p>Perfil <b>{profile.risk_level}</b> configurado.</p>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              {allDocsUploaded 
                ? 'Documentos enviados. Aguarde aprovação.' 
                : 'Você pode enviar documentos depois.'}
            </p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
              Seja bem-vindo ao futuro da gestão de patrimônio.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.wizardCard} glass-panel`}>
        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${step >= 1 ? styles.completed : ''}`}></div>
          <div className={`${styles.progressStep} ${step >= 2 ? styles.completed : ''}`}></div>
          <div className={`${styles.progressStep} ${step >= 3 ? styles.completed : ''}`}></div>
          <div className={`${styles.progressStep} ${step >= 4 ? styles.completed : ''}`}></div>
        </div>

        {error && <div style={{color:'var(--danger)'}}>{error}</div>}

        {renderStep()}

        <div className={styles.footer}>
          {step > 1 && step < 4 ? (
            <button className={styles.btnBack} onClick={prevStep}>Voltar</button>
          ) : step === 4 ? (
            <button className={styles.btnBack} onClick={prevStep}>Voltar</button>
          ) : <div></div>}
          
          {step < 3 ? (
            <button 
              className={styles.btnNext} 
              onClick={nextStep}
              disabled={(step === 1 && !profile.risk_level) || (step === 2 && !profile.primary_broker)}
            >
              Continuar
            </button>
          ) : step === 3 ? (
            <button className={styles.btnNext} onClick={nextStep}>
              Pular Documents
            </button>
          ) : (
            <button className={styles.btnNext} onClick={finishOnboarding} disabled={loading}>
              {loading ? 'Preparando...' : 'Ir para o Dashboard'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}