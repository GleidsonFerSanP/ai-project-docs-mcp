# Exemplo: Registrando Seu Primeiro Contrato

## Problema

Você tem uma interface `ISolutionAdapter` que define como todas as soluções devem se comunicar com o frontend. O agent continua criando implementações que não respeitam esse contrato.

## Solução

### 1. Defina o contrato no código (se ainda não existe)

```typescript
// src/core/interfaces/solution-adapter.interface.ts

/**
 * Contrato que todas as soluções devem implementar.
 * 
 * Este é o ÚNICO ponto de comunicação entre soluções (backend)
 * e o consumidor (frontend). Todas as implementações DEVEM
 * respeitar este contrato.
 */
export interface ISolutionAdapter<TInput, TOutput> {
  /**
   * Executa a solução com o input fornecido.
   * 
   * @param input - Dados de entrada para a solução
   * @returns Promise com resultado encapsulado em ApiResponse
   * 
   * IMPORTANTE: Nunca lance exceções diretamente.
   * Sempre retorne erro via ApiResponse.error
   */
  execute(input: TInput): Promise<ApiResponse<TOutput>>;

  /**
   * Valida se o input é válido antes de executar.
   * 
   * @param input - Dados a validar
   * @returns true se válido, false caso contrário
   */
  validate(input: TInput): boolean;

  /**
   * Retorna nome único da solução.
   * Usado para logging e identificação.
   */
  getName(): string;
}

/**
 * Formato padrão de resposta da API.
 * Usado em todas as comunicações backend <-> frontend.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
  };
}
```

### 2. Registre no MCP

Abra o chat com o agent e diga:

```
"Registre este contrato crítico do projeto. Leia o arquivo 
src/core/interfaces/solution-adapter.interface.ts e registre 
a interface ISolutionAdapter como um contrato que TODAS as 
implementações de soluções devem respeitar."
```

Ou registre manualmente via tool:

```json
{
  "tool": "register_contract",
  "arguments": {
    "name": "ISolutionAdapter",
    "context": "backend",
    "description": "Contrato que define como todas as soluções devem se comunicar. É o ÚNICO ponto de interface entre backend e frontend para execução de soluções.",
    "interface_code": "export interface ISolutionAdapter<TInput, TOutput> {\n  execute(input: TInput): Promise<ApiResponse<TOutput>>;\n  validate(input: TInput): boolean;\n  getName(): string;\n}",
    "rules": [
      "DEVE implementar interface ISolutionAdapter<TInput, TOutput>",
      "DEVE ter método execute() retornando Promise<ApiResponse<TOutput>>",
      "DEVE ter método validate() retornando boolean",
      "DEVE ter método getName() retornando string única",
      "NUNCA lance exceções diretamente - sempre retorne via ApiResponse.error",
      "SEMPRE valide input antes de executar",
      "Use tipos genéricos TInput e TOutput para type safety"
    ],
    "examples": [
      "export class OpenAISolutionAdapter implements ISolutionAdapter<CommandInput, CommandResult> {\n  async execute(input: CommandInput): Promise<ApiResponse<CommandResult>> {\n    try {\n      if (!this.validate(input)) {\n        return { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid input' } };\n      }\n      const result = await this.process(input);\n      return { success: true, data: result };\n    } catch (error) {\n      return { success: false, error: { code: 'EXECUTION_ERROR', message: error.message } };\n    }\n  }\n  validate(input: CommandInput): boolean {\n    return !!input.text && input.text.length > 0;\n  }\n  getName(): string {\n    return 'OpenAI-GPT4';\n  }\n}"
    ],
    "file_path": "src/core/interfaces/solution-adapter.interface.ts"
  }
}
```

### 3. Verifique o registro

```
"Liste todos os contratos registrados"
```

Você verá:

```json
{
  "contracts": [
    {
      "id": "isolutionadapter",
      "name": "ISolutionAdapter",
      "context": "backend",
      "description": "Contrato que define como todas as soluções devem se comunicar...",
      "rules": [
        "DEVE implementar interface ISolutionAdapter<TInput, TOutput>",
        "..."
      ]
    }
  ],
  "reminder": "SEMPRE respeite estes contratos ao criar novas implementações!"
}
```

### 4. Use automaticamente

Agora, quando você pedir:

```
"Crie uma nova solução chamada ClaudeSolutionAdapter"
```

O agent **automaticamente**:
1. ✅ Busca contrato ISolutionAdapter
2. ✅ Implementa respeitando todas as regras
3. ✅ Valida implementação
4. ✅ Não esquece nenhum método

**Resultado:**

```typescript
export class ClaudeSolutionAdapter implements ISolutionAdapter<CommandInput, CommandResult> {
  async execute(input: CommandInput): Promise<ApiResponse<CommandResult>> {
    // Validação obrigatória
    if (!this.validate(input)) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Command input is invalid',
        },
      };
    }

    try {
      // Processamento
      const result = await this.processWithClaude(input);
      
      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date(),
          requestId: generateRequestId(),
        },
      };
    } catch (error) {
      // Nunca lança exceção direta
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message,
        },
      };
    }
  }

  validate(input: CommandInput): boolean {
    return !!input.text && input.text.trim().length > 0;
  }

  getName(): string {
    return 'Claude-Sonnet-4';
  }

  private async processWithClaude(input: CommandInput): Promise<CommandResult> {
    // Implementação específica
  }
}
```

### 5. Validação Manual (opcional)

Se quiser verificar uma implementação antes de commitar:

```
"Valide esta implementação da ClaudeSolutionAdapter contra o contrato ISolutionAdapter"
```

```json
{
  "valid": true,
  "message": "✅ Código respeita o contrato 'ISolutionAdapter'"
}
```

---

## Próximos Passos

1. **Registre outros contratos críticos:**
   - `IRepository<T>` - Padrão de repositório
   - `IUseCase<TInput, TOutput>` - Padrão de use case
   - `IValidator<T>` - Validadores

2. **Ensine padrões específicos:**
   

```
   "Aprenda nosso padrão de injeção de dependência"
   "Aprenda como estruturamos testes unitários"
   ```

3. **Registre decisões arquiteturais:**
   

```
   "Registre que usamos ISolutionAdapter ao invés de classes diretas para permitir troca de implementações"
   ```

---

## Dica Pro

Crie um ritual ao definir novas abstrações importantes:

```typescript
// 1. Define interface
export interface INewContract { }

// 2. Imediatamente registre no MCP
"Registre INewContract como contrato crítico"

// 3. Documente decisão
"Registre a decisão de usar INewContract para [motivo]"
```

Assim seu MCP sempre estará sincronizado com o projeto! 🎯
