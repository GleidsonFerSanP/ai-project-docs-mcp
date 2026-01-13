import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Output channel para logs categorizados
let outputChannel: vscode.OutputChannel;

function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    const logMessage = `[${timestamp}] ${prefix} ${message}`;
    
    outputChannel.appendLine(logMessage);
    
    // Também logar no console para debug
    if (level === 'error') {
        console.error(logMessage);
    } else if (level === 'warn') {
        console.warn(logMessage);
    } else {
        console.log(logMessage);
    }
}

export function activate(context: vscode.ExtensionContext) {
    // Criar output channel categorizado
    outputChannel = vscode.window.createOutputChannel('AI Project Context', { log: true });
    context.subscriptions.push(outputChannel);
    
    log('AI Project Context extension is now active!');
    log(`Extension path: ${context.extensionPath}`);

    // Garantir que estrutura global existe
    ensureGlobalStructure();

    // Registrar MCP Server Definition Provider (API moderna do VS Code)
    log('Registering MCP Server Definition Provider...');
    const mcpServerPath = path.join(context.extensionPath, 'mcp-server', 'index.js');
    log(`MCP Server path: ${mcpServerPath}`);
    
    // Verificar se arquivo existe
    if (!fs.existsSync(mcpServerPath)) {
        log(`MCP Server file not found at: ${mcpServerPath}`, 'error');
    } else {
        log('MCP Server file found successfully');
    }
    
    context.subscriptions.push(
        vscode.lm.registerMcpServerDefinitionProvider('ai-project-context', {
            provideMcpServerDefinitions() {
                log('Providing MCP Server definitions...');
                return [
                    new vscode.McpStdioServerDefinition(
                        'ai-project-context',
                        'node',
                        [mcpServerPath]
                    )
                ];
            }
        })
    );
    log('MCP Server Definition Provider registered successfully');

    // Configurar MCP automaticamente ao ativar (fallback para versões antigas)
    const config = vscode.workspace.getConfiguration('aiProjectContext');
    const autoStart = config.get<boolean>('autoStart', true);

    if (autoStart) {
        configureMCP(context);
    }

    // Command: Configure MCP
    const configureCmd = vscode.commands.registerCommand('ai-project-context.configure', () => {
        log('Command: Configure MCP');
        configureMCP(context);
        vscode.window.showInformationMessage('AI Project Context configured successfully!');
    });

    // Command: Restart MCP Server
    const restartCmd = vscode.commands.registerCommand('ai-project-context.restart', () => {
        log('Command: Restart MCP Server');
        vscode.window.showInformationMessage('Restarting MCP server... Please reload VS Code.');
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    });

    // Command: Open Documentation
    const viewDocsCmd = vscode.commands.registerCommand('ai-project-context.viewDocs', () => {
        // Abrir README no GitHub
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/GleidsonFerSanP/ai-project-docs-mcp#readme'));
    });

    context.subscriptions.push(configureCmd, restartCmd, viewDocsCmd);

    // Mostrar mensagem de boas-vindas
    vscode.window.showInformationMessage(
        'AI Project Context is ready! Use @ai-project-context in Copilot Chat.',
        'Open Docs'
    ).then(selection => {
        if (selection === 'Open Docs') {
            vscode.commands.executeCommand('ai-project-context.viewDocs');
        }
    });
}

function ensureGlobalStructure() {
    log('Ensuring global structure exists...');
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
        log('Could not determine home directory', 'error');
        return;
    }
    log(`Home directory: ${homeDir}`);

    const globalDir = path.join(homeDir, '.project-docs-mcp');
    const configPath = path.join(globalDir, 'mcp-config.json');
    const knowledgeDir = path.join(globalDir, 'knowledge');
    const docsDir = path.join(globalDir, 'docs');

    // Criar diretórios se não existirem
    [globalDir, knowledgeDir, docsDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log(`Created directory: ${dir}`);
        } else {
            log(`Directory already exists: ${dir}`);
        }
    });

    // Criar config padrão se não existir
    if (!fs.existsSync(configPath)) {
        const defaultConfig = {
            version: '1.2.0',
            defaultProject: 'default',
            workspaceRoots: [
                '${HOME}/workspace',
                '${HOME}/projects',
                '${HOME}/dev'
            ],
            projects: {
                default: {
                    name: 'Default Project',
                    description: 'Default project configuration. Edit ~/.project-docs-mcp/mcp-config.json to customize.',
                    paths: ['${HOME}/workspace', '${HOME}/projects'],
                    stack: {
                        backend: 'Node.js',
                        frontend: 'React'
                    },
                    principles: ['SOLID', 'Clean Code']
                }
            }
        };

        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
        console.log(`Created default config at: ${configPath}`);
        
        vscode.window.showInformationMessage(
            `Project Docs MCP initialized at ${globalDir}`,
            'Open Config'
        ).then(selection => {
            if (selection === 'Open Config') {
                vscode.workspace.openTextDocument(configPath).then(doc => {
                    vscode.window.showTextDocument(doc);
                });
            }
        });
    }
}

