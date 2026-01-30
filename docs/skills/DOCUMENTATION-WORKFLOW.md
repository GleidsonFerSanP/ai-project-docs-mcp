# Documentation Workflow

## Contents

* Checking for Duplicates
* Creating Documentation
* Updating Existing Docs
* Documentation Types
* Auto-Sync Feature

---

## Checking for Duplicates

**ALWAYS check before creating:**

```typescript
check_existing_documentation({
  title: "Proposed Title",
  topics: ["auth", "jwt"],
  keywords: ["authentication", "token"]
})
```

**Results:**
* `≥50% match` → Update existing doc instead
* `<50% match` → Safe to create new doc

---

## Creating Documentation

After confirming no duplicate:

```typescript
manage_documentation({
  action: "create",
  title: "Authentication System",
  file_path: "docs/features/authentication.md",
  context: "backend",
  type: "guide",
  summary: "JWT-based authentication flow",
  topics: ["auth", "jwt", "security"],
  keywords: ["login", "token", "refresh"]
})
```

**This automatically:**
* Creates the .md file with template
* Registers in documentation.json
* Enables future duplicate detection

---

## Updating Existing Docs

```typescript
manage_documentation({
  action: "update",
  document_id: "existing-doc-id",
  title: "Updated Title",
  summary: "Updated summary"
})
```

---

## Documentation Types

| Type | Use For |
|------|---------|
| `architecture` | System design, ADRs |
| `api` | API endpoints, contracts |
| `guide` | How-to instructions |
| `troubleshooting` | Problem solutions |
| `setup` | Installation, config |
| `business-flow` | Process documentation |

---

## Context Detection

Paths auto-map to contexts:
* `/backend/` → `backend`
* `/frontend/` → `frontend`
* `/infrastructure/` → `infrastructure`
* `/shared/` → `shared`

---

## Auto-Sync Feature

Scan existing docs in a project:

```typescript
sync_documentation_files({
  project_id: "my-project",
  auto_register: true,
  scan_path: "docs/"
})
```

**This:**
* Finds all .md files recursively
* Auto-extracts title, context, type
* Registers untracked docs
* Enables duplicate detection

---

## Documentation Checklist

```
Creating Documentation:
- [ ] Ran check_existing_documentation
- [ ] No duplicate found (or updating existing)
- [ ] Chose appropriate type
- [ ] Set correct context
- [ ] Added relevant topics/keywords
- [ ] File path follows conventions
```

---

## Architectural Decisions (ADRs)

Special documentation for decisions:

```typescript
add_decision({
  title: "Use PostgreSQL for Database",
  context: "Need ACID-compliant storage",
  decision: "PostgreSQL over MongoDB",
  positive_consequences: [
    "ACID compliance",
    "Mature ecosystem"
  ],
  negative_consequences: [
    "Less flexible schema"
  ],
  alternatives: ["MongoDB", "MySQL"]
})
```
