.PHONY: help dev dev-docker frontend backend setup commit-feat commit-fix commit-docs commit-ui commit-ref

help:
	@echo "Comandos disponíveis:"
	@echo "  make dev         - Inicia o Front e o Back juntos no mesmo terminal"
	@echo "  make dev-docker  - Inicia Front, Back e os Banco de Dados (Docker)"
	@echo "  make frontend    - Inicia apenas o Frontend"
	@echo "  make backend     - Inicia apenas o Backend"
	@echo "  make setup       - Instala/atualiza todas as dependências locais"
	@echo "  -- Commits Automáticos --"
	@echo "  make commit-feat msg=\"Sua mensagem\" - Nova feature (✨)"
	@echo "  make commit-fix  msg=\"Sua mensagem\" - Correção de bug (🐛)"
	@echo "  make commit-docs msg=\"Sua mensagem\" - Documentação (📝)"
	@echo "  make commit-ui   msg=\"Sua mensagem\" - Interface/Visual (🎨)"
	@echo "  make commit-ref  msg=\"Sua mensagem\" - Refatoração (♻️)"

dev:
	@bash start.sh

dev-docker:
	@echo "Iniciando Docker..."
	@docker compose up -d
	@bash start.sh

frontend:
	cd frontend && npm run dev

backend:
	cd backend && source venv/bin/activate && python3 manage.py runserver

setup:
	@echo "Instalando dependências do Frontend..."
	cd frontend && npm install
	@echo "Instalando dependências do Backend..."
	cd backend && source venv/bin/activate && pip install -r requirements.txt

# --- COMANDOS GIT COM EMOJIS ---
# Uso: make commit-feat msg="Adiciona tela de login"
commit-feat:
	@git add .
	@git commit -m "✨ feat: $(msg)"
	@echo "Commit 'feat' realizado com sucesso!"

commit-fix:
	@git add .
	@git commit -m "🐛 fix: $(msg)"
	@echo "Commit 'fix' realizado com sucesso!"

commit-docs:
	@git add .
	@git commit -m "📝 docs: $(msg)"
	@echo "Commit 'docs' realizado com sucesso!"

commit-ui:
	@git add .
	@git commit -m "🎨 ui: $(msg)"
	@echo "Commit 'ui' realizado com sucesso!"

commit-ref:
	@git add .
	@git commit -m "♻️ refactor: $(msg)"
	@echo "Commit 'refactor' realizado com sucesso!"
