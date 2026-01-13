# AI Project Docs MCP

> **Universal Multi-Project Documentation System with Auto-Learning and Duplicate Prevention**

Model Context Protocol (MCP) server that acts as a **single source of truth** for multiple software projects, featuring intelligent documentation management, contract registry, pattern learning, and automatic duplicate detection.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-green)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/GleidsonFerSanP.project-docs-mcp)](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.project-docs-mcp)
[![VS Code Installs](https://img.shields.io/visual-studio-marketplace/i/GleidsonFerSanP.project-docs-mcp)](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.project-docs-mcp)

---

## 🎯 What Problem Does This Solve?

**The Problem:**
* AI agents forget critical interfaces and contracts between sessions
* Duplicate documentation files are constantly created
* Project-specific patterns aren't preserved
* Architectural decisions are lost or repeated
* Onboarding new AI agents requires repeating the same instructions

**The Solution:**
This MCP server provides persistent memory for your projects, ensuring AI agents:
* ✅ Never forget critical contracts and interfaces
* ✅ Automatically detect and prevent duplicate documentation
* ✅ Remember project-specific patterns and apply them consistently
* ✅ Validate code against registered contracts
* ✅ Access architectural decisions instantly

---

## ✨ Key Features

### 🎯 Session Focus Management (NEW!)

* **Auto-Refresh Context**: Automatically reloads guidelines every 10 interactions or 30 minutes
* **Continuous Validation**: Validates code against contracts and guidelines in real-time
* **Progress Checkpoints**: Save progress and maintain conversation focus
* **Violation Detection**: Alerts when code violates contracts or guidelines
* **Session Resume**: Resume previous sessions with full context and history

[📖 Learn more about Session Focus System](docs/_shared/SESSION-FOCUS-SYSTEM.md)

### 📚 Multi-Project Support

Manage documentation for multiple projects independently with automatic context detection.

### 🧠 Auto-Learning System

* **Contract Registry**: Register critical interfaces that must always be respected
* **Pattern Learning**: Teach project-specific patterns once, apply forever
* **Project Scanning**: Automatically extract interfaces and patterns from code
* **Validation**: Validate implementations against registered contracts

### 🔍 Intelligent Documentation Management

* **Duplicate Detection**: Similarity algorithm prevents duplicate documentation (≥50% match)
* **Automatic Updates**: Suggests updating existing docs instead of creating new ones
* **Metadata Tracking**: Full version history, topics, keywords, and context

### 🌍 Cross-Machine Portability

* Environment variable support (`${HOME}`,     `${USER}`)
* Works seamlessly across macOS, Linux, and Windows
* Clean separation between framework and user data

### 📦 VS Code Extension

One-click installation with automatic MCP configuration.

---

## 🚀 Quick Start

### Option 1: VS Code Extension (Recommended)

VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.project-docs-mcp)
1. **Install from VS Code Marketplace**
   - Search for "Project Docs MCP" or visit [marketplace link]
   - Click Install

2. **Extension auto-configures everything!**
   - Creates `~/.project-docs-mcp/` directory
   - Generates default configuration
   - Configures MCP server automatically
   - Ready to use with `@project-docs` in Copilot Chat

3. **Customize your configuration** (Optional)
   

```bash
   # Edit the config file
   code ~/.project-docs-mcp/mcp-config.json
   ```

### Option 2: Manual Setup

```bash
# Clone and build
git clone https://github.com/GleidsonFerSanP/ai-project-docs-mcp.git
cd ai-project-docs-mcp
npm install
npm run build

# The server will automatically create ~/.project-docs-mcp/ on first run
# with a default configuration

# Run the server
npm start

# Configure in GitHub Copilot
# See detailed instructions: docs/GITHUB-COPILOT-SETUP.md
```

> **⚠️ Important**: If you don't see `@project-docs` in GitHub Copilot Chat, read the [GitHub Copilot Setup Guide](docs/GITHUB-COPILOT-SETUP.md) for detailed configuration instructions.

### Configuration

The configuration file is automatically created at:
* **macOS/Linux**: `~/.project-docs-mcp/mcp-config.json`
* **Windows**: `%USERPROFILE%\.project-docs-mcp\mcp-config.json`

**Default configuration:**

```json
{
  "version": "1.2.0",
  "defaultProject": "default",
  "workspaceRoots": ["${HOME}/workspace", "${HOME}/projects", "${HOME}/dev"],
  "projects": {
    "default": {
      "name": "Default Project",
      "description": "Default project configuration",
      "paths": ["${HOME}/workspace", "${HOME}/projects"],
      "stack": {
        "backend": "Node.js",
        "frontend": "React"
      },
      "principles": ["SOLID", "Clean Code"]
    }
  }
}
```

**To add your own projects**, edit the config file:

```json
{
  "currentProject": "my-app",
  "workspaceRoots": ["${HOME}/projects"],
  "projects": {
    "my-app": {
      "name": "My Application",
      "description": "Full-stack application",
      "paths": ["${HOME}/projects/my-app"],
      "stack": {
        "backend": "NestJS",
        "frontend": "React",
        "database": "PostgreSQL"
      },
      "principles": ["DDD", "Clean Architecture"]
    }
  }
}
```

---

## 📖 Usage

### Create a Project

```typescript
@project-docs create_project {
  "project_id": "my-app",
  "name": "My Application",
  "description": "Full-stack application",
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

### Add Documentation (with Duplicate Prevention)

```typescript
// System automatically checks for similar docs
@project-docs manage_documentation {
  "project_id": "my-app",
  "action": "create",
  "title": "Authentication System",
  "summary": "JWT-based authentication",
  "topics": ["auth", "jwt", "security"],
  "context": "backend"
}
// → If similar doc exists (≥50%), returns existing doc for update
```

### Register a Feature

```typescript
@project-docs register_feature {
  "project_id": "my-app",
  "name": "User Authentication",
  "context": "Security",
  "description": "JWT authentication with refresh tokens",
  "business_rules": [
    "Token expires in 15 minutes",
    "Refresh token valid for 7 days"
  ],
  "use_cases": [{
    "name": "Login",
    "steps": ["Validate credentials", "Generate JWT", "Return tokens"]
  }],
  "related_contracts": ["IAuthService"]
}
```

### Learn a Pattern

```typescript
@project-docs learn_pattern {
  "project_id": "my-app",
  "name": "Repository Pattern",
  "context": "backend",
  "description": "Data access pattern",
  "pattern": "class UserRepository extends BaseRepository<User> { ... }",
  "examples": ["UserRepository", "ProductRepository"]
}
```

### Validate Code Against Contract

```typescript
@project-docs validate_contract {
  "project_id": "my-app",
  "contract_name": "IUserRepository",
  "code": "class UserRepository implements IUserRepository { ... }"
}
```

---

## 🛠️ Available Tools

| Tool | Purpose |
|------|---------|
| `create_project` | Register new project with full configuration |
| `get_project_info` | Get complete project information |
| `list_projects` | List all registered projects |
| `switch_project` | Change current project context |
| `identify_context` | Auto-detect project and context from file path |
| `register_contract` | Register critical interface/contract |
| `get_contracts` | List registered contracts |
| `validate_contract` | Validate code against contract |
| `learn_pattern` | Teach project-specific pattern |
| `scan_project` | Auto-extract patterns from codebase |
| `register_feature` | Document complete feature with use cases |
| `get_features` | List features with filtering |
| `get_feature_context` | Get complete feature context |
| `update_feature` | Update existing feature |
| `check_existing_documentation` | Find similar documentation |
| `manage_documentation` | Create/update documentation with duplicate prevention |
| `list_documentation` | List all documentation |
| `add_decision` | Register architectural decision (ADR) |
| `get_guidelines` | Get context-specific guidelines |
| `should_document` | Determine if documentation is needed |

---

## 📂 Project Structure

### Source Code (This Repository)

```
ai-project-docs-mcp/
├── src/
│   ├── index.ts              # MCP Server
│   ├── knowledge-base.ts     # Knowledge management
│   └── project-manager.ts    # Project management
├── extension/                # VS Code extension
│   ├── src/extension.ts
│   └── package.json
├── docs/
│   ├── _shared/              # Shared documentation
│   │   ├── AUTO-LEARNING.md
│   │   ├── DOCUMENTATION-MANAGEMENT.md
│   │   ├── PORTABILITY-SETUP.md
│   │   └── CLEAN-DISTRIBUTION.md
│   └── contracts/            # Contract examples
├── mcp-config.example.json   # Configuration example
└── package.json
```

### User Data (Auto-created at `~/.project-docs-mcp/` )

```
~/.project-docs-mcp/
├── mcp-config.json           # Your project configurations
├── knowledge/                # Knowledge base (per project)
│   ├── default/              # Default project
│   │   ├── contracts.json    # Registered contracts
│   │   ├── patterns.json     # Learned patterns
│   │   ├── features.json     # Feature documentation
│   │   ├── decisions.json    # Architectural decisions (ADRs)
│   │   └── documentation.json # Documentation index
│   └── my-project/           # Your custom projects...
│       ├── contracts.json
│       ├── patterns.json
│       └── ...
└── docs/                     # Custom documentation files
    ├── default/
    └── my-project/
```

**Key Points:**
* ✅ **Separation of concerns**: Framework code vs. user data
* ✅ **Persistence**: Data survives extension updates
* ✅ **Portability**: Easy backup with `tar -czf backup.tar.gz ~/.project-docs-mcp/`
* ✅ **Multi-project**: Each project has isolated knowledge base

---
│       ├── contracts.json
│       ├── patterns.json
│       ├── features.json
---

## 🔒 Data Privacy

Your project data stays **private** and **local**:

* ✅ Framework code is public (this repo)
* ✅ Your projects/docs are stored locally in `~/.project-docs-mcp/`
* ✅ Data is completely isolated from the extension files
* ✅ Clean distribution ensures only framework is shared

**Backup your data:**

```bash
# Simple backup
tar -czf project-docs-backup-$(date +%Y%m%d).tar.gz ~/.project-docs-mcp/

# Or use git for versioning
cd ~/.project-docs-mcp
git init
git remote add origin <your-private-repo>
git add .
git commit -m "Initial backup"
git push -u origin main
```

**Restore on another machine:**

```bash
# From tar backup
tar -xzf project-docs-backup-20260104.tar.gz -C ~/

# Or clone from git
git clone <your-private-repo> ~/.project-docs-mcp
```

---

## 🌍 Cross-Machine Setup

The configuration automatically supports environment variables for portability:

```json
{
  "workspaceRoots": ["${HOME}/projects"],
  "projects": {
    "my-app": {
      "paths": ["${HOME}/projects/my-app"]
    }
  }
}
```

**Supported variables:** `${HOME}` , `${USER}` , `${PWD}`

This means the same config works on:
* 🍎 **macOS**: `${HOME}` → `/Users/username`
* 🐧 **Linux**: `${HOME}` → `/home/username`
* 🪟 **Windows**: `${HOME}` → `C:\Users\username`
```

Supported variables: `${HOME}` , `${USER}` , `${PWD}`

---

## 🎯 Use Cases

### ✅ Prevent Contract Violations

Register `ISolutionAdapter` once - AI agents will always respect it.

### ✅ Consistent Code Patterns

Teach error handling pattern once - AI applies it to all new code.

### ✅ Automatic Validation

Validate implementations against contracts before committing.

### ✅ Instant Onboarding

New AI agent? Scan project → instant knowledge of all contracts and patterns.

### ✅ Preserve Decisions

Document PostgreSQL decision → AI never suggests MongoDB again.

---

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 Links

* [GitHub Repository](https://github.com/GleidsonFerSanP/ai-project-docs-mcp)
* [VS Code Extension](https://marketplace.visualstudio.com/) (coming soon)
* [Model Context Protocol](https://modelcontextprotocol.io/)

---

## 💡 Need Help?

Check the documentation:
* [Auto-Learning Guide](docs/_shared/AUTO-LEARNING.md)
* [Documentation Management](docs/_shared/DOCUMENTATION-MANAGEMENT.md)
* [Portability Setup](docs/_shared/PORTABILITY-SETUP.md)
* [Clean Distribution](docs/_shared/CLEAN-DISTRIBUTION.md)

Or open an [issue](https://github.com/GleidsonFerSanP/ai-project-docs-mcp/issues).

---

**Built with ❤️ for developers who want AI agents that actually remember.**
