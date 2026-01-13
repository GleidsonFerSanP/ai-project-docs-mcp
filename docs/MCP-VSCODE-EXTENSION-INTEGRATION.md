# Como MCPs Funcionam como Extensões do VS Code

## Pergunta

**Como um MCP (Model Context Protocol) server pode funcionar integrado como uma extensão do VS Code, se ele não aparece na lista de "MCP Servers Installed" do GitHub Copilot? Qual é o mecanismo técnico por trás dessa integração e como o protocolo MCP é utilizado nesse contexto?**

---

## 📡 Entendendo o Protocolo MCP

### O que é MCP (Model Context Protocol)?

O **Model Context Protocol** é um protocolo de comunicação padronizado criado pela Anthropic para permitir que agentes de IA (como Claude, GitHub Copilot, etc.) se comuniquem com "servidores de contexto" externos.

**Características principais:**
* 📨 **Protocolo JSON-RPC 2.0** - Comunicação via mensagens JSON
* 🔄 **Bidirecional** - Cliente e servidor podem enviar/receber mensagens
* 📦 **Baseado em stdio** - Usa entrada/saída padrão (stdin/stdout)
* 🛠️ **Extensível** - Suporta tools, resources e prompts customizados

### Estrutura Básica do MCP

```
┌─────────────────┐         MCP Protocol        ┌──────────────────┐
│   AI Agent      │◄──────────────────────────►│   MCP Server     │
│ (GitHub Copilot)│   JSON-RPC via stdio       │ (Node.js Process)│
└─────────────────┘                             └──────────────────┘
```

#### Fluxo de Comunicação:

1. **Inicialização**

```json
→ Cliente envia: {"jsonrpc":"2.0","method":"initialize","params":{...}}
← Servidor responde: {"jsonrpc":"2.0","result":{"capabilities":{...}}}
```

2. **Listagem de Tools**

```json
→ Cliente envia: {"jsonrpc":"2.0","method":"tools/list"}
← Servidor responde: {"result":{"tools":[{name:"...", description:"..."}]}}
```

3. **Chamada de Tool**

```json
→ Cliente envia: {"jsonrpc":"2.0","method":"tools/call","params":{"name":"get_current_focus","arguments":{...}}}
← Servidor responde: {"result":{"content":[{type:"text",text:"..."}]}}
```

### Componentes de um MCP Server

Um servidor MCP pode expor três tipos de recursos:

1. **Tools** (Ferramentas)
   - Ações que o AI pode executar
   - Exemplo: `get_current_focus` , `update_focus` , `start_session`

2. **Resources** (Recursos)
   - Dados que o AI pode acessar
   - Exemplo: Documentação, arquivos de configuração

3. **Prompts** (Prompts)
   - Templates de prompts pré-configurados
   - Exemplo: Templates para ADRs, documentação

---

## 🔧 Dois Modos de Registrar MCPs no VS Code

### Modo 1: Configuração Manual (Tradicional)

**Como funciona:**
O usuário edita manualmente o arquivo de configuração do GitHub Copilot:

**Localização do arquivo:**

```bash
# macOS
~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/mcpServers.json

# Linux
~/.config/Code/User/globalStorage/github.copilot-chat/mcpServers.json

# Windows
%APPDATA%\Code\User\globalStorage\github.copilot-chat\mcpServers.json
```

**Exemplo de configuração:**

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/server.js"]
    },
    "another-mcp": {
      "command": "python",
      "args": ["-m", "my_mcp_module"]
    }
  }
}
```

**Características:**
* ✅ Aparece na lista "MCP Servers Installed"
* ✅ Controle total sobre configuração
* ❌ Requer configuração manual
* ❌ Caminho absoluto pode quebrar ao mover pastas
* ❌ Precisa editar JSON manualmente

**Fluxo:**

```
1. Usuário edita mcpServers.json
2. VS Code detecta mudança
3. GitHub Copilot lê configuração
4. Inicia processo MCP com comando especificado
5. Estabelece comunicação via stdio
```

---

### Modo 2: Via Extensão (API Moderna) ⭐

**Como funciona:**
A extensão do VS Code registra o MCP **programaticamente** usando a API oficial.

#### Estrutura da Extensão

```
extension/
├── package.json          # Manifest da extensão
├── src/
│   └── extension.ts      # Código que registra o MCP
└── mcp-server/
    ├── index.js          # MCP Server (protocolo MCP)
    ├── session-manager.js
    └── knowledge-base.js
