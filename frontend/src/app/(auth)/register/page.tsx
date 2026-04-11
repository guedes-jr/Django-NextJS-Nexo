import Image from 'next/image';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function RegisterPage() {
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

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="name">Nome Completo</label>
            <input 
              type="text" 
              id="name" 
              className={styles.input} 
              placeholder="João Guedes"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">E-mail</label>
            <input 
              type="email" 
              id="email" 
              className={styles.input} 
              placeholder="exemplo@nexo.com.br"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Crie uma senha segura</label>
            <input 
              type="password" 
              id="password" 
              className={styles.input} 
              placeholder="Minimo de 8 caracteres"
            />
          </div>

          <button type="button" className={styles.btnPrimary}>
            Criar Conta Gratuita
          </button>
        </form>

        <p className={styles.linkText}>
          Já possui conta? <Link href="/login">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
