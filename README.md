# AI Project Docs MCP

> **Universal Multi-Project Documentation System with Auto-Learning and Duplicate Prevention**

Model Context Protocol (MCP) server that acts as a **single source of truth** for multiple software projects, featuring intelligent documentation management, contract registry, pattern learning, and automatic duplicate detection.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-green)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎯 What Problem Does This Solve?

**The Problem:**
- AI agents forget critical interfaces and contracts between sessions
- Duplicate documentation files are constantly created
- Project-specific patterns aren't preserved
- Architectural decisions are lost or repeated
- Onboarding new AI agents requires repeating the same instructions

**The Solution:**
This MCP server provides persistent memory for your projects, ensuring AI agents:
- ✅ Never forget critical contracts and interfaces
- ✅ Automatically detect and prevent duplicate documentation
- ✅ Remember project-specific patterns and apply them consistently
- ✅ Validate code against registered contracts
- ✅ Access architectural decisions instantly

---

## ✨ Key Features

### 📚 Multi-Project Support
Manage documentation for multiple projects independently with automatic context detection.

### 🧠 Auto-Learning System
- **Contract Registry**: Register critical interfaces that must always be respected
- **Pattern Learning**: Teach project-specific patterns once, apply forever
- **Project Scanning**: Automatically extract interfaces and patterns from code
- **Validation**: Validate implementations against registered contracts

### 🔍 Intelligent Documentation Management
- **Duplicate Detection**: Similarity algorithm prevents duplicate documentation (≥50% match)
- **Automatic Updates**: Suggests updating existing docs instead of creating new ones
- **Metadata Tracking**: Full version history, topics, keywords, and context

### 🌍 Cross-Machine Portability
- Environment variable support (`${HOME}`, `${USER}`)
- Works seamlessly across macOS, Linux, and Windows
- Clean separation between framework and user data

### 📦 VS Code Extension
One-click installation with automatic MCP configuration.

---

## 🚀 Quick Start

### Option 1: VS Code Extension (Recommended)

1. Install from VS Code Marketplace (coming soon)
2. Extension auto-configures MCP - done!

### Option 2: Manual Setup

```bash
# Clone and build
git clone https://github.com/GleidsonFerSanP/ai-project-docs-mcp.git
cd ai-project-docs-mcp
npm install
npm run build

# Configure VS Code
# Add to your VS Code settings.json:
{
  "github.copilot.advanced": {
    "mcp": {
      "servers": {
        "project-docs": {
          "command": "node",
          "args": ["${workspaceFolder}/ai-project-docs-mcp/dist/index.js"]
        }
      }
    }
  }
}

# Restart VS Code
```

### Configuration

Create `mcp-config.json`:

```json
{
  "currentProject": "my-project",
  "workspaceRoots": ["${HOME}/projects"],
  "projects": {
    "my-project": {
      "name": "My Project",
      "description": "Project description",
      "paths": ["${HOME}/projects/my-project"],
      "stack": {
        "backend": "NestJS",
        "frontend": "React"
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
├── knowledge/                # Knowledge base (per project)
│   └── example-project/      # Example structure
│       ├── contracts.json
│       ├── patterns.json
│       ├── features.json
│       ├── decisions.json
│       └── documentation.json
├── mcp-config.example.json   # Configuration example
└── package.json
```

---

## 🔒 Data Privacy

Your project data stays **private** and **local**:

- ✅ Framework code is public (this repo)
- ✅ Your projects/docs are stored locally in `knowledge/`
- ✅ `.gitignore` prevents accidental commits of personal projects
- ✅ Clean distribution ensures only framework is shared

**Backup your data:**
```bash
# Create private repo for your knowledge base
cd knowledge
git init
git remote add origin <your-private-repo>
git push -u origin main
```

---

## 🌍 Cross-Machine Setup

Use environment variables for portability:

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

Supported variables: `${HOME}`, `${USER}`, `${PWD}`

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

- [GitHub Repository](https://github.com/GleidsonFerSanP/ai-project-docs-mcp)
- [VS Code Extension](https://marketplace.visualstudio.com/) (coming soon)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

## 💡 Need Help?

Check the documentation:
- [Auto-Learning Guide](docs/_shared/AUTO-LEARNING.md)
- [Documentation Management](docs/_shared/DOCUMENTATION-MANAGEMENT.md)
- [Portability Setup](docs/_shared/PORTABILITY-SETUP.md)
- [Clean Distribution](docs/_shared/CLEAN-DISTRIBUTION.md)

Or open an [issue](https://github.com/GleidsonFerSanP/ai-project-docs-mcp/issues).

---

**Built with ❤️ for developers who want AI agents that actually remember.**
