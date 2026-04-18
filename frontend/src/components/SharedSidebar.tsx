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
      { href: '/carteira', label: 'Carteira', icon: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z' },
      { href: '/movimentacoes', label: 'Movimentações', icon: 'M22 12l-4-4 5.5 6-5.5 9h9' },
    ]
  },
  {
    title: 'Análise',
    icon: 'M3 3v18h18',
    items: [
      { href: '/benchmark', label: 'Benchmarks', icon: 'M3 3v18h18' },
      { href: '/concentracao', label: 'Concentração', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
      { href: '/historico', label: 'Histórico', icon: 'M12 8v4l0 0m0-4l0 0' },
    ]
  },
  {
    title: 'Planejamento',
    icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    items: [
      { href: '/metas', label: 'Metas', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' },
      { href: '/alocacao', label: 'Alocação', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' },
    ]
  },
  {
    title: 'Operações',
    icon: 'M3 21h18M3 10h18M3 7l9-4 9 4',
    items: [
      { href: '/corretoras', label: 'Corretoras', icon: 'M3 21h18M3 10h18M3 7l9-4 9 4' },
      { href: '/eventos', label: 'Eventos', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z' },
      { href: '/documentos', label: 'Documentos', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
    ]
  },
  {
    title: 'Automação',
    icon: 'M12 2v4m0 12v4M2 12h4m12 0h4',
    items: [
      { href: '/automations', label: 'Automações', icon: 'M12 2v4m0 12v4M2 12h4m12 0h4' },
      { href: '/alertas', label: 'Alertas', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' },
    ]
  },
  {
    title: 'Admin',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066',
    items: [
      { href: '/admin', label: 'Painel', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066' },
      { href: '/admin/usuarios', label: 'Usuários', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
      { href: '/admin/reconciliacao', label: 'Reconciliação', icon: 'M9 3v10M15 3v10M3 9h18M3 15h18' },
    ]
  },
  {
    title: 'Dev Tools',
    icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    items: [
      { href: '/admin/webshell', label: 'WebShell', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { href: '/admin/dbshell', label: 'DBShell', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 4-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 4-4' },
      { href: '/admin/logs', label: 'Monitor', icon: 'M9 12h6m-3-3v6m-3-6V6a3 3 0 013-3' },
      { href: '/admin/cache', label: 'Cache', icon: 'M12 15v2m-6 4v2m-6-8V6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2z' },
      { href: '/admin/tasks', label: 'Tasks', icon: 'M4 4v5h.582m0 0a8 8 0 015.582 9.572m0 0A12 12 0 0114.418 12' },
      { href: '/admin/config', label: 'Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066' },
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