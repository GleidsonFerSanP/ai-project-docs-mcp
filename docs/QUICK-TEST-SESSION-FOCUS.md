# Quick Test - Session Focus System

Este arquivo demonstra como testar o novo sistema de manutenção de foco.

## Teste Rápido

### 1. Iniciar uma sessão focada

```bash
# No GitHub Copilot Chat
@project-docs #coding-session backend
```

Você verá:
* 🎯 Instruções de manutenção de foco
* ⚡ Regras de auto-refresh
* ✅ Validação contínua habilitada
* 📍 Checkpoints configurados

### 2. Criar sessão manualmente

```typescript
// Via tool MCP
{
  "tool": "start_session",
  "params": {
    "context": "backend",
    "current_focus": "Testar sistema de sessões",
    "active_contracts": ["ISessionManager"],
    "focus_reminders": [
      "Validar estado da sessão",
      "Criar checkpoints regulares"
    ]
  }
}
```

### 3. Verificar estado da sessão

```typescript
{
  "tool": "get_session_state"
}
```

### 4. Validar foco da conversa

```typescript
{
  "tool": "validate_conversation_focus",
  "params": {
    "proposed_action": "Adicionar novo endpoint de API"
  }
}
```

### 5. Criar checkpoint

```typescript
{
  "tool": "create_checkpoint",
  "params": {
    "summary": "Sistema de sessões implementado e testado",
    "next_focus": "Documentar uso e criar testes unitários"
  }
}
```

### 6. Listar sessões ativas

```typescript
{
  "tool": "list_active_sessions"
}
```

### 7. Retomar sessão anterior

```bash
@project-docs #session-resume session-1234567890
```

### 8. Finalizar sessão

```typescript
{
  "tool": "complete_session",
  "params": {
    "session_id": "session-1234567890"
  }
}
```

## Testes de Validação

### Teste 1: Violação de Contrato

```typescript
// Propor código que viola um contrato
validate_conversation_focus({
  proposed_code: `
    class MyService {
      // Sem implementar IAuthService
      login() { return true; }
    }
  `
})

// Esperado: Detectar violação
```

### Teste 2: Divergência de Foco

```typescript
// Sessão focada em "Implementar autenticação"
validate_conversation_focus({
  proposed_action: "Adicionar funcionalidade de upload de arquivos"
})

// Esperado: Warning de divergência
```

### Teste 3: Auto-Refresh

```typescript
// Simular 10 interações
for (let i = 0; i < 10; i++) {
  get_session_state()
}

// Esperado: Sugestão de refresh_session_context
```

## Verificar Persistência

```bash
# Ver arquivo de sessões
cat .project-docs-mcp/sessions.json

# Deve conter:
# - sessionId
# - projectId
# - context
# - currentFocus
# - turnCount
# - checkpoints
# - violations
```

## Métricas de Sucesso

✅ Sessão criada com sucesso
✅ Contexto atualizado automaticamente
✅ Violações detectadas
✅ Checkpoints salvos
✅ Sessão retomada com contexto completo
✅ Métricas finais calculadas

## Próximos Passos

1. Testar em projeto real
2. Verificar integração com GitHub Copilot
3. Validar persistência entre sessões
4. Testar cleanup de sessões antigas
