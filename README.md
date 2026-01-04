# JARVIS Documentation MCP Server

MCP Server que fornece documentação centralizada e contextual para múltiplos projetos com **sistema de auto-aprendizado** e **prevenção automática de duplicação**.

## 🌍 Portabilidade

**✅ Funciona em qualquer máquina sem modificar código!**

* Usa variáveis de ambiente (`${HOME}`,  `${USER}`)
* Paths relativos configuráveis
* Knowledge base compartilhável via Git
* Setup simples em nova máquina

📖 **[Guia Completo de Portabilidade](docs/_shared/PORTABILITY-SETUP.md)**

## 🚫 Prevenção de Duplicação

**✅ Impossível criar documentação duplicada!**

* Verificação automática de similaridade
* Bloqueio em tentativa de duplicação
* Força atualização de docs existentes
* Sistema garante única fonte da verdade

📖 **[Sistema de Gerenciamento de Documentação](docs/_shared/DOCUMENTATION-MANAGEMENT.md)**

## O que é?

Este MCP (Model Context Protocol) Server fornece acesso consistente à documentação de projetos para AI agents (GitHub Copilot, Claude, etc.), garantindo que:

1. ✅ Backend e Frontend sigam os mesmos princípios (SOLID, Clean Architecture)
2. ✅ Agents identifiquem automaticamente se estão no backend ou frontend
3. ✅ Documentação seja criada apenas quando necessário
4. ✅ Não haja ambiguidade entre os projetos
5. 🧠 Agents aprendam e lembrem contratos/padrões do projeto
6. 🔍 Validação automática de implementações contra contratos
7. 📝 Memória persistente de decisões arquiteturais
8. 🚫 **NOVO:** Prevenção automática de duplicação de documentação
9. 🌍 **NOVO:** Totalmente portátil entre máquinas

## 🆕 Sistema de Auto-Aprendizado

**Problema resolvido:** Agent para de esquecer contratos e interfaces importantes!

### Como funciona:

1. **Contract Registry**: Registre interfaces críticas que devem ser respeitadas
2. **Pattern Learning**: Ensine padrões específicos do seu projeto
3. **Project Scanning**: Análise automática do código
4. **Validation**: Verifique se implementações respeitam contratos
5. **Architectural Decisions**: Memória de decisões importantes

**📖 [Guia Completo de Auto-Aprendizado](docs/AUTO-LEARNING.md)**

## 📥 Instalação

### Opção 1: Extensão VS Code (Recomendado) ⭐

**A forma mais fácil de usar!**

