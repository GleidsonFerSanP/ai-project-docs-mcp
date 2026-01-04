# Configuração GitHub Copilot + MCP - VS Code

## ✅ Configuração Aplicada

O MCP `project-docs` foi configurado em:

```
~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/mcpServers.json
```

## 🎯 Para Usar em TODOS os Chats

### 1. Configurar Workspace Settings (Prioridade Global)

Crie/edite `.vscode/settings.json` no seu workspace:

```json
{
  "github.copilot.chat.mcp.enabled": true,
  "github.copilot.chat.mcp.preferredServers": [
    "project-docs"
  ],
  "github.copilot.chat.useProjectContext": true,
  "github.copilot.chat.welcomeMessage": "MCP project-docs ativo! Use @ para invocar tools de documentação, contratos e padrões."
}
```

### 2. Configurar User Settings (Global)

Abra VS Code Settings (Cmd+, ) e adicione:

```json
{
  "github.copilot.chat.mcp.enabled": true,
  "github.copilot.chat.mcp.preferredServers": [
    "project-docs"
  ],
  "github.copilot.chat.mcp.autoLoad": true
}
```

Ou edite diretamente: `~/Library/Application Support/Code/User/settings.json`

## 🚀 Como Usar

### Invocar o MCP no Chat

```
@project-docs list_projects
```

### Contexto Automático

Com as configurações acima, o Copilot irá:
* ✅ Carregar o MCP automaticamente
* ✅ Priorizar as ferramentas do `project-docs`
* ✅ Sugerir uso dos tools quando relevante
* ✅ Incluir contexto dos seus projetos nas respostas

### Exemplos de Uso

**Identificar contexto do arquivo atual:**

```
@project-docs identifique o contexto deste arquivo
```

**Buscar contratos:**

```
@project-docs liste todos os contratos do backend
```

**Validar código:**

```
@project-docs valide se esta implementação respeita o contrato ISolutionAdapter
```

**Criar novo projeto:**

```
@project-docs crie um novo projeto chamado "minha-api" com FastAPI
```

## 🔄 Reiniciar VS Code

Após configurar:
1. Feche completamente o VS Code (Cmd+Q)
2. Reabra o VS Code
3. Abra o Copilot Chat
4. Digite `@` e veja se `project-docs` aparece

## 🐛 Troubleshooting

### MCP não aparece no @

**Verificar:**

```bash
# Ver se o arquivo existe
cat ~/Library/Application\ Support/Code/User/globalStorage/github.copilot-chat/mcpServers.json

# Testar manualmente
node /Users/gleidsonfersanp/workspace/AI/jarvis-docs-mcp/dist/index.js
```

### Ver logs do MCP

**Abrir Output no VS Code:**
1. View → Output (Cmd+Shift+U)
2. Selecionar "GitHub Copilot Chat" no dropdown
3. Procurar por mensagens do MCP

### Recarregar Configurações

```
Cmd+Shift+P → "Developer: Reload Window"
```

## 📋 Comandos Úteis

**Listar MCPs disponíveis:**

```
Cmd+Shift+P → "MCP: List Servers"
```

**Ver status do MCP:**

```
Cmd+Shift+P → "MCP: Show Server Status"
```

**Recarregar MCP:**

```
Cmd+Shift+P → "MCP: Restart Server"
```

---

**Status:** ✅ Configurado para prioridade global
**Servidor:** project-docs
**Tools:** 13 disponíveis
**Auto-load:** Habilitado
