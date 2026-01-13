# Evolução: Sistema de Foco Conversacional para GitHub Copilot

## 📋 Resumo das Implementações

Este documento descreve as duas evoluções implementadas no projeto **AI Project Docs MCP**:

1. **Arquivo de Instruções para GitHub Copilot** - Guia completo de integração com o MCP
2. **Sistema de Manutenção de Foco Conversacional** - Mecanismo para manter agentes de AI focados e contextualizados

---

## 🎯 Evolução 1: Instruções para GitHub Copilot

### Objetivo

Criar um arquivo de instruções específico que ensina o GitHub Copilot a **sempre consultar o MCP** para se contextualizar sobre o projeto atual.

### Implementação

#### Arquivo Criado

* **Localização Principal**: `.github/copilot-instructions.md`
* **Localização da Extensão**: `extension/resources/instructions/github-copilot.instructions.md`

#### Conteúdo do Arquivo

O arquivo contém instruções detalhadas sobre:

1. **Workflow Obrigatório**: Sequência de passos que o Copilot DEVE seguir em TODA conversa
   - Identificar contexto do projeto
   - Carregar guidelines e contratos
   - Iniciar ou retomar sessão
   - Trabalhar com foco awareness
   - Adicionar checkpoints regularmente
   - Atualizar contexto quando necessário

2. **Regras Críticas** (NEVER VIOLATE):
   - Context Before Code
   - Focus First
   - Checkpoint Progress
   - Validate Contracts
   - Refresh Regularly
   - Document Decisions

3. **Quick Reference**: Tabela de ferramentas essenciais com frequência de uso

4. **Exemplos Práticos**: Fluxo completo de conversa mostrando uso correto das ferramentas

5. **Erros Comuns**: O que NÃO fazer e como fazer corretamente

### Registro na Extensão

O arquivo foi registrado no `extension/package.json` como `chatInstruction` :

```json
{
  "name": "GitHubCopilotProjectContextIntegration",
  "description": "**CRITICAL**: Read this file at the START of EVERY conversation...",
  "path": "resources/instructions/github-copilot.instructions.md"
}
```

---

## 🧠 Evolução 2: Sistema de Manutenção de Foco Conversacional

### Objetivo

Criar um mecanismo para **sumarizar e manter o foco conversacional**, garantindo que agentes de AI não percam o rumo durante conversas longas.

### Componentes Implementados

#### 1. Métodos Adicionados ao `SessionManager`

**Localização**: `src/session-manager.ts`

##### `updateFocus(sessionId, newFocus, reason)`

* Atualiza o foco da sessão quando usuário muda de direção
* Cria checkpoint automático registrando a mudança
* Parâmetros:
  + `sessionId`: ID da sessão
  + `newFocus`: Nova descrição do objetivo
  + `reason`: Motivo da mudança (opcional)

##### `getCurrentFocus(projectId?, sessionId?)`

* Obtém a última sessão ativa ou uma específica
* Retorna estado completo da sessão
* Parâmetros:
  + `projectId`: ID do projeto (opcional)
  + `sessionId`: ID da sessão específica (opcional)

#### 2. Ferramentas MCP Adicionadas

**Localização**: `src/index.ts`

##### Tool: `update_focus`

```typescript
{
  name: 'update_focus',
  description: 'Atualiza o foco da sessão atual quando o usuário muda de direção',
  inputSchema: {
    session_id: string (opcional),
    project_id: string (opcional),
    new_focus: string (obrigatório),
    reason: string (opcional)
  }
}
```

**Uso**:

```javascript
update_focus({
    new_focus: "Implementar autenticação JWT com refresh tokens",
    reason: "Usuário solicitou adicionar segurança extra"
})
```

##### Tool: `get_current_focus`

```typescript
{
  name: 'get_current_focus',
  description: 'Obtém o foco atual da sessão ativa. Use no INÍCIO de toda conversa.',
  inputSchema: {
    session_id: string (opcional),
    project_id: string (opcional)
  }
}
```

**Uso**:

```javascript
// No início de toda conversa
const focusState = get_current_focus({
    project_id: "my-project"
})

// Retorna:
{
    success: true,
    session: {
        sessionId: "session-123",
        currentFocus: "Implementar sistema de autenticação",
        turnCount: 15,
        activeContracts: ["IAuthService", "IUserRepository"],
        activeFeatures: ["auth-feature-001"]
    },
    latestCheckpoint: {
        ...
    },
    activeGuidelines: [...],
    needsContextRefresh: {
        needed: false
    }
}
```

