"use client";

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'rect' },
  { href: '/carteira', label: 'Carteira', icon: 'pie' },
  { href: '/movimentacoes', label: 'Movimentacoes', icon: 'trend' },
  { href: '/metas', label: 'Metas', icon: 'target' },
  { href: '/documentos', label: 'Documentos', icon: 'doc' },
  { href: '/automations', label: 'Automacoes', icon: 'auto' },
  { href: '/alertas', label: 'Alertas', icon: 'bell' },
];

const icons: Record<string, React.ReactNode> = {
  rect: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  pie: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>,
  trend: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  target: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  doc: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
  auto: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 12v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m12 12h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"></path></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
};

export default function Sidebar({ className = '' }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className={className}>
      <div className="sidebar">
        <div className="logo" onClick={() => router.push('/')}>
          <img src="/logo.png" alt="NEXO Logo" width={36} height={36} />
          <span>NEXO</span>
        </div>
        
        <nav className="nav">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`navItem ${isActive ? 'active' : ''}`}>
                {icons[item.icon]}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}