import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectAnalyzer, ProjectInfo } from './project-analyzer';
import { TemplateEngine, GeneratedFile, LLMContext } from './template-engine';
import { FileGenerator, VSCodeConfigurer, GenerationResult } from './file-generator';

/**
 * Configuration for the context setup manager
 */
export interface ContextSetupConfig {
    /** Whether to automatically show prompt on activation */
    autoPrompt: boolean;
    /** Whether to use LLM for customization */
    useLLMCustomization: boolean;
    /** Files to generate */
    filesToGenerate: ('agents' | 'skills' | 'copilot-instructions' | 'all')[];
}

/**
 * User preference for context setup
 */
interface UserPreference {
    rejected: boolean;
    rejectedAt?: string;
    workspacePath: string;
    version: string;
}

const PREFERENCE_KEY = 'aiProjectContext.progressiveContextSetup';
const CURRENT_VERSION = '1.0';
const LEARN_MORE_URL = 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct#provide-contextual-information';

/**
 * Manages the progressive context setup flow
 */
export class ContextSetupManager {
    private context: vscode.ExtensionContext;
    private workspaceRoot: string;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, workspaceRoot: string, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.workspaceRoot = workspaceRoot;
        this.outputChannel = outputChannel;
    }

    /**
     * Check if workspace needs progressive context setup
     */
    async checkWorkspace(): Promise<{
        needsSetup: boolean;
        existingFiles: string[];
        missingFiles: string[];
    }> {
        const analyzer = new ProjectAnalyzer(this.workspaceRoot);
        const projectInfo = await analyzer.analyze();
        
        const templateEngine = new TemplateEngine(projectInfo);
        const files = templateEngine.generateAllFiles();
        
        const fileGenerator = new FileGenerator(this.workspaceRoot);
        const { existing, missing } = fileGenerator.checkExistingFiles(files);

        // Check if structure already exists
        const hasStructure = fileGenerator.hasProgressiveContextStructure();

        return {
            needsSetup: !hasStructure && missing.length > 0,
            existingFiles: existing,
            missingFiles: missing
        };
    }

    /**
     * Show setup prompt to user with explanation
     */
    async showSetupPrompt(): Promise<'accept' | 'reject' | 'later'> {
        // Check if user has already rejected
        if (this.hasUserRejected()) {
            this.outputChannel.appendLine('[Progressive Context] User previously rejected setup');
            return 'reject';
        }

        const result = await vscode.window.showInformationMessage(
            '🚀 Improve AI coding assistance with Progressive Context Setup?\n\n' +
            'This creates AGENTS.md and skill files to help AI assistants (Copilot, Claude, etc.) understand your project better.',
            {
                modal: false,
                detail: 'Progressive context helps AI assistants understand your project structure, conventions, and patterns. ' +
                        'Files created: AGENTS.md, docs/skills/, .github/copilot-instructions.md'
            },
            'Setup Now',
            'Learn More',
            'Not Now',
            "Don't Ask Again"
        );

        switch (result) {
            case 'Setup Now':
                return 'accept';
            case 'Learn More':
                // Open documentation
                await vscode.env.openExternal(vscode.Uri.parse(LEARN_MORE_URL));
                // Show prompt again after learning more
                return this.showSetupPrompt();
            case "Don't Ask Again":
                await this.saveRejection();
                return 'reject';
            case 'Not Now':
            default:
                return 'later';
        }
    }

    /**
     * Run the complete setup process - Opens Copilot Chat with a rich prompt
     */
    async runSetup(config?: Partial<ContextSetupConfig>): Promise<GenerationResult> {
        this.outputChannel.appendLine('[Progressive Context] Starting setup...');

        try {
            // Step 1: Analyze project
            this.outputChannel.appendLine('[Progressive Context] Analyzing project...');
            const analyzer = new ProjectAnalyzer(this.workspaceRoot);
            const projectInfo = await analyzer.analyze();
            this.logProjectInfo(projectInfo);

            // Step 2: Generate rich prompt for Copilot Chat
            this.outputChannel.appendLine('[Progressive Context] Generating Copilot prompt...');
            const prompt = this.generateCopilotPrompt(projectInfo);

            // Step 3: Open Copilot Chat with the prompt
            await this.openCopilotChatWithPrompt(prompt);

            return {
                success: true,
                filesCreated: [],
                filesSkipped: [],
                errors: []
            };
        } catch (error) {
            this.outputChannel.appendLine(`[Progressive Context] Error: ${error}`);
            vscode.window.showErrorMessage(`Failed to start setup: ${error}`);
            return {
                success: false,
                filesCreated: [],
                filesSkipped: [],
                errors: [`Setup failed: ${error}`]
            };
        }
    }

    /**
     * Generate a rich prompt for Copilot Chat based on project analysis
     */
    private generateCopilotPrompt(projectInfo: ProjectInfo): string {
        const projectDetails = this.formatProjectDetails(projectInfo);
        
        // Use single quotes and careful escaping
        const prompt = [
            '# Progressive Context Setup Request',
            '',
            '## IMPORTANT: Research First',
            '',
            'Before creating any files, please **fetch and read** these articles to understand context engineering best practices:',
            '',
            '1. **Anthropic Context Engineering**: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents',
            '2. **Progressive Context Enrichment**: https://www.inferable.ai/blog/posts/llm-progressive-context-encrichment',
            '3. **AGENTS.md Standard**: https://agents.md/',
            '4. **Claude Agent Skills Best Practices**: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices',
            '5. **Token Problem & Progressive Disclosure**: https://hackernoon.com/progressive-context-disclosure-and-the-token-problem',
            '',
            'Read these articles to understand:',
            '- Progressive disclosure patterns',
            '- Concise instruction writing ("context is finite")',
            '- Right altitude for instructions',
            '- SKILL.md structure with references',
            '- Compaction strategies',
            '',
            '---',
            '',
            '## Your Task',
            '',
            'Create a complete **Progressive Context** structure. Generate files that are **specific to this project**, not generic templates.',
            '',
            '## Project Analysis (Auto-Detected)',
            projectDetails,
            '',
            '---',
            '',
            '## Directory Structure to Create',
            '',
            '```',
            '[project-root]/',
            '├── AGENTS.md                    # Main entry point (MUST be at root for detection)',
            '└── .ai-agents/',
            '    ├── QUICK-REFERENCE.md       # Condensed checklist (fits in context)',
            '    ├── skills/',
            '    │   ├── SKILL.md             # Progressive disclosure hub',
            '    │   ├── SESSION-WORKFLOW.md  # Session management details',
            '    │   ├── CONTRACT-REFERENCE.md # Contract validation workflow',
            '    │   ├── DOCUMENTATION-WORKFLOW.md # Doc creation rules',
            '    │   └── PATTERNS-REFERENCE.md # Code patterns for this project',
            '    └── copilot-instructions.md  # GitHub Copilot custom instructions',
            '```',
            '',
            '**IMPORTANT**: AGENTS.md MUST be at project root (not inside .ai-agents/) for the extension detection to work properly.',
            '',
            '---',
            '',
            '## CRITICAL PATH RULE',
            '',
            '**ALWAYS use relative paths** in all MCP tool calls and examples:',
            '- CORRECT: identify_context({ file_path: "./src/index.ts" })',
            '- WRONG: identify_context({ file_path: "/Users/username/project/src/index.ts" })',
            '',
            'Absolute paths break when multiple developers work on the project. ALL examples in generated files must use relative paths starting with "./"',
            '',
            '---',
            '',
            '## Available MCP Tools (AI Project Context Extension)',
            '',
            'This project has access to the **AI Project Context MCP** which provides powerful context management. ALL generated files must reference and leverage these tools:',
            '',
            '### Session & Focus Management',
            '| Tool | Purpose |',
            '|------|---------|',
            '| identify_context | Auto-detect project and context from file path |',
            '| start_session | Begin focused work session with objectives |',
            '| get_current_focus | Get active session state and focus |',
            '| update_focus | Change session focus when direction changes |',
            '| create_checkpoint | Save progress milestone |',
            '| complete_session | Mark session as done |',
            '| refresh_session_context | Reload context every 10 turns |',
            '',
            '### Guidelines & Contracts',
            '| Tool | Purpose |',
            '|------|---------|',
            '| get_merged_guidelines | Load global + project guidelines |',
            '| get_guidelines | Get context-specific guidelines |',
            '| register_contract | Define critical interfaces that must be respected |',
            '| get_contracts | Retrieve interface contracts |',
            '| validate_contract | Check code against contracts |',
            '',
            '### Patterns & Features',
            '| Tool | Purpose |',
            '|------|---------|',
            '| learn_pattern | Teach MCP a new code pattern |',
            '| register_feature | Document a feature with business rules |',
            '| get_features | List project features |',
            '| get_feature_context | Get complete feature context |',
            '',
            '### Documentation & Decisions',
            '| Tool | Purpose |',
            '|------|---------|',
            '| check_existing_documentation | Check before creating new docs |',
            '| manage_documentation | Create/update documentation |',
            '| add_decision | Record architectural decisions (ADR) |',
            '| get_complete_project_context | Get full project summary |',
            '',
            '---',
            '',
            '## MCP Workflow to Document',
            '',
            'ALL files should teach AI agents this workflow:',
            '',
            '1. identify_context({ file_path: "./src/file.ts" }) - Know where you are (RELATIVE PATH!)',
            '2. get_current_focus() - Check active session',
            '3. start_session({ context, current_focus }) OR get_merged_guidelines({ context }) - Start/load rules',
            '4. [Do the work] - Execute task',
            '5. create_checkpoint({ summary, next_focus }) - Save progress',
            '6. complete_session() when done - Close session',
            '',
            '---',
            '',
            '## File Requirements',
            '',
            '### 1. AGENTS.md (at project root)',
            'Main entry point with: Project overview, MCP Quick Start (relative paths!), Dev environment, Code conventions, Architecture, Links to .ai-agents/ files',
            '',
            '### 2. .ai-agents/QUICK-REFERENCE.md',
            'Condensed checklist (<500 tokens): Every conversation workflow, Path rule reminder, Checklist, Links',
            '',
            '### 3. .ai-agents/skills/SKILL.md',
            'Progressive disclosure hub: Quick start code, Path convention, Links to workflow files, Anti-patterns',
            '',
            '### 4. .ai-agents/copilot-instructions.md',
            'GitHub Copilot instructions: Reference to AGENTS.md, Path convention rule, Core rules, MCP workflow',
            '',
            '---',
            '',
            '## Quality Criteria',
            '',
            '- AGENTS.md at project root (required for extension detection)',
            '- Other files inside .ai-agents/ directory',
            '- All paths are relative (./src/... not /Users/...)',
            '- Every section filled with project-specific content',
            '- Commands that actually work for this project',
            '- MCP tools properly referenced and integrated',
            '- No generic placeholders like "[customize this]"',
            '',
            '---',
            '',
            '## Action',
            '',
            '1. **First**: Fetch and read the 5 articles listed above',
            '2. **Then**: Analyze this project codebase to understand architecture',
            '3. **Create AGENTS.md at project root** (required for detection)',
            '4. **Create .ai-agents/ directory** with QUICK-REFERENCE.md, skills/, and copilot-instructions.md',
            '5. **Verify**: All paths in examples are relative (./path), not absolute',
            '',
            'Start by creating **AGENTS.md at the project root**, then create the .ai-agents/ directory with the remaining files.'
        ].join('\n');
        
        return prompt;
    }

    /**
     * Format project details for the prompt
     */
    private formatProjectDetails(info: ProjectInfo): string {
        const lines: string[] = [];
        
        lines.push(`**Project Name**: ${info.name}`);
        lines.push(`**Root Path**: ${info.rootPath}`);
        lines.push(`**Languages**: ${info.languages.join(', ') || 'Not detected'}`);
        lines.push(`**Frameworks**: ${info.frameworks.join(', ') || 'None detected'}`);
        lines.push(`**Build Tools**: ${info.buildTools.join(', ') || 'None detected'}`);
        lines.push(`**Package Manager**: ${info.packageManager || 'Not detected'}`);
        lines.push(`**Has Tests**: ${info.hasTests ? 'Yes' : 'No'}`);
        if (info.testFrameworks.length > 0) {
            lines.push(`**Test Frameworks**: ${info.testFrameworks.join(', ')}`);
        }
        lines.push(`**Has Docker**: ${info.hasDocker ? 'Yes' : 'No'}`);
        lines.push(`**CI/CD**: ${info.hasCICD ? info.cicdPlatform : 'None detected'}`);
        lines.push(`**Entry Points**: ${info.mainEntryPoints.join(', ') || 'Not detected'}`);
        lines.push(`**Directory Structure**:`);
        for (const dir of info.structure.directories.slice(0, 10)) {
            lines.push(`  - ${dir}/`);
        }
        
        return lines.join('\n');
    }

    /**
     * Open Copilot Chat with a pre-filled prompt
     */
    private async openCopilotChatWithPrompt(prompt: string): Promise<void> {
        try {
            // Try to use the Copilot Chat API to open with a prompt
            await vscode.commands.executeCommand('workbench.action.chat.open', {
                query: prompt,
                isPartialQuery: false
            });
            
            this.outputChannel.appendLine('[Progressive Context] Copilot Chat opened with prompt');
            
            vscode.window.showInformationMessage(
                '🚀 Copilot Chat opened! Follow the instructions to create your Progressive Context files.',
                'Got it'
            );
        } catch (error) {
            this.outputChannel.appendLine(`[Progressive Context] Failed to open chat directly: ${error}`);
            
            // Fallback: Copy to clipboard and notify user
            await vscode.env.clipboard.writeText(prompt);
            
            const action = await vscode.window.showInformationMessage(
                '📋 Setup prompt copied to clipboard! Open Copilot Chat (Cmd+Shift+I) and paste it.',
                'Open Chat',
                'OK'
            );
            
            if (action === 'Open Chat') {
                await vscode.commands.executeCommand('workbench.action.chat.open');
            }
        }
    }

    /**
     * Check if user has previously rejected setup for this workspace
     */
    hasUserRejected(): boolean {
        const preferences = this.context.globalState.get<Record<string, UserPreference>>(PREFERENCE_KEY, {});
        const key = this.getWorkspaceKey();
        const pref = preferences[key];
        
        if (!pref) return false;
        
        // Allow re-prompting if version changed
        if (pref.version !== CURRENT_VERSION) return false;
        
        return pref.rejected;
    }

    /**
     * Save user rejection preference
     */
    async saveRejection(): Promise<void> {
        const preferences = this.context.globalState.get<Record<string, UserPreference>>(PREFERENCE_KEY, {});
        const key = this.getWorkspaceKey();
        
        preferences[key] = {
            rejected: true,
            rejectedAt: new Date().toISOString(),
            workspacePath: this.workspaceRoot,
            version: CURRENT_VERSION
        };

        await this.context.globalState.update(PREFERENCE_KEY, preferences);
        this.outputChannel.appendLine('[Progressive Context] User preference saved: rejected');
    }

    /**
     * Clear rejection preference (for testing or user request)
     */
    async clearRejection(): Promise<void> {
        const preferences = this.context.globalState.get<Record<string, UserPreference>>(PREFERENCE_KEY, {});
        const key = this.getWorkspaceKey();
        
        delete preferences[key];
        
        await this.context.globalState.update(PREFERENCE_KEY, preferences);
        this.outputChannel.appendLine('[Progressive Context] User preference cleared');
    }

    /**
     * Check and prompt for setup if needed (main entry point)
     */
    async checkAndPrompt(): Promise<void> {
        try {
            const { needsSetup, existingFiles, missingFiles } = await this.checkWorkspace();

            if (!needsSetup) {
                this.outputChannel.appendLine('[Progressive Context] Workspace already has context structure');
                return;
            }

            this.outputChannel.appendLine(`[Progressive Context] Missing files: ${missingFiles.join(', ')}`);

            const response = await this.showSetupPrompt();

            if (response === 'accept') {
                await this.runSetup();
            }
        } catch (error) {
            this.outputChannel.appendLine(`[Progressive Context] Check failed: ${error}`);
        }
    }

    // Private helper methods

    private getWorkspaceKey(): string {
        return Buffer.from(this.workspaceRoot).toString('base64').slice(0, 32);
    }

    private logProjectInfo(info: ProjectInfo): void {
        this.outputChannel.appendLine(`[Progressive Context] Project: ${info.name}`);
        this.outputChannel.appendLine(`[Progressive Context] Languages: ${info.languages.join(', ')}`);
        this.outputChannel.appendLine(`[Progressive Context] Frameworks: ${info.frameworks.join(', ') || 'none'}`);
        this.outputChannel.appendLine(`[Progressive Context] Build tools: ${info.buildTools.join(', ') || 'none'}`);
    }
}

