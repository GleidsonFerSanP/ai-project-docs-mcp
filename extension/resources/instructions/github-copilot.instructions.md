---
description: Core instructions for AI agents using Project Docs MCP. Load at conversation start.
---

# GitHub Copilot - Project Docs MCP Integration

## Quick Start

Every conversation starts with:

```typescript
identify_context({ file_path: "current/path" }); // 1. Where am I?
get_current_focus({ project_id: "detected" }); // 2. Active session?
get_merged_guidelines({ context: "backend" }); // 3. Load rules (if coding)
start_session({ context: "backend", current_focus: "task" }); // 4. Start work
```

## Core Workflow

```
Context → Focus → Guidelines → Work → Checkpoint → Repeat
```

| Step       | Tool                                  | Frequency             |
| ---------- | ------------------------------------- | --------------------- |
| Identify   | `identify_context`                    | 🔴 Every conversation |
| Focus      | `get_current_focus` / `start_session` | 🔴 After identify     |
| Guidelines | `get_merged_guidelines`               | 🔴 Before coding      |
| Contracts  | `get_contracts`                       | 🟡 Before interfaces  |
| Checkpoint | `create_checkpoint`                   | 🟡 Every 5-10 msgs    |
| Complete   | `complete_session`                    | 🟢 When done          |

## Critical Rules

1. **Context before code** - Never code without `identify_context`
2. **Check contracts** - Always validate before implementing interfaces
3. **Checkpoint regularly** - Prevents context loss
4. **Refresh every 10 turns** - Combat context drift

## Focus Management

**Good focus**: Specific, actionable

- "Implement JWT auth following IAuthService"
- "Fix timeout in db connection pool"

**Bad focus**: Vague, unactionable

- "Working on stuff"
- "Fix bugs"

Update focus when user changes direction:

```typescript
update_focus({
  new_focus: "new specific task",
  reason: "user changed direction",
});
```

---

### 5. **Add Checkpoints Regularly** ✅

After completing each meaningful step:

```
add_checkpoint({
  session_id: "<current_session>",
  summary: "What was accomplished in this step",
  next_focus: "What comes next",
  files_modified: ["list", "of", "files"]
})
```

**When to checkpoint:**

- ✅ After implementing a feature
- ✅ After fixing a bug
- ✅ After refactoring a module
- ✅ Every 5-10 user messages
- ✅ Before switching to a different task

**Why?** Checkpoints create a breadcrumb trail and enable recovery if conversation diverges.

---

### 6. **Context Refresh (Auto-trigger)** 🔄

The MCP will remind you when to refresh context (every 10 turns or 30 min). When reminded:

```
Reload:
1. get_current_focus() → Check if still aligned
2. get_merged_guidelines() → Re-apply rules
3. get_contracts() → Re-validate contracts
```

**Why?** Long conversations cause context drift. Regular refresh keeps you aligned.

---

## 🧠 Session Focus: The Heart of the System

### What is Session Focus?

**Session Focus** is a **clean, concise summary** of the current objective. It's the "north star" that keeps the conversation on track.

### Good Focus Examples ✅

```
✅ "Implement user authentication with JWT tokens following the IAuthService contract"
✅ "Refactor payment module to use the Repository pattern and add unit tests"
✅ "Fix database connection timeout issue in production environment"
✅ "Add feature: email notifications on order completion"
```

### Bad Focus Examples ❌

```
❌ "Working on stuff" (too vague)
❌ "Fix everything" (not specific)
❌ "Help user with code" (not actionable)
```

### Focus Update Triggers

Update focus when:

- 🔄 User explicitly changes direction
- 🔄 Current task is completed and user asks for something new
- 🔄 You realize the stated focus doesn't match user's intent

---

## 🛡️ Contract Validation

Before making changes, ALWAYS check if contracts are involved:

```
1. get_contracts({ context: "<current_context>" })
2. For each relevant contract:
   validate_contract({
     contract_name: "<contract_name>",
     code: "<proposed_implementation>"
   })
```

**If validation fails:**

- 🚨 ALERT the user immediately
- 🚨 Explain the violation
- 🚨 Suggest a compliant implementation

---

## 📊 When to Complete a Session

Mark session as completed when:

- ✅ User's original request is fully satisfied
- ✅ All files are saved and working
- ✅ Tests pass (if applicable)
- ✅ User explicitly says "done", "finished", "that's all"

```
complete_session({
  session_id: "<current_session>",
  final_summary: "Summary of everything accomplished",
  outcome: "success" | "partial" | "abandoned"
})
```

---

## 🔥 Critical Rules - NEVER VIOLATE

### Rule 1: Context Before Code

**NEVER** write code before identifying context and loading guidelines.

### Rule 2: Focus First

**ALWAYS** establish or retrieve session focus before starting work.

### Rule 3: Checkpoint Progress

**ALWAYS** add checkpoints after meaningful work.

### Rule 4: Validate Contracts

**NEVER** implement interfaces without validating against registered contracts.

### Rule 5: Refresh Regularly

**ALWAYS** respect context refresh reminders (every 10 turns).

### Rule 6: Document Decisions

