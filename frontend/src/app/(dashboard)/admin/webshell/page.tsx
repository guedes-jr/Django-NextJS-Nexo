"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';
import Editor, { useMonaco } from '@monaco-editor/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function WebShellPage() {
  const router = useRouter();
  const monaco = useMonaco();
  const [history, setHistory] = useState<{command: string; output: string; exit_code: number}[]>([]);
  const [editorValue, setEditorValue] = useState('from django.contrib.auth import get_user_model\nUser = get_user_model()\n\n# Comece a digitar aqui...\n');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    if (monaco && token) {
      const disposable = monaco.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['.'],
        provideCompletionItems: async function(model, position) {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          });
          
          const match = textUntilPosition.match(/([a-zA-Z0-9_]+)\.$/);
          if (!match) return { suggestions: [] };
          
          const target = match[1];
          
          try {
            const res = await fetch(`${API_URL}/api/monitor/shell/attrs/?target=${target}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.attributes) {
              const suggestions = data.attributes.map((attr: any) => ({
                label: attr.name,
                kind: attr.type === 'method' 
                  ? monaco.languages.CompletionItemKind.Method 
                  : attr.type === 'property' 
                    ? monaco.languages.CompletionItemKind.Property
                    : monaco.languages.CompletionItemKind.Field,
                insertText: attr.type === 'method' ? `${attr.name}()` : attr.name,
                detail: attr.signature || attr.type,
              }));
              return { suggestions };
            }
          } catch (e) {
            console.error('Erro no autocomplete', e);
          }
          return { suggestions: [] };
        }
      });
      
      return () => disposable.dispose();
    }
  }, [monaco, token]);

  const executeCode = async () => {
    const code = editorValue;
    if (!code.trim()) return;
    
    setLoading(true);
    setHistory(prev => [...prev, { command: code, output: '', exit_code: 0 }]);
    
    try {
      const res = await fetch(`${API_URL}/api/monitor/shell/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: code })
      });
      const data = await res.json();
      setHistory(prev => [...prev.slice(0, -1), {
        command: code,
        output: data.output || data.error || '',
        exit_code: data.exit_code || 0
      }]);
    } catch (err) {
      setHistory(prev => [...prev.slice(0, -1), {
        command: code,
        output: 'Erro de conexão com o terminal do Django.',
        exit_code: 1
      }]);
    }
    
    setLoading(false);
  };

  const executeCodeRef = useRef(executeCode);
  useEffect(() => {
    executeCodeRef.current = executeCode;
  }, [executeCode]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      executeCodeRef.current();
    });
  };

  return (
    <div className="shell-container">
      <SharedSidebar />
      <main className="shell-main">
        <header className="shell-header">
          <div>
            <h1 className="text-gradient">WebShell IDE</h1>
            <p className="shell-subtitle">Editor Python inteligente integrado ao Django ORM</p>
          </div>
          <div className="shell-actions">
            <button className="shell-btn" onClick={() => setHistory([])}>🗑️ Limpar Console</button>
            <button className="shell-btn" onClick={() => setEditorValue('')}>📄 Novo Script</button>
            <button className="shell-btn primary" onClick={executeCode} disabled={loading}>
              {loading ? 'Executando...' : '▶ Executar (Ctrl+Enter)'}
            </button>
          </div>
        </header>

        <div className="editor-workspace">
          {/* Top Pane: Monaco Editor */}
          <div className="editor-pane">
            <div className="pane-header">
              <span>script.py</span>
              <span className="kb-shortcut">Pressione Ctrl+Space para Autocomplete</span>
            </div>
            <div style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={editorValue}
                onChange={(value) => setEditorValue(value || '')}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineHeight: 24,
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                }}
              />
            </div>
          </div>

          {/* Bottom Pane: Terminal Output */}
          <div className="terminal-pane">
            <div className="pane-header terminal-bg">
              <span>Console Output</span>
            </div>
            <div className="terminal-output">
              {history.length === 0 && (
                <div className="welcome-message">
                  <pre style={{color: '#7dcfff'}}>{`Ambiente Python (Django backend) pronto.
Escreva um script complexo acima e pressione 'Executar'.

Atalhos:
  [Ctrl + Enter]  - Executar o bloco de código
  [Ctrl + Espaço] - Forçar sugestões de Autocomplete
  [Ponto .]       - Carregar os atributos da classe/módulo dinamicamente
`}</pre>
                </div>
              )}
              {history.map((item, i) => (
                <div key={i} className="command-block">
                  <div className="command-header">
                    <span className="prompt">Script [{i + 1}] executado com sucesso:</span>
                  </div>
                  {item.output && (
                    <pre className={`output ${item.exit_code === 0 ? 'exit-0' : 'exit-1'}`}>
                      {item.output}
                    </pre>
                  )}
                </div>
              ))}
              {loading && <div className="loading">Avaliando código no servidor Django...</div>}
              <div ref={bottomRef} style={{ height: '10px' }} />
            </div>
          </div>
        </div>

        <style>{`
          .shell-container { display: flex; min-height: 100vh; background: var(--bg-primary); }
          .shell-main { flex: 1; padding: 32px; display: flex; flex-direction: column; gap: 20px; height: 100vh; overflow: hidden; }
          .shell-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; }
          .shell-subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
          .shell-actions { display: flex; gap: 12px; }
          .shell-btn { padding: 10px 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; font-size: 13px; font-weight: 500; }
          .shell-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
          .shell-btn.primary { background: var(--accent-primary); border-color: var(--accent-primary); color: white; }
          .shell-btn.primary:hover { opacity: 0.9; }
          .shell-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          
          .editor-workspace { flex: 1; display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
          
          .editor-pane { flex: 3; display: flex; flex-direction: column; background: #1e1e1e; }
          .terminal-pane { flex: 2; display: flex; flex-direction: column; background: #0d1117; border-top: 1px solid #30363d; overflow: hidden; }
          
          .pane-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: #252526; color: #9da5b4; font-size: 12px; font-family: sans-serif; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .pane-header.terminal-bg { background: #161b22; }
          .kb-shortcut { color: #5c6370; }
          
          .terminal-output { flex: 1; padding: 20px; overflow-y: auto; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; line-height: 1.6; }
          .welcome-message pre { color: var(--text-secondary); margin: 0; }
          .command-block { margin-bottom: 24px; }
          .command-header { display: flex; align-items: flex-start; margin-bottom: 8px; }
          .prompt { color: #8b5cf6; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
          .output { background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; white-space: pre-wrap; word-break: break-all; color: #a5d6ff; border-left: 3px solid transparent; }
          .exit-0 { border-left-color: #2ea043; }
          .exit-1 { border-left-color: #f85149; color: #f85149; }
          
          .loading { color: #89ddff; animation: blink 1.5s infinite; font-family: monospace; font-size: 13px; margin-top: 10px; }
          @keyframes blink { 50% { opacity: 0.5; } }
          
          /* Custom Scrollbar for Workspace */
          .terminal-output::-webkit-scrollbar { width: 8px; height: 8px; }
          .terminal-output::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
          .terminal-output::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
          .terminal-output::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}</style>
      </main>
    </div>
  );
}