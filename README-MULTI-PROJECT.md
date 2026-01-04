# Multi-Project JARVIS Docs MCP

## 🎯 Visão Geral

Este MCP Server foi transformado em um **sistema universal de documentação** que suporta múltiplos projetos simultaneamente. Cada projeto possui:

* ✅ Knowledge base isolada (contratos, padrões, decisões)
* ✅ Documentação específica e compartilhada
* ✅ Auto-detecção de projeto por caminho de arquivo
* ✅ Contextos personalizados por stack (backend, frontend, infrastructure, scripting)
* ✅ **NOVO:** Criação de projetos em runtime via chat! 🚀

## 🆕 Novidade: Criação de Projetos em Runtime

Agora você pode criar novos projetos **diretamente do chat**, sem editar arquivos ou reiniciar o servidor!

```typescript
create_project({
  project_id: "meu-novo-projeto",
  name: "Meu Projeto",
  description: "Sistema XYZ com API e frontend",
  paths: ["/projeto", "/app"],
  stack: { backend: "FastAPI", frontend: "React" },
  principles: ["Clean Architecture", "TDD"]
})
```

O MCP automaticamente cria:
* Estrutura de diretórios (`docs/`,  `knowledge/`)
* Arquivos de knowledge base (contracts, patterns, decisions)
* `project-overview.md` inicial
* Atualiza `mcp-config.json`

📖 **[Ver documentação completa sobre criação de projetos](docs/_shared/creating-projects.md)**

## 📁 Estrutura de Diretórios

```
jarvis-docs-mcp/
├── mcp-config.json          # Configuração de todos os projetos
├── docs/
│   ├── _shared/             # Documentação compartilhada
│   │   ├── documentation-rules.md
│   │   └── AUTO-LEARNING.md
│   ├── jarvis/              # Docs do projeto JARVIS
│   │   ├── project-overview.md
│   │   ├── backend-guidelines.md
│   │   └── frontend-guidelines.md
│   └── automacao-n8n/       # Docs do projeto N8N
│       └── project-overview.md
├── knowledge/
│   ├── jarvis/              # Knowledge base do JARVIS
│   │   ├── contracts.json
│   │   ├── patterns.json
│   │   └── decisions.json
│   └── automacao-n8n/       # Knowledge base do N8N
│       ├── contracts.json
│       ├── patterns.json
│       └── decisions.json
└── src/
    ├── index.ts             # MCP Server principal
    ├── project-manager.ts   # Gerenciamento multi-projeto
    └── knowledge-base.ts    # Persistência isolada
```

## 🔧 Configuração de Projetos

Edite `mcp-config.json` para adicionar/configurar projetos:

```json
{
  "version": "1.0",
  "defaultProject": "jarvis",
  "projects": {
    "jarvis": {
      "name": "JARVIS System",
      "description": "Sistema web completo com NestJS + Angular",
      "paths": [
        "/jarvis",
        "/JARVIS",
        "/backend",
        "/frontend"
      ],
      "stack": {
        "backend": "NestJS",
        "frontend": "Angular",
        "database": "PostgreSQL",
        "orm": "TypeORM"
      },
      "principles": [
        "SOLID",
        "Clean Architecture",
        "DDD"
      ]
    },
    "automacao-n8n": {
      "name": "Automação N8N Infrastructure",
      "description": "Infraestrutura AWS com Terraform e automações",
      "paths": [
        "/automacao-n8n",
        "/n8n",
        "/terraform",
        "/infrastructure"
      ],
      "stack": {
        "infrastructure": "Terraform",
        "cloud": "AWS",
        "cicd": "GitHub Actions",
        "scripting": "Shell/Bash"
      },
      "principles": [
        "Infrastructure as Code",
        "GitOps",
        "Immutable Infrastructure"
      ]
    }
  }
}
```

## 🛠️ Ferramentas (Tools)

### Gerenciamento de Projetos

#### `create_project` ⭐ NOVO

Cria um novo projeto dinamicamente com toda a estrutura necessária.

