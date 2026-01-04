# Configuração para Múltiplos Vendors

Este MCP funciona com qualquer vendor que suporte Model Context Protocol.

## GitHub Copilot (VS Code)

**Arquivo:** VS Code `settings.json`

**Localização:**
* Mac: `~/Library/Application Support/Code/User/settings.json`
* Windows: `%APPDATA%\Code\User\settings.json`
* Linux: `~/.config/Code/User/settings.json`

**Configuração:**

```json
{
  "github.copilot.advanced": {
    "mcp": {
      "servers": {
        "jarvis-docs": {
          "command": "node",
          "args": [
            "/caminho/absoluto/para/jarvis-docs-mcp/dist/index.js"
          ]
        }
      }
    }
  }
}
```

---

## Claude Desktop

**Arquivo:** `claude_desktop_config.json`

**Localização:**
* Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
* Windows: `%APPDATA%\Claude\claude_desktop_config.json`
* Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuração:**

```json
{
  "mcpServers": {
    "jarvis-docs": {
      "command": "node",
      "args": [
        "/caminho/absoluto/para/jarvis-docs-mcp/dist/index.js"
      ]
    }
  }
}
```

---

## Cline (VS Code Extension)

**Arquivo:** VS Code `settings.json`

**Configuração:**

```json
{
  "cline.mcpServers": {
    "jarvis-docs": {
      "command": "node",
      "args": [
        "/caminho/absoluto/para/jarvis-docs-mcp/dist/index.js"
      ]
    }
  }
}
```

---

## Continue.dev

**Arquivo:** `config.json` do Continue

**Localização:**
* Mac/Linux: `~/.continue/config.json`
* Windows: `%USERPROFILE%\.continue\config.json`

**Configuração:**

```json
{
  "mcpServers": [
    {
      "name": "jarvis-docs",
      "command": "node",
      "args": [
        "/caminho/absoluto/para/jarvis-docs-mcp/dist/index.js"
      ]
    }
  ]
}
```

---

## Configuração Genérica (MCP Client)

Para qualquer cliente MCP:

```json
{
  "name": "jarvis-docs",
  "command": "node",
  "args": ["/caminho/completo/jarvis-docs-mcp/dist/index.js"],
  "env": {}
}
```

---

## Variáveis de Ambiente (Opcional)

Se precisar configurar caminhos via env vars:

```bash
# .env ou environment do sistema
JARVIS_DOCS_PATH=/caminho/do/projeto/jarvis
JARVIS_BACKEND_PATH=/caminho/do/backend
JARVIS_FRONTEND_PATH=/caminho/do/frontend
```

Então na configuração:

```json
{
  "command": "node",
  "args": ["/caminho/mcp/dist/index.js"],
  "env": {
    "JARVIS_DOCS_PATH": "/caminho/do/projeto",
    "JARVIS_BACKEND_PATH": "/caminho/backend",
    "JARVIS_FRONTEND_PATH": "/caminho/frontend"
  }
}
```

---

## Testando Configuração

### 1. Verificar se MCP está rodando

Após configurar e reiniciar o editor/app, teste:

```
"Liste os recursos disponíveis do MCP"
```

Você deve ver:
* project-overview
* backend-guidelines
* frontend-guidelines
* documentation-rules

### 2. Testar contexto

```
"Identifique o contexto deste arquivo"
```

Deve retornar backend ou frontend.

### 3. Testar contratos

```
"Liste contratos registrados"
```

Deve funcionar (mesmo se vazio inicialmente).

---

## Troubleshooting

### MCP não aparece

1. **Verificar caminho:** Deve ser absoluto
2. **Verificar build:** `ls /caminho/mcp/dist/index.js`
3. **Reiniciar completamente** o editor/app
4. **Verificar logs:** Cada vendor tem local de logs diferente

### Comandos não funcionam

1. Verificar se MCP está ativo: `"Liste recursos do MCP"`
2. Ver errors do vendor
3. Rebuild MCP: `npm run build`

### Performance lenta

1. Reduzir tamanho de docs se muito grandes
2. Usar `scan_project` apenas quando necessário
3. Limitar resultados de busca

---

## Melhores Práticas

### ✅ FAÇA

* Use caminho absoluto sempre
* Mantenha MCP atualizado (rebuild após mudanças)
* Teste após configuração
* Use ambiente de desenvolvimento primeiro

### ❌ NÃO FAÇA

* Caminhos relativos
* Esquecer de rebuild
* Múltiplas instâncias com mesmo nome
* Modificar arquivos em `knowledge/` manualmente

---

## Múltiplos Projetos

Se trabalha em vários projetos, crie MCPs separados:

```json
{
  "mcpServers": {
    "jarvis-docs": {
      "command": "node",
      "args": ["/projetos/jarvis/mcp/dist/index.js"]
    },
    "outro-projeto-docs": {
      "command": "node",
      "args": ["/projetos/outro/mcp/dist/index.js"]
    }
  }
}
```

---

## Compartilhando Configuração

### Em Equipe

Adicione ao README do projeto:

```markdown

## Setup MCP

1. Clone o MCP:
   ```bash
   git clone [repo-mcp]
   cd jarvis-docs-mcp
   npm install && npm run build
   ```

2. Configure seu editor seguindo: [CONFIGURACAO.md]

```

### Via Package

Publique como package npm:

```bash
npm publish jarvis-docs-mcp
```

Então:

```json
{
  "command": "npx",
  "args": ["jarvis-docs-mcp"]
}
```

---

**Dúvidas?** Consulte documentação do seu vendor específico sobre MCP support.
