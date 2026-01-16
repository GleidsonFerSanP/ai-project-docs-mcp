# Regras de Documentação - Projeto JARVIS

## Princípio Fundamental

**Documentação é código comentado de forma inteligente, não arquivos .md desnecessários.**

## O QUE DOCUMENTAR

### ✅ SEMPRE Documentar (Criar arquivo .md)

1. **Arquitetura de Sistema**
   - Decisões arquiteturais importantes
   - Diagramas de fluxo de dados críticos
   - Integrações com sistemas externos
   - Exemplo: `architecture-decisions.md` , `integration-flow.md`

2. **APIs Públicas**
   - Endpoints expostos externamente
   - Contratos de API para consumidores externos
   - Exemplo: `api-reference.md`

3. **Setup e Configuração Inicial**
   - README.md com instruções de instalação
   - Variáveis de ambiente necessárias
   - Pré-requisitos do projeto
   - Exemplo: `README.md` , `SETUP.md`

4. **Fluxos de Negócio Complexos**
   - Processos que envolvem múltiplos sistemas
   - Regras de negócio não óbvias pelo código
   - Exemplo: `payment-flow.md` , `authentication-flow.md`

5. **Troubleshooting Comum**
   - Problemas conhecidos e soluções
   - FAQ para desenvolvedores
   - Exemplo: `TROUBLESHOOTING.md`

### ⚠️ DOCUMENTAR Inline (Comentários no código)

1. **Lógica Complexa**

```typescript
// Calculate retry delay using exponential backoff with jitter
// Formula: min(maxDelay, baseDelay * 2^attempt) + random(0, 1000)
// This prevents thundering herd problem when services restart
const delay = Math.min(
  this.maxDelay,
  this.baseDelay * Math.pow(2, attempt)
) + Math.random() * 1000;
```

2. **Workarounds e Hacks Temporários**

```typescript
// FIXME: Temporary workaround for API v1 compatibility
// Remove after all clients migrate to API v2 (target: Q2 2026)
// Issue: #1234
if (legacyClient) {
  return this.transformToLegacyFormat(data);
}
```

3. **Business Rules no Domain**

```typescript
export class Order {
  /**
   * Validates if order can be cancelled.
   * 
   * Business Rules:
   * - Orders cannot be cancelled after 24h of creation
   * - Orders with status 'shipped' cannot be cancelled
   * - Cancellation requires manager approval for orders > $1000
   * 
   * @throws {OrderCancellationException} if validation fails
   */
  canBeCancelled(): boolean {
    // Implementation
  }
}
```

4. **Explicações de Algoritmos**

```typescript
/**
 * Implements Levenshtein distance algorithm to calculate
 * similarity between user commands and known intents.
 * 
 * Time complexity: O(m*n) where m and n are string lengths
 * Space complexity: O(m*n) - can be optimized to O(min(m,n))
 * 
 * @see https://en.wikipedia.org/wiki/Levenshtein_distance
 */
private calculateSimilarity(str1: string, str2: string): number {
  // Implementation
}
```

### ❌ NUNCA Documentar

1. **Código Auto-Explicativo**

```typescript
// ❌ NÃO FAÇA ISSO
// Get user by id
const user = await this.userRepository.findById(id);

// ✅ O código já é claro, não precisa comentário
const user = await this.userRepository.findById(id);
```

2. **Mudanças Triviais em Componentes**

```typescript
// ❌ NÃO CRIAR: component-changes.md
// ❌ NÃO CRIAR: update-log.md
// O Git history já registra essas mudanças
```

3. **Implementações Óbvias**

```typescript
// ❌ NÃO FAÇA ISSO
/**
 * Sets the name
 * @param name - the name to set
 */
setName(name: string) {
  this.name = name;
}

// ✅ Remova comentários óbvios
setName(name: string) {
  this.name = name;
}
```

4. **TODOs Pessoais**

```typescript
// ❌ NÃO FAÇA ISSO
// TODO: revisar isso amanhã
// TODO: melhorar performance aqui

// ✅ FAÇA ISSO (com contexto e tracking)
// TODO(#1234): Optimize query performance - current load time: 5s, target: <1s
// TODO(gleidsonfersanp): Add input validation before beta release
```

## FORMATOS DE DOCUMENTAÇÃO

### JSDoc para TypeScript

#### Functions/Methods

```typescript
/**
 * Processes a user command using NLP and executes the corresponding action.
 * 
 * @param command - The command text from the user
 * @param userId - ID of the user executing the command
 * @param context - Optional execution context with previous commands
 * @returns Promise resolving to command execution result
 * @throws {InvalidCommandException} If command format is invalid
 * @throws {UnauthorizedException} If user lacks permission
 * 
 * @example
 * ```typescript
 * const result = await processCommand(
 *   "turn on the lights",
 *   "user-123",
 *   { previousCommand: "dim lights to 50%" }
 * );
 * ```

 */
async processCommand(
  command: string, 
  userId: string, 
  context?: CommandContext
): Promise<CommandResult> {
  // Implementation
}

```

#### Interfaces e Types

```typescript
/**
 * Represents a command in the JARVIS system.
 * 
 * Commands are user instructions that trigger specific actions
 * within the system or connected devices.
 */
interface Command {
  /** Unique identifier */
  id: string;
  
  /** Raw command text from user */
  text: string;
  
  /** Detected intent after NLP processing */
  intent: Intent;
  
  /** Current execution status */
  status: CommandStatus;
  
  /** ISO timestamp of command creation */
  createdAt: Date;
}
```

