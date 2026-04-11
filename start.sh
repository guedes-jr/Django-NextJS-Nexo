#!/bin/bash

echo "🚀 Iniciando a plataforma NEXO localmente..."

# Esta função garante que quando você apertar Ctrl+C, ambos os processos morram limpos
cleanup() {
    echo ""
    echo "🛑 Encerrando todos os servidores da NEXO..."
    # Usa 'kill 0' para matar todo o grupo de processos filho criados no script
    kill 0
}

# Prepara a armadilha para atirar no cleanup ao receber o comando de parada
trap cleanup SIGINT SIGTERM

echo "📦 [FRONTEND] Iniciando Next.js na porta 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "⚙️  [BACKEND] Iniciando Django na porta 8001..."
cd backend
source venv/bin/activate
python3 manage.py runserver 8001 &
BACKEND_PID=$!
cd ..

echo "✅ Todos os servidores rodando! Acompanhe os logs abaixo:"
echo "--------------------------------------------------------"

# Mantem o script rodando prendendo a atenção nos logs dos PIDs em background
wait $FRONTEND_PID $BACKEND_PID
