"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  all_permissions: string[];
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export default function UsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/profiles/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      
      if (!res.ok) {
        throw new Error('Erro ao carregar usuários: ' + res.status);
      }
      
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editPerms, setEditPerms] = useState<string[]>([]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/profiles/${userId}/`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      if (res.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        ));
      }
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditPerms(user.all_permissions || []);
  };

  const saveUserChanges = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`${API_URL}/api/profiles/${editingUser.id}/`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          role: editRole,
          permissions: editPerms
        })
      });
      
      if (res.ok) {
        setUsers(users.map(u => 
          u.id === editingUser.id ? { ...u, role: editRole, permissions: editPerms } : u
        ));
        setEditingUser(null);
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || 
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'USER': 'Usuário',
      'MANAGER': 'Gerente',
      'SUPPORT': 'Suporte',
      'ADMIN': 'Admin'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'USER': '#888',
      'MANAGER': '#f59e0b',
      'SUPPORT': '#3b82f6',
      'ADMIN': '#ef4444'
    };
    return colors[role] || '#888';
  };

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
          <h1>Gestão de Usuários</h1>
          <button className="btn-primary">+ Novo Usuário</button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="filters">
          <input 
            type="text" 
            placeholder="Buscar usuário..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <select 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos os perfis</option>
            <option value="USER">Usuário</option>
            <option value="MANAGER">Gerente</option>
            <option value="SUPPORT">Suporte</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Último acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span 
                      className="role-badge"
                      style={{ backgroundColor: getRoleColor(user.role) }}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleString('pt-BR')
                      : 'Nunca'
                    }
                  </td>
                  <td>
                    <button 
                      className="btn-icon"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      title={user.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {user.is_active ? '⏸' : '▶'}
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => openEditModal(user)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="empty">Nenhum usuário encontrado</div>
          )}
        </div>

        {editingUser && (
          <div className="modal-overlay" onClick={() => setEditingUser(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Editar {editingUser.username}</h2>
              <div className="form-group">
                <label>Perfil</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="USER">Usuário</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="SUPPORT">Suporte</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Permissões</label>
                <div className="permissions-grid">
                  {['view_dashboard', 'view_portfolio', 'edit_portfolio', 'view_positions', 'edit_positions', 'view_transactions', 'edit_transactions', 'view_goals', 'edit_goals', 'view_automations', 'edit_automations', 'view_alerts', 'edit_alerts', 'view_documents', 'edit_documents', 'view_users', 'edit_users', 'view_profiles', 'view_reports'].map(perm => (
                    <label key={perm} className="perm-checkbox">
                      <input 
                        type="checkbox"
                        checked={editPerms.includes(perm)}
                        onChange={e => {
                          if (e.target.checked) {
                            setEditPerms([...editPerms, perm]);
                          } else {
                            setEditPerms(editPerms.filter(p => p !== perm));
                          }
                        }}
                      />
                      {perm.replace('view_', 'Visualizar ').replace('edit_', 'Editar ')}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
                <button className="btn-primary" onClick={saveUserChanges}>Salvar</button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 2rem; background: #0d0d0d; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
          .header h1 { color: #fff; font-size: 1.5rem; margin: 0; }
          .btn-primary { background: #22c55e; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
          .btn-primary:hover { background: #16a34a; }
          .error { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
          .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
          .search-input { flex: 1; background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 0.75rem 1rem; border-radius: 8px; }
          .filter-select { background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 0.75rem 1rem; border-radius: 8px; }
          .table-container { background: #141414; border-radius: 12px; overflow: hidden; }
          .table { width: 100%; border-collapse: collapse; }
          .table th { text-align: left; padding: 1rem; color: #888; font-weight: 500; border-bottom: 1px solid #222; }
          .table td { padding: 1rem; color: #fff; border-bottom: 1px solid #222; }
          .table tr:hover { background: #1a1a1a; }
          .role-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; color: #fff; }
          .status { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; }
          .status.active { background: #dcfce7; color: #166534; }
          .status.inactive { background: #fee2e2; color: #991b1b; }
          .btn-icon { background: transparent; border: none; color: #fff; cursor: pointer; padding: 0.5rem; font-size: 1.25rem; }
          .btn-icon:hover { opacity: 0.7; }
          .empty { padding: 3rem; text-align: center; color: #666; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
          .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
          .modal { background: #1a1a1a; padding: 2rem; border-radius: 12px; width: 500px; max-height: 80vh; overflow-y: auto; }
          .modal h2 { color: #fff; margin: 0 0 1.5rem; }
          .form-group { margin-bottom: 1rem; }
          .form-group label { display: block; color: #888; margin-bottom: 0.5rem; }
          .form-group select { width: 100%; background: #222; border: 1px solid #333; color: #fff; padding: 0.75rem; border-radius: 8px; }
          .permissions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
          .perm-checkbox { display: flex; align-items: center; gap: 0.5rem; color: #888; font-size: 0.875rem; }
          .modal-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
          .btn-secondary { background: #333; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; }
          .btn-secondary:hover { background: #444; }
        `}</style>
      </main>
    </div>
  );
}