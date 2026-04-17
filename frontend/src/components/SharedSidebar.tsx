"use client";

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { href: '/carteira', label: 'Carteira', icon: 'M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z' },
  { href: '/relatorios', label: 'Relatorios', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z' },
  { href: '/backup', label: 'Backup', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
  { href: '/movimentacoes', label: 'Movimentacoes', icon: 'M22 12l-4-4 5.5 6-5.5 9h9' },
  { href: '/alocacao', label: 'Alocacao', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2a3.5 3.5 0 0 1 3.5 3.5V10l-3.5 1L15 11l1-3.5V5a2 2 0 0 0-2-2h-1' },
  { href: '/metas', label: 'Metas', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2' },
  { href: '/corretoras', label: 'Corretoras', icon: 'M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3' },
  { href: '/corretoras/comparativo', label: 'Comparativo', icon: 'M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z' },
  { href: '/eventos', label: 'Eventos', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z' },
  { href: '/historico', label: 'Historico', icon: 'M3 3v18h18' },
  { href: '/benchmark', label: 'Benchmark', icon: 'M3 3v18h18' },
  { href: '/concentracao', label: 'Concentracao', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { href: '/documentos', label: 'Documentos', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6' },
  { href: '/automations', label: 'Automacoes', icon: 'M12 2v4m0 12v4M2 12h4m12 0h4m-3.5-6.5l2.5 2.5m2.5 2.5l2.5-2.5M5 9l2.5-2.5M19 17l-2.5 2.5' },
  { href: '/alertas', label: 'Alertas', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
  { href: '/admin', label: 'Admin', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: 'M12 12c2-2 4-2 6 0M12 12c2-2 4-2 6 0M12 12c-2-2-4-2-6 0M12 12c-2-2-4-2-6 0M12 2a10 10 0 0 1 10 10' },
  { href: '/admin/suporte', label: 'Suporte', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { href: '/admin/reconciliacao', label: 'Reconciliacao', icon: 'M9 3v10M15 3v10M3 9h18M3 15h18' },
  { href: '/admin/cms', label: 'CMS', icon: 'M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zM4 13a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6z' },
  { href: '/admin/monitor', label: 'Monitor', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { href: '/admin/verificacoes', label: 'Verificacoes', icon: 'M9 12l2 2 4-4m5.618-4.016A11.959 11.959 0 0 1 12 2.944a11.959 11.959 0 0 1-2.618 5.046 11.96 11.96 0 0 1-2.004 2.004 11.959 11.959 0 0 1-5.046 2.618A11.96 11.96 0 0 1 2.944 12c0-.654.053-1.295.15-1.916a11.959 11.959 0 0 1 5.046-2.618 11.96 11.96 0 0 1 2.004-2.004A11.959 11.959 0 0 1 12 5.056c.654 0 1.295-.053 1.916-.15a11.958 11.958 0 0 1 2.004 2.004 11.958 11.958 0 0 1 2.618 5.046c.896.097 1.742.262 2.618.15' },
  { href: '/admin/auditoria', label: 'Auditoria', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H9m3-4V4m0 0h4m0 4v4m0-4h-4m4 0h4' },
  { href: '/admin/webshell', label: 'WebShell', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/admin/dbshell', label: 'DBShell', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 4-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 4-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
  { href: '/admin/logs', label: 'Logs', icon: 'M9 12h6m-3-3v6m-3-6V6a3 3 0 013-3' },
  { href: '/admin/cache', label: 'Cache', icon: 'M12 15v2m-6 4v2m-6-8V6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2z' },
  { href: '/admin/tasks', label: 'Tasks', icon: 'M4 4v5h.582m0 0a8 8 0 005.582 9.572m0 0A12 12 0 0114.418 12m0 0a8 8 0 015.582-9.572M4 4h5v5' },
  { href: '/admin/config', label: 'Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z' },
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