```

#### 1. Declaração no package.json

```json
{
  "name": "ai-project-context",
  "version": "1.4.0",
  "publisher": "GleidsonFerSanP",
  "contributes": {
    "mcpServerDefinitionProviders": [
      {
        "id": "ai-project-context",
        "label": "AI Project Context"
      }
    ]
  }
}
```

**O que isso faz:**
* Declara que a extensão **fornece** um MCP server
* `id`: Identificador único do MCP
* `label`: Nome que aparece no Copilot Chat

#### 2. Registro Programático no extension.ts

```typescript
import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    // Caminho do MCP server (relativo à extensão)
    const mcpServerPath = path.join(
        context.extensionPath, 
        'mcp-server', 
        'index.js'
    );

    // Registra o MCP Server Definition Provider
    context.subscriptions.push(
        vscode.lm.registerMcpServerDefinitionProvider('ai-project-context', {
            provideMcpServerDefinitions() {
                return [
                    new vscode.McpStdioServerDefinition(
                        'ai-project-context',  // ID do MCP
                        'node',                // Comando para executar
                        [mcpServerPath]        // Argumentos (path do server)
                    )
                ];
            }
        })
    );
}
```

**O que acontece aqui:**

1. **`vscode.lm.registerMcpServerDefinitionProvider`**
   - API oficial do VS Code para registrar MCPs
   - `lm` = Language Model API

2. **`provideMcpServerDefinitions()`**
   - Função chamada quando Copilot precisa iniciar o MCP
   - Retorna array de definições de servidor

3. **`vscode.McpStdioServerDefinition`**
   - Classe que define como iniciar o processo MCP
   - Parâmetros: (id, command, args)
   - Usa comunicação via **stdio** (entrada/saída padrão)

#### 3. Fluxo de Ativação

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Usuário instala extensão via VSIX ou Marketplace         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. VS Code lê package.json                                   │
│    • Vê "mcpServerDefinitionProviders"                       │
│    • Registra extension como provider de MCP                 │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. VS Code ativa extensão (extension.ts)                     │
│    • activate() é chamado                                    │
│    • vscode.lm.registerMcpServerDefinitionProvider() executa │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Usuário abre GitHub Copilot Chat                          │
│    • Copilot consulta MCPs disponíveis                       │
│    • Chama provideMcpServerDefinitions()                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Extensão retorna McpStdioServerDefinition                 │
│    • Comando: "node"                                         │
│    • Args: ["/path/to/extension/mcp-server/index.js"]       │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. VS Code inicia processo MCP                               │
│    • Executa: node /path/to/mcp-server/index.js             │
│    • Estabelece comunicação via stdin/stdout                 │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Handshake MCP (JSON-RPC)                                  │
│    Client → Server: {"method":"initialize"}                  │
│    Server → Client: {"result":{"capabilities":{...}}}        │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. MCP Server pronto!                                        │
│    • Tools registradas ficam disponíveis                     │
│    • Aparece como "@ai-project-context" no Copilot          │
└──────────────────────────────────────────────────────────────┘
```

**Características:**
* ✅ **Registro automático** quando extensão ativa
* ✅ **Path sempre correto** (relativo à extensão)
* ✅ **Zero configuração manual**
* ✅ **Portável** - funciona em qualquer máquina
* ✅ **Atualizável** - atualiza extensão = MCP atualizado
* ❌ **NÃO aparece** na lista "Installed" (registrado dinamicamente)

---

## 🔍 Por Que Não Aparece na Lista "Installed"?

### Lista "MCP Servers Installed"

Essa lista mostra **apenas** MCPs configurados manualmente em `mcpServers.json` .

**Analogia:**
* **Modo Manual** = Atalho na área de trabalho (você vê o arquivo)
* **Modo Extensão** = Aplicativo integrado no sistema (invisível, mas funcional)

### Onde o MCP Via Extensão "Vive"?

O MCP registrado via extensão existe em **runtime** (memória), não em arquivo de configuração:

```typescript
// Quando extensão ativa:
vscode.lm.registerMcpServerDefinitionProvider(...)
// ↓
// VS Code guarda internamente:
{
  'ai-project-context': {
    provider: function provideMcpServerDefinitions() { ... }
  }
}
```

Quando Copilot precisa do MCP:
1. Consulta providers registrados
2. Chama `provideMcpServerDefinitions()`
3. Recebe definição do servidor
4. Inicia processo

