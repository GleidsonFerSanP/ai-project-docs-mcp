# Context Engineering Guide

> Best practices for managing AI agent context based on Anthropic's research and production experience.

## Contents

* Core Principles
* Progressive Context Enrichment
* Compaction Strategies
* Structured Note-Taking
* Sub-Agent Patterns
* Anti-Patterns

---

## Core Principles

### 1. Context is Finite

The context window is a shared resource. Every token competes for attention:
* System prompts
* Conversation history
* Tool metadata
* Your actual request

**Rule**: Find the smallest set of high-signal tokens that maximize desired outcomes.

### 2. Right Altitude

Balance between:
* ❌ **Too specific**: Brittle if-else logic for every edge case
* ❌ **Too vague**: High-level guidance without concrete signals
* ✅ **Just right**: Specific enough to guide, flexible enough to adapt

### 3. Assume Intelligence

Claude already knows common concepts. Only add what's unique:
* ❌ "PDF files are documents that contain text and images..."
* ✅ "Use pdfplumber for extraction"

---

## Progressive Context Enrichment

Instead of loading everything upfront, fetch context just-in-time:

```
Task Start → Need More Context? → Tool Call → Fetch Specific Data
     ↓              ↓
  Process      More Steps?
  Current         ↓
   Step      Task Complete
```

### Implementation

```typescript
// Bad: Dump everything
const allDocs = await getAllDocumentation();
// Context bloat!

// Good: Fetch what's needed
const relevantDocs = await searchDocumentation({ 
  query: "authentication",
  limit: 3 
});
```

### Benefits

* Focused attention on relevant data
* No context window limits on total data
* Lower token costs
* Better accuracy

---

## Compaction Strategies

When context grows large, compress it:

### Tool Result Clearing

After using tool output deep in history, clear raw results:

```typescript
// Before compaction
[tool_call: search_files]
[tool_result: { files: [...200 files...] }]
[assistant: Found 3 relevant files...]

// After compaction
[assistant: Found 3 relevant files: auth.ts, user.ts, session.ts]
```

### Summary Checkpoints

Periodically summarize and restart context:

```typescript
create_checkpoint({
  summary: `
    Implemented:
    - JWT auth in auth.ts
    - User model in user.ts
    
    Decisions:
    - Using RS256 for token signing
    - 15min access token expiry
    
    Pending:
    - Refresh token implementation
  `,
  next_focus: "Implement refresh token rotation"
})
```

### What to Preserve in Compaction

* Architectural decisions made
* Unresolved bugs/issues
* Key implementation details
* Current progress state

### What to Discard

* Redundant tool outputs
* Exploration dead-ends
* Verbose explanations already applied

---

## Structured Note-Taking

Maintain external notes for persistence across compaction:

### Session Notes Pattern

```markdown
# SESSION NOTES

## Current Objective

Implement user authentication

## Completed

- [x] JWT token generation
- [x] Login endpoint
- [ ] Refresh token

## Decisions Made

- RS256 signing (security requirement)
- 15min expiry (balance security/UX)

## Issues Found

- Race condition in token refresh (needs mutex)

## Files Modified

- src/auth/jwt.service.ts
- src/auth/auth.controller.ts
```

### Benefits

* Survives context resets
* Trackable progress
* Clear resumption points

---

## Sub-Agent Patterns

For complex tasks, delegate to focused sub-agents:

```
┌─────────────────┐
│   Main Agent    │ ← Coordinates, synthesizes
│ (light context) │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Sub-A  │ │Sub-B  │ ← Deep exploration
│search │ │analyze│   (isolated context)
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         ▼
   Condensed Results
   (1-2k tokens)
```

### When to Use

* Complex research tasks
* Parallel exploration needed
* Deep analysis of different areas

---

## Anti-Patterns

### ❌ Context Hoarding

Loading "just in case" data.

**Fix**: Load only what's immediately needed.

### ❌ Duplicate Information

Same info in multiple formats.

**Fix**: Single source of truth, reference it.

### ❌ Verbose Explanations

Over-explaining common concepts.

**Fix**: Assume Claude knows, add only project-specific details.

### ❌ Flat Structure

Everything in one large document.

**Fix**: Progressive disclosure with linked references.

### ❌ Stale Context

Keeping outdated information in context.

**Fix**: Regular refresh, checkpoint and compact.

---

## Implementation Checklist

```
Context Engineering:
- [ ] System prompt under 500 lines
- [ ] Tools are focused and minimal
- [ ] Examples are diverse, not exhaustive
- [ ] Progressive disclosure structure
- [ ] Compaction strategy defined
- [ ] Note-taking for persistence
- [ ] Sub-agents for complex tasks
- [ ] Regular context refresh
```

---

## References

* [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
* [Progressive Context Enrichment](https://www.inferable.ai/blog/posts/llm-progressive-context-encrichment)
* [Claude Platform: Skill Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
