"use client";

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { href: '/carteira', label: 'Carteira', icon: 'M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z' },
  { href: '/movimentacoes', label: 'Movimentacoes', icon: 'M22 12l-4-4 5.5 6-5.5 9h9' },
  { href: '/alocacao', label: 'Alocacao', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2a3.5 3.5 0 0 1 3.5 3.5V10l-3.5 1L15 11l1-3.5V5a2 2 0 0 0-2-2h-1' },
  { href: '/metas', label: 'Metas', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2' },
  { href: '/documentos', label: 'Documentos', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6' },
  { href: '/automations', label: 'Automacoes', icon: 'M12 2v4m0 12v4M2 12h4m12 0h4m-3.5-6.5l2.5 2.5m2.5 2.5l2.5-2.5M5 9l2.5-2.5M19 17l-2.5 2.5' },
  { href: '/alertas', label: 'Alertas', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: 'M12 12c2-2 4-2 6 0M12 12c2-2 4-2 6 0M12 12c-2-2-4-2-6 0M12 12c-2-2-4-2-6 0M12 2a10 10 0 0 1 10 10' },
  { href: '/admin/suporte', label: 'Suporte', icon: 'M12 2a10 10 0 0 1 10 10M12 2a10 10 0 0 1 10 10M12 2a10 10 0 0 1 10 10' },
  { href: '/admin/reconciliacao', label: 'Reconciliacao', icon: 'M9 3v10M15 3v10M3 9h18M3 15h18' },
];

export default function SharedSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="logo" onClick={() => router.push('/')}>
        <img src="/logo.png" alt="NEXO Logo" width={36} height={36} />
        <span>NEXO</span>
      </div>
      
      <nav className="nav">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`navItem ${isActive ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}