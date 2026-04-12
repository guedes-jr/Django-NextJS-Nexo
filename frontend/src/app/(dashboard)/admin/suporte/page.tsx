"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Ticket {
  id: number;
  user_username: string;
  assigned_username: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

interface Message {
  id: number;
  user_username: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export default function SuportePage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/support/tickets/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      
      if (!res.ok) {
        throw new Error('Erro ao carregar tickets');
      }
      
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) return;
    
    try {
      const res = await fetch(`${API_URL}/api/support/tickets/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTicket)
      });
      
      if (res.ok) {
        setNewTicket({ title: '', description: '', priority: 'MEDIUM' });
        fetchTickets();
      }
    } catch (err) {
      console.error('Erro ao criar ticket:', err);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !replyMessage) return;
    
    try {
      const res = await fetch(`${API_URL}/api/support/tickets/${selectedTicket.id}/messages/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: replyMessage })
      });
      
      if (res.ok) {
        setReplyMessage('');
        // Refresh tickets and update selected ticket
        const updatedTickets = await fetch(`${API_URL}/api/support/tickets/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());
        setTickets(updatedTickets);
        const updated = updatedTickets.find((t: Ticket) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'OPEN': '#3b82f6',
      'IN_PROGRESS': '#f59e0b',
      'WAITING': '#8b5cf6',
      'RESOLVED': '#22c55e',
      'CLOSED': '#6b7280',
    };
    return colors[status] || '#888';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'OPEN': 'Aberto',
      'IN_PROGRESS': 'Em Andamento',
      'WAITING': 'Aguardando',
      'RESOLVED': 'Resolvido',
      'CLOSED': 'Fechado',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'LOW': '#6b7280',
      'MEDIUM': '#3b82f6',
      'HIGH': '#f59e0b',
      'URGENT': '#ef4444',
    };
    return colors[priority] || '#888';
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
          <h1>Suporte</h1>
          <button className="btn-primary" onClick={() => setSelectedTicket(null)}>+ Novo Ticket</button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="content-grid">
          <div className="tickets-list">
            <h2>Meus Tickets</h2>
            {tickets.map(ticket => (
              <div 
                key={ticket.id} 
                className={`ticket-card ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="ticket-header">
                  <span className="ticket-id">#{ticket.id}</span>
                  <span className="ticket-priority" style={{ backgroundColor: getPriorityColor(ticket.priority) }}>
                    {ticket.priority}
                  </span>
                </div>
                <h3>{ticket.title}</h3>
                <div className="ticket-meta">
                  <span>{ticket.user_username}</span>
                  <span style={{ color: getStatusColor(ticket.status) }}>{getStatusLabel(ticket.status)}</span>
                </div>
              </div>
            ))}
            {tickets.length === 0 && <div className="empty">Nenhum ticket encontrado</div>}
          </div>

          <div className="ticket-detail">
            {selectedTicket ? (
              <>
                <div className="detail-header">
                  <h2>{selectedTicket.title}</h2>
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedTicket.status) }}>
                    {getStatusLabel(selectedTicket.status)}
                  </span>
                </div>
                <p className="description">{selectedTicket.description}</p>
                
                <div className="messages">
                  {selectedTicket.messages?.map(msg => (
                    <div key={msg.id} className={`message ${msg.is_internal ? 'internal' : ''}`}>
                      <div className="message-header">
                        <strong>{msg.user_username}</strong>
                        <span>{new Date(msg.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <p>{msg.message}</p>
                    </div>
                  ))}
                </div>

                <div className="reply-box">
                  <textarea 
                    placeholder="Digite sua mensagem..."
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                  />
                  <button className="btn-primary" onClick={sendMessage}>Enviar</button>
                </div>
              </>
            ) : (
              <div className="new-ticket">
                <h2>Novo Ticket</h2>
                <div className="form-group">
                  <label>Título</label>
                  <input 
                    type="text" 
                    value={newTicket.title}
                    onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                    placeholder="Descreva seu problema"
                  />
                </div>
                <div className="form-group">
                  <label>Prioridade</label>
                  <select 
                    value={newTicket.priority}
                    onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea 
                    value={newTicket.description}
                    onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Detalhe seu problema..."
                    rows={6}
                  />
                </div>
                <button className="btn-primary" onClick={createTicket}>Abrir Ticket</button>
              </div>
            )}
          </div>
        </div>

        <style>{`
          .container { display: flex; min-height: 100vh; }
          .main { flex: 1; padding: 2rem; background: #0d0d0d; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
          .header h1 { color: #fff; font-size: 1.5rem; margin: 0; }
          .btn-primary { background: #22c55e; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
          .btn-primary:hover { background: #16a34a; }
          .error { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
          .content-grid { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; }
          .tickets-list h2 { color: #888; font-size: 0.875rem; margin-bottom: 1rem; }
          .ticket-card { background: #1a1a1a; padding: 1rem; border-radius: 8px; cursor: pointer; margin-bottom: 0.75rem; border: 1px solid transparent; }
          .ticket-card.selected { border-color: #22c55e; }
          .ticket-card:hover { background: #222; }
          .ticket-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
          .ticket-id { color: #666; font-size: 0.75rem; }
          .ticket-priority { color: #fff; font-size: 0.625rem; padding: 0.125rem 0.5rem; border-radius: 9999px; }
          .ticket-card h3 { color: #fff; font-size: 0.875rem; margin: 0 0 0.5rem; font-weight: 500; }
          .ticket-meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: #666; }
          .ticket-detail { background: #141414; border-radius: 12px; padding: 1.5rem; }
          .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
          .detail-header h2 { color: #fff; margin: 0; }
          .status-badge { color: #fff; font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 9999px; }
          .description { color: #888; margin-bottom: 1.5rem; }
          .messages { max-height: 400px; overflow-y: auto; margin-bottom: 1rem; }
          .message { background: #1a1a1a; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; }
          .message.internal { background: #1e1b4b; border-left: 3px solid #6366f1; }
          .message-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #888; font-size: 0.75rem; }
          .message-header strong { color: #fff; }
          .message p { color: #ccc; margin: 0; }
          .reply-box textarea { width: 100%; background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.75rem; }
          .new-ticket h2 { color: #fff; margin: 0 0 1.5rem; }
          .form-group { margin-bottom: 1rem; }
          .form-group label { display: block; color: #888; margin-bottom: 0.5rem; }
          .form-group input, .form-group select, .form-group textarea { width: 100%; background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 0.75rem; border-radius: 8px; }
          .empty { padding: 3rem; text-align: center; color: #666; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100vh; color: #666; }
        `}</style>
      </main>
    </div>
  );
}