---

## 🆚 Comparação Detalhada

| Aspecto | Modo Manual | Modo Extensão |
|---------|-------------|---------------|
| **Registro** | Editar JSON manualmente | Automático via API |
| **Visibilidade** | Aparece em "Installed" ✅ | Não aparece ❌ |
| **Configuração** | Usuário precisa configurar | Zero-config ✅ |
| **Path Management** | Absoluto (pode quebrar) ⚠️ | Relativo (sempre funciona) ✅ |
| **Portabilidade** | Máquina específica | Universal ✅ |
| **Atualização** | Manual | Via update da extensão ✅ |
| **Resiliência** | Quebra se mover pasta | Nunca quebra ✅ |
| **Distribuição** | README com instruções | Marketplace (1 clique) ✅ |

---

## 🎯 Como Verificar se o MCP Está Funcionando

### 1. Via Copilot Chat (Mais Simples)

1. Abra GitHub Copilot Chat (`Cmd+Shift+I` ou `Ctrl+Shift+I`)
2. Digite `@`
3. Veja se aparece **"AI Project Context"** na lista

### 2. Via Output Logs

1. Abra Output panel: `Cmd+Shift+U` (Mac) ou `Ctrl+Shift+U` (Windows/Linux)
2. Selecione **"AI Project Context"** no dropdown
3. Veja logs de ativação:

```
[2026-01-12T21:45:00.000Z] ℹ️ AI Project Context extension is now active!
[2026-01-12T21:45:00.001Z] ℹ️ MCP Server path: /path/to/mcp-server/index.js
[2026-01-12T21:45:00.002Z] ℹ️ MCP Server file found successfully
[2026-01-12T21:45:00.003Z] ℹ️ MCP Server Definition Provider registered successfully
```

### 3. Via Developer Tools (Avançado)

1. Abra DevTools: `Help → Toggle Developer Tools`
2. No Console, execute:

```javascript
// Listar todos os providers registrados
Object.keys(vscode.lm._mcpProviders || {})
// Deve incluir 'ai-project-context'

// Ver tools disponíveis
vscode.lm.tools
// Deve listar tools como get_current_focus, update_focus, etc.
```

### 4. Testando Diretamente o MCP Server

Você pode testar o servidor MCP diretamente:

```bash
# Enviar comando JSON-RPC via stdin
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
node ~/.vscode/extensions/gleidsonfersanp.ai-project-context-1.4.0/mcp-server/index.js
```

Deve retornar JSON com lista de tools:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {"name": "start_session", "description": "..."},
      {"name": "get_current_focus", "description": "..."},
      {"name": "update_focus", "description": "..."}
    ]
  }
}
```

---

## 🏗️ Arquitetura Completa

```
┌─────────────────────────────────────────────────────────────────┐
│                        VS Code Instance                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │  GitHub Copilot Chat │      │  Extension Host      │        │
│  │                      │      │                      │        │
│  │  • UI do Chat        │      │  ┌────────────────┐ │        │
│  │  • @mentions         │◄────►│  │ AI Project     │ │        │
│  │  • Tool execution    │      │  │ Context Ext    │ │        │
│  └──────────┬───────────┘      │  │                │ │        │
│             │                  │  │ • extension.ts │ │        │
│             │                  │  │ • activate()   │ │        │
│             │                  │  └────────┬───────┘ │        │
│             │                  │           │         │        │
│             │ vscode.lm API    │           │         │        │
│             │                  │           │         │        │
│  ┌──────────▼───────────┐      │  ┌────────▼───────┐ │        │
│  │  MCP Client          │      │  │ MCP Provider   │ │        │
│  │  (Built-in VS Code)  │◄────►│  │ Registry       │ │        │
│  │                      │      │  │                │ │        │
│  │  • Initialize        │      │  │ 'ai-project-   │ │        │
│  │  • tools/list        │      │  │  context'      │ │        │
│  │  • tools/call        │      │  └────────┬───────┘ │        │
│  └──────────┬───────────┘      └───────────┼─────────┘        │
│             │                              │                   │
│             │ JSON-RPC 2.0                 │ spawn()           │
│             │ via stdio                    │                   │
└─────────────┼──────────────────────────────┼───────────────────┘
              │                              │
              │                              ▼
              │                    ┌─────────────────────┐
              │                    │  Node.js Process    │
              │                    │  (Spawned by VS Code)│
              │                    └─────────┬───────────┘
              │                              │
              ▼                              ▼
    ┌─────────────────────────────────────────────────────┐
    │           MCP Server Process                        │
    │   (mcp-server/index.js)                             │
    ├─────────────────────────────────────────────────────┤
    │                                                       │
    │  • StdioServerTransport ← stdin/stdout               │
    │  • Server (@modelcontextprotocol/sdk)                │
    │  • RequestHandlers:                                  │
    │    - ListToolsRequestSchema                          │
    │    - CallToolRequestSchema                           │
    │    - ListResourcesRequestSchema                      │
    │                                                       │
    │  • Business Logic:                                   │
    │    - SessionManager                                  │
    │    - KnowledgeBase                                   │
    │    - ProjectManager                                  │
    │                                                       │
    │  • Tools:                                            │
    │    - start_session()                                 │
    │    - get_current_focus()                             │
    │    - update_focus()                                  │
    │    - 40+ other tools                                 │
    │                                                       │
    └─────────────────────────────────────────────────────┘