```json
{
  "name": "create_project",
  "arguments": {
    "project_id": "meu-projeto",
    "name": "Meu Projeto Incrível",
    "description": "Sistema web com API e dashboard",
    "paths": ["/meu-projeto", "/projeto"],
    "stack": {
      "backend": "FastAPI",
      "frontend": "Vue.js",
      "database": "PostgreSQL"
    },
    "principles": ["Clean Architecture", "TDD", "SOLID"]
  }
}
```

**Cria automaticamente:**
* ✅ Atualiza `mcp-config.json`
* ✅ Cria `docs/meu-projeto/` com `project-overview.md`
* ✅ Cria `knowledge/meu-projeto/` com arquivos vazios
* ✅ Projeto pronto para uso imediatamente!

**[📖 Documentação completa](docs/_shared/creating-projects.md)**

#### `list_projects`

Lista todos os projetos configurados.

```json
{
  "name": "list_projects"
}
```

**Resposta:**

```json
{
  "message": "📋 2 projeto(s) disponível(is)",
  "current_project": "jarvis",
  "projects": [
    {
      "id": "jarvis",
      "name": "JARVIS System",
      "description": "Sistema web completo...",
      "stack": {...}
    },
    {
      "id": "automacao-n8n",
      "name": "Automação N8N Infrastructure",
      ...
    }
  ]
}
```

#### `get_project_info`

Obtém informações detalhadas sobre um projeto específico.

```json
{
  "name": "get_project_info",
  "arguments": {
    "project_id": "automacao-n8n"
  }
}
```

#### `switch_project`

Muda o contexto atual para outro projeto.

```json
{
  "name": "switch_project",
  "arguments": {
    "project_id": "automacao-n8n"
  }
}
```

### Auto-Detecção

#### `identify_context`

**Auto-detecta** o projeto e contexto baseado no caminho do arquivo.

```json
{
  "name": "identify_context",
  "arguments": {
    "file_path": "/home/user/projetos/automacao-n8n/terraform/main.tf"
  }
}
```

**Resposta:**

```json
{
  "project": "automacao-n8n",
  "context": "infrastructure",
  "detected": true,
  "message": "🏗️ Infrastructure - Terraform (automacao-n8n)",
  "guidelines_summary": "Guidelines de IaC e Terraform carregados"
}
```

### Guidelines e Documentação

#### `get_guidelines`

Retorna guidelines específicos do projeto e contexto.

```json
{
  "name": "get_guidelines",
  "arguments": {
    "project_id": "automacao-n8n",  // Opcional: usa projeto atual se omitido
    "context": "infrastructure",
    "topic": "terraform"             // Opcional: filtra por tópico
  }
}
```

#### `should_document`

Determina se mudança precisa de documentação `.md` ou apenas comentários.

```json
{
  "name": "should_document",
  "arguments": {
    "change_type": "architecture",
    "complexity": "complex",
    "description": "Nova estrutura de módulos Terraform"
  }
}
```

### Knowledge Base (por projeto)

#### `register_contract`

Registra contrato/interface **no projeto específico** (auto-detectado ou especificado).

```json
{
  "name": "register_contract",
  "arguments": {
    "project_id": "automacao-n8n",  // Opcional: auto-detecta se omitido
    "name": "IModuleConfig",
    "context": "infrastructure",
    "description": "Configuração padrão de módulos Terraform",
    "interface_code": "interface IModuleConfig { ... }",
    "rules": [
      "Todos os módulos devem ter outputs documentados",
      "Variables devem ter descriptions e defaults quando apropriado"
    ],
    "file_path": "/terraform/modules/base/config.tf"
  }
}
```

#### `get_contracts`

Lista contratos registrados **no projeto específico**.

```json
{
  "name": "get_contracts",
  "arguments": {
    "project_id": "jarvis",       // Opcional
    "context": "backend",          // Opcional: all, backend, frontend, infrastructure, shared
    "search": "Adapter"            // Opcional: busca por termo
  }
}
```

#### `validate_contract`

