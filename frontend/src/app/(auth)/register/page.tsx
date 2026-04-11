"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Username precisa ser alfanumerico por padrao no Django auth, usamos um extrator de string p/ simplificar MVP.
      const generatedUsername = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
      
      const payload = {
        username: generatedUsername,
        email: formData.email,
        password: formData.password
      };

      const res = await fetch('http://localhost:8001/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Ocorreu um erro ao criar a conta.');
      }

      // Se sucesso, vai pro tela de login
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.id]: e.target.value});
  }

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authCard} glass-panel animate-fade-in`}>
        
        <div className={styles.logo}>
          <Image src="/logo.png" alt="NEXO Logo" width={42} height={42} />
          <span>NEXO</span>
        </div>

        <div className={styles.header}>
          <h1>Abra sua conta</h1>
          <p>O primeiro passo para a sua evolução patrimonial.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
          
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="name">Nome Completo</label>
            <input 
              type="text" 
              id="name" 
              className={styles.input} 
              placeholder="João Guedes"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">E-mail</label>
            <input 
              type="email" 
              id="email" 
              className={styles.input} 
              placeholder="exemplo@nexo.com.br"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Crie uma senha segura</label>
            <input 
              type="password" 
              id="password" 
              className={styles.input} 
              placeholder="Mínimo de 8 caracteres"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Conta Gratuita'}
          </button>
        </form>

        <p className={styles.linkText}>
          Já possui conta? <Link href="/login">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