### README Structure (Root do projeto)

```markdown
# Projeto JARVIS

## O que é?

[1-2 parágrafos sobre o projeto]

## Quick Start

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
ng serve
```

## Stack

* Backend: NestJS + PostgreSQL
* Frontend: Angular + Material
* Infrastructure: Docker + AWS

## Estrutura

```
/
├── backend/         # NestJS API
├── frontend/        # Angular App
└── docs/            # Documentação
```

## Links Úteis

* [Architecture Decisions](docs/architecture-decisions.md)
* [API Reference](docs/api-reference.md)
* [Troubleshooting](docs/TROUBLESHOOTING.md)

## Contribuindo

[Link para CONTRIBUTING.md se houver]

```

### Feature Documentation (Quando necessário)

```markdown
# Command Processing Module

## Propósito

Processa comandos de linguagem natural do usuário e executa ações correspondentes.

## Arquitetura

[Diagrama ou explicação de fluxo]

## Componentes Principais

- **CommandController**: Recebe requisições HTTP
- **ProcessCommandUseCase**: Orquestra processamento
- **IntentService**: Detecta intenção via NLP
- **CommandExecutor**: Executa ação correspondente

## Fluxo de Dados

1. User → Controller (HTTP POST)
2. Controller → UseCase
3. UseCase → IntentService (detecta intenção)
4. UseCase → CommandExecutor (executa)
5. Result → User

## Integrações

- OpenAI API para NLP
- Redis para cache de intents
- WebSocket para feedback em tempo real

## Configuração

```env
OPENAI_API_KEY=xxx
REDIS_URL=xxx
```

## Exemplos

[Exemplos práticos de uso]

```

## REGRAS PARA AI AGENTS

### Quando uma tarefa é solicitada:

1. **Identifique o contexto**
   - Backend ou Frontend?
   - Feature nova ou modificação?
   - Complexidade: simples, média, alta?

2. **Para mudanças SIMPLES:**
   - Implemente o código
   - Adicione comentários inline APENAS se lógica não for óbvia
   - Não crie documentos .md

3. **Para mudanças MÉDIAS:**
   - Implemente o código
   - Documente via JSDoc/comments
   - Atualize README se houver novos comandos/scripts
   - Não crie documentos .md separados

4. **Para mudanças COMPLEXAS:**
   - Implemente o código
   - Documente via JSDoc/comments
   - Pergunte ao usuário: "Esta mudança afeta a arquitetura ou requer documentação separada?"
   - SE SIM: crie documento focado em arquitetura/decisões
   - SE NÃO: apenas código + comentários

5. **NUNCA:**
   - Criar arquivo .md para "registrar mudanças"
   - Criar changelog manual (use git commits)
   - Documentar o óbvio
   - Criar "summary.md" ou "changes.md"

### Checklist Antes de Documentar

Antes de criar um arquivo .md, pergunte:

- [ ] Esta informação estará desatualizada em 1 mês?
- [ ] O código com bons nomes já explica isso?
- [ ] Isso é responsabilidade do Git history?
- [ ] Isso beneficia apenas uma pessoa temporariamente?

Se respondeu SIM a qualquer uma: **NÃO DOCUMENTE em .md**

Se respondeu NÃO a todas E é uma decisão arquitetural/setup/fluxo crítico: **DOCUMENTE**

## MANUTENÇÃO DE DOCUMENTAÇÃO

### Quando atualizar documentação existente:

1. **README.md**: Sempre que comandos/setup mudar
2. **API docs**: Sempre que endpoints mudarem
3. **Architecture docs**: Apenas em mudanças significativas
4. **Inline comments**: Sempre que lógica mudar

### Como atualizar:

```typescript
// ✅ BOM: Atualizar comentário junto com código
/**
 * Validates command format.
 * 
 * Updated: 2026-01-04 - Added support for multi-line commands
 */
validateCommand(text: string): boolean {
  // New implementation
}

// ❌ RUIM: Documentar em arquivo separado que ficará desatualizado
```

## TEMPLATES

### Para Decisões Arquiteturais (ADR)

```markdown
# ADR-001: [Título da Decisão]

## Status

[Proposto | Aceito | Rejeitado | Deprecated]

## Contexto

[Por que precisamos tomar essa decisão?]

## Decisão

[O que decidimos fazer?]

## Consequências

### Positivas
- [Lista de benefícios]

### Negativas

- [Lista de trade-offs]

## Alternativas Consideradas

- [Opção 1]: [Por que não escolhemos]
- [Opção 2]: [Por que não escolhemos]
```

### Para Troubleshooting

```markdown
# Problema: [Descrição]

## Sintomas

- [Como o problema se manifesta]

## Causa Raiz

[Por que acontece]

## Solução

```bash
# Comandos ou passos para resolver
```

## Prevenção

[Como evitar que aconteça novamente]
```

---

## RESUMO RÁPIDO

**Pergunte-se sempre:**

> "Esta documentação ainda será relevante daqui 6 meses? Ela ajuda o próximo dev a entender algo que o código sozinho não explica?"

**Se SIM:** Documente de forma concisa
**Se NÃO:** Melhore o código para ser auto-explicativo