Valida código contra contrato registrado.

```json
{
  "name": "validate_contract",
  "arguments": {
    "project_id": "jarvis",        // Opcional
    "contract_name": "ISolutionAdapter",
    "code": "export class ConcreteAdapter implements ISolutionAdapter { ... }"
  }
}
```

#### `learn_pattern`

Ensina novo padrão ao MCP (isolado por projeto).

```json
{
  "name": "learn_pattern",
  "arguments": {
    "project_id": "automacao-n8n", // Opcional
    "name": "terraform-module-structure",
    "context": "infrastructure",
    "description": "Estrutura padrão de módulos Terraform reutilizáveis",
    "pattern": "module/\n  main.tf\n  variables.tf\n  outputs.tf\n  README.md",
    "examples": [
      "terraform/modules/vpc/",
      "terraform/modules/rds/"
    ]
  }
}
```

#### `scan_project`

Escaneia projeto e extrai interfaces/classes automaticamente.

```json
{
  "name": "scan_project",
  "arguments": {
    "project_id": "jarvis",        // Opcional
    "project_path": "/home/user/projetos/jarvis/backend",
    "context": "backend"
  }
}
```

#### `add_decision`

Registra decisão arquitetural (ADR) no projeto.

```json
{
  "name": "add_decision",
  "arguments": {
    "project_id": "automacao-n8n", // Opcional
    "title": "Uso de Terraform Workspaces",
    "context": "Gerenciamento de múltiplos ambientes (dev, staging, prod)",
    "decision": "Usar Terraform Workspaces para separar estados por ambiente",
    "positive_consequences": [
      "Código DRY - mesma configuração para todos os ambientes",
      "Mudanças de ambiente simples"
    ],
    "negative_consequences": [
      "Workspaces podem ser confusos para iniciantes",
      "State files compartilham mesmo backend"
    ],
    "alternatives": [
      "Diretórios separados por ambiente",
      "Repositórios separados"
    ]
  }
}
```

## 🔄 Fluxo de Trabalho

### Cenário 1: Trabalhando no JARVIS (NestJS)

```typescript
// 1. Identificar contexto (auto-detecta jarvis)
identify_context({
  file_path: "/home/user/jarvis/backend/src/modules/solution/solution.service.ts"
})
// Resposta: { project: "jarvis", context: "backend" }

// 2. Buscar guidelines
get_guidelines({
  context: "backend",
  topic: "services"
})

// 3. Verificar contratos existentes
get_contracts({
  context: "backend",
  search: "Solution"
})

// 4. Validar implementação
validate_contract({
  contract_name: "ISolutionAdapter",
  code: "export class ConcreteAdapter implements ISolutionAdapter { ... }"
})
```

### Cenário 2: Trabalhando no N8N (Terraform)

```typescript
// 1. Identificar contexto (auto-detecta automacao-n8n)
identify_context({
  file_path: "/home/user/automacao-n8n/terraform/modules/vpc/main.tf"
})
// Resposta: { project: "automacao-n8n", context: "infrastructure" }

// 2. Buscar guidelines de infraestrutura
get_guidelines({
  context: "infrastructure",
  topic: "modules"
})

// 3. Registrar padrão de módulo
learn_pattern({
  name: "vpc-module-structure",
  context: "infrastructure",
  pattern: "...",
  examples: [...]
})

// 4. Adicionar decisão arquitetural
add_decision({
  title: "Estratégia de Networking",
  context: "Definição de VPCs e Subnets",
  decision: "...",
  ...
})
```

### Cenário 3: Mudança de Projeto

```typescript
// Listar projetos disponíveis
list_projects()

// Mudar para N8N
switch_project({ project_id: "automacao-n8n" })

// Agora todas as operações sem project_id explícito usam automacao-n8n
get_contracts({ context: "infrastructure" })
// Retorna apenas contratos do automacao-n8n
```

## 🎨 Contextos por Stack

Cada projeto pode ter múltiplos contextos baseados no seu stack:

