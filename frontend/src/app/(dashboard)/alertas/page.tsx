"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { color: string }> = {
  'ALERT': { color: 'var(--warning)' },
  'INFO': { color: 'var(--accent-primary)' },
  'SUCCESS': { color: 'var(--success)' },
  'WARNING': { color: 'var(--warning)' },
};

export default function AlertasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) { router.push('/login'); return; }
    fetch(`${API_URL}/api/portfolio/notifications/`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data) setNotifications(data); })
      .finally(() => { setLoading(false); });
  }, [router]);

  const handleMarkRead = async (id: number) => {
    const token = localStorage.getItem('nexo_access');
    await fetch(`${API_URL}/api/portfolio/notifications/mark-read/`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: id })
    });
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--glass-border)' }}>
          <div>
            <h1 className="text-gradient">Alertas</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Notificacoes e avisos</p>
          </div>
          {unreadCount > 0 && <span style={{ padding: '8px 16px', background: 'var(--danger)', borderRadius: '8px', fontSize: '14px' }}>{unreadCount} nao lidas</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto 16px', opacity: 0.5 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <p>Nenhum alerta</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)} style={{ padding: '16px', background: n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(59,130,246,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', cursor: 'pointer', opacity: n.is_read ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: typeConfig[n.notification_type]?.color || 'var(--text-primary)' }}>{n.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(n.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{n.message}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}