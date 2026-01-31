# Changelog - AI Project Context Extension

All notable changes to this extension will be documented in this file.

## [1.6.5] - 2025-01-30

### Bug Fixes & Improvements

* **AGENTS.md at project root**: Fixed structure - AGENTS.md must be at project root (not inside .ai-agents/) for the extension detection to work properly
* **Relative paths enforcement**: All MCP tool examples now use relative paths (`./src/...`) instead of absolute paths (`/Users/...`)
* **Multi-developer support**: Documentation explicitly warns against absolute paths which break when multiple developers work on the project

### Updated Structure

```
[project-root]/
├── AGENTS.md                    # MUST be at root (required for detection)
└── .ai-agents/
    ├── QUICK-REFERENCE.md       # Condensed checklist
    ├── skills/                  # Detailed workflows
    └── copilot-instructions.md  # GitHub Copilot config
```

### Path Convention Examples

```typescript
// ✅ CORRECT - Relative paths
identify_context({ file_path: "./src/index.ts" })

// ❌ WRONG - Absolute paths (breaks for other developers)
identify_context({ file_path: "/Users/username/project/src/index.ts" })
```

---

## [1.6.4] - 2025-01-30

### Major Enhancement: `.ai-agents/` Directory Structure & Article Research

* **Dedicated `.ai-agents/` directory**: All context files are now organized in a dedicated hidden directory instead of scattered in project root
* **LLM Article Research**: The prompt now instructs the LLM to fetch and read 5 context engineering articles before generating files:
  + Anthropic's Effective Context Engineering
  + Inferable's Context Engineering for AI Agents
  + AGENTS.md Standard from AgentConfig
  + Claude Platform's Build Effective Agents
  + HackerNoon's What is AGENTS.md
* **Complete MCP Tool Documentation**: The prompt includes ALL MCP tools organized by category (Session, Guidelines, Contracts, Patterns, Features, Documentation)
* **Template Reference**: Uses this project's own structure as the template model
* **Quality Criteria**: Explicit requirements for generated files (specificity, actionability, tool integration)
* **Backward Compatibility**: Still detects legacy `AGENTS.md` at root for existing setups

### New Directory Structure

```
.ai-agents/
├── AGENTS.md              # Main entry point for AI agents
├── QUICK-REFERENCE.md     # Concise summary (under 200 lines)
└── skills/                # Detailed domain knowledge
    ├── README.md          # Skills index
    └── [skill-name].md    # Individual skills
```

---

## [1.6.3] - 2025-01-30

### Major Improvement: Copilot Chat Integration

* **LLM-Powered Setup**: Instead of generating generic template files, the extension now opens GitHub Copilot Chat with a rich, contextual prompt
* **Project-Aware Generation**: The prompt includes all detected project information (languages, frameworks, structure) and instructs the LLM to create project-specific documentation
* **Context Engineering Best Practices**: The prompt incorporates principles from:
  + Anthropic's Effective Context Engineering
  + Inferable's Progressive Context Enrichment
  + AGENTS.md Standard
  + Claude Platform Best Practices
* **No More Placeholders**: Files are generated with complete, project-specific content instead of "[customize this]" placeholders

---

## [1.6.2] - 2025-01-30

### Bug Fixes

* **Fixed setup detection logic**: Now correctly prompts when AGENTS.md is missing, even if other files like `.github/copilot-instructions.md` exist. AGENTS.md is the primary indicator for progressive context setup.

---

## [1.6.1] - 2025-01-30

### Bug Fixes

* **Fixed duplicate alerts**: Removed duplicate welcome message, now only shows Progressive Context prompt
* **Improved prompt logic**: Better debug logging for troubleshooting
* **Fixed prompt timing**: Reduced delay from 3s to 2s for faster response

---

## [1.6.0] - 2025-01-27

### 🚀 New Feature: Progressive Context Setup

Automatically generate AI-friendly project documentation structure to improve AI coding assistants' understanding of your project.

#### What's New

* **Auto-detection of project setup needs**: When you open a workspace without progressive context files, the extension prompts you to set them up
* **Intelligent project analysis**: Automatically detects:
  + Programming languages (TypeScript, Python, Go, Rust, etc.)
  + Frameworks (React, Next.js, NestJS, Django, FastAPI, etc.)
  + Build tools (npm, yarn, pnpm, webpack, vite, etc.)
  + Test frameworks (Jest, Vitest, pytest, etc.)
  + CI/CD platforms (GitHub Actions, GitLab CI, etc.)
  + Project structure and conventions

* **LLM-powered customization**: Uses VS Code's Language Model API to customize generated files based on your specific project

#### Files Generated

| File | Purpose |
|------|---------|
| `AGENTS.md` | AI agent instructions - conventions, structure, commands |
| `docs/skills/SKILL.md` | Main skill file with workflow references |
| `docs/skills/DEV-WORKFLOW.md` | Development workflow guide |
| `docs/skills/TEST-WORKFLOW.md` | Testing workflow guide |
| `docs/skills/ARCHITECTURE.md` | Architecture reference |
| `.github/copilot-instructions.md` | GitHub Copilot custom instructions |

#### New Commands

| Command | Description |
|---------|-------------|
| `AI Project Context: Setup Progressive Context` | Manually run the setup |
| `AI Project Context: Check Progressive Context Status` | Check what's configured |
| `AI Project Context: Reset Progressive Context Prompt` | Clear rejection to re-enable prompt |

#### New Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `aiProjectContext.enableProgressiveContextPrompt` | `true` | Show prompt on new workspaces |
| `aiProjectContext.useLLMCustomization` | `true` | Use LLM to customize generated files |

#### User Preference Handling

* **Remember user choice**: If you click "Don't Ask Again", the prompt won't appear again for that workspace
* **Reset anytime**: Use the "Reset Progressive Context Prompt" command to re-enable

#### VS Code Configuration

When you accept setup, the extension automatically configures:
* `.vscode/settings.json` with Copilot instruction file references
* File associations for `AGENTS.md` and `SKILL.md`
* Markdown editor settings

### Why Progressive Context?

Progressive context is based on research from:
* [Anthropic's Context Engineering Guidelines](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct)
* [OpenAI's AGENTS.md Standard](https://cdn.openai.com/AGENTS-md-en-draft-4.pdf)

Benefits:
* ✅ AI assistants understand your project structure
* ✅ Consistent code generation following your conventions
* ✅ Better context awareness during conversations
* ✅ Reduced need to repeat project details

---

## [1.5.3] - 2025-01-20

### Bug Fixes

* Fixed categorized logging output channel
* Improved MCP server stability

---

## [1.5.2] - 2025-01-15

### Improvements

* Enhanced MCP server registration
* Better error handling for config loading

---

## [1.5.1] - 2025-01-10

### Bug Fixes

* Fixed extension activation on startup
* Resolved path issues on Windows

---

## [1.5.0] - 2025-01-05

### Features

* Added Session Focus System for conversation tracking
* New commands for session management
* Improved contract validation

---

## [1.4.0] - 2024-12-20

### Features

* GitHub Copilot Chat integration
* Chat instructions for better AI context

---

## [1.3.0] - 2024-12-10

### Features

* Feature registration system
* Documentation management tools

---

## [1.2.0] - 2024-12-01

### Features

* Contract registration and validation
* Pattern learning system

---

## [1.1.0] - 2024-11-20

### Features

* Multi-project support
* Project switching

---

## [1.0.0] - 2024-11-10

### Initial Release

* MCP Server integration
* Basic project context management
* Guidelines system
