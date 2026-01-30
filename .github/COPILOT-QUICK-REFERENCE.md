---
description: Core instructions for AI agents using Project Docs MCP. Load at conversation start for context awareness.
---

# Project Docs MCP - Agent Instructions

## Quick Start (Every Conversation)

```typescript
// 1. Identify context
identify_context({ file_path: "current/path" })

// 2. Check for active session
get_current_focus({ project_id: "detected" })

// 3. Load guidelines (if coding)
get_merged_guidelines({ context: "backend|frontend" })

// 4. Start/resume session
start_session({ context: "backend", current_focus: "specific task" })
```

## Core Workflow

```
Context → Focus → Guidelines → Work → Checkpoint → Repeat
```

| Step | Tool | When |
|------|------|------|
| Identify | `identify_context` | Every conversation start |
| Focus | `get_current_focus` / `start_session` | After identify |
| Guidelines | `get_merged_guidelines` | Before coding |
| Contracts | `get_contracts` | Before implementing interfaces |
| Checkpoint | `create_checkpoint` | After completing steps |
| Complete | `complete_session` | When task done |

## Focus Examples

✅ Good:
* "Implement JWT auth following IAuthService"
* "Fix timeout in db connection pool"

❌ Bad:
* "Working on stuff"
* "Fix bugs"

## Critical Rules

1. **Context before code** - Never code without `identify_context`
2. **Check contracts** - Validate before implementing interfaces
3. **Checkpoint regularly** - Every 5-10 messages
4. **Refresh context** - Every 10 turns or 30 min

## Detailed References

For detailed workflows, see:
* **Sessions**: [SESSION-WORKFLOW.md](../docs/skills/SESSION-WORKFLOW.md)
* **Contracts**: [CONTRACT-REFERENCE.md](../docs/skills/CONTRACT-REFERENCE.md)
* **Documentation**: [DOCUMENTATION-WORKFLOW.md](../docs/skills/DOCUMENTATION-WORKFLOW.md)
* **Patterns**: [PATTERNS-REFERENCE.md](../docs/skills/PATTERNS-REFERENCE.md)
* **Context Engineering**: [CONTEXT-ENGINEERING.md](../docs/_shared/CONTEXT-ENGINEERING.md)

## Conversation Checklist

```
Before responding:
- [ ] Context identified
- [ ] Session active
- [ ] Guidelines loaded (if coding)
- [ ] Contracts checked (if interfaces)

After work:
- [ ] Checkpoint created
- [ ] Files validated
- [ ] Focus updated (if changed)
```
