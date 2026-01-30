# Progressive Context Enrichment Configuration

> Configuration and patterns for implementing progressive context loading in the MCP.

## Principle

Instead of loading all project data upfront, expose tools that let agents fetch context just-in-time:

```
Agent Request → Light Initial Context → Need More? → Tool Call → Focused Data
```

## Implementation Patterns

### 1. Lazy Loading via Tools

Each tool returns minimal data with pointers to more:

```typescript
// Bad: Return everything
get_project_info() → { ...all_guidelines, ...all_contracts, ...all_patterns, ...all_docs }

// Good: Return summary with references
get_project_info() → {
  summary: "...",
  available: {
    guidelines: 5,
    contracts: 3,
    patterns: 8
  },
  fetch_with: ["get_guidelines", "get_contracts", "get_patterns"]
}
```

### 2. Scoped Retrieval

Tools accept filters to narrow results:

```typescript
// Broad (avoid)
get_contracts()

// Scoped (prefer)
get_contracts({ context: "backend", search: "payment" })
```

### 3. Pagination and Limits

For large datasets:

```typescript
list_documentation({
  context: "backend",
  limit: 10,
  offset: 0
})
```

## Tool Design Guidelines

### Minimal Metadata in System Prompt

Only essential tool descriptions loaded at start:
* Tool name
* Brief description
* Key parameters

Full documentation available via `get_tool_help({ tool: "name" })` .

### Self-Descriptive Results

Tool results include hints for next steps:

```json
{
  "result": { "contracts": [...] },
  "related": ["IPaymentGateway relates to IOrderService"],
  "next_actions": ["validate_contract", "get_contract_examples"]
}
```

### Context Size Awareness

Tools can accept `max_tokens` hint:

```typescript
get_guidelines({
  context: "backend",
  max_tokens: 500  // Summarize if exceeds
})
```

## Session Context Strategy

### Initial Load (Minimal)

```
Session Start:
1. Project ID + basic metadata
2. Active session focus (if any)
3. Tool availability (names only)
```

### On-Demand Load

```
When coding → get_merged_guidelines()
When implementing interface → get_contracts()
When creating docs → check_existing_documentation()
```

### Compaction Triggers

Compact context when:
* Tool results exceed threshold
* Conversation exceeds N turns
* Context approaches window limit

## Configuration Options

```json
{
  "progressive_context": {
    "enabled": true,
    "initial_load": ["project_id", "session_focus"],
    "lazy_load": ["guidelines", "contracts", "patterns", "docs"],
    "compaction": {
      "threshold_tokens": 50000,
      "preserve": ["decisions", "current_focus", "last_checkpoint"],
      "discard": ["old_tool_results", "exploration_history"]
    }
  }
}
```

## Anti-Patterns

### ❌ Eager Loading

```typescript
// Bad: Load everything on session start
start_session() → loads all guidelines, contracts, patterns, docs
```

### ❌ Unscoped Queries

```typescript
// Bad: No filters
get_all_documentation()

// Good: Targeted
get_documentation({ context: "backend", type: "api" })
```

### ❌ Large Inline Results

```typescript
// Bad: Embed full content
{ file: "auth.ts", content: "...5000 lines..." }

// Good: Reference
{ file: "auth.ts", lines: 5000, read_with: "read_file({ path: 'auth.ts', lines: '1-50' })" }
```

## Metrics to Track

* Average tokens per tool call
* Context utilization percentage
* Compaction frequency
* Session coherence (goal completion rate)

## References

* [Anthropic Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
* [Progressive Context Enrichment](https://www.inferable.ai/blog/posts/llm-progressive-context-encrichment)
