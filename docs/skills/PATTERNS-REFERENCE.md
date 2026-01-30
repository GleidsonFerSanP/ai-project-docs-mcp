# Patterns Reference

## Contents

* What Are Patterns
* Retrieving Patterns
* Learning New Patterns
* Common Pattern Categories
* Pattern Application

---

## What Are Patterns

Patterns are **reusable code structures** learned from the project:
* Naming conventions
* Code organization
* Implementation approaches
* Testing strategies

---

## Retrieving Patterns

```typescript
// Get patterns for context
get_guidelines({ 
  context: "backend",
  topic: "patterns"
})

// Or via complete context
get_complete_project_context({
  include_patterns: true
})
```

---

## Learning New Patterns

Teach the MCP a pattern:

```typescript
learn_pattern({
  name: "Repository Pattern",
  context: "backend",
  description: "Data access abstraction layer",
  pattern: `
    class ${EntityName}Repository extends BaseRepository<${EntityName}> {
      constructor(private db: Database) {
        super(db, '${table_name}');
      }
      
      async findByField(field: string): Promise<${EntityName}[]> {
        return this.db.query('SELECT * FROM ${table_name} WHERE field = ?', [field]);
      }
    }
  `,
  examples: [
    "UserRepository",
    "ProductRepository",
    "OrderRepository"
  ]
})
```

---

## Common Pattern Categories

### Backend Patterns

**Repository**

```typescript
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}
```

**Service**

```typescript
class UserService {
  constructor(private repo: IUserRepository) {}
  
  async createUser(data: CreateUserDto): Promise<User> {
    // validation + business logic
    return this.repo.save(user);
  }
}
```

**Factory**

```typescript
class PaymentGatewayFactory {
  static create(type: string): IPaymentGateway {
    switch(type) {
      case 'stripe': return new StripeGateway();
      case 'paypal': return new PayPalGateway();
      default: throw new Error('Unknown gateway');
    }
  }
}
```

### Frontend Patterns

**Component**

```typescript
interface Props {
  data: Data;
  onAction: (id: string) => void;
}

const Component: React.FC<Props> = ({ data, onAction }) => {
  // component logic
};
```

**Hook**

```typescript
function useCustomHook(param: string) {
  const [state, setState] = useState();
  // hook logic
  return { state, actions };
}
```

### Infrastructure Patterns

**Module**

```hcl
module "service" {
  source = "./modules/service"
  name   = var.service_name
  env    = var.environment
}
```

---

## Pattern Application

When implementing:

1. **Check existing patterns** for the task
2. **Follow the structure** exactly
3. **Adapt** only where necessary
4. **Document deviations** if any

---

## Pattern Checklist

```
Applying Pattern:
- [ ] Retrieved relevant patterns
- [ ] Understood pattern structure
- [ ] Applied consistently
- [ ] Adapted for specific needs
- [ ] No unnecessary deviations
```