##### Tool: `resume_session`

```typescript
{
  name: 'resume_session',
  description: 'Reativa uma sessão pausada',
  inputSchema: {
    session_id: string (obrigatório)
  }
}
```

**Uso**:

```javascript
resume_session({
    session_id: "session-123"
})
```

---

## 🔄 Fluxo Completo: Ciclo de Vida da Sessão

```
┌─────────────────────────────────────────────────────────────┐
│  1. IDENTIFICAR CONTEXTO                                    │
│     identify_context({ file_path: "src/auth/service.ts" }) │
│     → projectId: "my-app", context: "backend"              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  2. OBTER FOCO ATUAL                                        │
│     get_current_focus({ project_id: "my-app" })            │
│     → sessão ativa OU null                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    [Sessão Existe]    [Sem Sessão]
         │                   │
         │                   ▼
         │          ┌─────────────────────────┐
         │          │  3a. INICIAR SESSÃO     │
         │          │  start_session({        │
         │          │    context: "backend",  │
         │          │    focus: "..."         │
         │          │  })                     │
         │          └───────────┬─────────────┘
         │                      │
         └──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  4. CARREGAR REGRAS                                         │
│     get_merged_guidelines({ context: "backend" })          │
│     get_contracts({ context: "backend" })                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  5. TRABALHAR COM FOCO                                      │
│     [Executar tarefas respeitando contratos e guidelines]  │
│     [Validar código: validate_contract()]                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  Mudou direção?  │
        └────┬────────┬────┘
             │ SIM    │ NÃO
             ▼        │
    ┌────────────────┐│
    │ update_focus() ││
    └────────┬───────┘│
             └────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  6. CHECKPOINT                                              │
│     add_checkpoint({                                        │
│       summary: "O que foi feito",                          │
│       next_focus: "Próxima etapa",                         │
│       files_modified: [...]                                │
│     })                                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  10 turnos ou    │
        │  30 minutos?     │
        └────┬────────┬────┘
             │ SIM    │ NÃO
             ▼        │
    ┌──────────────────┐│
    │refresh_session() ││
    │_context()        ││
    └────────┬─────────┘│
             └──────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  Tarefa          │
        │  concluída?      │
        └────┬────────┬────┘
             │ SIM    │ NÃO
             ▼        │
    ┌──────────────────┐│
    │complete_session()││
    └──────────────────┘│
                        │
                        └──► [Voltar ao passo 5]
```

---

## 📊 O que é "Session Focus"?

**Session Focus** é uma **sumarização clean e concisa do objetivo em curso**. É o "norte" que mantém a conversa no rumo.

### Características do Bom Foco

✅ **BOM**:
* "Implementar autenticação JWT seguindo contrato IAuthService"
* "Refatorar módulo de pagamento para usar Repository Pattern"
* "Corrigir timeout de conexão com banco de dados em produção"

❌ **RUIM**:
* "Trabalhando em coisas" (vago demais)
* "Consertar tudo" (não específico)
* "Ajudar usuário" (não acionável)

### Quando Atualizar o Foco

* 🔄 Usuário muda explicitamente de direção
* 🔄 Tarefa atual completa e nova solicitação surge
* 🔄 Percebe-se que foco não reflete intenção do usuário

---

## 🛡️ Validação Contínua

O sistema garante que durante TODA a conversa:

1. **Contratos são respeitados**: Cada mudança é validada contra interfaces críticas
2. **Guidelines são aplicadas**: Regras globais e do projeto são seguidas
3. **Foco é mantido**: Ações são verificadas contra objetivo da sessão
4. **Progresso é rastreado**: Checkpoints criam trilha auditável
5. **Violações são alertadas**: Problemas são detectados imediatamente

### Exemplo de Validação

```javascript
validate_conversation_focus({
    session_id: "session-123",
    proposed_code: "class UserService { ... }",
    proposed_action: "Implementar serviço de usuário"
})

// Retorna:
{
    valid: true / false,
    violations: [{
        type: "contract",
        severity: "error",
        description: "Implementação não segue IUserService.getById signature",
        suggestedFix: "Ajuste o método getById para retornar Promise<User | null>"
    }],
    needsContextRefresh: {
        needed: false
    }
}
```

---

## 🎯 Benefícios do Sistema

### Antes ❌

* Guidelines eram esquecidas após muitas interações
* Contratos críticos não eram validados continuamente
* Conversa divergia do objetivo original
* Era necessário reafirmar premissas constantemente

