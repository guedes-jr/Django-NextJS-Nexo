"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../auth.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Ícones minimalistas para show/hide
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // States of new UI 
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse move handler for interactive gradient background
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Update CSS variables smoothly
      containerRef.current.style.setProperty('--mouse-x', `${x}%`);
      containerRef.current.style.setProperty('--mouse-y', `${y}%`);
    }
  };

  // Detect any generic typing action over form elements
  const handleTypingEvent = () => setIsTyping(true);
  const handleBlurEvent = () => setIsTyping(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8001/api/auth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error('Credenciais inválidas ou erro no servidor.');
      }

      const data = await res.json();
      
      localStorage.setItem('nexo_access', data.access);
      localStorage.setItem('nexo_refresh', data.refresh);
      
      const userRes = await fetch(`${API_URL}/api/auth/user/`, {
        headers: { 'Authorization': `Bearer ${data.access}` }
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        localStorage.setItem('nexo_user', JSON.stringify(userData));
      }

      const profileRes = await fetch(`${API_URL}/api/profile/`, {
        headers: { 'Authorization': `Bearer ${data.access}` }
      });
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (!profileData.onboarding_completed) {
          router.push('/onboarding');
          return;
        }
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={styles.authContainer} 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
    >
      <div className={`${styles.authCard} glass-panel animate-fade-in ${isTyping ? styles.typingActive : ''}`}>
        
        <div className={styles.logo}>
          <div className={styles.logoIcon}>💎</div>
          <span>NEXO</span>
        </div>

        <div className={styles.header}>
          <h1>Bem-vindo de volta</h1>
          <p>Acesse seu painel inteligente de patrimônio.</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <p style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
          
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="username">Login (E-mail ou Username)</label>
            <input 
              type="text" 
              id="username" 
              className={styles.input} 
              placeholder="seu_usuario_ou_email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={handleTypingEvent}
              onBlur={handleBlurEvent}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Senha Segura</label>
            <div className={styles.inputWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                className={`${styles.input} ${styles.passwordField}`} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleTypingEvent}
                onBlur={handleBlurEvent}
                required
              />
              <button 
                type="button" 
                className={styles.passwordToggle} 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Acessando...' : 'Acessar Plataforma'}
          </button>
        </form>

        <div className={styles.linkText}>
           <Link href="/register">Criar conta</Link>
           <span className={styles.separator}>•</span>
           <Link href="/forgot-password">Esqueci minha senha</Link>
        </div>
      </div>
    </div>
  );
}
