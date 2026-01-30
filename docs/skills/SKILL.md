---
name: project-context-management
description: Manages AI agent context for software projects. Use when agents need project guidelines, contracts, patterns, documentation, or session focus. Triggers on mentions of: project context, guidelines, contracts, patterns, documentation, session, checkpoint.
---

# Project Context Management Skill

## Quick Start

Initialize context at conversation start:

```typescript
// 1. Identify project
identify_context({ file_path: "current/working/path" })

// 2. Load guidelines
get_merged_guidelines({ context: "backend" })

// 3. Start session
start_session({ context: "backend", current_focus: "task description" })
```

## Core Operations

**Session Management**: See [SESSION-WORKFLOW.md](SESSION-WORKFLOW.md)
**Contract Validation**: See [CONTRACT-REFERENCE.md](CONTRACT-REFERENCE.md)  
**Documentation**: See [DOCUMENTATION-WORKFLOW.md](DOCUMENTATION-WORKFLOW.md)
**Patterns**: See [PATTERNS-REFERENCE.md](PATTERNS-REFERENCE.md)

## Tool Quick Reference

| Operation | Tool | When |
|-----------|------|------|
| Start work | `identify_context` + `start_session` | Every conversation |
| Load rules | `get_merged_guidelines` | Before coding |
| Check contracts | `get_contracts` | Before implementing interfaces |
| Save progress | `create_checkpoint` | After completing steps |
| End work | `complete_session` | When task done |

## Workflow Checklist

Copy and track progress:

```
Task Progress:
- [ ] identify_context called
- [ ] guidelines loaded
- [ ] session started
- [ ] work completed
- [ ] checkpoint created
- [ ] session completed
```

## Decision Tree

```
Need to write code?
├─ YES → Load guidelines first
│        ├─ Implementing interface? → Check contracts
│        └─ Using patterns? → Get patterns
└─ NO → Just reading/researching
         └─ No special tools needed
```

## Anti-Patterns

❌ Starting code without `identify_context`

❌ Implementing interfaces without checking contracts
❌ Long sessions without checkpoints
❌ Creating docs without checking duplicates
