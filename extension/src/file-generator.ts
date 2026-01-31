import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GeneratedFile } from './template-engine';

/**
 * Result of a file generation operation
 */
export interface GenerationResult {
    success: boolean;
    filesCreated: string[];
    filesSkipped: string[];
    errors: string[];
}

/**
 * Handles file generation and VS Code configuration
 */
export class FileGenerator {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Generate all files, skipping those that already exist
     */
    async generateFiles(files: GeneratedFile[], overwrite: boolean = false): Promise<GenerationResult> {
        const result: GenerationResult = {
            success: true,
            filesCreated: [],
            filesSkipped: [],
            errors: []
        };

        for (const file of files) {
            try {
                const fullPath = path.join(this.workspaceRoot, file.relativePath);
                const exists = fs.existsSync(fullPath);

                if (exists && !overwrite) {
                    result.filesSkipped.push(file.relativePath);
                    continue;
                }

                // Ensure directory exists
                const dir = path.dirname(fullPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                // Write file
                fs.writeFileSync(fullPath, file.content, 'utf-8');
                result.filesCreated.push(file.relativePath);
            } catch (error) {
                result.success = false;
                result.errors.push(`Failed to create ${file.relativePath}: ${error}`);
            }
        }

        return result;
    }

    /**
     * Check which files already exist
     */
    checkExistingFiles(files: GeneratedFile[]): { existing: string[]; missing: string[] } {
        const existing: string[] = [];
        const missing: string[] = [];

        for (const file of files) {
            const fullPath = path.join(this.workspaceRoot, file.relativePath);
            if (fs.existsSync(fullPath)) {
                existing.push(file.relativePath);
            } else {
                missing.push(file.relativePath);
            }
        }

        return { existing, missing };
    }

    /**
     * Check if the core progressive context structure exists
     * AGENTS.md MUST be at project root for detection to work
     */
    hasProgressiveContextStructure(): boolean {
        // AGENTS.md must be at project root (not inside .ai-agents/)
        const hasAgentsMd = fs.existsSync(path.join(this.workspaceRoot, 'AGENTS.md'));
        
        return hasAgentsMd;
    }
}

/**
 * Configures VS Code workspace settings for progressive context
 */
export class VSCodeConfigurer {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Configure VS Code settings for the workspace
     */
    async configureWorkspace(): Promise<{ success: boolean; configured: string[] }> {
        const configured: string[] = [];
        
        try {
            // Get workspace configuration
            const config = vscode.workspace.getConfiguration('', vscode.Uri.file(this.workspaceRoot));

            // Configure Copilot to use custom instructions
            const copilotConfig = vscode.workspace.getConfiguration('github.copilot.chat', vscode.Uri.file(this.workspaceRoot));
            
            // Check if codeGeneration.instructions is already configured
            const currentInstructions = copilotConfig.get<Array<{file: string}>>('codeGeneration.instructions');
            
            if (!currentInstructions || currentInstructions.length === 0) {
                // Add instruction file references
                const instructionsToAdd = [
                    { file: '.github/copilot-instructions.md' }
                ];

                await copilotConfig.update(
                    'codeGeneration.instructions',
                    instructionsToAdd,
                    vscode.ConfigurationTarget.Workspace
                );
                configured.push('github.copilot.chat.codeGeneration.instructions');
            }

            // Configure file associations for better editing
            const filesConfig = vscode.workspace.getConfiguration('files', vscode.Uri.file(this.workspaceRoot));
            
            // Add AGENTS.md and SKILL.md to markdown associations
            const currentAssociations = filesConfig.get<Record<string, string>>('associations') || {};
            
            if (!currentAssociations['AGENTS.md']) {
                await filesConfig.update(
                    'associations',
                    {
                        ...currentAssociations,
                        'AGENTS.md': 'markdown',
                        'SKILL.md': 'markdown'
                    },
                    vscode.ConfigurationTarget.Workspace
                );
                configured.push('files.associations');
            }

            // Configure editor settings for markdown
            const editorConfig = vscode.workspace.getConfiguration('[markdown]', vscode.Uri.file(this.workspaceRoot));
            
            // Enable word wrap for markdown
            const currentWordWrap = editorConfig.get('editor.wordWrap');
            if (!currentWordWrap) {
                await vscode.workspace.getConfiguration().update(
                    '[markdown]',
                    {
                        'editor.wordWrap': 'on',
                        'editor.quickSuggestions': {
                            'other': true,
                            'comments': false,
                            'strings': false
                        }
                    },
                    vscode.ConfigurationTarget.Workspace
                );
                configured.push('[markdown] settings');
            }

            return { success: true, configured };
        } catch (error) {
            console.error('Failed to configure workspace:', error);
            return { success: false, configured };
        }
    }

    /**
     * Create or update .vscode/settings.json with recommended settings
     */
    async updateVSCodeSettings(): Promise<boolean> {
        const vscodePath = path.join(this.workspaceRoot, '.vscode');
        const settingsPath = path.join(vscodePath, 'settings.json');

        try {
            // Ensure .vscode directory exists
            if (!fs.existsSync(vscodePath)) {
                fs.mkdirSync(vscodePath, { recursive: true });
            }

            // Read existing settings or create new
            let settings: Record<string, any> = {};
            if (fs.existsSync(settingsPath)) {
                const content = fs.readFileSync(settingsPath, 'utf-8');
                try {
                    settings = JSON.parse(content);
                } catch {
                    // If JSON is invalid, back it up and create new
                    fs.renameSync(settingsPath, `${settingsPath}.backup`);
                }
            }

            // Add progressive context settings
            const newSettings = {
                ...settings,
                'github.copilot.chat.codeGeneration.instructions': [
                    { 'file': '.github/copilot-instructions.md' }
                ],
                'files.associations': {
                    ...(settings['files.associations'] || {}),
                    'AGENTS.md': 'markdown',
                    'SKILL.md': 'markdown'
                },
                '[markdown]': {
                    ...(settings['[markdown]'] || {}),
                    'editor.wordWrap': 'on'
                },
                // Recommended: Add AGENTS.md to Copilot's context
                'github.copilot.chat.localeOverride': settings['github.copilot.chat.localeOverride'] || 'en'
            };

            // Write settings
            fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), 'utf-8');
            
            return true;
        } catch (error) {
            console.error('Failed to update VS Code settings:', error);
            return false;
        }
    }

    /**
     * Check if workspace already has progressive context configuration
     */
    hasConfiguration(): boolean {
        const settingsPath = path.join(this.workspaceRoot, '.vscode', 'settings.json');
        
        if (!fs.existsSync(settingsPath)) {
            return false;
        }

        try {
            const content = fs.readFileSync(settingsPath, 'utf-8');
            const settings = JSON.parse(content);
            
            // Check for copilot instructions configuration
            const instructions = settings['github.copilot.chat.codeGeneration.instructions'];
            if (instructions && Array.isArray(instructions)) {
                return instructions.some((i: any) => 
                    i.file && (
                        i.file.includes('copilot-instructions') ||
                        i.file.includes('AGENTS.md')
                    )
                );
            }
            
            return false;
        } catch {
            return false;
        }
    }
}
