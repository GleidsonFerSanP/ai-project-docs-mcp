# Sistema de Auto-Aprendizado - JARVIS MCP

## 🎯 Problema Resolvido

**Antes:** Agent esquece contratos/interfaces importantes e fica criando implementações que violam padrões do projeto.

**Agora:** MCP aprende e persiste conhecimento sobre contratos, padrões e decisões arquiteturais. Agent **NUNCA MAIS** vai esquecer!

## 🧠 Como Funciona

### 1. **Contract Registry** - Contratos Críticos
Registre interfaces/contratos que **DEVEM** ser respeitados sempre.

### 2. **Pattern Learning** - Padrões do Projeto
Ensine padrões específicos do seu projeto ao MCP.

### 3. **Project Scanning** - Análise Automática
Escanei automaticamente o código para extrair padrões.

### 4. **Validation** - Verificação Automática
Valide se novas implementações respeitam contratos.

### 5. **Architectural Decisions** - Memória de Decisões
Registre decisões importantes que agents devem respeitar.

---

## 🚀 Guia de Uso

### Cenário 1: Registrando um Contrato Crítico

**Seu problema:** Você tem uma interface `ISolutionAdapter` que TODAS as soluções devem implementar, mas o agent sempre esquece.

**Solução:**

```typescript
// No chat com o agent, envie:
"Registre este contrato crítico que todas as soluções devem respeitar"
```

O agent usará `register_contract`:
```json
{
  "name": "ISolutionAdapter",
  "context": "backend",
  "description": "Contrato que define como todas as soluções devem se comunicar com o frontend",
  "interface_code": "export interface ISolutionAdapter<TInput, TOutput> {\n  execute(input: TInput): Promise<ApiResponse<TOutput>>;\n  validate(input: TInput): boolean;\n  getName(): string;\n}",
  "rules": [
    "Todas as implementações devem ter método execute() que retorna Promise<ApiResponse<T>>",
    "Deve implementar método validate() para validar entrada",
    "Deve ter método getName() retornando nome único da solução",
    "Nunca lance exceções diretas, sempre retorne no ApiResponse.error"
  ],
  "examples": [
    "class OpenAISolutionAdapter implements ISolutionAdapter<CommandInput, CommandResult> { ... }"
  ],
  "file_path": "src/core/interfaces/solution-adapter.interface.ts"
}
```

**Resultado:**
✅ Contrato persistido em `knowledge/contracts.json`  
✅ Agent **SEMPRE** checará este contrato antes de criar implementações  
✅ Validação automática de novas implementações

---

### Cenário 2: Validando Implementações

**Antes de criar nova solução:**

```typescript
// Agent pode usar: validate_contract
```

```json
{
  "contract_name": "ISolutionAdapter",
  "code": "class NewSolution implements ISolutionAdapter { ... }"
}
```

**Resposta:**
```json
{
  "valid": false,
  "violations": [
    "Missing required method: validate()",
    "execute() not returning Promise<ApiResponse<T>>"
  ],
  "suggestion": "Corrija as violações antes de prosseguir"
}
```

Agent **automaticamente** corrige antes de continuar!

---

### Cenário 3: Ensinando Padrões

**Seu problema:** Você usa um padrão específico de error handling que o agent não conhece.

**Solução:**

```typescript
// No chat:
"Aprenda este padrão de error handling que usamos no projeto"
```

```json
{
  "name": "Domain Error Handling",
  "context": "backend",
  "description": "Padrão de tratamento de erros na camada de domínio",
  "pattern": "try {\n  // business logic\n} catch (error) {\n  if (error instanceof DomainException) {\n    return { success: false, error: { code: error.code, message: error.message } };\n  }\n  throw error; // Re-throw unexpected errors\n}",
  "examples": [
    "src/application/use-cases/create-user.use-case.ts",
    "src/application/use-cases/process-command.use-case.ts"
  ]
}
```

**Resultado:**
✅ Padrão persistido  
✅ Agent usa este padrão em novos códigos  
✅ Consistência em todo o projeto

---

### Cenário 4: Escaneando Projeto Automaticamente

**Primeira vez configurando MCP:**

```typescript
// No chat:
"Escanei o projeto backend em /caminho/do/projeto/backend"
```

```json
{
  "project_path": "/Users/seu-usuario/projetos/jarvis/backend",
  "context": "backend"
}
```

**Resultado:**
```json
{
  "files_scanned": 145,
  "interfaces_found": ["ISolutionAdapter", "ICommandRepository", "IUserRepository", ...],
  "classes_found": ["CommandService", "UserService", ...]
}
```

**Próximo passo:**
```
"Registre as interfaces ISolutionAdapter, ICommandRepository e IUserRepository como contratos críticos"
```

Agent extrai automaticamente do código e registra!

---

### Cenário 5: Registrando Decisões Arquiteturais

**Você toma uma decisão importante:**

```typescript
// No chat:
"Registre esta decisão arquitetural: Usaremos CQRS apenas para módulos de relatórios, não para todo o sistema"
```

