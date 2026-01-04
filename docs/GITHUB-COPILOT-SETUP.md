# Configuração do GitHub Copilot MCP

## Problema Comum

Se você está vendo as instruções na documentação mas não consegue usar `@project-docs` no GitHub Copilot Chat, é porque o MCP server não está configurado corretamente.

## Entendendo o GitHub Copilot MCP

O GitHub Copilot usa um arquivo específico para gerenciar servidores MCP:

**Localização do arquivo de configuração:**
* **macOS**: `~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/mcpServers.json`
* **Linux**: `~/.config/Code/User/globalStorage/github.copilot-chat/mcpServers.json`
* **Windows**: `%APPDATA%\Code\User\globalStorage\github.copilot-chat\mcpServers.json`

## Solução Rápida

### Usar a Extensão (Automático)

1. **Instale a extensão** do VS Code Marketplace ou arquivo `.vsix`
2. **Recarregue o VS Code**: `Ctrl/Cmd + Shift + P` → `Developer: Reload Window`
3. **Pronto!** O MCP "Project Docs" aparece automaticamente no botão de MCPs do Copilot Chat

A extensão v1.2.0+ usa a API oficial do VS Code e registra o MCP automaticamente - não precisa de configuração manual!

### Opção 2: Configuração Manual

1. Abra o arquivo de configuração:

```bash
# macOS
code ~/Library/Application\ Support/Code/User/globalStorage/github.copilot-chat/mcpServers.json

# Linux
code ~/.config/Code/User/globalStorage/github.copilot-chat/mcpServers.json

# Windows
code %APPDATA%\Code\User\globalStorage\github.copilot-chat\mcpServers.json
```

2. Adicione a configuração do `project-docs`:

```json
{
    "mcpServers": {
        "project-docs": {
            "command": "node",
            "args": [
                "/caminho/completo/para/ai-project-docs-mcp/extension/mcp-server/index.js"
            ],
            "disabled": false,
            "alwaysAllow": [
                "create_project",
                "list_projects",
                "get_project_info",
                "switch_project",
                "identify_context",
                "get_guidelines",
                "should_document",
                "register_contract",
                "get_contracts",
                "validate_contract",
                "learn_pattern",
                "scan_project",
                "add_decision",
                "register_feature",
                "get_features",
                "update_feature",
                "get_feature_context"
            ]
        }
    }
}
```

3. **Importante**: Substitua `/caminho/completo/para/ai-project-docs-mcp/` pelo caminho real onde você clonou o projeto ou onde a extensão está instalada.

4. Recarregue o VS Code: `Ctrl/Cmd + Shift + P` → `Developer: Reload Window`

## Verificando se está funcionando

1. **Abra o GitHub Copilot Chat**
2. **Procure pelo botão de MCPs** (geralmente um ícone de plugin ou engrenagem)
3. **Você deve ver "project-docs" na lista**
4. **Habilite-o** se estiver desabilitado
5. **Teste**: Digite `@project-docs list_projects` no chat

## Formato da Configuração

O GitHub Copilot usa um formato específico:

```json
{
    "mcpServers": {
        "nome-do-server": {
            "command": "executável",
            "args": ["argumentos"],
            "disabled": false,
            "alwaysAllow": ["lista", "de", "ferramentas", "permitidas"]
        }
    }
}
```

**Campos importantes:**
* `command`: Executável para rodar o servidor (ex: `node`,   `python`,   `deno`)
* `args`: Array com o caminho do servidor e argumentos
* `disabled`: Se `true`, o MCP não será carregado
* `alwaysAllow`: Lista de tools que não precisam de confirmação

## Como Usar Após Configurado

### Comandos Disponíveis

```
@project-docs list_projects
@project-docs create_project {"project_id": "meu-app", "name": "Meu App"}
@project-docs get_project_info {"project_id": "meu-app"}
@project-docs register_contract {...}
@project-docs learn_pattern {...}
```

### Exemplo Completo

```
@project-docs create_project {
  "project_id": "my-app",
  "name": "My Application",
  "description": "Full-stack application",
  "paths": ["${HOME}/projects/my-app"],
  "stack": {
    "backend": "NestJS",
    "frontend": "React",
    "database": "PostgreSQL"
  },
  "principles": ["SOLID", "Clean Architecture"]
}
```

## Troubleshooting

### O MCP não aparece na lista

1. **Verifique o arquivo de configuração** existe
2. **Confirme que o caminho** do servidor está correto
3. **Recarregue o VS Code** completamente
4. **Verifique os logs** do GitHub Copilot: `Help` → `Toggle Developer Tools` → `Console`

### Erro "command not found"

* Certifique-se de que o Node.js está instalado: `node --version`
* Use o caminho completo para o executável se necessário

### MCP desabilitado automaticamente

* Verifique se há erros no arquivo `index.js` do servidor
* Execute manualmente para ver erros: `node /caminho/para/mcp-server/index.js`

### Permissões negadas

* Adicione as ferramentas necessárias no array `alwaysAllow`
* Ou aprove manualmente quando solicitado pelo Copilot

## Diferença entre mcp.json e mcpServers.json

* **`mcp.json`**: Formato antigo/simples (não usado pelo GitHub Copilot)
* **`mcpServers.json`**: Formato atual do GitHub Copilot com controle de permissões

**A extensão agora usa o formato correto ( `mcpServers.json` )!**

## Próximos Passos

1. Configure seu projeto em `~/.project-docs-mcp/mcp-config.json`
2. Leia [AUTO-LEARNING.md](../docs/_shared/AUTO-LEARNING.md) para aprender sobre os recursos
3. Veja [MCP-CONFIG-EXAMPLES.md](../docs/_shared/MCP-CONFIG-EXAMPLES.md) para exemplos de configuração

## Suporte

Se ainda tiver problemas:
1. Abra uma issue no GitHub: https://github.com/GleidsonFerSanP/ai-project-docs-mcp/issues
2. Inclua os logs do console do VS Code
3. Anexe o conteúdo (sem dados sensíveis) do seu `mcpServers.json`
