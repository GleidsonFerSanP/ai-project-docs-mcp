# AGENTS.md

> Instructions for AI coding agents working on this repository.

## Project Overview

**AI Project Docs MCP** - A Model Context Protocol server providing persistent memory for AI coding agents. It manages documentation, contracts, patterns, and guidelines across multiple projects.

**Tech Stack:**
* Language: TypeScript 5.3
* Runtime: Node.js
* Protocol: MCP (Model Context Protocol)
* Extension: VS Code Extension

## Dev Environment

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start MCP server
npm start

# For extension development
cd extension && npm install && npm run build
```

## Testing

```bash
# Run quick validation test
node test-mcp.mjs

# Type check
npx tsc --noEmit

# Lint (if configured)
npm run lint
```

## Code Conventions

### TypeScript Rules

* Strict mode enabled
* Use interfaces for contracts (prefix with `I`)
* Explicit return types on public functions
* Prefer `const` over `let`

### File Structure

```
src/                    # MCP server source
  index.ts              # Entry point
  knowledge-base.ts     # Knowledge management
  project-manager.ts    # Multi-project handling
  session-manager.ts    # Session focus system
extension/              # VS Code extension
  src/extension.ts      # Extension entry
  mcp-server/           # Bundled MCP server
docs/                   # Documentation
  _shared/              # Cross-project docs
  features/             # Feature docs
  contracts/            # Contract templates
```

### Naming Conventions

* Files: `kebab-case.ts`
* Classes: `PascalCase`
* Interfaces: `IPascalCase`
* Functions: `camelCase`
* Constants: `UPPER_SNAKE_CASE`

## MCP Tools Reference

Core tools exposed by this server:

| Tool | Purpose |
|------|---------|
| `identify_context` | Auto-detect project from file path |
| `get_merged_guidelines` | Load global + project guidelines |
| `get_contracts` | Retrieve interface contracts |
| `register_contract` | Define critical interfaces |
| `manage_documentation` | Create/update docs |
| `start_session` | Begin focused work session |
| `create_checkpoint` | Save progress milestone |

## Validation Workflows

### Before Editing Code

1. Run `npm run build` - must compile without errors
2. Check relevant contracts in `knowledge/` or `.project-docs-mcp/`
3. Validate against registered patterns

### Before Committing

```bash
# Must pass
npm run build
npx tsc --noEmit
node test-mcp.mjs
```

### Pull Request Guidelines

* Title: `[component] Brief description`
* Include test results in PR body
* Reference any contracts affected

## Architecture Decisions

Key architectural choices:

1. **Progressive Disclosure**: Load context incrementally, not all at once
2. **Minimal Context**: Only essential tokens in system prompts
3. **Tool-Based Retrieval**: Fetch data just-in-time via tools
4. **Session Focus**: Maintain conversation coherence via checkpoints
5. **Duplicate Prevention**: 50% similarity threshold for docs

## Common Tasks

### Add a New MCP Tool

1. Define in `src/index.ts` in the tools array
2. Implement handler in the appropriate manager
3. Update README.md with tool documentation
4. Add to this AGENTS.md reference table

### Register a New Contract

```typescript
register_contract({
  name: "INewInterface",
  context: "backend",
  description: "What it does",
  interface_code: "interface INewInterface { ... }",
  rules: ["Rule 1", "Rule 2"]
})
```

### Add Documentation

```typescript
// Always check first
check_existing_documentation({ title: "Topic", topics: ["relevant"] })

// Then create if no duplicate
manage_documentation({
  action: "create",
  title: "Document Title",
  file_path: "docs/category/name.md",
  context: "backend",
  type: "guide"
})
```

## Files to Avoid Modifying

* `package-lock.json` - Only via npm install
* `extension/mcp-server/*.js` - Generated from build
* `*.json` in `knowledge/` - Managed by MCP tools

## Security Notes

* Never log sensitive data
* Validate all file paths (path traversal)
* Sanitize user inputs in tool parameters
* Config files may contain paths - use env vars

## Troubleshooting

**Build fails:**

```bash
rm -rf node_modules
npm install
npm run build
```

**MCP not connecting:**
* Check `~/.project-docs-mcp/mcp-config.json` exists
* Verify VS Code has correct MCP settings
* See `docs/TROUBLESHOOTING.md`

**Extension not loading:**
* Reload VS Code window
* Check Output → AI Project Context
* Verify extension is activated
