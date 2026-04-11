import Image from 'next/image';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function LoginPage() {
  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authCard} glass-panel animate-fade-in`}>
        
        <div className={styles.logo}>
          <Image src="/logo.png" alt="NEXO Logo" width={42} height={42} />
          <span>NEXO</span>
        </div>

        <div className={styles.header}>
          <h1>Bem-vindo de volta</h1>
          <p>Acesse seu painel inteligente de patrimônio.</p>
        </div>

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">E-mail Corporativo ou Pessoal</label>
            <input 
              type="email" 
              id="email" 
              className={styles.input} 
              placeholder="exemplo@nexo.com.br"
            />
          </div>

          <div className={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label} htmlFor="password">Senha Segura</label>
              <Link href="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>Esqueci minha senha</Link>
            </div>
            <input 
              type="password" 
              id="password" 
              className={styles.input} 
              placeholder="••••••••"
            />
          </div>

          <button type="button" className={styles.btnPrimary}>
            Acessar Plataforma
          </button>
        </form>

        <p className={styles.linkText}>
          Ainda não é cliente? <Link href="/register">Abra sua conta</Link>
        </p>
      </div>
    </div>
  );
}
