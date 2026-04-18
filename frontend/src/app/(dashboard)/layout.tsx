"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const COLORS = [
  '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795', 
  '#3182ce', '#5a67d8', '#805ad5', '#d53f8c', '#ed64a6'
];

function getInitials(name: string): string {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
}

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/auth/user/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (res.status === 401) {
        router.push('/login');
      }
      return res.json();
    })
    .then(data => {
      setUser(data);
      setMounted(true);
    })
    .catch(() => {
      router.push('/login');
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('nexo_access');
    localStorage.removeItem('nexo_refresh');
    router.push('/login');
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <header className="navbar">
        <Link href="/" className="nav-logo">
          <span className="logo-icon"></span>
        </Link>
        
        <div className="nav-user">
          <button className="user-btn" onClick={() => setShowMenu(!showMenu)}>
            <div className="user-avatar" style={{ backgroundColor: getColorFromName(user?.username || '') }}>
              {getInitials(user?.username || '')}
            </div>
          </button>
          
          {showMenu && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-name">{user?.username || 'Usuário'}</span>
                <span className="dropdown-email">{user?.email || ''}</span>
              </div>
              <div className="dropdown-divider" />
              <Link href="/perfil" className="dropdown-item" onClick={() => setShowMenu(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Meu Perfil
              </Link>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          background: transparent;
          z-index: 100;
        }
        .nav-logo {
          text-decoration: none;
        }
        .logo-icon {
          display: block;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          color: white;
        }
        .nav-user {
          position: relative;
        }
        .user-btn {
          display: flex;
          align-items: center;
          padding: 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .user-btn:hover {
          background: var(--bg-tertiary);
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: white;
        }
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 180px;
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          padding: 6px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .dropdown-header {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .dropdown-name {
          font-weight: 600;
          font-size: 13px;
          color: var(--text-primary);
        }
        .dropdown-email {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .dropdown-divider {
          height: 1px;
          background: var(--glass-border);
          margin: 6px 0;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 13px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dropdown-item:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .dropdown-item.logout:hover {
          background: rgba(255,100,100,0.15);
          color: #ff6b6b;
        }
      `}</style>

      {children}
    </>
  );
}