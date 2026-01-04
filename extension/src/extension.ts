import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('Project Docs MCP extension is now active!');

    // Configurar MCP automaticamente ao ativar
    const config = vscode.workspace.getConfiguration('projectDocsMcp');
    const autoStart = config.get<boolean>('autoStart', true);

    if (autoStart) {
        configureMCP(context);
    }

    // Command: Configure MCP
    const configureCmd = vscode.commands.registerCommand('project-docs-mcp.configure', () => {
        configureMCP(context);
        vscode.window.showInformationMessage('Project Docs MCP configured successfully!');
    });

    // Command: Restart MCP Server
    const restartCmd = vscode.commands.registerCommand('project-docs-mcp.restart', () => {
        vscode.window.showInformationMessage('Restarting MCP server... Please reload VS Code.');
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    });

    // Command: Open Documentation
    const viewDocsCmd = vscode.commands.registerCommand('project-docs-mcp.viewDocs', () => {
        const docsPath = path.join(context.extensionPath, '..', 'docs');
        if (fs.existsSync(docsPath)) {
            vscode.env.openExternal(vscode.Uri.file(docsPath));
        } else {
            vscode.window.showWarningMessage('Documentation not found!');
        }
    });

    context.subscriptions.push(configureCmd, restartCmd, viewDocsCmd);

    // Mostrar mensagem de boas-vindas
    vscode.window.showInformationMessage(
        'Project Docs MCP is ready! Use @project-docs in Copilot Chat.',
        'Open Docs'
    ).then(selection => {
        if (selection === 'Open Docs') {
            vscode.commands.executeCommand('project-docs-mcp.viewDocs');
        }
    });
}

function configureMCP(context: vscode.ExtensionContext) {
    // Caminho do MCP server (bundled na extensão)
    const mcpServerPath = path.join(context.extensionPath, '..', 'dist', 'index.js');

    if (!fs.existsSync(mcpServerPath)) {
        vscode.window.showErrorMessage(
            'MCP Server not found! Please reinstall the extension.'
        );
        return;
    }

    // Criar/atualizar configuração MCP do Copilot
    const mcpConfig = getMCPConfigPath();
    
    if (!mcpConfig) {
        vscode.window.showWarningMessage(
            'Could not locate MCP config path. Please configure manually.'
        );
        return;
    }

    // Ler configuração existente ou criar nova
    let config: any = { servers: {} };
    
    if (fs.existsSync(mcpConfig)) {
        try {
            const content = fs.readFileSync(mcpConfig, 'utf-8');
            config = JSON.parse(content);
        } catch (error) {
            console.error('Error reading MCP config:', error);
        }
    }

    // Adicionar/atualizar configuração do Project Docs MCP
    config.servers['project-docs'] = {
        command: 'node',
        args: [mcpServerPath]
    };

    // Criar diretório se não existir
    const configDir = path.dirname(mcpConfig);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    // Salvar configuração
    try {
        fs.writeFileSync(mcpConfig, JSON.stringify(config, null, 2), 'utf-8');
        console.log('MCP config updated successfully at:', mcpConfig);
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to update MCP config: ${error}`
        );
    }
}

function getMCPConfigPath(): string | null {
    const platform = process.platform;
    const homeDir = process.env.HOME || process.env.USERPROFILE;

    if (!homeDir) {
        return null;
    }

    let configPath: string;

    switch (platform) {
        case 'darwin': // macOS
            configPath = path.join(
                homeDir,
                'Library',
                'Application Support',
                'Code',
                'User',
                'globalStorage',
                'github.copilot-chat',
                'mcp.json'
            );
            break;

        case 'linux':
            configPath = path.join(
                homeDir,
                '.config',
                'Code',
                'User',
                'globalStorage',
                'github.copilot-chat',
                'mcp.json'
            );
            break;

        case 'win32': // Windows
            const appData = process.env.APPDATA;
            if (!appData) {
                return null;
            }
            configPath = path.join(
                appData,
                'Code',
                'User',
                'globalStorage',
                'github.copilot-chat',
                'mcp.json'
            );
            break;

        default:
            return null;
    }

    return configPath;
}

export function deactivate() {
    console.log('Project Docs MCP extension deactivated');
}
