# Criando Projetos Dinamicamente

## 🎯 Visão Geral

O MCP agora suporta criação de novos projetos **em runtime**, diretamente do chat, sem necessidade de editar arquivos manualmente ou reiniciar o servidor!

## 🚀 Como Criar um Novo Projeto

### Usando o Tool `create_project`

```typescript
create_project({
  project_id: "meu-novo-projeto",
  name: "Meu Novo Projeto Incrível",
  description: "Sistema de gerenciamento XYZ com API REST e frontend moderno",
  paths: [
    "/meu-novo-projeto",
    "/projeto-xyz",
    "/xyz"
  ],
  stack: {
    backend: "FastAPI",
    frontend: "React",
    database: "MongoDB",
    cache: "Redis"
  },
  principles: [
    "Clean Architecture",
    "TDD",
    "SOLID",
    "API First"
  ]
})
```

### O Que É Criado Automaticamente

Quando você executa `create_project` , o MCP:

1. ✅ **Valida o ID do projeto** (apenas lowercase, números, hífens e underscores)
2. ✅ **Atualiza `mcp-config.json`** com a nova configuração
3. ✅ **Cria estrutura de diretórios:**
   

```
   docs/meu-novo-projeto/
   knowledge/meu-novo-projeto/
   ```

4. ✅ **Cria arquivos de knowledge base:**
   - `contracts.json` (vazio)
   - `patterns.json` (vazio)
   - `decisions.json` (vazio)
5. ✅ **Gera `project-overview.md`** básico com:
   - Nome e descrição
   - Stack tecnológico
   - Princípios
   - Estrutura inicial para você completar

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "✅ Projeto 'meu-novo-projeto' criado com sucesso!\n\nEstrutura criada:\n- docs/meu-novo-projeto/\n- knowledge/meu-novo-projeto/\n\nArquivos criados:\n- project-overview.md\n- contracts.json\n- patterns.json\n- decisions.json",
  "project_id": "meu-novo-projeto",
  "next_steps": [
    "Use 'switch_project' para mudar para o novo projeto",
    "Edite docs/meu-novo-projeto/project-overview.md com guidelines específicos",
    "Use 'register_contract' para adicionar contratos importantes",
    "Use 'learn_pattern' para registrar padrões do projeto"
  ]
}
```

## 📋 Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `project_id` | string | ID único (lowercase, alfanumérico, `-` , `_` ) | `"meu-app"` |
| `name` | string | Nome completo do projeto | `"Meu Aplicativo Web"` |
| `description` | string | Descrição detalhada | `"Sistema de gestão..."` |
| `paths` | string[] | Padrões de caminho para auto-detecção | `["/app", "/projeto"]` |
| `stack` | object | Tecnologias usadas | `{"backend": "NestJS"}` |
| `principles` | string[] | Princípios e convenções | `["SOLID", "DDD"]` |

## 🎨 Exemplos de Uso

### Exemplo 1: Projeto Python com FastAPI

```typescript
create_project({
  project_id: "api-vendas",
  name: "API de Vendas",
  description: "API REST para sistema de vendas com processamento de pagamentos",
  paths: ["/api-vendas", "/vendas-api", "/sales-api"],
  stack: {
    backend: "FastAPI",
    database: "PostgreSQL",
    orm: "SQLAlchemy",
    cache: "Redis",
    queue: "Celery"
  },
  principles: [
    "Clean Architecture",
    "DDD",
    "CQRS",
    "Event Sourcing",
    "TDD"
  ]
})
```

### Exemplo 2: Projeto Mobile com React Native

```typescript
create_project({
  project_id: "app-delivery",
  name: "App de Delivery",
  description: "Aplicativo mobile para delivery de comida com tracking em tempo real",
  paths: ["/app-delivery", "/delivery-mobile", "/mobile"],
  stack: {
    mobile: "React Native",
    state: "Redux Toolkit",
    navigation: "React Navigation",
    backend_integration: "Axios",
    maps: "Google Maps API"
  },
  principles: [
    "Component-Driven Development",
    "Atomic Design",
    "Mobile First",
    "Offline First"
  ]
})
```

### Exemplo 3: Projeto DevOps/Infrastructure

```typescript
create_project({
  project_id: "k8s-platform",
  name: "Kubernetes Platform",
  description: "Plataforma Kubernetes com GitOps e auto-scaling",
  paths: ["/k8s-platform", "/kubernetes", "/platform"],
  stack: {
    orchestration: "Kubernetes",
    iac: "Terraform",
    gitops: "ArgoCD",
    monitoring: "Prometheus + Grafana",
    cicd: "GitHub Actions"
  },
  principles: [
    "Infrastructure as Code",
    "GitOps",
    "Immutable Infrastructure",
    "Everything as Code",
    "Declarative Configuration"
  ]
})
```

### Exemplo 4: Projeto Data Science

```typescript
create_project({
  project_id: "ml-pipeline",
  name: "ML Pipeline",
  description: "Pipeline de machine learning para predição de churn",
  paths: ["/ml-pipeline", "/data-science", "/ml"],
  stack: {
    language: "Python",
    ml: "Scikit-learn + TensorFlow",
    data_processing: "Pandas + NumPy",
    visualization: "Matplotlib + Seaborn",
    mlops: "MLflow",
    deployment: "FastAPI + Docker"
  },
  principles: [
    "Reproducible Research",
    "Version Control for Data",
    "Experiment Tracking",
    "Model Versioning",
    "Continuous Training"
  ]
})
```

## 🔄 Fluxo Completo de Criação

### 1. Criar o Projeto

```typescript
create_project({
  project_id: "novo-projeto",
  name: "Novo Projeto",
  description: "Descrição...",
  paths: ["/novo-projeto"],
  stack: { backend: "Node.js" },
  principles: ["SOLID"]
})
```

### 2. Mudar para o Novo Projeto

```typescript
switch_project({ project_id: "novo-projeto" })
```

### 3. Personalizar Documentation

Agora você pode editar `docs/novo-projeto/project-overview.md` manualmente para adicionar:
* Guidelines específicos
* Estrutura de diretórios detalhada
* Comandos de setup
* Padrões de código
* Etc.

### 4. Popular Knowledge Base

```typescript
// Registrar contratos importantes
register_contract({
  name: "IUserRepository",
  context: "backend",
  description: "Interface do repositório de usuários",
  interface_code: "...",
  rules: [...]
})