```json
{
  "title": "CQRS apenas para módulos de relatórios",
  "context": "Avaliamos usar CQRS em todo o sistema, mas a complexidade não justifica. Apenas relatórios têm leitura/escrita com padrões muito diferentes.",
  "decision": "Implementar CQRS (Command Query Responsibility Segregation) apenas no módulo de relatórios. Demais módulos usam padrão tradicional de Use Cases.",
  "positive_consequences": [
    "Simplicidade mantida na maior parte do sistema",
    "Performance otimizada em relatórios",
    "Escalabilidade onde realmente importa"
  ],
  "negative_consequences": [
    "Inconsistência arquitetural entre módulos",
    "Curva de aprendizado para desenvolvedores"
  ],
  "alternatives": [
    "CQRS em todo sistema - rejeitado por over-engineering",
    "Nenhum CQRS - rejeitado por problemas de performance em relatórios"
  ]
}
```

**Resultado:**
✅ ADR-001 criado  
✅ Agent respeitará esta decisão  
✅ Nunca mais sugerirá CQRS fora de relatórios

---

## 📋 Fluxo Completo de Onboarding

### Primeira Vez Usando o MCP

**1. Escanear Projeto**
```
"Escanei o projeto backend em /caminho/projeto/backend"
"Escanei o projeto frontend em /caminho/projeto/frontend"
```

**2. Registrar Contratos Críticos**
```
"Das interfaces encontradas, registre ISolutionAdapter, IRepository e IUseCase como contratos críticos"
```

**3. Ensinar Padrões Específicos**
```
"Aprenda o padrão de injeção de dependência que usamos"
"Aprenda nosso padrão de validação de DTOs"
"Aprenda como estruturamos testes"
```

**4. Registrar Decisões Importantes**
```
"Registre que usamos PostgreSQL (não MongoDB) para dados transacionais"
"Registre que frontend usa Signals (não RxJS) para state management simples"
```

**5. Validação Contínua**
A partir de agora, agent **automaticamente**:
- ✅ Checa contratos antes de criar implementações
- ✅ Aplica padrões aprendidos
- ✅ Respeita decisões arquiteturais
- ✅ Mantém consistência

---

## 🔄 Uso Diário

### Desenvolvendo Nova Feature

**Agent (automaticamente):**
1. Identifica contexto (backend/frontend)
2. Busca contratos relevantes
3. Valida implementação contra contratos
4. Aplica padrões aprendidos
5. Respeita decisões arquiteturais

**Você:** Só precisa revisar, não reexplicar!

### Adicionando Novo Padrão

Quando você cria algo novo que deve se tornar padrão:

```
"Aprenda este padrão de [nome] que usarei daqui pra frente"
```

MCP atualiza knowledge base automaticamente.

---

## 📁 Estrutura de Conhecimento

```
knowledge/
├── contracts.json      # Contratos registrados
├── patterns.json       # Padrões aprendidos
└── decisions.json      # ADRs (Architectural Decision Records)

docs/
├── contracts/
│   ├── backend/       # Docs detalhados de contratos backend
│   └── frontend/      # Docs detalhados de contratos frontend
├── patterns/          # Documentação de padrões
└── architecture-decisions/  # ADRs em markdown
```

---

## 🎓 Melhores Práticas

### ✅ FAÇA

1. **Registre contratos logo no início do projeto**
2. **Ensine padrões conforme os define**
3. **Valide implementações críticas**
4. **Documente decisões importantes**
5. **Atualize conhecimento quando padrões evoluem**

### ❌ NÃO FAÇA

1. **Registrar TUDO como contrato** - só o crítico
2. **Ensinar padrões óbvios** - apenas específicos do projeto
3. **Esquecer de atualizar** quando padrões mudam
4. **Registrar decisões triviais** - só arquiteturais

---

## 🔧 Troubleshooting

### Agent ainda está criando código que viola contratos

**Solução:**
```
"Busque contratos registrados para [contexto]"
"Valide esta implementação contra o contrato [nome]"
```

Lembre o agent explicitamente.

### Conhecimento não persiste entre sessões

**Verificar:**
1. Arquivos em `knowledge/` estão sendo criados?
2. Permissões de escrita no diretório?
3. MCP foi rebuilded após mudanças? (`npm run build`)

### Agent não encontra contratos

**Verificar:**
```
"Liste todos os contratos registrados"
```

Se vazio, re-registre contratos.

---

## 🚀 Próximos Passos

1. **Build e instale o MCP atualizado**
```bash
cd jarvis-docs-mcp
npm install
npm run build
```

2. **Reinicie o VS Code** (para recarregar MCP)

3. **Comece o onboarding:**
```
"Escanei meu projeto e registre contratos críticos"
```

4. **Desenvolva normalmente!** Agent agora tem memória 🧠

---

## 💡 Dica de Ouro

**Crie um "ritual de aprendizado":**

Sempre que:
- ✨ Criar novo contrato importante → `register_contract`
- 🎨 Definir novo padrão → `learn_pattern`
- 🏗️ Tomar decisão arquitetural → `add_decision`

**Em 1 semana:** Seu MCP conhecerá seu projeto melhor que qualquer documentação!

---

**Dúvidas?** O MCP é auto-explicativo. Apenas pergunte:
```
"Como registro um contrato?"
"Como valido implementações?"
"Mostre contratos registrados"
```
