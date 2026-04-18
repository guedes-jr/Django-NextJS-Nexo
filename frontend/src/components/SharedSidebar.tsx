"use client";

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

const navGroups = [
  {
    title: 'Principal',
    icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    items: [
      { href: '/', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
      { href: '/carteira', label: 'Carteira', icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
      { href: '/movimentacoes', label: 'Movimentações', icon: 'M7 7h10v10H7z M17 7h.01M7 17h10' },
    ]
  },
  {
    title: 'Análise',
    icon: 'M18 20V10M12 20V4M6 20v-6',
    items: [
      { href: '/benchmark', label: 'Benchmarks', icon: 'M18 20V10M12 20V4M6 20v-6' },
      { href: '/concentracao', label: 'Concentração', icon: 'M11 2a9 9 0 0 1 6.36 2.64L21 8m-4-4.64A9 9 0 0 1 11 22H2m9-16.36A9 9 0 0 1 15.64 3.64L9 10m6-2.64A9 9 0 0 0 2.36 11.64L2 19' },
      { href: '/historico', label: 'Histórico', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    ]
  },
  {
    title: 'Planejamento',
    icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2',
    items: [
      { href: '/metas', label: 'Metas', icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
      { href: '/alocacao', label: 'Alocação', icon: 'M11 2a9 9 0 0 1 6 6.58V10l4 4-4 4v1.42a9 9 0 1 1-6-6.58z' },
    ]
  },
  {
    title: 'Operações',
    icon: 'M3 21h18M5 21V7l7-4 7 4v14',
    items: [
      { href: '/corretoras', label: 'Corretoras', icon: 'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0H7m14 0l2-12m-2 12l-2 12' },
      { href: '/eventos', label: 'Eventos', icon: 'M8 7V4m8 4V4m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { href: '/documentos', label: 'Documentos', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z' },
    ]
  },
  {
    title: 'Automação',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2 2.931C11.511 9.926 10.652 10.5 9.5 10.5 8.5 10.5 8 9.5 8 8.5c0-.828-.415-1.578-1.013-2.05',
    items: [
      { href: '/automations', label: 'Automações', icon: 'M12 12m0 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2z' },
      { href: '/alertas', label: 'Alertas', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
    ]
  },
  {
    title: 'Admin',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    items: [
      { href: '/admin', label: 'Painel', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
      { href: '/admin/usuarios', label: 'Usuários', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m4 0a4 4 0 0 0 4-4m-4 4v4m0-4H5m8 0h.01M17 9h.01' },
      { href: '/admin/reconciliacao', label: 'Reconciliação', icon: 'M3 6h18M3 12h18M3 18h18M3 6v12m0 6h18' },
    ]
  },
  {
    title: 'Dev Tools',
    icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    items: [
      { href: '/admin/webshell', label: 'WebShell', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { href: '/admin/dbshell', label: 'DBShell', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 4-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 4-4M4 7c0-2.21 3.582-4 8-4s8 1.79 4 4' },
      { href: '/admin/logs', label: 'Monitor', icon: 'M9 17v-2m3 2v-4m3 2v-6m-9 6V7m9 4V5' },
      { href: '/admin/cache', label: 'Cache', icon: 'M5 8h14M5 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8' },
      { href: '/admin/tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
      { href: '/admin/config', label: 'Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2 2.931C11.511 9.926 10.652 10.5 9.5 10.5 8.5 10.5 8 9.5 8 8.5c0-.828-.415-1.578-1.013-2.05' },
    ]
  },
];

export default function SharedSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setExpanded(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="sidebar">
      <div className="logo" onClick={() => router.push('/')}>
        <img src="/logo_icon.png" alt="NEXO" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <span>NEXO</span>
      </div>
      
      <nav className="nav">
        {navGroups.map(group => {
          const isExpanded = expanded[group.title];
          const hasActive = group.items.some(item => pathname === item.href);
          const showGroup = isExpanded !== undefined ? isExpanded : hasActive;
          
          return (
            <div key={group.title} className="navGroup">
              <div 
                className={`groupTitle ${hasActive ? 'hasActive' : ''}`}
                onClick={() => toggleGroup(group.title)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={group.icon} />
                  </svg>
                  {group.title}
                </div>
              </div>
              <div className={`groupItems ${showGroup ? 'expanded' : ''}`}>
                {group.items.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={`navItem ${isActive ? 'active' : ''}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon} />
                      </svg>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}