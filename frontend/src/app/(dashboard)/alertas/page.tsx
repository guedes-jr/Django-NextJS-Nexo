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
  link?: string;
}

interface NotificationSettings {
  price_alerts: boolean;
  goal_alerts: boolean;
  market_news: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
  'ALERT': { color: '#ef4444', icon: '🔔', label: 'Alerta' },
  'INFO': { color: '#3b82f6', icon: 'ℹ️', label: 'Informação' },
  'SUCCESS': { color: '#22c55e', icon: '✅', label: 'Sucesso' },
  'WARNING': { color: '#f59e0b', icon: '⚠️', label: 'Aviso' },
  'GOAL': { color: '#8b5cf6', icon: '🎯', label: 'Meta' },
  'PRICE': { color: '#06b6d4', icon: '📈', label: 'Preço' },
  'MARKET': { color: '#ec4899', icon: '📊', label: 'Mercado' },
};

export default function AlertasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    price_alerts: true,
    goal_alerts: true,
    market_news: true,
    email_notifications: true,
    push_notifications: true,
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    fetchNotifications();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/portfolio/notifications/`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/portfolio/notifications/mark-read/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id })
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await handleMarkRead(n.id);
    }
  };

  const saveSettings = async () => {
    alert('Configurações salvas (mock)');
    setShowSettings(false);
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.notification_type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unreadByType = notifications.reduce((acc, n) => {
    if (!n.is_read) acc[n.notification_type] = (acc[n.notification_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="container">
        <SharedSidebar />
        <main className="main"><div className="loading">Carregando...</div></main>
      </div>
    );
  }

  return (
    <div className="container">
      <SharedSidebar />
      <main className="main">
        <div className="header">
          <div>
            <h1 className="text-gradient">Central de Notificações</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Gerencie seus alertas e configurações de notificação</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => setShowSettings(true)}>
              ⚙️ Configurações
            </button>
            {unreadCount > 0 && (
              <button className="btn-primary" onClick={markAllRead}>
                Marcar todas como lidas
              </button>
            )}
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-pill">
            <span className="stat-count">{unreadCount}</span>
            <span className="stat-label">Não lidas</span>
          </div>
          {Object.entries(unreadByType).map(([type, count]) => (
            <div key={type} className="stat-pill">
              <span className="stat-count" style={{ color: typeConfig[type]?.color }}>{count}</span>
              <span className="stat-label">{typeConfig[type]?.label || type}</span>
            </div>
          ))}
        </div>

        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas ({notifications.length})
          </button>
          {Object.keys(typeConfig).map(type => {
            const count = notifications.filter(n => n.notification_type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                className={`filter-btn ${filter === type ? 'active' : ''}`}
                onClick={() => setFilter(type)}
              >
                {typeConfig[type].icon} {typeConfig[type].label} ({count})
              </button>
            );
          })}
        </div>

        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">🔔</span>
              <h3>Nenhuma notificação</h3>
              <p>Você receberá alertas sobre preços, metas e eventos do mercado</p>
            </div>
          ) : (
            filteredNotifications.map(n => (
              <div 
                key={n.id} 
                className={`notification-card ${n.is_read ? 'read' : 'unread'}`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
                <div className="notification-icon" style={{ backgroundColor: typeConfig[n.notification_type]?.color + '20' }}>
                  {typeConfig[n.notification_type]?.icon || '🔔'}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <span className="notification-title" style={{ color: typeConfig[n.notification_type]?.color }}>
                      {n.title}
                    </span>
                    <span className="notification-time">
                      {new Date(n.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="notification-message">{n.message}</p>
                  {n.link && <span className="notification-link">Ver mais →</span>}
                </div>
                {!n.is_read && <div className="unread-dot" />}
              </div>
            ))
          )}
        </div>

        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Configurações de Notificação</h2>
                <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
              </div>
              
              <div className="settings-section">
                <h3>Tipos de Alerta</h3>
                <label className="setting-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.price_alerts}
                    onChange={e => setSettings({ ...settings, price_alerts: e.target.checked })}
                  />
                  <span>Alertas de preço</span>
                  <span className="setting-desc">Receba alertas quando ativos atingirem valores específicos</span>
                </label>
                <label className="setting-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.goal_alerts}
                    onChange={e => setSettings({ ...settings, goal_alerts: e.target.checked })}
                  />
                  <span>Alertas de meta</span>
                  <span className="setting-desc">Notificações sobre progresso e conclusão de metas</span>
                </label>
                <label className="setting-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.market_news}
                    onChange={e => setSettings({ ...settings, market_news: e.target.checked })}
                  />
                  <span>Notícias do mercado</span>
                  <span className="setting-desc">Atualizações sobre eventos corporativos e notícias</span>
                </label>
              </div>

              <div className="settings-section">
                <h3>Canais de Envio</h3>
                <label className="setting-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.push_notifications}
                    onChange={e => setSettings({ ...settings, push_notifications: e.target.checked })}
                  />
                  <span>Notificações push</span>
                  <span className="setting-desc">Receba notificações no navegador</span>
                </label>
                <label className="setting-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.email_notifications}
                    onChange={e => setSettings({ ...settings, email_notifications: e.target.checked })}
                  />
                  <span>E-mail</span>
                  <span className="setting-desc">Receba resumos diários por e-mail</span>
                </label>
              </div>

              <button className="btn-primary" onClick={saveSettings}>Salvar Configurações</button>
            </div>
          </div>
        )}

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 32px 48px; background: var(--bg-primary); display: flex; flex-direction: column; gap: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .header h1 { font-size: 1.875rem; font-weight: 700; margin: 0; }
          .header-actions { display: flex; gap: 12px; }
          .btn-primary { background: var(--accent-primary); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
          .btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; }
          
          .stats-row { display: flex; gap: 12px; flex-wrap: wrap; }
          .stat-pill { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 9999px; }
          .stat-count { font-size: 1.25rem; font-weight: 700; }
          .stat-label { font-size: 0.875rem; color: var(--text-secondary); }
          
          .filters { display: flex; gap: 8px; flex-wrap: wrap; }
          .filter-btn { background: var(--bg-secondary); border: 1px solid var(--glass-border); color: var(--text-secondary); padding: 10px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
          .filter-btn.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
          
          .notifications-list { display: flex; flex-direction: column; gap: 12px; }
          .notification-card { display: flex; align-items: flex-start; gap: 16px; padding: 20px; background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 12px; cursor: pointer; transition: all 0.2s; position: relative; }
          .notification-card.unread { background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.3); }
          .notification-card.read { opacity: 0.7; }
          .notification-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
          .notification-content { flex: 1; }
          .notification-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .notification-title { font-weight: 600; font-size: 1rem; }
          .notification-time { font-size: 0.75rem; color: var(--text-secondary); }
          .notification-message { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
          .notification-link { display: inline-block; margin-top: 8px; font-size: 0.75rem; color: var(--accent-primary); }
          .unread-dot { width: 10px; height: 10px; background: var(--accent-primary); border-radius: 50%; position: absolute; top: 16px; right: 16px; }
          
          .empty { text-align: center; padding: 64px; }
          .empty-icon { font-size: 4rem; display: block; margin-bottom: 16px; }
          .empty h3 { margin: 0 0 8px; }
          .empty p { color: var(--text-secondary); margin: 0; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
          
          .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
          .modal { background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 16px; padding: 24px; width: 100%; max-width: 500px; }
          .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
          .modal-header h2 { margin: 0; }
          .close-btn { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-secondary); }
          .settings-section { margin-bottom: 24px; }
          .settings-section h3 { font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 12px; text-transform: uppercase; }
          .setting-toggle { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 8px; cursor: pointer; }
          .setting-toggle input { margin-bottom: 4px; }
          .setting-toggle span:first-of-type { font-weight: 500; }
          .setting-desc { font-size: 0.75rem; color: var(--text-secondary); }
        `}</style>
      </main>
    </div>
  );
}