/**
 * Register commands for progressive context setup
 */
export function registerContextSetupCommands(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel
): void {
    // Command to manually run setup
    context.subscriptions.push(
        vscode.commands.registerCommand('aiProjectContext.setupProgressiveContext', async () => {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const manager = new ContextSetupManager(context, workspaceRoot, outputChannel);
            await manager.runSetup();
        })
    );

    // Command to clear rejection and re-prompt
    context.subscriptions.push(
        vscode.commands.registerCommand('aiProjectContext.resetProgressiveContextPrompt', async () => {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const manager = new ContextSetupManager(context, workspaceRoot, outputChannel);
            await manager.clearRejection();
            vscode.window.showInformationMessage('Progressive Context prompt has been reset. It will appear on next activation.');
        })
    );

    // Command to check status
    context.subscriptions.push(
        vscode.commands.registerCommand('aiProjectContext.checkProgressiveContextStatus', async () => {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const manager = new ContextSetupManager(context, workspaceRoot, outputChannel);
            const { needsSetup, existingFiles, missingFiles } = await manager.checkWorkspace();

            if (!needsSetup) {
                vscode.window.showInformationMessage(
                    `✅ Progressive Context is configured.\n\nExisting files: ${existingFiles.join(', ')}`
                );
            } else {
                const result = await vscode.window.showInformationMessage(
                    `⚠️ Progressive Context is not fully configured.\n\nMissing: ${missingFiles.join(', ')}`,
                    'Setup Now'
                );

                if (result === 'Setup Now') {
                    await manager.runSetup();
                }
            }
        })
    );
}