function configureMCP(context: vscode.ExtensionContext) {
    // Caminho do MCP server (bundled na extensão)
    const mcpServerPath = path.join(context.extensionPath, 'mcp-server', 'index.js');

    if (!fs.existsSync(mcpServerPath)) {
        vscode.window.showErrorMessage(
            'MCP Server not found! Please reinstall the extension.'
        );
        return;
    }

    // GitHub Copilot usa mcpServers.json (não mcp.json)
    const mcpConfigDir = getMCPConfigDir();
    
    if (!mcpConfigDir) {
        vscode.window.showWarningMessage(
            'Could not locate MCP config path. Please configure manually.'
        );
        return;
    }

    // Criar diretório se não existir
    if (!fs.existsSync(mcpConfigDir)) {
        fs.mkdirSync(mcpConfigDir, { recursive: true });
    }

    const mcpServersPath = path.join(mcpConfigDir, 'mcpServers.json');

    // Ler configuração existente ou criar nova
    let config: any = { mcpServers: {} };
    
    if (fs.existsSync(mcpServersPath)) {
        try {
            const content = fs.readFileSync(mcpServersPath, 'utf-8');
            config = JSON.parse(content);
            if (!config.mcpServers) {
                config.mcpServers = {};
            }
        } catch (error) {
            console.error('Error reading MCP config:', error);
            config = { mcpServers: {} };
        }
    }

    // Adicionar/atualizar configuração do Project Docs MCP
    config.mcpServers['project-docs'] = {
        command: 'node',
        args: [mcpServerPath],
        disabled: false,
        alwaysAllow: [
            'create_project',
            'list_projects',
            'get_project_info',
            'switch_project',
            'identify_context',
            'get_guidelines',
            'should_document',
            'register_contract',
            'get_contracts',
            'validate_contract',
            'learn_pattern',
            'scan_project',
            'add_decision',
            'register_feature',
            'get_features',
            'update_feature',
            'get_feature_context'
        ]
    };

    // Salvar configuração
    try {
        fs.writeFileSync(mcpServersPath, JSON.stringify(config, null, 4), 'utf-8');
        console.log('MCP config updated successfully at:', mcpServersPath);
        vscode.window.showInformationMessage(
            'Project Docs MCP configured! Please reload VS Code to activate.',
            'Reload Now'
        ).then(selection => {
            if (selection === 'Reload Now') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to update MCP config: ${error}`
        );
    }
}

function getMCPConfigDir(): string | null {
    const platform = process.platform;
    const homeDir = process.env.HOME || process.env.USERPROFILE;

    if (!homeDir) {
        return null;
    }

    let configDir: string;

    switch (platform) {
        case 'darwin': // macOS
            configDir = path.join(
                homeDir,
                'Library',
                'Application Support',
                'Code',
                'User',
                'globalStorage',
                'github.copilot-chat'
            );
            break;

        case 'linux':
            configDir = path.join(
                homeDir,
                '.config',
                'Code',
                'User',
                'globalStorage',
                'github.copilot-chat'
            );
            break;

        case 'win32': // Windows
            const appData = process.env.APPDATA;
            if (!appData) {
                return null;
            }
            configDir = path.join(
                appData,
                'Code',
                'User',
                'globalStorage',
                'github.copilot-chat'
            );
            break;

        default:
            return null;
    }

    return configDir;
}

export function deactivate() {
    console.log('Project Docs MCP extension deactivated');
}
