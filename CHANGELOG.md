# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), 
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-04

### 🔧 Critical Fix - GitHub Copilot Integration

This release fixes a **critical issue** where the MCP server was not appearing in GitHub Copilot Chat.

### Fixed

* **MCP not showing in GitHub Copilot**: Extension now uses VS Code's official `vscode.lm.registerMcpServerDefinitionProvider` API
* **Missing contribution point**: Added `mcpServerDefinitionProviders` to package.json
* **Wrong registration method**: Changed from manual config files to VS Code API
* **Fallback support**: Maintains compatibility with older methods via `mcpServers.json` and `settings.json`

### Changed

* **Configuration format**: Now uses GitHub Copilot's official `mcpServers.json` format
* **Extension behavior**: Shows reload prompt after configuration
* **MCP config function**: Renamed `getMCPConfigPath()` to `getMCPConfigDir()`

### Added

* **GitHub Copilot Setup Guide** (`docs/GITHUB-COPILOT-SETUP.md`)
  + Complete guide for configuring MCP with GitHub Copilot
  + Troubleshooting section
  + Manual configuration steps
  + Explanation of configuration format
* **Updated troubleshooting guide** with MCP-specific issues
* **Better error messages** and user feedback

### Technical Details

**Before (Wrong Format):**

```json
{
  "servers": {
    "project-docs": {
      "command": "node",
      "args": [...]
    }
  }
}
```

**After (Correct Format):**

```json
{
  "mcpServers": {
    "project-docs": {
      "command": "node",
      "args": [...],
      "disabled": false,
      "alwaysAllow": [...]
    }
  }
}
```

### Migration

No action required! Just:
1. Reload VS Code: `Cmd/Ctrl + Shift + P` → `Developer: Reload Window`
2. Check if `project-docs` appears in Copilot's MCP button

If issues persist, see [GitHub Copilot Setup Guide](docs/GITHUB-COPILOT-SETUP.md).

---

## [1.1.0] - 2026-01-04

### 🎉 Major Changes - Global Configuration Path

This release introduces a **breaking change** that significantly improves data persistence and portability.

### Added

* **Global configuration directory** (`~/.project-docs-mcp/`)
  + All user data now lives outside the extension directory
  + Data persists across extension updates
  + Easy backup and restore capabilities
* **Automatic structure initialization**
  + Extension now creates required directories automatically
  + Default configuration is generated on first run
  + No manual setup required

### Changed

* **Configuration location**: Moved from extension directory to `~/.project-docs-mcp/`
* **Knowledge base location**: Now stored in `~/.project-docs-mcp/knowledge/`
* **Documentation location**: Now stored in `~/.project-docs-mcp/docs/`

### Fixed

* **Extension not working after installation**: The MCP server was failing because `mcp-config.json` was missing
* **Data loss on extension updates**: User data no longer stored in extension directory
* **Cross-machine portability**: Configuration now uses global path with environment variables

### Migration Guide

If you were using a previous version:

1. **Backup your old data** (if you had any in the extension directory):
   

```bash
   cp -r ~/.vscode/extensions/gleidsonfersanp.project-docs-mcp-*/knowledge ~/.project-docs-mcp/
   ```

2. **Reload VS Code** to trigger the new extension:
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Reload Window"
   - Press Enter

3. **Verify installation**:
   

```bash
   ls -la ~/.project-docs-mcp/
   ```

   
   You should see:
   

```
   mcp-config.json
   knowledge/
   docs/
   ```

### Documentation Updates

* Updated README.md with new global path structure
* Added backup and restore instructions
* Clarified cross-platform compatibility

---

## [1.0.3] - 2026-01-03

### Added

* VS Code Extension initial release
* Multi-project documentation support
* Contract registry system
* Pattern learning capabilities

### Fixed

* Various bug fixes and improvements

---

## [1.0.0] - 2025-12-XX

### Added

* Initial MCP server implementation
* Knowledge base system
* Project management features
* Documentation management with duplicate prevention