```

---

## 💡 Vantagens da Abordagem via Extensão

### 1. Zero Configuração

```
Usuário: code --install-extension ai-project-context-1.4.0.vsix
VS Code: ✅ Extensão instalada!
Copilot: ✅ MCP disponível automaticamente!
```

### 2. Path Management Automático

```typescript
// Sempre funciona, não importa onde extensão está instalada
const mcpServerPath = path.join(context.extensionPath, 'mcp-server', 'index.js');
// macOS: /Users/user/.vscode/extensions/gleidsonfersanp.ai-project-context-1.4.0/mcp-server/index.js
// Windows: C:\Users\user\.vscode\extensions\gleidsonfersanp.ai-project-context-1.4.0\mcp-server\index.js
```

### 3. Versionamento

```json
// package.json
"version": "1.4.0"

// Marketplace gerencia versões automaticamente
v1.3.0 → v1.4.0 (update available)
```

### 4. Distribuição

```
Manual:    README → "Copie este JSON" → Quebra se path mudar
Extensão:  Marketplace → 1 clique → Sempre funciona
```

### 5. Logging Integrado

```typescript
// Output channel categorizado
const outputChannel = vscode.window.createOutputChannel('AI Project Context', { log: true });
outputChannel.appendLine('MCP Server registered successfully');
```

---

## 🔐 Segurança e Isolamento

### Processo Separado

O MCP Server roda em **processo Node.js separado**:

```
VS Code Process (PID 1234)
  └─ Extension Host (PID 1235)
       └─ Node.js MCP Server (PID 1236) ← Isolado
```

**Benefícios:**
* ✅ Crash do MCP não afeta VS Code
* ✅ MCP pode ser reiniciado sem reiniciar VS Code
* ✅ Recursos (CPU/Memory) isolados

### Comunicação Segura via stdio

```
┌──────────┐     stdin     ┌──────────┐
│ VS Code  │──────────────►│   MCP    │
│          │               │  Server  │
│          │◄──────────────│          │
└──────────┘    stdout     └──────────┘
```

**Por que stdio?**
* ✅ Padrão, não requer rede
* ✅ Sem portas expostas
* ✅ Comunicação local apenas
* ✅ JSON-RPC garante protocolo consistente

---

## 📚 Recursos Adicionais

### Documentação Oficial

* [MCP Specification](https://modelcontextprotocol.io/)
* [VS Code Extension API](https://code.visualstudio.com/api)
* [GitHub Copilot MCP Integration](https://code.visualstudio.com/docs/copilot/copilot-extensibility-overview)

### Código Fonte

* [AI Project Context Extension](https://github.com/GleidsonFerSanP/ai-project-docs-mcp)
* [MCP SDK](https://github.com/modelcontextprotocol/sdk)

---

## 🎯 Conclusão

O MCP via extensão **não aparece na lista "Installed"** porque é registrado **dinamicamente via API**, não via arquivo de configuração estático.

**É como:**
* 📱 Apps nativos do iOS vs. atalhos na tela inicial
* 🔌 Drivers integrados vs. drivers de terceiros instalados manualmente
* 🎮 Jogos digitais vs. mídia física

O MCP está lá, funcionando perfeitamente, apenas gerenciado de forma mais inteligente pela extensão! 🚀

---

**Gerado em:** 12 de Janeiro de 2026  
**Versão:** 1.0  
**Projeto:** [AI Project Context](https://github.com/GleidsonFerSanP/ai-project-docs-mcp)