**ALWAYS** use `add_decision()` when making architectural choices.

---

## 🎓 Quick Reference: Essential Tools

| Tool                           | When to Use                                  | Frequency    |
| ------------------------------ | -------------------------------------------- | ------------ |
| `identify_context`             | START of every conversation                  | 🔴 ALWAYS    |
| `get_current_focus`            | After identifying context                    | 🔴 ALWAYS    |
| `get_merged_guidelines`        | Before making any code changes               | 🔴 ALWAYS    |
| `get_contracts`                | Before implementing interfaces               | 🟡 OFTEN     |
| `start_session`                | If no active session                         | 🟢 AS NEEDED |
| `update_focus`                 | When user changes direction                  | 🟢 AS NEEDED |
| `add_checkpoint`               | After completing sub-tasks (every 5-10 msgs) | 🟡 OFTEN     |
| `complete_session`             | When task is fully done                      | 🟢 AS NEEDED |
| `validate_contract`            | Before implementing critical interfaces      | 🟡 OFTEN     |
| `check_existing_documentation` | Before creating new docs                     | 🟡 OFTEN     |

---

## 💡 Example Conversation Flow

```
User: "I need to add a new payment gateway integration"

AI Agent:
1. identify_context({ file_path: "src/payments/gateway.ts" })
   → Detects: project=my-app, context=backend

2. get_current_focus({ project_id: "my-app" })
   → Returns: No active session

3. start_session({
     project_id: "my-app",
     context: "backend",
     focus: "Add new payment gateway integration following payment service contracts"
   })

4. get_merged_guidelines({ project_id: "my-app", context: "backend" })
   → Loads: SOLID, Repository Pattern, Dependency Injection rules

5. get_contracts({ context: "backend", search: "payment" })
   → Finds: IPaymentGateway, IPaymentService contracts

6. [Implement the integration following contracts]

7. add_checkpoint({
     session_id: "current-session-id",
     summary: "Implemented Stripe payment gateway with IPaymentGateway contract",
     next_focus: "Add unit tests for gateway integration",
     files_modified: ["src/payments/stripe-gateway.ts"]
   })

8. [Continue with tests...]

9. complete_session({
     session_id: "current-session-id",
     final_summary: "Successfully added Stripe gateway with tests and validation",
     outcome: "success"
   })
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Starting Work Without Context

```
User: "Fix this bug"
AI: [Immediately edits code] ← WRONG!
```

**✅ Correct:**

```
AI: Let me first identify the project context...
    [calls identify_context + get_current_focus + get_guidelines]
```

### ❌ Losing Focus in Long Conversations

```
User: "Add feature X"
AI: [Works on X]
User: "What about Y?"
AI: [Works on Y]
User: "And Z?"
AI: [Works on Z, forgot X] ← WRONG!
```

**✅ Correct:**

```
AI: [Completes X, adds checkpoint]
    [Updates focus to Y, adds checkpoint]
    [Updates focus to Z, adds checkpoint]
```

### ❌ Ignoring Contract Violations

```
AI: [Implements interface differently than contract specifies] ← WRONG!
```

**✅ Correct:**

```
AI: [Validates against contract first]
    "⚠️ This implementation violates IPaymentGateway.processPayment signature"
    [Suggests compliant implementation]
```

---

## 📝 Summary: The AI Agent's Mantra

> **"Context → Focus → Guidelines → Work → Checkpoint → Validate → Repeat"**

Every conversation should follow this cycle:

1. 🔍 **Identify** where I am (project, context)
2. 🎯 **Establish** what I'm doing (session focus)
3. 📚 **Load** the rules (guidelines, contracts)
4. 🛠️ **Execute** the work (with awareness)
5. ✅ **Checkpoint** progress (document what's done)
6. 🛡️ **Validate** against rules (ensure compliance)
7. 🔄 **Repeat** until complete

---

## 🎓 Advanced: Focus Refinement Strategy

As conversations evolve, refine focus to stay precise:

```
Initial Focus: "Fix authentication issues"
Refined Focus: "Fix JWT token expiration not being validated in auth middleware"

Initial Focus: "Improve performance"
Refined Focus: "Optimize database queries in user service by adding indexes and caching"
```

**Refinement happens when:**

- Initial focus was too broad
- User provides more specific details
- Problem scope changes during investigation

---

## 🏁 Final Checklist for Every Conversation

Before responding to user:

- [ ] ✅ Context identified?
- [ ] ✅ Session active or started?
- [ ] ✅ Guidelines loaded?
- [ ] ✅ Contracts checked (if relevant)?
- [ ] ✅ Focus clear and specific?

After completing work:

- [ ] ✅ Checkpoint added?
- [ ] ✅ Files saved?
- [ ] ✅ Contracts validated?
- [ ] ✅ Focus still aligned or updated?
- [ ] ✅ Session completed (if task done)?

---

**Remember: Your job is not just to write code, but to write _contextually aware, guideline-compliant, focus-maintained_ code that fits seamlessly into the project's ecosystem.**

🎯 **Stay Focused. Stay Contextualized. Stay Compliant.**
