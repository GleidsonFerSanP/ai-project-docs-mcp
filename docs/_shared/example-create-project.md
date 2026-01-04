# Exemplo Prático: Criando e Usando um Novo Projeto

## 🎯 Cenário

Vamos criar um novo projeto do zero: uma **API de E-commerce** com FastAPI e React.

## 📝 Passo a Passo Completo

### 1️⃣ Criar o Projeto

```typescript
// No chat, use o tool create_project
create_project({
  project_id: "ecommerce-api",
  name: "E-commerce API",
  description: "API REST para e-commerce com carrinho, pagamentos e gestão de produtos",
  paths: [
    "/ecommerce-api",
    "/ecommerce",
    "/api-ecommerce"
  ],
  stack: {
    backend: "FastAPI 0.109",
    frontend: "React 18 + TypeScript",
    database: "PostgreSQL 15",
    cache: "Redis 7",
    queue: "Celery",
    payment: "Stripe API"
  },
  principles: [
    "Clean Architecture",
    "Domain-Driven Design",
    "CQRS",
    "TDD",
    "API First Design",
    "RESTful Best Practices"
  ]
})
```

**Resposta esperada:**

```json
{
  "success": true,
  "message": "✅ Projeto 'ecommerce-api' criado com sucesso!...",
  "project_id": "ecommerce-api",
  "next_steps": [...]
}
```

### 2️⃣ Verificar Projeto Criado

```typescript
// Listar todos os projetos
list_projects()

// Resultado:
// - jarvis
// - automacao-n8n
// - ecommerce-api ← NOVO!
```

### 3️⃣ Mudar para o Novo Projeto

```typescript
switch_project({ project_id: "ecommerce-api" })

// Resposta:
// {
//   "success": true,
//   "message": "✅ Projeto alterado para 'ecommerce-api'"
// }
```

### 4️⃣ Ver Informações do Projeto

```typescript
get_project_info({ project_id: "ecommerce-api" })

// Resultado mostra:
// - Configuração completa
// - Paths para docs e knowledge
// - Stack tecnológico
// - Princípios
```

### 5️⃣ Testar Auto-Detecção

```typescript
// Simular que você está editando um arquivo do projeto
identify_context({
  file_path: "/home/user/ecommerce-api/backend/app/domain/product.py"
})

// Resposta:
// {
//   "project": "ecommerce-api",
//   "context": "backend",
//   "detected": true,
//   "message": "🔧 Backend - FastAPI (ecommerce-api)"
// }
```

### 6️⃣ Registrar Primeiro Contrato

```typescript
register_contract({
  // project_id não é necessário - já estamos no ecommerce-api
  name: "IProductRepository",
  context: "backend",
  description: "Interface do repositório de produtos com operações CRUD",
  interface_code: `
from abc import ABC, abstractmethod
from typing import List, Optional
from domain.product import Product

class IProductRepository(ABC):
    @abstractmethod
    async def create(self, product: Product) -> Product:
        """Cria um novo produto"""
        pass
    
    @abstractmethod
    async def get_by_id(self, product_id: str) -> Optional[Product]:
        """Busca produto por ID"""
        pass
    
    @abstractmethod
    async def list_all(self, skip: int = 0, limit: int = 100) -> List[Product]:
        """Lista todos os produtos com paginação"""
        pass
    
    @abstractmethod
    async def update(self, product_id: str, product: Product) -> Product:
        """Atualiza produto existente"""
        pass
    
    @abstractmethod
    async def delete(self, product_id: str) -> bool:
        """Remove produto"""
        pass
  `,
  rules: [
    "Todas as operações devem ser assíncronas (async/await)",
    "Usar type hints para todos os parâmetros e retornos",
    "Retornar None quando produto não for encontrado (get_by_id)",
    "Lançar exceções específicas de domínio (ProductNotFound, ValidationError)",
    "Paginação deve ter valores padrão (skip=0, limit=100)"
  ],
  examples: [
    "class PostgresProductRepository(IProductRepository): ...",
    "class MongoProductRepository(IProductRepository): ..."
  ],
  file_path: "/backend/app/domain/repositories/product_repository.py"
})

// Resposta:
// {
//   "success": true,
//   "message": "✅ Contrato 'IProductRepository' registrado no projeto 'ecommerce-api'",
//   "reminder": "A partir de agora, TODAS as implementações de 'IProductRepository' no projeto 'ecommerce-api' devem respeitar estas regras..."
// }
```

### 7️⃣ Registrar Padrão de Serviço

```typescript
learn_pattern({
  name: "service-layer-pattern",
  context: "backend",
  description: "Padrão para camada de serviços com validação e orquestração",
  pattern: `
from typing import List
from domain.repositories.product_repository import IProductRepository
from domain.entities.product import Product
from domain.exceptions import ProductNotFoundError, ValidationError

class ProductService:
    def __init__(self, repository: IProductRepository):
        self.repository = repository
    
    async def create_product(self, product_data: dict) -> Product:
        # 1. Validar dados
        self._validate_product_data(product_data)
        
        # 2. Criar entidade
        product = Product(**product_data)
        
        # 3. Regras de negócio
        if await self._is_duplicate_sku(product.sku):
            raise ValidationError("SKU já existe")
        
        # 4. Persistir
        return await self.repository.create(product)
    
    def _validate_product_data(self, data: dict) -> None:
        required = ['name', 'price', 'sku']
        if not all(k in data for k in required):
            raise ValidationError(f"Campos obrigatórios: {required}")
  `,
  examples: [
    "class OrderService: # Mesmo padrão para pedidos",
    "class PaymentService: # Mesmo padrão para pagamentos",
    "class CartService: # Mesmo padrão para carrinho"
  ]
})
```

