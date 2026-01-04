# Troubleshooting Guide

## 🚨 MOST COMMON ISSUE: MCP Not Showing in GitHub Copilot

**Symptoms:**
* `@project-docs` doesn't appear as an option in Copilot Chat
* MCP button in Copilot doesn't show "project-docs"
* Commands in documentation don't work

**Solution:**

The GitHub Copilot uses a specific configuration file that needs to be set up correctly.

👉 **[Read the Complete GitHub Copilot Setup Guide](docs/GITHUB-COPILOT-SETUP.md)**

**Quick Fix:**
1. Run command: `Ctrl/Cmd + Shift + P` → `Configure Project Docs MCP`
2. Reload VS Code when prompted
3. Check if `project-docs` appears in the MCP button in Copilot Chat

---

## Common Issues and Solutions

### 1. MCP Server Not Working After Installation

**Symptoms:**
* Extension installed but `@project-docs` doesn't work in Copilot Chat
* No response from MCP tools

**Solutions:**

**Step 1: Verify Extension Installation**

```bash
code --list-extensions | grep project-docs
```

Should output: `gleidsonfersanp.project-docs-mcp`

**Step 2: Check Global Structure**

```bash
ls -la ~/.project-docs-mcp/
```

Should show:

```
mcp-config.json
knowledge/
docs/
```

If missing, the extension didn't run on startup. Try:

```bash
# Reload VS Code
# Cmd+Shift+P -> "Reload Window"
```

**Step 3: Verify MCP Configuration (Updated Format)**

```bash
# macOS
cat ~/Library/Application\ Support/Code/User/globalStorage/github.copilot-chat/mcpServers.json

# Linux
cat ~/.config/Code/User/globalStorage/github.copilot-chat/mcpServers.json

# Windows (PowerShell)
Get-Content "$env:APPDATA\Code\User\globalStorage\github.copilot-chat\mcpServers.json"
```

Should contain:

```json
{
    "mcpServers": {
        "project-docs": {
            "command": "node",
            "args": ["/path/to/extension/mcp-server/index.js"],
            "disabled": false,
            "alwaysAllow": [...]
        }
    }
}
```

**If the configuration is wrong or missing:**
* Run: `Ctrl/Cmd + Shift + P` → `Configure Project Docs MCP`
* Or manually edit the file following [this guide](docs/GITHUB-COPILOT-SETUP.md)
{
  "servers": {

    "project-docs": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/.vscode/extensions/gleidsonfersanp.project-docs-mcp-1.1.0/mcp-server/index.js"
      ]
    }

  }
}

```

**Step 4: Manual Configuration (if needed)**
Run the command:

```

Cmd+Shift+P -> "Configure Project Docs MCP"

```

---

### 2. Config File Not Found Error

**Error Message:**

```

Failed to load MCP config from /path/to/mcp-config.json

```

**Solution:**
Create the structure manually:

```bash
mkdir -p ~/.project-docs-mcp/{knowledge,docs}

cat > ~/.project-docs-mcp/mcp-config.json << 'EOF'
{
  "version": "1.2.0",
  "defaultProject": "default",
  "workspaceRoots": ["${HOME}/workspace", "${HOME}/projects"],
  "projects": {
    "default": {
      "name": "Default Project",
      "description": "Default project",
      "paths": ["${HOME}/workspace"],
      "stack": {
        "backend": "Node.js",
        "frontend": "React"
      },
      "principles": ["SOLID"]
    }
  }
}
EOF
```

Then reload VS Code.

---

### 3. Extension Not Activating

**Symptoms:**
* Extension shows as installed but doesn't run
* No welcome message on VS Code startup

**Solutions:**

**Check extension logs:**
1. Open Output panel: `Cmd+Shift+U` (macOS) or `Ctrl+Shift+U`
2. Select "Log (Extension Host)" from dropdown
3. Look for "Project Docs MCP" messages

**Force activation:**

```
Cmd+Shift+P -> "Developer: Restart Extension Host"
```

---

### 4. MCP Server Crashing

**Check server logs:**

```bash
# The server logs to console
# Look in VS Code Output panel -> "Project Docs MCP"
```

**Common causes:**
* Corrupted `mcp-config.json`
* Missing required directories
* Invalid JSON in knowledge files

**Fix:**

```bash
# Backup existing data
mv ~/.project-docs-mcp ~/.project-docs-mcp.backup

# Reinstall extension
code --uninstall-extension gleidsonfersanp.project-docs-mcp
code --install-extension gleidsonfersanp.project-docs-mcp

# Reload VS Code
```

---

### 5. Data Not Persisting

**Issue:** Changes made through MCP tools don't persist

**Check file permissions:**

```bash
ls -la ~/.project-docs-mcp/
# All files should be readable/writable by your user
```

**Fix permissions:**

```bash
chmod -R u+rw ~/.project-docs-mcp/
```

---

### 6. Project Not Auto-Detected

**Symptoms:**
* MCP can't detect which project you're working on
* Always defaults to "default" project

**Solution:**
Update your project paths in `~/.project-docs-mcp/mcp-config.json` :

```json
{
  "projects": {
    "my-project": {
      "paths": [
        "/full/path/to/my-project",
        "my-project",  // Will match any path containing "my-project"
        "${HOME}/workspace/my-project"
      ]
    }
  }
}
```

**Tips:**
* Use full absolute paths for better matching
* Use `${HOME}` for portability
* Paths are case-insensitive
* Multiple paths can be specified per project

---

### 7. Environment Variables Not Expanding

**Issue:** `${HOME}` or `${USER}` not being replaced with actual values

**Supported variables:**
* `${HOME}` - User home directory
* `${USER}` - Username
* `${PWD}` - Current working directory

**Example:**

```json
{
  "workspaceRoots": [
    "${HOME}/workspace",  // ✅ Will expand
    "$HOME/workspace",    // ❌ Won't expand (wrong syntax)
    "~/workspace"         // ❌ Won't expand (use ${HOME})
  ]
}
```

---

### 8. VS Code Can't Find MCP Server

**Error in mcp.json:**

```
command not found: node
```

**Solution:**
Ensure Node.js is in your PATH:

```bash
which node
# Should output: /usr/local/bin/node or similar
```

If not found:

```bash
# Install Node.js from https://nodejs.org
# Or use a version manager like nvm
```

---

### 9. Multiple Extension Versions Installed

**Issue:** Having both old and new versions can cause conflicts

**Check installed versions:**

```bash
ls -la ~/.vscode/extensions/ | grep project-docs
```

**Clean installation:**

```bash
# Remove all versions
rm -rf ~/.vscode/extensions/gleidsonfersanp.project-docs-mcp-*

# Reinstall latest
code --install-extension gleidsonfersanp.project-docs-mcp

# Reload VS Code
```

---

## Getting Help

If none of these solutions work:

1. **Check GitHub Issues**: https://github.com/GleidsonFerSanP/ai-project-docs-mcp/issues
2. **Open a new issue** with:
   - VS Code version ( `code --version` )
   - Extension version
   - Operating system
   - Output from troubleshooting steps above
   - Relevant logs from VS Code Output panel

---

## Debug Mode

Enable verbose logging:

1. Edit `~/.project-docs-mcp/mcp-config.json`:

```json
{
  "debug": true,
  "logLevel": "debug"
}
```

2. Restart VS Code

3. Check logs in Output panel -> "Project Docs MCP"
