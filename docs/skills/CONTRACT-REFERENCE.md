# Contract Reference

## Contents

* What Are Contracts
* Retrieving Contracts
* Validating Code
* Registering New Contracts
* Common Contract Patterns

---

## What Are Contracts

Contracts are **critical interfaces** that implementations MUST respect. They:
* Define expected behavior
* Specify method signatures
* Include implementation rules
* Prevent breaking changes

---

## Retrieving Contracts

```typescript
// Get all contracts for context
get_contracts({ context: "backend" })

// Search specific contract
get_contracts({ 
  context: "backend",
  search: "payment"
})
```

---

## Validating Code

Before implementing an interface:

```typescript
validate_contract({
  contract_name: "IPaymentGateway",
  code: `
    class StripeGateway implements IPaymentGateway {
      async processPayment(amount: number): Promise<Result> {
        // implementation
      }
    }
  `
})
```

**If validation fails:**
1. Alert user immediately
2. Explain the violation
3. Suggest compliant implementation

---

## Registering New Contracts

```typescript
register_contract({
  name: "IUserRepository",
  context: "backend",
  description: "Repository for user data access",
  interface_code: `
    interface IUserRepository {
      findById(id: string): Promise<User | null>;
      findByEmail(email: string): Promise<User | null>;
      save(user: User): Promise<User>;
      delete(id: string): Promise<void>;
    }
  `,
  rules: [
    "Must handle null for non-existent users",
    "save() must be idempotent",
    "delete() must soft-delete by default"
  ],
  examples: [
    "class PostgresUserRepository implements IUserRepository { ... }"
  ]
})
```

---

## Common Contract Patterns

### Repository Pattern

```typescript
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
```

### Service Pattern

```typescript
interface IService {
  execute(input: Input): Promise<Output>;
  validate(input: Input): ValidationResult;
}
```

### Gateway Pattern

```typescript
interface IGateway {
  send(request: Request): Promise<Response>;
  healthCheck(): Promise<boolean>;
}
```

---

## Contract Checklist

Before implementing:

```
Contract Validation:
- [ ] Contract retrieved from registry
- [ ] Method signatures match exactly
- [ ] All rules understood
- [ ] Error handling follows contract
- [ ] Tests cover contract requirements
```
