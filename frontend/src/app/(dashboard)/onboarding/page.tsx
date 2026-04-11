"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './onboarding.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Perfil State
  const [profile, setProfile] = useState({
    risk_level: '',
    primary_broker: '',
    financial_goal: 'Crescimento de Patrimônio'
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSelectRisk = (risk: string) => {
    setProfile({ ...profile, risk_level: risk });
    setTimeout(nextStep, 350); // Auto-avanca com leve delay UX
  };

  const handleSelectBroker = (broker: string) => {
    setProfile({ ...profile, primary_broker: broker });
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nexo_access');
      const res = await fetch('http://localhost:8001/api/profile/', {
        method: 'PUT', // Atualiza via RetrieveUpdateAPIView
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...profile,
          onboarding_completed: true // Sinaliza que ja terminou!
        })
      });

      if (!res.ok) throw new Error("Erro ao salvar perfil");
      
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
              <p>Isso nos ajudará a personalizar os indicadores do seu painel.</p>
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
          <div className={styles.stepContent} style={{ textAlign: 'center', margin: '40px 0' }}>
            <div className={styles.header}>
              <h1>Tudo pronto!</h1>
              <p>A NEXO agora usará seu perfil <b>{profile.risk_level}</b> para calibrar o terminal.</p>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Seja bem-vindo ao futuro da gestão de patrimônio da sua família.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.wizardCard} glass-panel`}>
        
        {/* Progress Tracker */}
        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${step >= 1 ? styles.completed : ''}`}></div>
          <div className={`${styles.progressStep} ${step >= 2 ? styles.completed : ''}`}></div>
          <div className={`${styles.progressStep} ${step >= 3 ? styles.completed : ''}`}></div>
        </div>

        {error && <div style={{color:'var(--danger)'}}>{error}</div>}

        {renderStep()}

        {/* Dynamic Footer Buttons */}
        <div className={styles.footer}>
          {step > 1 ? (
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