### 8️⃣ Documentar Decisão Arquitetural

```typescript
add_decision({
  title: "Separação de Comandos e Consultas (CQRS)",
  context: "Sistema precisa de alta performance em leituras e garantir consistência em escritas",
  decision: "Implementar CQRS com repositórios separados para leitura (queries) e escrita (commands)",
  positive_consequences: [
    "Otimização independente de leitura e escrita",
    "Leituras podem usar views/materialized views para performance",
    "Escritas mantêm validações e regras de negócio",
    "Facilita implementação de Event Sourcing no futuro",
    "Escalabilidade: replicas para leitura, master para escrita"
  ],
  negative_consequences: [
    "Complexidade adicional no código",
    "Possível inconsistência eventual entre leitura e escrita",
    "Dois modelos de dados para manter",
    "Curva de aprendizado para equipe"
  ],
  alternatives: [
    "Repository único para leitura e escrita (mais simples, menos performático)",
    "Event Sourcing completo (mais complexo, muito mais escalável)",
    "Cache agressivo sem separação de modelos (menos flexível)"
  ]
})
```

### 9️⃣ Validar Implementação

```typescript
validate_contract({
  contract_name: "IProductRepository",
  code: `
class PostgresProductRepository(IProductRepository):
    def __init__(self, db_session):
        self.db = db_session
    
    async def create(self, product: Product) -> Product:
        # ... implementação
        return product
    
    async def get_by_id(self, product_id: str) -> Optional[Product]:
        # ... implementação
        return product or None
    
    # ... outros métodos
  `
})

// Resposta:
// {
//   "valid": true,
//   "message": "✅ Código respeita o contrato 'IProductRepository'"
// }
```

### 🔟 Buscar Contratos Registrados

```typescript
get_contracts({
  context: "backend"
})

// Resultado:
// {
//   "project": "ecommerce-api",
//   "message": "📋 1 contrato(s) encontrado(s) no projeto 'ecommerce-api'",
//   "contracts": [
//     {
//       "name": "IProductRepository",
//       "context": "backend",
//       "description": "...",
//       "rules": [...]
//     }
//   ]
// }
```

## 🎨 Estrutura Criada

Após todos esses passos, você tem:

```
jarvis-docs-mcp/
├── mcp-config.json ← Atualizado com ecommerce-api
├── docs/
│   └── ecommerce-api/
│       └── project-overview.md ← Criado automaticamente
└── knowledge/
    └── ecommerce-api/
        ├── contracts.json ← Contém IProductRepository
        ├── patterns.json ← Contém service-layer-pattern
        └── decisions.json ← Contém decisão CQRS
```

## 🔄 Trabalhando com Múltiplos Projetos

Agora você pode alternar entre projetos facilmente:

```typescript
// Trabalhar no JARVIS
switch_project({ project_id: "jarvis" })
get_contracts({ context: "backend" })
// Retorna contratos do JARVIS

// Trabalhar no E-commerce
switch_project({ project_id: "ecommerce-api" })
get_contracts({ context: "backend" })
// Retorna contratos do E-commerce (totalmente isolados!)

// Trabalhar na infraestrutura N8N
switch_project({ project_id: "automacao-n8n" })
get_contracts({ context: "infrastructure" })
// Retorna contratos de infraestrutura
```

## 💡 Dicas Avançadas

### Criar Projeto com Stack Completo

```typescript
create_project({
  project_id: "microservices-platform",
  name: "Microservices Platform",
  description: "Plataforma de microserviços com service mesh e observabilidade",
  paths: ["/platform", "/microservices"],
  stack: {
    orchestration: "Kubernetes 1.28",
    service_mesh: "Istio 1.20",
    api_gateway: "Kong",
    monitoring: "Prometheus + Grafana",
    logging: "ELK Stack",
    tracing: "Jaeger",
    cicd: "GitLab CI + ArgoCD",
    messaging: "Kafka",
    databases: "PostgreSQL + MongoDB + Redis"
  },
  principles: [
    "Microservices Architecture",
    "Domain-Driven Design",
    "Event-Driven Architecture",
    "Infrastructure as Code",
    "GitOps",
    "Observability First",
    "Defense in Depth",
    "Fail Fast"
  ]
})
```

### Auto-Detecção com Múltiplos Paths

```typescript
// Projeto detectado por qualquer um desses caminhos:
identify_context({ file_path: "/home/user/ecommerce-api/main.py" })
identify_context({ file_path: "/workspace/ecommerce/backend/app.py" })
identify_context({ file_path: "/projects/api-ecommerce/src/domain.py" })
// Todos detectam: project="ecommerce-api"
```

## 📚 Próximos Passos

1. ✅ Personalizar `docs/ecommerce-api/project-overview.md`
2. ✅ Adicionar mais contratos conforme você identifica interfaces críticas
3. ✅ Registrar padrões conforme você os estabelece
4. ✅ Documentar decisões importantes com `add_decision`
5. ✅ Usar `scan_project` para extrair interfaces automaticamente

---

**Projeto criado em runtime!** Sem editar arquivos, sem reiniciar servidor! 🚀
