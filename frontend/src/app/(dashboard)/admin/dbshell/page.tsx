"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SharedSidebar from '@/components/SharedSidebar';
import Editor, { useMonaco } from '@monaco-editor/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

type SchemaRow = { table: string; column: string; type: string; nullable: boolean };

export default function DBShellPage() {
  const router = useRouter();
  const monaco = useMonaco();
  const [editorValue, setEditorValue] = useState('SELECT * FROM identity_customuser LIMIT 10;\n');
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [schema, setSchema] = useState<SchemaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ rows: 0, time: 0, status: '' });
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('nexo_access') : null;

  useEffect(() => {
    if (!token) router.push('/login');
  }, [token, router]);

  // Load History and Schema
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/monitor/db/`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setHistory(data.history || []));
      
    fetch(`${API_URL}/api/monitor/db/schema/`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setSchema(data.schema || []));
  }, [token]);

  // Register Monaco Autocomplete
  useEffect(() => {
    if (monaco && token && schema.length > 0) {
      const tableNames = Array.from(new Set(schema.map(s => s.table)));
      const columnNames = Array.from(new Set(schema.map(s => s.column)));
      
      const disposable = monaco.languages.registerCompletionItemProvider('sql', {
        provideCompletionItems: function(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
            };

            const suggestions: any[] = [];
            
            ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT JOIN', 'INNER JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'LIMIT', 'OFFSET'].forEach(kw => {
                suggestions.push({ label: kw, kind: monaco.languages.CompletionItemKind.Keyword, insertText: kw, range: range, detail: "SQL Keyword" });
            });

            tableNames.forEach(t => {
                suggestions.push({ label: t, kind: monaco.languages.CompletionItemKind.Class, insertText: t, range: range, detail: "Table" });
            });

            columnNames.forEach(c => {
                suggestions.push({ label: c, kind: monaco.languages.CompletionItemKind.Field, insertText: c, range: range, detail: "Column" });
            });

            return { suggestions };
        }
      });
      return () => disposable.dispose();
    }
  }, [monaco, schema, token]);

  const executeQuery = async () => {
    const query = editorValue;
    if (!query.trim()) return;
    
    setLoading(true);
    setStats({ rows: 0, time: 0, status: 'RUNNING' });
    
    try {
      const res = await fetch(`${API_URL}/api/monitor/db/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      if (data.status === 'ERROR') {
        setStats({ rows: 0, time: 0, status: 'ERROR' });
        setResults([[data.output || data.error || 'Erro']]);
        setColumns(['Erro']);
      } else {
        setStats({ rows: data.rows_affected || 0, time: data.execution_time || 0, status: 'SUCCESS' });
        setResults(data.output || []);
        setColumns(data.columns || (data.output?.[0] || []));
        
        // Refresh history mapping manually to avoid large re-fetching loops
        setHistory(prev => [{ query, created_at: new Date().toISOString() }, ...prev].slice(0, 50));
      }
    } catch (err) {
      setStats({ rows: 0, time: 0, status: 'ERROR' });
      setResults([['Erro de conexão com o banco']]);
      setColumns(['Erro']);
    }
    setLoading(false);
  };

  const executeQueryRef = useRef(executeQuery);
  useEffect(() => { executeQueryRef.current = executeQuery; }, [executeQuery]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      executeQueryRef.current();
    });
  };

  const tableGroups = Array.from(new Set(schema.map(s => s.table))).slice(0, 15);

  return (
    <div className="shell-container">
      <SharedSidebar />
      <main className="shell-main">
        <header className="shell-header">
          <div>
            <h1 className="text-gradient">SQL DB Shell</h1>
            <p className="shell-subtitle">Explorador inteligente do banco de dados (Ctrl+Enter para Executar)</p>
          </div>
          <div className="shell-actions">
            <button className="shell-btn" onClick={() => setEditorValue('')}>🗑️ Limpar Editor</button>
            <button className="shell-btn primary" onClick={executeQuery} disabled={loading}>
              {loading ? 'Executando...' : '▶ Executar Query'}
            </button>
          </div>
        </header>

        <div className="editor-workspace">
          {/* Left Pane: Explorer */}
          <div className="explorer-pane">
            <div className="pane-header dark-bg">
              <span>Database Tables</span>
            </div>
            <div className="explorer-content">
              {tableGroups.length === 0 && <div className="muted-text">Carregando schema...</div>}
              {tableGroups.map(t => (
                <div key={t} className="tree-item" onClick={() => setEditorValue(`SELECT * FROM ${t} LIMIT 10;\n`)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                  <span>{t}</span>
                </div>
              ))}
              
              <div style={{ marginTop: '20px', marginBottom: '10px' }} className="pane-header dark-bg">
                <span>Histórico (Últimas)</span>
              </div>
              {history.slice(0, 8).map((h, i) => (
                <div key={i} className="tree-item history" onClick={() => setEditorValue(h.query)}>
                  <span className="truncate">{h.query.replace(/\n/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="main-right-pane">
            {/* Top Right: Code Editor */}
            <div className="editor-pane">
              <div className="pane-header">
                <span>query.sql</span>
                <span className="kb-shortcut">Pressione Ctrl+Space para ver as Tabelas/Colunas</span>
              </div>
              <div style={{ flex: 1 }}>
                <Editor
                  height="100%"
                  defaultLanguage="sql"
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
                    wordWrap: "on"
                  }}
                />
              </div>
            </div>

            {/* Bottom Right: Data Results */}
            <div className="terminal-pane results-pane">
              <div className="pane-header terminal-bg">
                <span>Query Results Output</span>
                {stats.status && (
                  <span className={`status status-${stats.status.toLowerCase()}`}>
                    {stats.status} • {stats.rows} linhas executadas • {stats.time.toFixed(2)}ms
                  </span>
                )}
              </div>
              <div className="data-grid-container">
                {results.length > 0 && typeof results[0] !== 'string' ? (
                  <table className="data-grid">
                    <thead>
                      <tr>
                        {Array.isArray(results[0]) 
                          ? results[0].map((col: string, i: number) => <th key={i}>{col}</th>) 
                          : Object.keys(results[0] || {}).map(col => <th key={col}>{col}</th>)
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(1).map((row: any, i: number) => (
                        <tr key={i}>
                          {Array.isArray(row) 
                            ? row.map((cell: any, j: number) => <td key={j}>{String(cell)}</td>)
                            : Object.values(row).map((cell: any, j: number) => <td key={j}>{String(cell)}</td>)
                          }
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="terminal-output string-output">
                    {results.map((r, i) => <div key={i}>{String(r)}</div>)}
                    {results.length === 0 && !loading && <span className="muted-text">Execute uma query para visualizar dados...</span>}
                    {loading && <span className="loading-text">Requisitando servidor SQL...</span>}
                  </div>
                )}
              </div>
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
          
          .editor-workspace { flex: 1; display: flex; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
          
          .explorer-pane { width: 260px; background: #161b22; display: flex; flex-direction: column; border-right: 1px solid #30363d; }
          .explorer-content { padding: 12px; overflow-y: auto; flex: 1; }
          .tree-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; color: #8a94a2; font-size: 13px; cursor: pointer; border-radius: 6px; margin-bottom: 2px; }
          .tree-item:hover { background: rgba(255,255,255,0.05); color: #c9d1d9; }
          .tree-item svg { color: #8b5cf6; }
          .tree-item.history { font-family: monospace; font-size: 12px; }
          
          .main-right-pane { flex: 1; display: flex; flex-direction: column; min-width: 0; }
          
          .editor-pane { flex: 1; display: flex; flex-direction: column; background: #1e1e1e; min-height: 200px; }
          .terminal-pane { flex: 1; display: flex; flex-direction: column; background: #0d1117; border-top: 1px solid #30363d; }
          
          .pane-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: #252526; color: #9da5b4; font-size: 12px; font-family: sans-serif; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .pane-header.terminal-bg { background: #161b22; }
          .pane-header.dark-bg { background: transparent; border: none; padding: 0 10px; font-weight: 700; text-transform: uppercase; color: #5c6370; margin-bottom: 8px; }
          .kb-shortcut { color: #5c6370; }
          
          .data-grid-container { flex: 1; overflow: auto; background: #0d1117; }
          .data-grid { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; font-family: 'Inter', sans-serif; }
          .data-grid th { text-align: left; padding: 12px 16px; background: #161b22; color: #c9d1d9; font-weight: 600; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #30363d; border-right: 1px solid #21262d; white-space: nowrap; }
          .data-grid td { padding: 12px 16px; border-bottom: 1px solid #21262d; border-right: 1px solid #21262d; color: #8a94a2; white-space: nowrap; max-width: 300px; overflow: hidden; text-overflow: ellipsis; }
          .data-grid tr:hover td { background: rgba(255,255,255,0.02); color: #c9d1d9; }
          
          .string-output { padding: 20px; font-family: monospace; color: #8be9fd; font-size: 14px; }
          
          .status { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; letter-spacing: 0.05em; }
          .status-success { background: rgba(46, 160, 67, 0.15); color: #3fb950; border: 1px solid rgba(46, 160, 67, 0.4); }
          .status-error { background: rgba(248, 81, 73, 0.1); color: #f85149; border: 1px solid rgba(248, 81, 73, 0.4); }
          .status-running { background: rgba(56, 139, 253, 0.1); color: #58a6ff; border: 1px solid rgba(56, 139, 253, 0.4); animation: pulse 1.5s infinite; }
          
          .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
          .muted-text { color: #5c6370; }
          .loading-text { color: #8b5cf6; animation: pulse 1.5s infinite; }
          
          @keyframes pulse { 50% { opacity: 0.5; } }
          
          /* Custom Scrollbar for Grid */
          .data-grid-container::-webkit-scrollbar { width: 10px; height: 10px; }
          .data-grid-container::-webkit-scrollbar-track { background: #0d1117; }
          .data-grid-container::-webkit-scrollbar-thumb { background: #30363d; border-radius: 5px; }
          .data-grid-container::-webkit-scrollbar-thumb:hover { background: #484f58; }
        `}</style>
      </main>
    </div>
  );
}