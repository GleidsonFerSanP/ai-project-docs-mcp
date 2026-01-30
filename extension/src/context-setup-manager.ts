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
     * Run the complete setup process
     */
    async runSetup(config?: Partial<ContextSetupConfig>): Promise<GenerationResult> {
        const fullConfig: ContextSetupConfig = {
            autoPrompt: true,
            useLLMCustomization: true,
            filesToGenerate: ['all'],
            ...config
        };

        this.outputChannel.appendLine('[Progressive Context] Starting setup...');

        try {
            // Step 1: Analyze project
            this.outputChannel.appendLine('[Progressive Context] Analyzing project...');
            const analyzer = new ProjectAnalyzer(this.workspaceRoot);
            const projectInfo = await analyzer.analyze();
            this.logProjectInfo(projectInfo);

            // Step 2: Generate templates
            this.outputChannel.appendLine('[Progressive Context] Generating templates...');
            const templateEngine = new TemplateEngine(projectInfo);
            let files = templateEngine.generateAllFiles();

            // Step 3: Filter files based on config
            if (!fullConfig.filesToGenerate.includes('all')) {
                files = this.filterFiles(files, fullConfig.filesToGenerate);
            }

            // Step 4: LLM customization (if enabled and available)
            if (fullConfig.useLLMCustomization) {
                files = await this.customizeWithLLM(files, projectInfo, templateEngine);
            }

            // Step 5: Generate files
            this.outputChannel.appendLine('[Progressive Context] Writing files...');
            const fileGenerator = new FileGenerator(this.workspaceRoot);
            const result = await fileGenerator.generateFiles(files, false);

            // Step 6: Configure VS Code
            if (result.filesCreated.length > 0) {
                this.outputChannel.appendLine('[Progressive Context] Configuring VS Code...');
                const configurer = new VSCodeConfigurer(this.workspaceRoot);
                await configurer.updateVSCodeSettings();
            }

            // Step 7: Show result
            this.showResult(result);

            return result;
        } catch (error) {
            this.outputChannel.appendLine(`[Progressive Context] Error: ${error}`);
            return {
                success: false,
                filesCreated: [],
                filesSkipped: [],
                errors: [`Setup failed: ${error}`]
            };
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

    private filterFiles(files: GeneratedFile[], filter: string[]): GeneratedFile[] {
        return files.filter(file => {
            if (filter.includes('agents') && file.relativePath === 'AGENTS.md') return true;
            if (filter.includes('skills') && file.relativePath.includes('docs/skills')) return true;
            if (filter.includes('copilot-instructions') && file.relativePath.includes('copilot-instructions')) return true;
            return false;
        });
    }

    private async customizeWithLLM(
        files: GeneratedFile[], 
        projectInfo: ProjectInfo,
        templateEngine: TemplateEngine
    ): Promise<GeneratedFile[]> {
        // Check if language model is available
        const models = await vscode.lm.selectChatModels({ family: 'gpt-4' });
        
        if (models.length === 0) {
            this.outputChannel.appendLine('[Progressive Context] No LLM available, using base templates');
            return files;
        }

        this.outputChannel.appendLine('[Progressive Context] Customizing with LLM...');

        const model = models[0];
        const customizedFiles: GeneratedFile[] = [];

        for (const file of files) {
            // Only customize main files
            if (file.relativePath !== 'AGENTS.md' && !file.relativePath.includes('SKILL.md')) {
                customizedFiles.push(file);
                continue;
            }

            try {
                const prompt = this.createCustomizationPrompt(file, projectInfo);
                const messages = [vscode.LanguageModelChatMessage.User(prompt)];
                
                const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
                
                let customizedContent = '';
                for await (const chunk of response.text) {
                    customizedContent += chunk;
                }

                // Extract content from markdown code block if present
                const extractedContent = this.extractMarkdownContent(customizedContent);

                customizedFiles.push({
                    ...file,
                    content: extractedContent || file.content
                });

                this.outputChannel.appendLine(`[Progressive Context] Customized: ${file.relativePath}`);
            } catch (error) {
                this.outputChannel.appendLine(`[Progressive Context] LLM customization failed for ${file.relativePath}: ${error}`);
                customizedFiles.push(file);
            }
        }

        return customizedFiles;
    }

    private createCustomizationPrompt(file: GeneratedFile, projectInfo: ProjectInfo): string {
        return `You are helping to create project documentation for AI coding assistants.

PROJECT INFORMATION:
- Name: ${projectInfo.name}
- Languages: ${projectInfo.languages.join(', ')}
- Frameworks: ${projectInfo.frameworks.join(', ') || 'None'}
- Build Tools: ${projectInfo.buildTools.join(', ') || 'None'}
- Test Frameworks: ${projectInfo.testFrameworks.join(', ') || 'None'}
- Has Docker: ${projectInfo.hasDocker}
- CI/CD: ${projectInfo.hasCICD ? projectInfo.cicdPlatform : 'None'}
- Package Manager: ${projectInfo.packageManager || 'Unknown'}
- Structure: ${projectInfo.structure.directories.slice(0, 5).join(', ')}

BASE TEMPLATE:
\`\`\`markdown
${file.content}
\`\`\`

TASK:
Customize this ${file.relativePath} file for the specific project above. 
- Fill in placeholder sections with reasonable defaults based on the detected tech stack
- Keep sections relevant to the detected technologies
- Remove sections that don't apply
- Keep it concise and actionable
- Maintain the same structure and format

Return ONLY the customized markdown content, no explanations.`;
    }

    private extractMarkdownContent(response: string): string | null {
        // Try to extract from code block
        const codeBlockMatch = response.match(/```(?:markdown)?\n?([\s\S]*?)```/);
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim();
        }
        
        // If no code block, check if response looks like markdown
        if (response.includes('#') && response.includes('\n')) {
            return response.trim();
        }

        return null;
    }

    private showResult(result: GenerationResult): void {
        if (result.filesCreated.length > 0) {
            vscode.window.showInformationMessage(
                `✅ Progressive Context Setup complete! Created ${result.filesCreated.length} files.`,
                'Open AGENTS.md'
            ).then(selection => {
                if (selection === 'Open AGENTS.md') {
                    const agentsPath = path.join(this.workspaceRoot, 'AGENTS.md');
                    vscode.workspace.openTextDocument(agentsPath).then(doc => {
                        vscode.window.showTextDocument(doc);
                    });
                }
            });
        } else if (result.filesSkipped.length > 0) {
            vscode.window.showInformationMessage(
                `Progressive Context files already exist. Skipped ${result.filesSkipped.length} files.`
            );
        }

        if (result.errors.length > 0) {
            vscode.window.showErrorMessage(
                `Some files failed to create: ${result.errors.join(', ')}`
            );
        }
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
