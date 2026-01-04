# Quick Start - Multi-Project MCP

## 🚀 Começando em 5 Minutos

### 1. Instalação e Build

```bash
cd /Users/gleidsonfersanp/workspace/AI/jarvis-docs-mcp
npm install
npm run build
```

### 2. Configurar no Claude Desktop

Edite `~/Library/Application Support/Claude/claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "jarvis-docs": {
      "command": "node",
      "args": [
        "/Users/gleidsonfersanp/workspace/AI/jarvis-docs-mcp/dist/index.js"
      ]
    }
  }
}
```

Reinicie o Claude Desktop.

### 3. Primeiros Comandos

#### Listar Projetos Disponíveis

```
@jarvis-docs list_projects
```

**Resultado esperado:**

```json
{
  "current_project": "jarvis",
  "projects": [
    {
      "id": "jarvis",
      "name": "JARVIS System",
      "description": "Sistema web completo com NestJS + Angular"
    },
    {
      "id": "automacao-n8n",
      "name": "Automação N8N Infrastructure",
      "description": "Infraestrutura AWS com Terraform"
    }
  ]
}
```

#### Ver Informações de um Projeto

```
@jarvis-docs get_project_info
{
  "project_id": "automacao-n8n"
}
```

#### Identificar Contexto (Auto-Detecção)

```
@jarvis-docs identify_context
{
  "file_path": "/home/user/automacao-n8n/terraform/modules/vpc/main.tf"
}
```

**Resultado esperado:**

```json
{
  "project": "automacao-n8n",
  "context": "infrastructure",
  "detected": true,
  "message": "🏗️ Infrastructure - Terraform (automacao-n8n)"
}
```

## 📖 Casos de Uso Comuns

### Cenário 1: Trabalhando no Backend do JARVIS

```typescript
// 1. Identificar contexto
identify_context({
  file_path: "/jarvis/backend/src/solution/solution.service.ts"
})

// 2. Buscar guidelines de backend
get_guidelines({
  context: "backend",
  topic: "services"
})

// 3. Ver contratos existentes
get_contracts({
  context: "backend"
})

// 4. Registrar novo contrato
register_contract({
  name: "ISolutionAdapter",
  context: "backend",
  description: "Adapter para soluções",
  interface_code: "export interface ISolutionAdapter { ... }",
  rules: [
    "Deve implementar método adapt()",
    "Deve validar entrada",
    "Deve retornar resultado padronizado"
  ]
})

// 5. Validar implementação
validate_contract({
  contract_name: "ISolutionAdapter",
  code: `
    export class ConcreteAdapter implements ISolutionAdapter {
      adapt(input: any) { ... }
    }
  `
})
```

### Cenário 2: Trabalhando com Terraform (N8N)

```typescript
// 1. Mudar para projeto N8N
switch_project({
  project_id: "automacao-n8n"
})

// 2. Identificar contexto
identify_context({
  file_path": "/n8n/terraform/modules/vpc/main.tf"
})

// 3. Buscar guidelines de Terraform
get_guidelines({
  context: "infrastructure",
  topic: "terraform"
})

// 4. Registrar padrão de módulo
learn_pattern({
  name: "terraform-module-structure",
  context: "infrastructure",
  description: "Estrutura padrão de módulos Terraform reutilizáveis",
  pattern: `
    module/
      main.tf        # Recursos principais
      variables.tf   # Input variables
      outputs.tf     # Output values
      README.md      # Documentação
      versions.tf    # Provider versions
  `,
  examples: [
    "terraform/modules/vpc/",
    "terraform/modules/rds/",
    "terraform/modules/ec2/"
  ]
})

// 5. Adicionar decisão arquitetural
add_decision({
  title: "Uso de Terraform Workspaces",
  context: "Gerenciamento de múltiplos ambientes (dev, staging, prod)",
  decision: "Usar Terraform Workspaces para separar estados por ambiente",
  positive_consequences: [
    "Código DRY - mesma configuração para todos os ambientes",
    "Mudança entre ambientes com um comando: terraform workspace select",
    "Reduz duplicação de código"
  ],
  negative_consequences: [
    "Workspaces podem ser confusos para iniciantes",
    "State files compartilham mesmo backend",
    "Risco de apply no ambiente errado"
  ],
  alternatives: [
    "Diretórios separados por ambiente",
    "Repositórios separados por ambiente",
    "Terragrunt para DRY"
  ]
})
```

### Cenário 3: Documentação de Mudança Complexa

