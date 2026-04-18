"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const COLORS = [
  '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795', 
  '#3182ce', '#5a67d8', '#805ad5', '#d53f8c', '#ed64a6'
];

function getInitials(firstName: string, lastName: string, username: string): string {
  if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  if (firstName) return firstName.charAt(0).toUpperCase();
  if (lastName) return lastName.charAt(0).toUpperCase();
  if (username) return username.charAt(0).toUpperCase();
  return 'U';
}

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function PerfilPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([
      fetch(`${API_URL}/api/auth/user/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_URL}/api/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_URL}/api/preferences/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ])
    .then(async ([userRes, profileRes, prefRes]) => {
      if (userRes.status === 401) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      const profileData = profileRes.ok ? await profileRes.json() : null;
      const prefData = prefRes.ok ? await prefRes.json() : null;
      setUser(userData);
      setProfile(profileData);
      setPreferences(prefData);
      setEditValue({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: profileData?.phone || userData.phone || '',
        about: userData.about || '',
        preferred_currency: prefData?.preferred_currency || 'BRL',
        preferred_language: prefData?.preferred_language || 'pt-BR',
        notifications_enabled: prefData?.notifications_enabled ?? prefData?.email_notifications ?? true
      });
    })
    .finally(() => {
      setMounted(true);
      setLoading(false);
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('nexo_access');
    localStorage.removeItem('nexo_refresh');
    router.push('/login');
  };

  const handleSave = async (field: string, value: any) => {
    const token = localStorage.getItem('nexo_access');
    if (!token) return;

    setSaving(true);
    try {
      let endpoint = `${API_URL}/api/profile/me/`;
      let body = { [field]: value };

      if (['preferred_currency', 'preferred_language', 'notifications_enabled', 'email_notifications'].includes(field)) {
        endpoint = `${API_URL}/api/preferences/`;
        if (field === 'notifications_enabled') {
          body = { email_notifications: value, push_notifications: value };
        }
      }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        if (endpoint.includes('preferences')) {
          setPreferences(data);
        } else {
          setUser((prev: any) => ({ ...prev, ...data }));
        }
        setEditValue((prev: any) => ({ ...prev, [field]: value }));
        setMessage('Perfil atualizado!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('Erro ao salvar');
    }
    setSaving(false);
    setEditingField(null);
  };

  const startEdit = (field: string) => {
    setEditingField(field);
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  if (!mounted || loading) {
    return (
      <div className="page-container">
        <SharedSidebar />
        <main className="main-content">
          <div className="loading">Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <SharedSidebar />
      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="text-gradient">Meu Perfil</h1>
            <p className="subtitle">Gerencie suas informações pessoais</p>
          </div>
        </header>

        {message && <div className="message">{message}</div>}

        <div className="profile-header">
          <div className="profile-header-left">
            <div className="avatar-circle" style={{ backgroundColor: getColorFromName(user?.username || '') }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="avatar-img" />
              ) : (
                <span className="avatar-initials">
                  {getInitials(user?.first_name, user?.last_name, user?.username)}
                </span>
              )}
            </div>
            <button className="avatar-edit-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Alterar foto
            </button>
          </div>

          <div className="profile-header-right">
            <h2 className="section-title">Informações Pessoais</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Primeiro Nome</label>
                {editingField === 'first_name' ? (
                  <input type="text" className="edit-input" value={editValue.first_name}
                    onChange={(e) => setEditValue({ ...editValue, first_name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave('first_name', editValue.first_name)} autoFocus />
                ) : (
                  <span className="editable" onClick={() => startEdit('first_name')}>{user?.first_name || '-'}</span>
                )}
              </div>
              <div className="info-item">
                <label>Sobrenome</label>
                {editingField === 'last_name' ? (
                  <input type="text" className="edit-input" value={editValue.last_name}
                    onChange={(e) => setEditValue({ ...editValue, last_name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave('last_name', editValue.last_name)} autoFocus />
                ) : (
                  <span className="editable" onClick={() => startEdit('last_name')}>{user?.last_name || '-'}</span>
                )}
              </div>
              <div className="info-item">
                <label>Telefone</label>
                {editingField === 'phone' ? (
                  <input type="text" className="edit-input" value={editValue.phone}
                    onChange={(e) => setEditValue({ ...editValue, phone: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave('phone', editValue.phone)} autoFocus />
                ) : (
                  <span className="editable" onClick={() => startEdit('phone')}>{editValue.phone || '-'}</span>
                )}
              </div>
              <div className="info-item full-width">
                <label>Sobre</label>
                {editingField === 'about' ? (
                  <textarea className="edit-textarea" value={editValue.about}
                    onChange={(e) => setEditValue({ ...editValue, about: e.target.value })} rows={3} />
                ) : (
                  <span className="editable" onClick={() => startEdit('about')}>{user?.about || '-'}</span>
                )}
              </div>
              {(editingField === 'first_name' || editingField === 'last_name' || editingField === 'phone' || editingField === 'about') && (
                <div className="edit-actions">
                  <button className="save-btn" onClick={() => handleSave(editingField, editValue[editingField])} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button className="cancel-btn" onClick={cancelEdit}>Cancelar</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="profile-section">
          <h2 className="section-title">Informações da Conta</h2>
          <div className="info-grid">
            <div className="info-item"><label>Usuário</label><span>{user?.username || '-'}</span></div>
            <div className="info-item"><label>E-mail</label><span>{user?.email || '-'}</span></div>
            <div className="info-item"><label>Data de cadastro</label><span>{user?.date_joined ? new Date(user.date_joined).toLocaleDateString('pt-BR') : '-'}</span></div>
            <div className="info-item"><label>Admin</label><span className={user?.is_admin ? 'badge-admin' : 'badge-user'}>{user?.is_admin ? 'Administrador' : 'Usuário'}</span></div>
          </div>
        </section>

        <section className="profile-section">
          <h2 className="section-title">Perfil de Investidor</h2>
          <div className="info-grid">
            <div className="info-item"><label>Nível de Risco</label><span>{profile?.risk_level || 'Não definido'}</span></div>
            <div className="info-item"><label>Corretora Principal</label><span>{profile?.primary_broker || 'Não definida'}</span></div>
            <div className="info-item"><label>Onboarding</label><span className={profile?.onboarding_completed ? 'badge-success' : 'badge-warning'}>{profile?.onboarding_completed ? 'Completo' : 'Incompleto'}</span></div>
          </div>
        </section>

        <section className="profile-section">
          <h2 className="section-title">Preferências</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Moeda</label>
              {editingField === 'preferred_currency' ? (
                <select className="edit-select" value={editValue.preferred_currency} onChange={(e) => handleSave('preferred_currency', e.target.value)}>
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              ) : (
                <span className="editable" onClick={() => startEdit('preferred_currency')}>{editValue.preferred_currency || 'BRL'}</span>
              )}
            </div>
            <div className="info-item">
              <label>Idioma</label>
              {editingField === 'preferred_language' ? (
                <select className="edit-select" value={editValue.preferred_language} onChange={(e) => handleSave('preferred_language', e.target.value)}>
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en-US">English (US)</option>
                </select>
              ) : (
                <span className="editable" onClick={() => startEdit('preferred_language')}>{editValue.preferred_language === 'pt-BR' ? 'Português (BR)' : 'English (US)'}</span>
              )}
            </div>
            <div className="info-item">
              <label>Notificações</label>
              {editingField === 'notifications_enabled' ? (
                <select className="edit-select" value={editValue.notifications_enabled ? 'true' : 'false'} onChange={(e) => handleSave('notifications_enabled', e.target.value === 'true')}>
                  <option value="true">Ativadas</option>
                  <option value="false">Desativadas</option>
                </select>
              ) : (
                <span className="editable" onClick={() => startEdit('notifications_enabled')}>{editValue.notifications_enabled ? 'Ativadas' : 'Desativadas'}</span>
              )}
            </div>
            <div className="info-item">
              <label>Two-Factor Auth</label>
              <span className={user?.mfa_enabled ? 'badge-success' : 'badge-warning'}>{user?.mfa_enabled ? 'Ativado' : 'Desativado'}</span>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <h2 className="section-title">Dispositivos Confiáveis</h2>
          <div className="devices-list">
            {user?.trusted_devices?.length > 0 ? (
              user.trusted_devices.map((device: any, i: number) => (
                <div key={i} className="device-item">
                  <div className="device-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div className="device-info">
                    <span className="device-name">{device.device_name || 'Dispositivo'}</span>
                    <span className="device-date">{device.last_used ? new Date(device.last_used).toLocaleDateString('pt-BR') : 'Uso recente'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-devices">Nenhum dispositivo cadastrado</p>
            )}
          </div>
        </section>

        <style>{`
          .page-container { display: flex; min-height: 100vh; }
          .main-content { flex: 1; padding: 32px 48px; display: flex; flex-direction: column; gap: 24px; }
          .loading { display: flex; align-items: center; justify-content: center; height: 100vh; color: var(--text-secondary); }
          .page-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--glass-border); }
          .page-header h1 { font-size: 28px; }
          .subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
          .logout-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md); color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
          .logout-btn:hover { background: rgba(255,100,100,0.15); border-color: rgba(255,100,100,0.4); color: #ff6b6b; }
          .profile-header { display: flex; gap: 32px; padding: 32px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 20px; backdrop-filter: blur(10px); }
          .profile-header-left { display: flex; flex-direction: column; align-items: center; gap: 16px; }
          .avatar-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .avatar-img { width: 100%; height: 100%; object-fit: cover; }
          .avatar-initials { font-size: 36px; font-weight: 700; color: white; }
          .avatar-edit-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md); color: var(--text-secondary); cursor: pointer; font-size: 14px; transition: all 0.2s; }
          .avatar-edit-btn:hover { background: var(--glass-bg); border-color: var(--accent-primary); color: var(--text-primary); }
          .profile-header-right { flex: 1; }
          .profile-header-right .section-title { margin-bottom: 16px; }
          .profile-header-right .info-grid { grid-template-columns: repeat(2, 1fr); }
          .message { background: rgba(72,187,120,0.15); color: #48bb78; padding: 14px 18px; border-radius: var(--radius-md); border: 1px solid rgba(72,187,120,0.3); }
          .profile-section { padding: 24px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 20px; backdrop-filter: blur(10px); }
          .section-title { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: var(--text-primary); }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
          .info-item label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
          .info-item span { font-size: 16px; }
          .info-item.full-width { grid-column: 1 / -1; }
          .editable { cursor: pointer; padding: 6px 10px; border-radius: var(--radius-sm); transition: background 0.2s; }
          .editable:hover { background: var(--glass-bg); }
          .edit-input, .edit-textarea, .edit-select { width: 100%; padding: 10px 14px; font-size: 16px; background: var(--bg-primary); border: 1px solid var(--glass-border); border-radius: var(--radius-md); color: var(--text-primary); transition: border-color 0.2s; }
          .edit-input:focus, .edit-textarea:focus, .edit-select:focus { outline: none; border-color: var(--accent-primary); }
          .edit-textarea { resize: vertical; min-height: 80px; }
          .edit-select { cursor: pointer; }
          .edit-actions { grid-column: 1 / -1; display: flex; gap: 12px; margin-top: 12px; }
          .save-btn { padding: 10px 18px; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
          .save-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.4); }
          .save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
          .cancel-btn { padding: 10px 18px; background: transparent; color: var(--text-secondary); border: 1px solid var(--glass-border); border-radius: var(--radius-md); cursor: pointer; font-weight: 500; transition: all 0.2s; }
          .cancel-btn:hover { background: var(--bg-secondary); }
          .badge-admin { background: rgba(66,153,225,0.15); color: #4299e1; padding: 6px 10px; border-radius: var(--radius-sm); font-size: 13px; border: 1px solid rgba(66,153,225,0.3); }
          .badge-user { background: rgba(72,187,120,0.15); color: #48bb78; padding: 6px 10px; border-radius: var(--radius-sm); font-size: 13px; border: 1px solid rgba(72,187,120,0.3); }
          .badge-success { background: rgba(72,187,120,0.15); color: #48bb78; padding: 6px 10px; border-radius: var(--radius-sm); font-size: 13px; border: 1px solid rgba(72,187,120,0.3); }
          .badge-warning { background: rgba(237,137,54,0.15); color: #ed8936; padding: 6px 10px; border-radius: var(--radius-sm); font-size: 13px; border: 1px solid rgba(237,137,54,0.3); }
          .devices-list { display: flex; flex-direction: column; gap: 12px; }
          .device-item { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid transparent; transition: border-color 0.2s; }
          .device-item:hover { border-color: var(--glass-border); }
          .device-icon { color: var(--text-secondary); }
          .device-info { display: flex; flex-direction: column; }
          .device-name { font-weight: 500; }
          .device-date { font-size: 13px; color: var(--text-secondary); }
          .no-devices { color: var(--text-secondary); font-style: italic; }
        `}</style>
      </main>
    </div>
  );
}