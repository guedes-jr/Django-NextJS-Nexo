#!/bin/bash

# ── Cores ──
CYAN='\033[1;36m'
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
GRAY='\033[0;90m'
RESET='\033[0m'

FRONT_TAG="${CYAN}[FRONTEND]${RESET}"
BACK_TAG="${YELLOW}[BACKEND]${RESET}"

# Modo background (não espera)
BACKGROUND=false
if [ "$1" = "--background" ] || [ "$1" = "-b" ]; then
    BACKGROUND=true
fi

echo ""
echo -e "${GREEN}🚀 Iniciando a plataforma NEXO localmente...${RESET}"
echo -e "${GRAY}────────────────────────────────────────────────${RESET}"

# ── Cleanup ──
cleanup() {
    echo ""
    echo -e "${RED}🛑 Encerrando todos os servidores da NEXO...${RESET}"
    trap - SIGINT SIGTERM
    
    if [ -n "$FRONTEND_PID" ]; then
        kill -TERM $FRONTEND_PID 2>/dev/null
    fi
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM $BACKEND_PID 2>/dev/null
    fi
    
    sleep 1
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "runserver 8001" 2>/dev/null
    
    echo -e "${GREEN}✅ Servidores encerrados.${RESET}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ── Frontend ──
echo -e "${FRONT_TAG} Iniciando Next.js na porta 3000..."
cd frontend
npm run dev 2>&1 | sed -u "s/^/$(printf "${CYAN}[FRONT]${RESET} ")/" &
FRONTEND_PID=$!
cd ..

# ── Backend ──
echo -e "${BACK_TAG} Iniciando Django na porta 8001..."
cd backend
source venv/bin/activate
python3 manage.py runserver 8001 2>&1 | sed -u "s/^/$(printf "${YELLOW}[BACK]${RESET}  ")/" &
BACKEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ Todos os servidores rodando!${RESET}"
echo -e "${GRAY}────────────────────────────────────────────────${RESET}"
echo -e "  ${FRONT_TAG} http://localhost:3000"
echo -e "  ${BACK_TAG}  http://localhost:8001"
echo -e "${GRAY}────────────────────────────────────────────────${RESET}"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para encerrar${RESET}"
echo ""

if [ "$BACKGROUND" = true ]; then
    echo -e "${GREEN}Modo background ativado. Os processos continuam em background.${RESET}"
    exit 0
fi

# Espera com capacidade de interrupção
while kill -0 $FRONTEND_PID 2>/dev/null; do
    sleep 1
done &

wait $FRONTEND_PID $BACKEND_PID 2>/dev/null