```typescript
// 1. Verificar se precisa documentar
should_document({
  change_type: "architecture",
  complexity: "complex",
  description: "Nova estrutura de módulos Terraform para multi-região"
})

// Resposta: Criar documentação .md ✅

// 2. Registrar decisão
add_decision({
  title: "Arquitetura Multi-Região",
  context: "Necessidade de deploy em múltiplas regiões AWS",
  decision: "Implementar módulos Terraform region-agnostic com variables para região",
  positive_consequences: [
    "Módulos reutilizáveis entre regiões",
    "Disaster recovery facilitado",
    "Redução de código duplicado"
  ],
  negative_consequences: [
    "Complexidade adicional nos módulos",
    "Testes devem cobrir múltiplas regiões",
    "Custos de infraestrutura aumentados"
  ]
})

// 3. Registrar padrão identificado
learn_pattern({
  name: "multi-region-module",
  context: "infrastructure",
  description: "Padrão para módulos Terraform que funcionam em qualquer região",
  pattern: `
    variable "aws_region" {
      description = "AWS region para deploy"
      type        = string
    }

    provider "aws" {
      region = var.aws_region
    }

    # Usar data sources region-agnostic
    data "aws_availability_zones" "available" {
      state = "available"
    }
  `,
  examples: [
    "modules/vpc-multi-region/",
    "modules/ec2-multi-region/"
  ]
})
```

## 🔍 Comandos de Busca e Validação

### Buscar Contratos Específicos

```typescript
get_contracts({
  project_id: "jarvis",
  search: "Adapter"
})
```

### Buscar Contratos por Contexto

```typescript
get_contracts({
  project_id: "automacao-n8n",
  context: "infrastructure"
})
```

### Escanear Projeto e Encontrar Interfaces

```typescript
scan_project({
  project_id: "jarvis",
  project_path: "/home/user/jarvis/backend/src",
  context: "backend"
})
```

## 🎯 Dicas de Produtividade

### 1. Deixe o MCP Auto-Detectar

```typescript
// ❌ Desnecessário
identify_context({
  file_path: "/jarvis/backend/service.ts",
  project_id: "jarvis"
})

// ✅ Melhor
identify_context({
  file_path: "/jarvis/backend/service.ts"
})
```

### 2. Use Projeto Atual Sempre que Possível

```typescript
// Se você já está trabalhando no JARVIS:
switch_project({ project_id: "jarvis" })

// Depois, não precisa especificar project_id:
get_contracts({ context: "backend" })
register_contract({ name: "IService", ... })
learn_pattern({ name: "service-pattern", ... })
```

### 3. Registre Contratos Imediatamente

```typescript
// Sempre que encontrar uma interface crítica:
register_contract({
  name: "ICriticalInterface",
  context: "backend",
  description: "Interface crítica que não deve ser violada",
  interface_code: "...",
  rules: [
    "Regra 1",
    "Regra 2",
    "Regra 3"
  ],
  file_path: "/path/to/interface.ts"
})
```

### 4. Valide Antes de Commit

```typescript
// Antes de commitar código que implementa um contrato:
validate_contract({
  contract_name: "ISolutionAdapter",
  code: `
    export class MyAdapter implements ISolutionAdapter {
      // implementação
    }
  `
})
```

## 🐛 Troubleshooting

### Problema: "Projeto não detectado"

**Solução:** Verifique se o caminho do arquivo inclui um dos padrões em `mcp-config.json` :

```json
{
  "projects": {
    "seu-projeto": {
      "paths": [
        "/seu-projeto",
        "/projeto",
        "meu-app"
      ]
    }
  }
}
```

### Problema: "Contexto retorna unknown"

**Solução:** Verifique:
1. O projeto tem o stack correto configurado em `mcp-config.json`
2. O caminho do arquivo contém hints do contexto (terraform/, backend/, etc.)

### Problema: "Contratos não aparecem"

**Solução:** Verifique:
1. Você está no projeto correto? Use `switch_project`
2. O contrato foi registrado para o contexto correto?
3. Use `get_contracts({ context: "all" })` para ver todos

## 📚 Recursos

* [README-MULTI-PROJECT.md](README-MULTI-PROJECT.md) - Documentação completa
* [MIGRATION-REPORT.md](MIGRATION-REPORT.md) - Detalhes da migração
* [docs/_shared/documentation-rules.md](docs/_shared/documentation-rules.md) - Quando documentar
* [docs/_shared/AUTO-LEARNING.md](docs/_shared/AUTO-LEARNING.md) - Como funciona o auto-learning

## 🚀 Adicionar Novo Projeto

1. Edite `mcp-config.json`:

```json
{
  "projects": {
    "novo-projeto": {
      "name": "Meu Novo Projeto",
      "description": "Descrição do projeto",
      "paths": ["/novo-projeto", "/projeto"],
      "stack": {
        "backend": "FastAPI",
        "frontend": "React"
      },
      "principles": ["DDD", "CQRS"]
    }
  }
}
```

2. Crie estrutura de pastas:

```bash
mkdir -p docs/novo-projeto knowledge/novo-projeto
touch knowledge/novo-projeto/{contracts,patterns,decisions}.json
```

3. Crie `docs/novo-projeto/project-overview.md`

4. Rebuild:

```bash
npm run build
```

5. Teste:

```typescript
list_projects()  // Deve aparecer "novo-projeto"
```

---

**Pronto para usar!** 🎉

Para mais detalhes, consulte [README-MULTI-PROJECT.md](README-MULTI-PROJECT.md).
