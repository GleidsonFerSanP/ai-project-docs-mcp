# Prompt: Tornar MCP Opcional em Extensões VS Code

> Prompt reutilizável para aplicar em projetos de extensões VS Code que usam MCP

## Contexto

Tenho uma extensão VS Code que usa MCP (Model Context Protocol) para fornecer ferramentas de contexto para AI assistants. O problema é que algumas empresas bloqueiam MCP por políticas de segurança, fazendo com que a extensão falhe completamente ao ativar.

**Objetivo**: Tornar o MCP opcional, permitindo que a extensão funcione mesmo quando MCP está bloqueado, mantendo as funcionalidades que não dependem diretamente do servidor MCP (como comandos que abrem o Copilot Chat com prompts).

## O que precisa ser feito

### 1. Identificar o ponto de registro do MCP

Localize no arquivo de ativação da extensão ( `extension.ts` ou similar) onde o MCP é registrado. Geralmente é algo como:

```typescript
vscode.lm.registerMcpServerDefinitionProvider('nome-extensao', {
    provideMcpServerDefinitions() {
        return [new vscode.McpStdioServerDefinition(...)];
    }
});
```

### 2. Envolver em try-catch com verificação de API

Transformar o registro do MCP em:

```typescript
let mcpAvailable = false;

// Verificar se usuário desabilitou MCP explicitamente
const config = vscode.workspace.getConfiguration('suaExtensao');
const mcpDisabled = config.get<boolean>('disableMCP', false);

if (mcpDisabled) {
    log('MCP desabilitado via configuração');
} else {
    try {
        // Verificar se API MCP existe
        if (typeof vscode.lm?.registerMcpServerDefinitionProvider === 'function') {
            context.subscriptions.push(
                vscode.lm.registerMcpServerDefinitionProvider('nome', {...})
            );
            mcpAvailable = true;
        } else {
            log('API MCP não disponível nesta versão do VS Code');
        }
    } catch (error) {
        log(`Registro MCP falhou (pode estar bloqueado): ${error}`);
        log('Extensão continuará funcionando sem MCP');
    }
}
```

### 3. Tornar comandos relacionados a MCP graceful

Comandos que dependem do MCP devem verificar `mcpAvailable` e oferecer alternativas:

```typescript
vscode.commands.registerCommand('extensao.configMCP', () => {
    if (!mcpAvailable) {
        vscode.window.showWarningMessage(
            'MCP não está disponível. Funcionalidade X ainda funciona normalmente.',
            'Usar Funcionalidade X'
        ).then(selection => {
            if (selection) {
                vscode.commands.executeCommand('extensao.funcionalidadeX');
            }
        });
        return;
    }
    // Código normal do comando...
});
```

### 4. Adicionar configuração para desabilitar MCP

No `package.json` , adicionar:

```json
"configuration": {
    "properties": {
        "suaExtensao.disableMCP": {
            "type": "boolean",
            "default": false,
            "description": "Desabilitar registro do servidor MCP (para ambientes restritos)"
        }
    }
}
```

### 5. Atualizar CHANGELOG

Documentar a mudança com nova versão.

## Regras importantes

1. **Nunca deixar a extensão falhar** - Se MCP falhar, extensão continua
2. **Log informativo** - Sempre logar quando MCP falha e o motivo
3. **Funcionalidades alternativas** - Se uma funcionalidade precisa de MCP, ofereça alternativa ou informe claramente
4. **Configuração explícita** - Permitir que usuários/empresas desabilitem MCP via settings

## Exemplo de resultado esperado

### Cenário: MCP disponível

```
Extensão ativa → Registra MCP ✓ → Todas funcionalidades funcionam
```

### Cenário: MCP bloqueado

```
Extensão ativa → Try-catch captura falha → Log warning → Extensão continua → Funcionalidades independentes funcionam
```

### Cenário: Usuário desabilita MCP

```
disableMCP = true → MCP nem tenta registrar → Extensão funciona standalone
```

## Analise meu projeto e implemente

Por favor:
1. Localize onde o MCP é registrado na extensão
2. Aplique o padrão acima para torná-lo opcional
3. Atualize comandos relacionados para serem graceful
4. Adicione a configuração `disableMCP` ao package.json
5. Atualize o CHANGELOG com a nova versão
6. Compile e verifique se não há erros

---

## Referência: Implementação no ai-project-docs-mcp

Esta abordagem foi implementada na extensão AI Project Context v1.6.6.

**Arquivos modificados:**
* `extension/src/extension.ts` - MCP opcional com try-catch
* `extension/package.json` - Config `disableMCP`

**Commit de referência:** Verificar histórico do repositório ai-project-docs-mcp

---

*Prompt criado em: 2026-02-16*
