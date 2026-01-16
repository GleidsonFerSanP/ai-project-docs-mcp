# Guia de Portabilidade - MCP Project Docs

## Problema Resolvido

✅ **MCP agora funciona em qualquer máquina sem modificar paths!**

## 🔧 Configuração Portátil

### 1. Variáveis de Ambiente Suportadas

O `mcp-config.json` agora suporta variáveis de ambiente:

```json
{
  "version": "1.2.0",
  "workspaceRoots": [
    "${HOME}/workspace",
    "${HOME}/projects", 
    "${HOME}/dev"
  ]
}
```

**Variáveis disponíveis:**
* `${HOME}` - Home directory do usuário
* `${USER}` - Nome do usuário
* `${PWD}` - Diretório atual
* Qualquer variável de ambiente do sistema

### 2. Configuração por Máquina

#### Máquina 1 (macOS/Linux)

```json
{
  "workspaceRoots": [
    "${HOME}/workspace",
    "${HOME}/Documents/projects"
  ]
}
```

#### Máquina 2 (Windows)

```json
{
  "workspaceRoots": [
    "${USERPROFILE}/workspace",
    "${USERPROFILE}/Documents/projects"
  ]
}
```

#### Máquina 3 (Servidor)

```json
{
  "workspaceRoots": [
    "/var/www/projects",
    "/opt/workspace"
  ]
}
```

## 📁 Como o MCP Detecta Projetos

### 1. Paths Relativos no Config

```json
{
  "projects": {
    "jarvis": {
      "paths": [
        "jarvis",           // ← Procura em: ${HOME}/workspace/jarvis
        "jarvis-backend",   // ← Procura em: ${HOME}/workspace/jarvis-backend
        "JARVIS"            // ← Case-insensitive
      ]
    }
  }
}
```

### 2. Sistema de Busca

Quando você usa uma tool do MCP com um arquivo:

```
Arquivo: /Users/user/workspace/jarvis-backend/src/handler.js
                                ^^^^^^^^^^^^^^
                                
1. MCP extrai "jarvis-backend" do path
2. Busca no config qual projeto tem path="jarvis-backend"
3. Encontra: projeto "jarvis"
4. Usa knowledge/jarvis/ para salvar dados
```

## 🚀 Setup em Nova Máquina

### Passo 1: Clone o Repositório

```bash
# Máquina 1
cd ~/workspace/AI
git clone <repo> jarvis-docs-mcp

# Máquina 2
cd ~/projects/tools
git clone <repo> jarvis-docs-mcp
```

### Passo 2: Configure Workspace Roots (Opcional)

Edite `mcp-config.json` :

```json
{
  "workspaceRoots": [
    "${HOME}/workspace",     // ← Ajuste para sua estrutura
    "${HOME}/projects"
  ]
}
```

### Passo 3: Build

```bash
cd jarvis-docs-mcp
npm install
npm run build
```

### Passo 4: Configure VS Code MCP

Edite `.vscode/mcp.json` ou `~/Library/Application Support/Code/User/globalStorage/...` :

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

**Ou use path absoluto da máquina:**

```json
{
  "args": [
    "/Users/seuuser/workspace/AI/jarvis-docs-mcp/dist/index.js"
  ]
}
```

## 🔍 Verificação de Problemas

### Erro: "ENOENT: no such file or directory"

```
Error: .../knowledge/educate/educate/features.json
                              ^^^^^^^ duplicado!
```

**Causa:** Bug de path duplicado (já corrigido na v2.3.0)

**Solução:**

```bash
npm run build  # Recompilar com correção
```

### Erro: "Projeto não encontrado"

```json
{
  "error": "Projeto 'meu-projeto' não encontrado"
}
```

**Causa:** Projeto não configurado no `mcp-config.json`

**Solução:**

1. Adicione no `mcp-config.json`:

```json
{
  "projects": {
    "meu-projeto": {
      "name": "Meu Projeto",
      "description": "...",
      "paths": ["meu-projeto", "meu-projeto-api"],
      "stack": {...},
      "principles": [...]
    }
  }
}
```

2. Ou use `create_project` tool:

```typescript
create_project({
  project_id: "meu-projeto",
  name: "Meu Projeto",
  // ...
})
```

## 🌍 Compartilhamento entre Máquinas

### Opção 1: Git (Recomendado)

```bash
# Máquina 1
git add knowledge/ docs/ mcp-config.json
git commit -m "Atualizar knowledge base"
git push

# Máquina 2
git pull
npm run build
```

### Opção 2: Sync Automático (Dropbox, OneDrive, etc)

```bash
# Symlinking
ln -s ~/Dropbox/jarvis-docs-mcp/knowledge ./knowledge
ln -s ~/Dropbox/jarvis-docs-mcp/docs ./docs
```

### Opção 3: Servidor Central (Futuro)

```json
{
  "remoteKnowledge": {
    "enabled": true,
    "url": "https://api.meuservidor.com/knowledge",
    "sync": "auto"
  }
}
```

## 📝 Checklist de Portabilidade

* [ ] `mcp-config.json` usa variáveis de ambiente (`${HOME}`)
* [ ] Paths são relativos (sem `/Users/seuuser/...`)
* [ ] `.vscode/mcp.json` configurado para sua máquina
* [ ] Build executado (`npm run build`)
* [ ] MCP Server reiniciado no VS Code
* [ ] Teste criando uma feature em projeto de teste

## 🎯 Resultado Final

**Antes:**

```
❌ Paths hardcoded: /Users/gleidson/workspace/...
❌ Não funciona em outras máquinas
❌ Precisa editar código para cada máquina
```

**Agora:**

```
✅ Variáveis de ambiente: ${HOME}/workspace/...
✅ Funciona em qualquer máquina
✅ Apenas configurar mcp.json uma vez
✅ Knowledge base compartilhável via Git
```

## 🐛 Bug Corrigido: Path Duplicado

**Antes (v2.2.0):**

```typescript
// Bug: path era duplicado
/knowledge/educate/educate/features.json
                    ^^^^^^^ duplicação
```

**Depois (v2.3.0):**

```typescript
// ✅ Correto
/knowledge/educate/features.json
```

**Fix aplicado em:**
* `src/index.ts` - getProjectContext()
* `src/knowledge-base.ts` - constructor()

---

**🎉 MCP Project Docs agora é totalmente portátil e compartilhável!**
