---
description: **CRITICAL**: Read this file when user is working with project documentation, architecture decisions, contracts, patterns, or features. This file provides guidance on using the Project Docs MCP tools effectively. **MUST** be read when user mentions: documentation, ADR, architectural decision, contract, pattern, feature registration, project guidelines, documenting code/architecture, documentação, decisão arquitetural, ADR (Architectural Decision Record), contrato, padrão, registro de feature, guidelines do projeto, documentar código/arquitetura.
---

# Project Docs MCP - AI Assistant Guidelines

## When to Use This MCP

Use Project Docs MCP tools when the user:

- Wants to **document** architecture, APIs, features, or decisions
- Asks about **existing documentation** in the project
- Needs to **register contracts, patterns, features** or **architectural decisions**
- Wants to **avoid duplicate documentation**
- Asks for **project guidelines** or coding standards
- Mentions terms like: ADR, architectural decision, contract, pattern, feature

## Core Principles

1. **Check Before Creating**: ALWAYS use `check_existing_documentation` before creating new docs to avoid duplicates
2. **Auto-Sync First**: Use `sync_documentation_files` when starting work on a new project to index existing docs
3. **Let MCP Manage**: Use MCP tools to create documentation - they auto-create .md files with templates
4. **Version Everything**: Documentation metadata lives in `.project-docs-mcp/` and should be committed to git

## Key Tools Reference

| Tool                           | When to Use                                    | Priority  |
| ------------------------------ | ---------------------------------------------- | --------- |
| `sync_documentation_files`     | First time on project, scan existing docs      | 🔴 HIGH   |
| `check_existing_documentation` | Before creating ANY documentation              | 🔴 HIGH   |
| `manage_documentation`         | Create/update documentation (auto-creates .md) | 🟢 ALWAYS |
| `list_documentation`           | Find existing docs, check what's documented    | 🟡 OFTEN  |
| `register_feature`             | Document a new feature with business rules     | 🟡 OFTEN  |
| `add_decision`                 | Record architectural decision (ADR)            | 🟡 OFTEN  |
| `register_contract`            | Define critical interfaces/contracts           | 🟢 ALWAYS |
| `get_guidelines`               | Get coding standards for current context       | 🟢 ALWAYS |
| `identify_context`             | Auto-detect project and context from file path | 🟢 ALWAYS |

## Workflow: Creating Documentation

```
1. identify_context({ file_path: "current/file/path" })
   → Detects project and context (backend/frontend/infra)

2. get_guidelines({ context: detected_context })
   → Load project-specific coding standards

3. check_existing_documentation({
     title: "Proposed Title",
     topics: ["main", "topics"],
     keywords: ["relevant", "keywords"]
   })
   → Checks for similar existing docs (>50% similarity blocks creation)

4. IF no duplicates:
   manage_documentation({
     action: "create",
     title: "Document Title",
     file_path: "docs/category/filename.md",
     context: "backend|frontend|infrastructure|shared",
     type: "architecture|api|guide|troubleshooting|setup",
     summary: "Brief description",
     topics: ["topic1", "topic2"],
     keywords: ["keyword1", "keyword2"]
   })
   → Creates .md file automatically with template
   → Registers in documentation.json
```

## Workflow: Working on Existing Project

```
1. sync_documentation_files({
     project_id: "project-name",
     auto_register: true
   })
   → Scans docs/ recursively
   → Auto-registers all .md files
   → Extracts title, context, type, topics, keywords

2. list_documentation()
   → See all registered documentation
   → Check what's already documented

3. Use normal workflow to create new docs
```

## Important Notes

- **Metadata Location**: Now stored in `{projectRoot}/.project-docs-mcp/` (versionable!)
- **Old Data**: Use `migrate_metadata_to_project` to migrate from `~/.project-docs-mcp/knowledge/`
- **Auto-Detection**: Context and type are auto-inferred from file paths:
  - `/backend/` → context: backend
  - `/frontend/` → context: frontend
  - `/architecture/` or `ADR-` → type: architecture
  - `/api/` → type: api
  - `/guides/` → type: guide

## Common Patterns

### Document a New Feature

```javascript
register_feature({
  name: "Feature Name",
  context: "backend",
  description: "What it does",
  businessRules: ["rule1", "rule2"],
  useCases: [
    {
      name: "Use Case 1",
      description: "Description",
      steps: ["step1", "step2"],
    },
  ],
});
```

### Record Architectural Decision (ADR)

```javascript
add_decision({
  title: "Use PostgreSQL for Primary Database",
  context: "We need a reliable ACID-compliant database",
  decision: "Chose PostgreSQL over MongoDB",
  positiveConsequences: ["ACID compliance", "Mature ecosystem"],
  negativeConsequences: ["Less flexible schema"],
  alternatives: ["MongoDB", "MySQL"],
});
```

### Define Critical Contract

```javascript
register_contract({
  name: "IPaymentGateway",
  context: "backend",
  description: "Interface for payment processing",
  interfaceCode: "interface IPaymentGateway { ... }",
  rules: ["Must handle errors gracefully", "Must be idempotent"],
});
```

## Error Prevention

❌ **DON'T**: Create documentation without checking for duplicates first
✅ **DO**: Always use `check_existing_documentation` before `manage_documentation`

❌ **DON'T**: Manually create .md files and JSON separately
✅ **DO**: Use `manage_documentation` - it handles both automatically

❌ **DON'T**: Forget to sync existing docs when starting on a project
✅ **DO**: Run `sync_documentation_files` first thing

## Context Awareness

Before making any changes or answering questions about documentation:

1. Use `identify_context` to detect current project and context
2. Use `get_guidelines` to load project-specific standards
3. Apply those guidelines in your responses and code suggestions
