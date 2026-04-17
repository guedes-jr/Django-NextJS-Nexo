"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Command {
  command: string;
  output: string;
  exit_code: number;
}

export default function WebShellPage() {
  const router = useRouter();
  const [commands, setCommands] = useState<Command[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    inputRef.current?.focus();
  }, [token, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commands]);

  const executeCommand = async () => {
    if (!currentCommand.trim()) return;
    
    setLoading(true);
    setCommands(prev => [...prev, { command: currentCommand, output: '', exit_code: 0 }]);
    
    try {
      const res = await fetch(`${API_URL}/api/monitor/shell/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: currentCommand })
      });
      
      const data = await res.json();
      setCommands(prev => [...prev.slice(0, -1), {
        command: currentCommand,
        output: data.output || data.error || '',
        exit_code: data.exit_code || 0
      }]);
    } catch (err) {
      setCommands(prev => [...prev.slice(0, -1), {
        command: currentCommand,
        output: 'Erro de conexão',
        exit_code: 1
      }]);
    }
    
    setCurrentCommand('');
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      executeCommand();
    }
  };

  const clearTerminal = async () => {
    await fetch(`${API_URL}/api/monitor/shell/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command: 'clear' })
    });
    setCommands([]);
  };

  return (
    <div style={{ display: 'flex' }}>
      <SharedSidebar />
      <main style={{ flex: 1, padding: '32px 48px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)', marginBottom: '16px' }}>
          <div>
            <h1 className="text-gradient animate-fade-in">WebShell</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Terminal integrado para execução de comandos</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={clearTerminal}
              style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#ccc', cursor: 'pointer' }}
            >
              Limpar
            </button>
            <button 
              onClick={() => setCurrentCommand('help')}
              style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
            >
              Help
            </button>
          </div>
        </header>

        <div style={{ 
          flex: 1, 
          background: '#0d1117', 
          borderRadius: '12px', 
          padding: '16px', 
          fontFamily: 'monospace',
          fontSize: '14px',
          overflow: 'auto',
          border: '1px solid #30363d'
        }}>
          <div style={{ color: '#8b949e', marginBottom: '16px' }}>
            <div style={{ color: '#58a6ff' }}>NEXO WebShell v1.0</div>
            <div>Digite 'help' para ver comandos disponíveis</div>
          </div>
          
          {commands.map((cmd, index) => (
            <div key={index} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#7ee787' }}>nexo@dev</span>
                <span style={{ color: '#8b949e' }}>$</span>
                <span style={{ color: '#c9d1d9' }}>{cmd.command}</span>
              </div>
              {cmd.output && (
                <pre style={{ 
                  color: cmd.exit_code === 0 ? '#c9d1d9' : '#f85149', 
                  margin: '4px 0 0 0', 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  {cmd.output}
                </pre>
              )}
            </div>
          ))}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#7ee787' }}>nexo@dev</span>
            <span style={{ color: '#8b949e' }}>$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoFocus
              style={{ 
                flex: 1, 
                background: 'transparent', 
                border: 'none', 
                outline: 'none',
                color: '#c9d1d9',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
              placeholder={loading ? 'Executando...' : 'Digite um comando...'}
            />
          </div>
          <div ref={bottomRef} />
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
          <span>Comandos: ls, pwd, cd, cat, whoami, ps, date</span>
          <span>Django: manage.py migrate, manage.py createsuperuser</span>
        </div>
      </main>
    </div>
  );
}