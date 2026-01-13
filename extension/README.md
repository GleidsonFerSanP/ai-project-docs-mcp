# AI Project Context - VS Code Extension

> **Intelligent Context Management for AI Assistants**

Keep AI agents focused, contextualized, and compliant with your project's architecture through session tracking, contract validation, and intelligent memory.

## 🚀 Quick Start

### Installation

**From Marketplace** (Recommended):
1. Open VS Code
2. Search for "AI Project Context"
3. Click "Install"
4. Done! Extension auto-configures everything

**From VSIX** (Local):

```bash
code --install-extension ai-project-context-1.4.0.vsix
```

### First Use

1. Open GitHub Copilot Chat
2. Type `@ai-project-context` to see available commands
3. Start with: `@ai-project-context list_projects`

## ✨ Key Features

### 🤖 Seamless Copilot Integration

* ✅ **Auto-configuration** on install
* ✅ **`@ai-project-context`** in Copilot Chat
* ✅ **Zero manual setup** required

### 🎯 Conversational Focus Maintenance (NEW in v1.4.0)

* ✅ **Session tracking** - Never lose context in long conversations
* ✅ **Focus management** - Keep AI agents on track with clear objectives
* ✅ **Auto-refresh** - Context reload every 10 turns or 30 minutes
* ✅ **Progress checkpoints** - Track what's been done and what's next
* ✅ **Violation detection** - Automatic validation against contracts and guidelines

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

### 📊 Categorized Logging

* ✅ **Output channel** - "AI Project Context" in VS Code Output panel
* ✅ **Timestamp logs** - Track all MCP operations
* ✅ **Error tracking** - Detailed error messages with context

## 🎯 Usage Examples

### Create Your First Project

```typescript
@ai-project-context create_project {
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
@ai-project-context register_contract {
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
@ai-project-context check_existing_documentation {
  "project_id": "my-app",
  "title": "Authentication System",
  "topics": ["auth", "jwt", "security"]
}
// Returns existing docs if similarity ≥50%
```

### Add Documentation (Auto-Dedup)

```typescript
@ai-project-context manage_documentation {
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

### Session Management (NEW in v1.4.0)

* `start_session` - Start new session with focus tracking
* `get_current_focus` - Get active session state (use at conversation start!)
* `update_focus` - Update session focus when direction changes
* `resume_session` - Reactivate paused session
* `refresh_session_context` - Reload guidelines and contracts (every 10 turns)
* `validate_conversation_focus` - Validate alignment with contracts and focus
* `create_checkpoint` - Document progress and next steps
* `complete_session` - Mark session as finished
* `list_active_sessions` - List all active sessions

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

### ✅ Maintain Conversational Focus (NEW!)

```typescript
// Start focused session
@ai-project-context start_session {
  "context": "backend",
  "current_focus": "Implement JWT authentication with refresh tokens"
}

// Check current state
@ai-project-context get_current_focus {}

// Update focus when direction changes
@ai-project-context update_focus {
  "new_focus": "Add email verification to registration flow",
  "reason": "User requested additional security"
}

// Create checkpoint after completing subtask
@ai-project-context create_checkpoint {
  "summary": "JWT service implemented with IAuthService contract",
  "next_focus": "Add unit tests for token validation",
  "files_modified": ["src/auth/jwt.service.ts"]
}
```

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

## 🔍 View Logs

Want to see what's happening under the hood?

1. Open **Output** panel: `Cmd+Shift+U` (Mac) or `Ctrl+Shift+U` (Windows/Linux)
2. Select **"Project Docs MCP"** from the dropdown
3. See categorized logs with timestamps:
   

```
   [2026-01-12T21:45:00.000Z] ℹ️ Project Docs MCP extension is now active!
   [2026-01-12T21:45:00.001Z] ℹ️ MCP Server file found successfully
   [2026-01-12T21:45:00.002Z] ℹ️ MCP Server Definition Provider registered successfully
   ```

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

1. Run: `@ai-project-context list_projects` to test connection
2. Check MCP config file exists
3. Verify extension is activated (check Extensions panel)

## 📄 License

MIT License - See [LICENSE](https://github.com/GleidsonFerSanP/ai-project-docs-mcp/blob/main/LICENSE)

## 🤝 Contributing

Contributions welcome! Visit [GitHub](https://github.com/GleidsonFerSanP/ai-project-docs-mcp) for issues and PRs.

---

**Built with ❤️ for developers who want AI agents that actually remember.**
