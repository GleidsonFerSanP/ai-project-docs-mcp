# Contract Registry - JARVIS Project

## O que são Contratos?

Contratos são **interfaces e abstrações críticas** que definem como diferentes partes do sistema devem se comunicar. São a "lei" do projeto que **NUNCA** deve ser violada.

## Contratos Registrados

### Backend Contracts

Nenhum contrato registrado ainda. Use a tool `register_contract` para adicionar.

### Frontend Contracts

Nenhum contrato registrado ainda. Use a tool `register_contract` para adicionar.

---

## Como Registrar um Contrato

Use a ferramenta MCP `register_contract` :

```json
{
  "name": "ISolutionAdapter",
  "context": "backend",
  "description": "Contrato que todas as soluções devem implementar",
  "interface_code": "...",
  "rules": [
    "Todas as implementações devem ter método execute()",
    "Resultado deve seguir padrão ApiResponse<T>"
  ],
  "examples": ["..."]
}
```

O agent **automaticamente** respeitará esse contrato em novas implementações.

---

*Este arquivo é auto-gerenciado pelo MCP Server*
