# 🚀 Guia Rápido de Teste - GitHub Copilot MCP

## ✅ O que foi corrigido

O MCP agora está **corretamente configurado** para funcionar com o GitHub Copilot Chat usando o formato `mcpServers.json` .

## 📋 Checklist de Teste

### 1. Verificar Configuração

```bash
# macOS
cat ~/Library/Application\ Support/Code/User/globalStorage/github.copilot-chat/mcpServers.json

# Linux
cat ~/.config/Code/User/globalStorage/github.copilot-chat/mcpServers.json

# Windows (PowerShell)
Get-Content "$env:APPDATA\Code\User\globalStorage\github.copilot-chat\mcpServers.json"
```

**Deve mostrar algo como:**

```json
{
    "mcpServers": {
        "project-docs": {
            "command": "node",
            "args": [
                "/Users/.../.vscode/extensions/gleidsonfersanp.project-docs-mcp-1.2.0/mcp-server/index.js"
            ],
            "disabled": false,
            "alwaysAllow": [
                "create_project",
                "list_projects",
                ...
            ]
        }
    }
}
```

✅ Se estiver assim, a configuração está correta!

### 2. Recarregar VS Code

**IMPORTANTE**: Você precisa recarregar o VS Code para que as alterações tenham efeito.

1. Pressione: `Cmd+Shift+P` (macOS) ou `Ctrl+Shift+P` (Windows/Linux)
2. Digite: `Developer: Reload Window`
3. Pressione Enter

### 3. Verificar no GitHub Copilot

1. **Abra o GitHub Copilot Chat** (ícone de chat na barra lateral)

2. **Procure pelo botão de MCPs**:
   - Pode ser um ícone de "plug" 🔌
   - Ou um ícone de "engrenagem" ⚙️
   - Geralmente fica perto da área de input do chat

3. **Clique no botão de MCPs**

4. **Você deve ver "project-docs" na lista!**

5. **Certifique-se de que está habilitado** (não deve ter um ícone de "desabilitado")

### 4. Testar Comandos

Digite no GitHub Copilot Chat:

```
@project-docs list_projects
```

**Resposta esperada:**

```json
{
  "projects": {
    "default": {
      "name": "Default Project",
      "description": "Default project configuration...",
      ...
    }
  }
}
```

### 5. Testar Criação de Projeto

```
@project-docs create_project {
  "project_id": "teste",
  "name": "Projeto de Teste",
  "description": "Apenas um teste",
  "paths": ["${HOME}/workspace/teste"],
  "stack": {
    "backend": "Node.js"
  },
  "principles": ["Clean Code"]
}
```

**Resposta esperada:**

```
✅ Projeto 'teste' criado com sucesso!
```

## 🔍 Troubleshooting

### MCP não aparece na lista

**Causa**: VS Code não recarregou ou configuração está incorreta

**Solução**:
1. Feche completamente o VS Code (Cmd+Q / Alt+F4)
2. Abra novamente
3. Execute o comando: `Configure Project Docs MCP`
4. Recarregue quando solicitado

### Erro "command not found"

**Causa**: Node.js não está no PATH ou caminho está errado

**Solução**:

```bash
# Verificar Node.js
node --version

# Se não funcionar, instale Node.js
# https://nodejs.org/
```

### MCP está desabilitado

**Causa**: Campo `disabled: true` na configuração

**Solução**:
1. Abra o arquivo `mcpServers.json`
2. Altere `"disabled": true` para `"disabled": false`
3. Recarregue o VS Code

### Erro "Module not found"

**Causa**: Caminho do `index.js` está incorreto

**Solução**:
1. Execute: `Configure Project Docs MCP`
2. Ou edite manualmente o caminho no `mcpServers.json`
3. Use o caminho completo: `/Users/.../.vscode/extensions/gleidsonfersanp.project-docs-mcp-X.X.X/mcp-server/index.js`

## 📚 Próximos Passos

### 1. Configurar Seus Projetos

Edite o arquivo de configuração:

```bash
code ~/.project-docs-mcp/mcp-config.json
```

Exemplo:

```json
{
  "version": "1.2.0",
  "defaultProject": "meu-app",
  "workspaceRoots": [
    "${HOME}/workspace",
    "${HOME}/projects"
  ],
  "projects": {
    "meu-app": {
      "name": "Meu Aplicativo",
      "description": "Aplicação full-stack",
      "paths": [
        "${HOME}/workspace/meu-app"
      ],
      "stack": {
        "backend": "NestJS",
        "frontend": "React",
        "database": "PostgreSQL"
      },
      "principles": [
        "SOLID",
        "Clean Architecture",
        "DDD"
      ]
    }
  }
}
```

### 2. Explorar Recursos

* **Contratos**: Registre interfaces críticas
* **Padrões**: Ensine padrões específicos do projeto
* **Decisões**: Documente decisões arquiteturais
* **Features**: Gerencie funcionalidades

### 3. Ler Documentação

* [GitHub Copilot Setup Guide](GITHUB-COPILOT-SETUP.md)
* [Auto-Learning System](../docs/_shared/AUTO-LEARNING.md)
* [MCP Config Examples](../docs/_shared/MCP-CONFIG-EXAMPLES.md)

## ✨ Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `@project-docs list_projects` | Lista todos os projetos |
| `@project-docs create_project {...}` | Cria novo projeto |
| `@project-docs get_project_info {...}` | Info de um projeto |
| `@project-docs register_contract {...}` | Registra contrato |
| `@project-docs get_contracts {...}` | Lista contratos |
| `@project-docs learn_pattern {...}` | Aprende novo padrão |
| `@project-docs scan_project {...}` | Escaneia código |
| `@project-docs add_decision {...}` | Adiciona decisão arquitetural |

## 🎯 Dica Pro

Para evitar ter que aprovar tools manualmente toda vez, certifique-se de que todas as tools estão no array `alwaysAllow` do `mcpServers.json` . A configuração atual já inclui todas!

---

## 📞 Precisa de Ajuda?

1. Leia: [GITHUB-COPILOT-SETUP.md](GITHUB-COPILOT-SETUP.md)
2. Veja: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
3. Abra issue: https://github.com/GleidsonFerSanP/ai-project-docs-mcp/issues