1. Instale a extensão do [VS Code Marketplace](https://marketplace.visualstudio.com)
2. Procure por "Project Docs MCP"
3. Clique em "Install"
4. **Pronto!** Configuração automática

**Ou instale manualmente:**

```bash
./build-extension.sh
code --install-extension extension/project-docs-mcp-2.4.0.vsix
```

📖 **[Guia de Publicação da Extensão](docs/_shared/EXTENSION-PUBLISHING.md)**

### Opção 2: Configuração Manual

```bash
# Clone e build
git clone <repo> jarvis-docs-mcp
cd jarvis-docs-mcp
npm install
npm run build

# Configure no VS Code
# Edite .vscode/mcp.json ou configuração global
```

📖 **[Guia de Portabilidade](docs/_shared/PORTABILITY-SETUP.md)**

## 🎯 Quick Start

### Com Extensão VS Code

Simplesmente use no Copilot Chat:

```
@project-docs list_projects
@project-docs register_feature { ... }
@project-docs check_existing_documentation { ... }
```

### Comandos da Extensão

* **Project Docs: Configure** - Reconfigura MCP
* **Project Docs: Restart MCP Server** - Reinicia servidor
* **Project Docs: Open Documentation** - Abre docs

## Features

### Resources (Documentos)

* **project-overview**: Visão geral, arquitetura, princípios SOLID/Clean Architecture
* **backend-guidelines**: Guidelines específicos para NestJS/backend
* **frontend-guidelines**: Guidelines específicos para Angular/frontend
* **documentation-rules**: Regras sobre quando documentar

### Tools (Ferramentas)

#### Contexto e Guidelines

#### 1. `identify_context`

Identifica automaticamente se você está no backend ou frontend.

**Uso:**

```json
{
  "file_path": "src/app/command/command.controller.ts",
  "project_type": "backend"
}
```

**Retorna:** Contexto identificado + guidelines relevantes

#### 2. `get_guidelines`

Busca guidelines específicos por contexto e tópico.

**Uso:**

```json
{
  "context": "backend",
  "topic": "testing"
}
```

#### 3. `should_document`

Verifica se uma mudança precisa de documentação .md.

**Uso:**

```json
{
  "change_type": "feature",
  "complexity": "complex",
  "description": "New payment processing module"
}
```

**Retorna:** Recomendação de documentação

#### 🧠 Auto-Aprendizado

#### 4. `register_contract`

Registra um contrato/interface crítico que **DEVE** ser respeitado.

```json
{
  "name": "ISolutionAdapter",
  "context": "backend",
  "description": "Contrato que todas as soluções devem implementar",
  "interface_code": "export interface ISolutionAdapter<T, R> { execute(input: T): Promise<ApiResponse<R>>; }",
  "rules": ["Deve ter método execute()", "Retornar ApiResponse<T>"],
  "examples": ["class OpenAISolution implements ISolutionAdapter {...}"]
}
```

#### 5. `get_contracts`

Lista contratos registrados ou busca específicos.

```json
{
  "context": "backend",
  "search": "Solution"
}
```

#### 6. `validate_contract`

Valida se código respeita um contrato.

```json
{
  "contract_name": "ISolutionAdapter",
  "code": "class NewSolution implements ISolutionAdapter {...}"
}
```

**Retorna:** Validação + violações (se houver)

#### 7. `learn_pattern`

Ensina um padrão ao MCP.

```json
{
  "name": "Domain Error Handling",
  "context": "backend",
  "description": "Padrão de tratamento de erros",
  "pattern": "try { ... } catch (e) { ... }",
  "examples": ["src/use-cases/create-user.ts"]
}
```

#### 8. `scan_project`

Escaneia projeto e extrai interfaces/classes.

```json
{
  "project_path": "/caminho/do/projeto/backend",
  "context": "backend"
}
```

#### 9. `add_decision`

Registra decisão arquitetural (ADR).

```json
{
  "title": "Usar PostgreSQL ao invés de MongoDB",
  "context": "Necessidade de transações ACID",
  "decision": "PostgreSQL para dados transacionais",
  "positive_consequences": ["Integridade de dados", "Transações"],
  "negative_consequences": ["Menos flexibilidade de schema"]
}
```

## Instalação

```bash
# Instalar dependências
npm install

# Build
npm run build

# Testar localmente
npm start
```

## Configuração no GitHub Copilot (VS Code)

Adicione ao seu `settings.json` :

```json
{
  "github.copilot.advanced": {
    "mcp": {
      "servers": {
        "jarvis-docs": {
          "command": "node",
          "args": ["/caminho/absoluto/para/jarvis-docs-mcp/dist/index.js"]
        }
      }
    }
  }
}
```

## Configuração no Claude Desktop

Adicione ao `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "jarvis-docs": {
      "command": "node",
      "args": ["/caminho/absoluto/para/jarvis-docs-mcp/dist/index.js"]
    }
  }
}
```

## Como Usar com AI Agents

### 🚀 Quick Start (Primeira Vez)

**1. Escanei seu projeto:**

```
"Escanei o projeto backend em /caminho/do/projeto/backend"
```

**2. Registre contratos críticos:**

```
"Registre a interface ISolutionAdapter como contrato crítico"
```

**3. Pronto!** Agent agora tem memória do seu projeto.

**📖 [Guia Completo de Uso](docs/AUTO-LEARNING.md)**

### Automaticamente

Quando você abre um arquivo do projeto JARVIS:
* O agent identifica se é backend ou frontend
* Carrega automaticamente os guidelines relevantes
* Checa contratos registrados
* Valida implementações
* Aplica padrões aprendidos

### Comandos Úteis

```
"Me mostre as guidelines de backend para services"
"Registre este contrato crítico que todas as soluções devem respeitar"
"Valide esta implementação contra o contrato ISolutionAdapter"
"Liste todos os contratos registrados"
"Escanei o projeto e encontre interfaces importantes"
"Aprenda este padrão que usamos no projeto"
```

## Estrutura do Projeto

```
jarvis-docs-mcp/
├── src/
│   ├── index.ts           # MCP Server implementation
│   └── knowledge-base.ts  # Sistema de aprendizado
├── docs/
│   ├── AUTO-LEARNING.md   # 🆕 Guia completo de uso
│   ├── contracts/         # 🆕 Contratos documentados
│   ├── patterns/          # 🆕 Padrões do projeto
│   ├── architecture-decisions/  # 🆕 ADRs
│   ├── project-overview.md
│   ├── backend-guidelines.md
│   ├── frontend-guidelines.md
│   └── documentation-rules.md
├── knowledge/             # 🆕 Base de conhecimento persistente
│   ├── contracts.json     # Contratos registrados
│   ├── patterns.json      # Padrões aprendidos
│   └── decisions.json     # Decisões arquiteturais
├── dist/                  # Build output
├── package.json
├── tsconfig.json
└── README.md
```

## Benefícios

### Para Desenvolvedores

* ✅ Não precisa repetir instruções para AI agents
* ✅ Consistência entre backend e frontend
* 🆕 **Agent NUNCA esquece contratos importantes**
* 🆕 **Validação automática de implementações**
* 🆕 **Padrões do projeto persistem entre sessões**
* ✅ Guidelines sempre atualizados
* ✅ Menos documentação desnecessária

### Para AI Agents

* ✅ Contexto automático baseado em arquivos
* ✅ Acesso estruturado à documentação
* ✅ Decisões consistentes sobre documentação
* ✅ Redução de ambiguidade

## Atualizando Documentação

Para atualizar os guidelines:

1. Edite os arquivos em `docs/`
2. Faça rebuild: `npm run build`
3. Reinicie o agent que está usando o MCP

## Princípios

Este MCP segue os mesmos princípios do projeto JARVIS:

* **Simplicidade**: Documentação direta e objetiva
* **Consistência**: Mesmos padrões em todo o projeto
* **Pragmatismo**: Documente apenas o necessário
* **Automação**: Reduza trabalho manual repetitivo

## Troubleshooting

### MCP não está sendo reconhecido

1. Verifique se o caminho no config está correto (absoluto)
2. Certifique-se de ter feito `npm run build`
3. Reinicie o VS Code / Claude Desktop

### Guidelines não estão sendo aplicados

1. Force reload: "Identifique o contexto deste projeto"
2. Verifique logs: `console.error` no MCP server
3. Confirme que arquivos em `docs/` existem

## Contribuindo

Para adicionar novos guidelines:

1. Adicione/edite arquivo em `docs/`
2. Atualize `DOCS` mapping em `src/index.ts`
3. Adicione resource em `ListResourcesRequestSchema`
4. Rebuild e teste

## Roadmap

* [ ] Support para mais stacks (Python, Go, etc.)
* [ ] Integration com ferramentas de linting
* [ ] Validação automática de padrões
* [ ] Dashboard de conformidade

## License

MIT

---

**Projeto JARVIS** - Building the future, one command at a time.
