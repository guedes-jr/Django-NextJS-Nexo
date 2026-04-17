# Autenticação

## Descrição
Sistema completo de autenticação usando JWT (JSON Web Tokens) com Django REST Framework e SimpleJWT.

## Funcionalidades

### Login
- Autenticação via username/password
- Retorna access token e refresh token
- Tokens com expiração configurável

### Registro
- Criação de novos usuários
- Validação de dados
- Perfil padrão: USER

### Recuperação de Senha
- Mock implementado
- Fluxo de reset via e-mail (configurável)

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login/` | Login |
| POST | `/api/auth/register/` | Registro |
| POST | `/api/auth/refresh/` | Refresh token |
| POST | `/api/auth/logout/` | Logout |

## Modelos

### CustomUser
- username, email, password
- role (USER, MANAGER, SUPPORT, ADMIN)
- permissions (list)
- is_active, is_verified
- currency preference

## Configurações

```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}
```

## Frontend

- Página de login em `/login`
- Armazenamento de tokens no localStorage
- Redirect automático para `/` após login
- Logout limpa tokens e redireciona para login

---

**Retornar para:** [Documentação Principal](../README.md)