// Aprender padrões
learn_pattern({
  name: "repository-pattern",
  context: "backend",
  description: "...",
  pattern: "...",
  examples: [...]
})

// Documentar decisões
add_decision({
  title: "Escolha do ORM",
  context: "...",
  decision: "...",
  positive_consequences: [...],
  negative_consequences: [...]
})
```

## ✅ Validações

O MCP valida automaticamente:

### ✅ ID do Projeto

* ❌ `"Meu Projeto"` - Contém espaços
* ❌ `"PROJETO"` - Contém maiúsculas
* ❌ `"projeto@novo"` - Contém caracteres especiais
* ✅ `"projeto-novo"` - Válido!
* ✅ `"projeto_novo"` - Válido!
* ✅ `"projeto123"` - Válido!

### ✅ Duplicação

Se o projeto já existe, retorna erro:

```json
{
  "error": "Projeto 'projeto-existente' já existe"
}
```

### ✅ Campos Obrigatórios

Todos os campos devem ser fornecidos, caso contrário:

```json
{
  "error": "Todos os campos são obrigatórios",
  "required": ["project_id", "name", "description", "paths", "stack", "principles"]
}
```

## 🎯 Dicas e Boas Práticas

### 1. **IDs Descritivos e Únicos**

```typescript
// ✅ BOM
project_id: "ecommerce-backend"
project_id: "mobile-app-ios"
project_id: "ml-recommendation-engine"

// ❌ EVITAR
project_id: "proj1"
project_id: "test"
project_id: "novo"
```

### 2. **Paths para Auto-Detecção**

Inclua todos os caminhos possíveis onde o projeto pode estar:

```typescript
paths: [
  "/nome-do-projeto",      // Caminho principal
  "/projeto",              // Alias curto
  "/legacy-nome",          // Nome antigo (se aplicável)
  "workspace/projeto"      // Caminho relativo comum
]
```

### 3. **Stack Detalhado**

Seja específico sobre as tecnologias:

```typescript
// ✅ BOM
stack: {
  backend: "NestJS 10.x",
  frontend: "Angular 17",
  database: "PostgreSQL 15",
  cache: "Redis 7"
}

// ❌ Muito genérico
stack: {
  backend: "Node",
  frontend: "Framework JS"
}
```

### 4. **Princípios Relevantes**

Liste princípios que realmente serão seguidos:

```typescript
// ✅ BOM - Princípios específicos e aplicáveis
principles: [
  "SOLID",
  "Clean Architecture",
  "TDD",
  "API First Design",
  "Semantic Versioning"
]

// ❌ EVITAR - Muito genérico ou óbvio
principles: [
  "Boas práticas",
  "Código limpo",
  "Qualidade"
]
```

## 🚨 Troubleshooting

### Erro: "ID do projeto deve conter apenas..."

**Problema:** ID do projeto contém caracteres inválidos.
**Solução:** Use apenas lowercase, números, hífens (-) e underscores (_).

### Erro: "Projeto já existe"

**Problema:** Você está tentando criar um projeto com ID que já existe.
**Solução:** 
1. Use `list_projects` para ver projetos existentes
2. Escolha um ID diferente
3. Ou remova o projeto existente manualmente (edite `mcp-config.json` e delete pastas)

### Erro: "Todos os campos são obrigatórios"

**Problema:** Você omitiu algum campo obrigatório.
**Solução:** Certifique-se de fornecer todos os 6 campos: `project_id` , `name` , `description` , `paths` , `stack` , `principles` .

## 📚 Próximos Passos

Após criar um projeto:

1. ✅ **Personalizar documentação:** Edite `docs/{projeto}/project-overview.md`
2. ✅ **Adicionar guidelines:** Crie arquivos `.md` adicionais em `docs/{projeto}/`
3. ✅ **Popular knowledge base:** Use `register_contract`, `learn_pattern`, `add_decision`
4. ✅ **Configurar auto-detecção:** Teste se os paths funcionam com `identify_context`

---

**Versão:** 2.1.0  
**Feature:** Runtime Project Creation  
**Data:** Janeiro 2025
