# Exemplos de Configuração MCP para Diferentes Sistemas

## macOS / Linux

```json
{
  "servers": {
    "project-docs": {
      "command": "node",
      "args": [
        "${HOME}/workspace/AI/jarvis-docs-mcp/dist/index.js"
      ]
    }
  }
}
```

**Ou com path absoluto:**

```json
{
  "servers": {
    "project-docs": {
      "command": "node",
      "args": [
        "/Users/seuuser/workspace/AI/jarvis-docs-mcp/dist/index.js"
      ]
    }
  }
}
```

## Windows

```json
{
  "servers": {
    "project-docs": {
      "command": "node",
      "args": [
        "%USERPROFILE%\\workspace\\AI\\jarvis-docs-mcp\\dist\\index.js"
      ]
    }
  }
}
```

**Ou:**

```json
{
  "servers": {
    "project-docs": {
      "command": "node",
      "args": [
        "C:\\Users\\SeuUser\\workspace\\AI\\jarvis-docs-mcp\\dist\\index.js"
      ]
    }
  }
}
```

## Docker / Container

```json
{
  "servers": {
    "project-docs": {
      "command": "node",
      "args": [
        "/app/jarvis-docs-mcp/dist/index.js"
      ]
    }
  }
}
```

## WSL (Windows Subsystem for Linux)

```json
{
  "servers": {
    "project-docs": {
      "command": "node",
      "args": [
        "/home/seuuser/workspace/AI/jarvis-docs-mcp/dist/index.js"
      ]
    }
  }
}
```

## Configuração Global vs Local

### Global (Todo VS Code)

**macOS:**

```
~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/mcp.json
```

**Linux:**

```
~/.config/Code/User/globalStorage/github.copilot-chat/mcp.json
```

**Windows:**

```
%APPDATA%\Code\User\globalStorage\github.copilot-chat\mcp.json
```

### Local (Apenas Workspace)

```
<seu-projeto>/.vscode/mcp.json
```

## Dicas de Portabilidade

### 1. Use Variáveis de Ambiente

```json
{
  "args": [
    "${HOME}/workspace/AI/jarvis-docs-mcp/dist/index.js"
  ]
}
```

### 2. Path Relativo ao Workspace

Se o MCP está no mesmo repositório:

```json
{
  "args": [
    "${workspaceFolder}/tools/jarvis-docs-mcp/dist/index.js"
  ]
}
```

### 3. Symlink Global (Avançado)

```bash
# Criar link global
sudo npm link

# Usar diretamente
{
  "command": "project-docs-mcp"
}
```

## Troubleshooting

### Erro: "command not found: node"

**Solução:** Especifique path completo do Node.js

```json
{
  "command": "/usr/local/bin/node",  // macOS/Linux
  "command": "C:\\Program Files\\nodejs\\node.exe"  // Windows
}
```

### Erro: "Cannot find module"

**Causa:** Path incorreto ou build não executado

**Solução:**

```bash
cd jarvis-docs-mcp
npm install
npm run build
```

### Erro: Permission denied

**Causa:** Arquivo não executável

**Solução:**

```bash
chmod +x dist/index.js
```

## Verificação

Para testar se está funcionando:

1. Abra VS Code
2. Abra GitHub Copilot Chat
3. Digite: `@project-docs list_projects`
4. Deve listar os projetos configurados

Se funcionar, a configuração está correta! ✅