| Stack | Contextos Disponíveis |
|-------|-----------------------|
| `backend` | `backend` |
| `frontend` | `frontend` |
| `infrastructure` | `infrastructure` |
| `scripting` | `scripting` |
| `shared` | `shared` (comum a todos) |

## 📝 Boas Práticas

### 1. **Auto-detecção sempre que possível**

```typescript
// ✅ BOM: Deixa o MCP detectar o projeto
identify_context({ file_path: "/projeto/arquivo.ts" })

// ❌ Desnecessário: Especificar manualmente
identify_context({ 
  file_path: "/projeto/arquivo.ts",
  project_id: "projeto" 
})
```

### 2. **Use project_id apenas quando necessário**

```typescript
// ✅ BOM: Operação no projeto atual
get_contracts({ context: "backend" })

// ✅ BOM: Operação cross-project explícita
get_contracts({ 
  project_id: "outro-projeto",
  context: "backend" 
})
```

### 3. **Registre contratos críticos logo que identificados**

```typescript
// Sempre que encontrar uma interface/contrato importante:
register_contract({
  name: "IImportantContract",
  context: "backend",
  description: "...",
  interface_code: "...",
  rules: [...]
})
```

### 4. **Documente decisões arquiteturais**

```typescript
// Após decisões importantes:
add_decision({
  title: "Escolha de Tecnologia X",
  context: "Por que escolhemos X em vez de Y",
  decision: "Decidimos usar X",
  positive_consequences: [...],
  negative_consequences: [...],
  alternatives: [...]
})
```

## 🔍 Troubleshooting

### Problema: Projeto não detectado automaticamente

**Solução:** Verifique se o caminho do arquivo inclui algum padrão definido em `mcp-config.json` :

```json
{
  "projects": {
    "seu-projeto": {
      "paths": [
        "/seu-projeto",      // ✅ Detecta: /home/user/seu-projeto/...
        "/projeto",          // ✅ Detecta: /workspace/projeto/...
        "meu-app"            // ✅ Detecta: .../meu-app/...
      ]
    }
  }
}
```

### Problema: Contexto retorna "unknown"

**Verificações:**
1. O projeto tem o stack correto configurado?
2. O nome do arquivo/caminho contém hints do contexto?

```typescript
// Terraform
"/terraform/main.tf"        → infrastructure ✅
"/infra/ec2.tf"            → infrastructure ✅

// Backend
"/backend/service.ts"       → backend ✅
"/api/controller.ts"        → backend ✅

// Frontend
"/frontend/component.tsx"   → frontend ✅
"/web/app.component.ts"     → frontend ✅
```

### Problema: Knowledge base não isola corretamente

**Verificação:** Cada projeto tem sua própria pasta em `knowledge/` :

```
knowledge/
├── jarvis/
│   ├── contracts.json      ← JARVIS contracts
│   ├── patterns.json
│   └── decisions.json
└── automacao-n8n/
    ├── contracts.json      ← N8N contracts (separado!)
    ├── patterns.json
    └── decisions.json
```

## 🚀 Próximos Passos

1. **Adicionar mais projetos**: Edite `mcp-config.json`
2. **Criar guidelines específicos**: Adicione `.md` em `docs/{projeto}/`
3. **Popular knowledge base**: Use `register_contract`, `learn_pattern`
4. **Documentar decisões**: Use `add_decision` regularmente

## 📚 Recursos Adicionais

* [docs/_shared/documentation-rules.md](docs/_shared/documentation-rules.md) - Regras de documentação (compartilhadas)
* [docs/_shared/AUTO-LEARNING.md](docs/_shared/AUTO-LEARNING.md) - Como funciona o sistema de auto-aprendizado
* [docs/jarvis/project-overview.md](docs/jarvis/project-overview.md) - Overview do JARVIS
* [docs/automacao-n8n/project-overview.md](docs/automacao-n8n/project-overview.md) - Overview do N8N

---

**Versão:** 2.0.0 (Multi-Project)  
**Autor:** Gleidson Fersan  
**Data:** Janeiro 2025
