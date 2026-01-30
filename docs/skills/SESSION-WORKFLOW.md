# Session Workflow

## Contents

* Starting a Session
* Managing Focus
* Creating Checkpoints
* Completing Sessions
* Long-Horizon Strategies

---

## Starting a Session

```typescript
start_session({
  context: "backend" | "frontend" | "infrastructure" | "all",
  current_focus: "Clear, specific task description",
  active_contracts: ["IContractName"],  // optional
  active_features: ["feature-id"]        // optional
})
```

**Good focus examples:**
* "Implement JWT auth following IAuthService contract"
* "Fix timeout bug in database connection pool"
* "Add email notifications on order completion"

**Bad focus examples:**
* "Working on stuff" (too vague)
* "Fix bugs" (not specific)

---

## Managing Focus

Update when direction changes:

```typescript
update_focus({
  new_focus: "New specific task description",
  reason: "Why focus changed"  // optional
})
```

**When to update:**
* User explicitly changes direction
* Current task completed, new task starting
* Discovered the real problem differs from initial assumption

---

## Creating Checkpoints

Save progress regularly:

```typescript
create_checkpoint({
  summary: "What was accomplished",
  next_focus: "What comes next",
  files_modified: ["file1.ts", "file2.ts"]
})
```

**When to checkpoint:**
* After implementing a feature
* After fixing a bug
* After refactoring
* Every 5-10 messages
* Before switching tasks

---

## Completing Sessions

Mark done when finished:

```typescript
complete_session({ session_id: "session-id" })
```

**Complete when:**
* User's request fully satisfied
* All files working
* Tests pass
* User says "done" or "finished"

---

## Long-Horizon Strategies

For tasks exceeding context limits:

### 1. Compaction

When context grows large, create summary checkpoints that preserve:
* Architectural decisions made
* Unresolved issues
* Key implementation details

### 2. Structured Note-Taking

Maintain `NOTES.md` tracking:
* Current progress
* Pending items
* Discovered issues

### 3. Sub-Agent Pattern

For complex research:
* Main agent coordinates
* Sub-agents do focused searches
* Results summarized back

---

## Refresh Triggers

Reload context when:
* Every 10 interactions
* Every 30 minutes
* After major context switch

```typescript
refresh_session_context({ session_id: "current" })
```
