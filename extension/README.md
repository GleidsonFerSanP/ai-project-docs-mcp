# Project Docs MCP - VS Code Extension

> **Universal Multi-Project Documentation System for GitHub Copilot and AI Assistants**

Intelligent documentation management with auto-learning, duplicate prevention, and persistent memory for your projects.

## 🚀 Quick Start

### Installation

**From Marketplace** (Recommended):
1. Open VS Code
2. Search for "Project Docs MCP"
3. Click "Install"
4. Done! Extension auto-configures everything

**From VSIX** (Local):

```bash
code --install-extension project-docs-mcp-1.0.1.vsix
```

### First Use

1. Open GitHub Copilot Chat
2. Type `@project-docs` to see available commands
3. Start with: `@project-docs list_projects`

## ✨ Key Features

### 🤖 Seamless Copilot Integration

* ✅ **Auto-configuration** on install
* ✅ **`@project-docs`** in Copilot Chat
* ✅ **Zero manual setup** required

### 🔍 Intelligent Documentation

* ✅ **Duplicate prevention** (≥50% similarity detection)
* ✅ **Version tracking** with timestamps
* ✅ **Smart search** by title, topics, keywords
* ✅ **Multi-project** support

### 🧠 Auto-Learning System

* ✅ **Contract registry** - Never forget interfaces
* ✅ **Pattern learning** - Preserve code patterns
* ✅ **Architectural decisions** - ADR tracking
* ✅ **Feature documentation** - Complete use cases

### 🌍 Cross-Machine Portability

* ✅ **Environment variables** (${HOME}, ${USER})
* ✅ **Works anywhere** - Mac, Linux, Windows
* ✅ **Shareable** knowledge base

## 🎯 Usage Examples

### Create Your First Project

```typescript
@project-docs create_project {
  "project_id": "my-app",
  "name": "My Application",
  "description": "Full-stack web application",
  "paths": ["${HOME}/projects/my-app"],
  "stack": {
    "backend": "NestJS",
    "frontend": "React",
    "database": "PostgreSQL"
  },
  "principles": ["SOLID", "Clean Architecture"]
}
```

### Register a Critical Contract

```typescript
@project-docs register_contract {
  "project_id": "my-app",
  "name": "IUserRepository",
  "context": "backend",
  "description": "User repository interface",
  "interface_code": "export interface IUserRepository { ... }",
  "rules": [
    "Must implement findById()",
    "Must handle errors properly"
  ]
}
```

### Check for Duplicate Documentation

```typescript
@project-docs check_existing_documentation {
  "project_id": "my-app",
  "title": "Authentication System",
  "topics": ["auth", "jwt", "security"]
}
// Returns existing docs if similarity ≥50%
```

### Add Documentation (Auto-Dedup)

```typescript
@project-docs manage_documentation {
  "project_id": "my-app",
  "action": "create",
  "title": "API Authentication",
  "summary": "JWT-based authentication with refresh tokens",
  "topics": ["api", "auth", "jwt"],
  "context": "backend",
  "type": "feature"
}
// System automatically prevents duplicates!
```

## 🛠️ Available Tools

### Project Management

* `create_project` - Register new project
* `get_project_info` - Get project details
* `list_projects` - List all projects
* `switch_project` - Change active project
* `identify_context` - Auto-detect project from file path

### Documentation

* `check_existing_documentation` - Find similar docs
* `manage_documentation` - Create/update with auto-dedup
* `list_documentation` - List all documents

### Contracts & Patterns

* `register_contract` - Register critical interface
* `get_contracts` - List registered contracts
* `validate_contract` - Validate implementation
* `learn_pattern` - Teach project pattern
* `scan_project` - Auto-extract patterns from code

### Features & Use Cases

* `register_feature` - Document complete feature
* `get_features` - List features with filters
* `get_feature_context` - Get full feature context
* `update_feature` - Update feature status

### Decisions & Guidelines

* `add_decision` - Record architectural decision (ADR)
* `get_guidelines` - Get context-specific guidelines
* `should_document` - Determine if documentation needed

## 📦 Extension Commands

* **Project Docs: Configure** - Reconfigure MCP server
* **Project Docs: Restart** - Restart MCP server
* **Project Docs: Open Documentation** - View documentation

## 🔧 Configuration

The extension auto-configures, but you can customize:

**Location:** VS Code Settings → GitHub Copilot → Advanced → MCP

**Config file:** `~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/mcp.json`

**Example:**

```json
{
  "servers": {
    "project-docs": {
      "command": "node",
      "args": ["/path/to/extension/mcp-server/index.js"]
    }
  }
}
```

## 🎓 Use Cases

### ✅ Prevent Contract Violations

Register `IUserService` once → AI never violates it again

### ✅ Consistent Code Patterns

Teach error handling pattern → Applied to all new code

### ✅ Automatic Validation

Validate implementations against contracts before committing

### ✅ Instant Onboarding

New AI agent? Scan project → Instant knowledge of contracts and patterns

### ✅ Preserve Decisions

Document PostgreSQL choice → AI never suggests MongoDB again

## 📚 Documentation

* **GitHub:** [ai-project-docs-mcp](https://github.com/GleidsonFerSanP/ai-project-docs-mcp)
* **Full Guide:** [README.md](https://github.com/GleidsonFerSanP/ai-project-docs-mcp#readme)
* **Auto-Learning:** [AUTO-LEARNING.md](https://github.com/GleidsonFerSanP/ai-project-docs-mcp/blob/main/docs/_shared/AUTO-LEARNING.md)
* **Documentation Management:** [DOCUMENTATION-MANAGEMENT.md](https://github.com/GleidsonFerSanP/ai-project-docs-mcp/blob/main/docs/_shared/DOCUMENTATION-MANAGEMENT.md)

## 🐛 Troubleshooting

### Extension not showing in Copilot Chat

1. Check if MCP is configured: `Cmd+Shift+P` → "Preferences: Open User Settings (JSON)"
2. Verify MCP server path is correct
3. Restart VS Code: `Cmd+Shift+P` → "Developer: Reload Window"

### "MCP Server not found" error

Reinstall the extension - v1.0.1+ includes the MCP server bundled.

### Commands not working

1. Run: `@project-docs list_projects` to test connection
2. Check MCP config file exists
3. Verify extension is activated (check Extensions panel)

## 📄 License

MIT License - See [LICENSE](https://github.com/GleidsonFerSanP/ai-project-docs-mcp/blob/main/LICENSE)

## 🤝 Contributing

Contributions welcome! Visit [GitHub](https://github.com/GleidsonFerSanP/ai-project-docs-mcp) for issues and PRs.

---

**Built with ❤️ for developers who want AI agents that actually remember.**