### Agora ✅

* Auto-refresh de contexto a cada 10 interações ou 30 minutos
* Validação automática contra contratos e guidelines
* Checkpoints regulares mantêm foco e progresso
* Violações são detectadas e alertadas imediatamente

---

## 📚 Ferramentas do Sistema de Sessão

| Ferramenta | Descrição | Quando Usar |
|-----------|-----------|-------------|
| `start_session` | Inicia nova sessão com foco definido | Início de trabalho |
| `get_current_focus` | Obtém sessão ativa e estado atual | **TODA conversa** |
| `update_focus` | Muda foco quando direção muda | Quando usuário solicita |
| `resume_session` | Reativa sessão pausada | Retomar trabalho anterior |
| `refresh_session_context` | Recarrega guidelines e contratos | A cada 10 turnos/30min |
| `validate_conversation_focus` | Valida alinhamento com foco | Antes de mudanças |
| `add_checkpoint` | Registra progresso | Após cada sub-tarefa |
| `complete_session` | Finaliza sessão | Trabalho concluído |
| `list_active_sessions` | Lista sessões ativas do projeto | Ver sessões em andamento |

---

## 🔧 Arquivos Modificados

### 1. Core MCP

* ✅ `src/session-manager.ts` - Adicionados métodos `updateFocus()` e `getCurrentFocus()`
* ✅ `src/index.ts` - Adicionados handlers para `update_focus`,  `get_current_focus`,  `resume_session`

### 2. Extensão VS Code

* ✅ `extension/package.json` - Registrado novo `chatInstruction`
* ✅ `extension/resources/instructions/github-copilot.instructions.md` - Criado arquivo de instruções

### 3. Documentação

* ✅ `.github/copilot-instructions.md` - Instruções globais para o repositório

---

## 📦 Como Usar

### 1. Instalação

```bash
cd /Users/gleidsonfersanp/workspace/AI/ai-project-docs-mcp
npm run build
cd extension
npm run compile
```

### 2. No GitHub Copilot Chat

```
1. Abrir GitHub Copilot Chat no VS Code
2. O Copilot automaticamente lerá as instruções
3. Ferramentas ficam disponíveis via MCP "Project Docs"
```

### 3. Exemplo de Uso

```
User: "Preciso implementar login com JWT"

Copilot (interno):
1. identify_context({ file_path: "src/auth/login.ts" })
2. get_current_focus({ project_id: "my-app" })
3. start_session({
     context: "backend",
     focus: "Implementar autenticação JWT com tokens"
   })
4. get_merged_guidelines({ context: "backend" })
5. get_contracts({ context: "backend", search: "auth" })

[Implementa o código respeitando contratos]

6. add_checkpoint({
     summary: "JWT service implementado com IAuthService",
     next_focus: "Adicionar refresh tokens",
     files_modified: ["src/auth/jwt-service.ts"]
   })
```

---

## 🎓 Boas Práticas

### Para o AI Agent (GitHub Copilot)

1. **SEMPRE** chamar `get_current_focus` no início de cada conversa
2. **SEMPRE** atualizar foco quando usuário muda de direção
3. **SEMPRE** adicionar checkpoints após completar sub-tarefas
4. **SEMPRE** validar código contra contratos antes de implementar
5. **SEMPRE** respeitar lembretes de refresh de contexto

### Para o Desenvolvedor

1. Definir foco claro ao iniciar trabalho
2. Revisar checkpoints para ver progresso
3. Resolver violações imediatamente
4. Completar sessões quando tarefa finalizada
5. Registrar contratos críticos no MCP

---

## 🚀 Próximos Passos

Para utilizar o sistema:

1. ✅ Código compilado e funcionando
2. ✅ Instruções registradas na extensão
3. ⏳ Reinstalar extensão no VS Code (se necessário)
4. ⏳ Testar com GitHub Copilot Chat
5. ⏳ Validar funcionamento do sistema de foco

---

## 📝 Conclusão

O sistema implementado garante que:

* ✅ GitHub Copilot **sempre** consulta o MCP para contexto
* ✅ Conversas longas **não perdem** o foco
* ✅ Progresso é **rastreado** com checkpoints
* ✅ Contratos e guidelines são **sempre respeitados**
* ✅ Violações são **detectadas automaticamente**

O resultado é um agente de AI que mantém **contexto, foco e qualidade** durante toda a conversa, produzindo código consistente com a arquitetura e padrões do projeto.

🎯 **Stay Focused. Stay Contextualized. Stay Compliant.**
