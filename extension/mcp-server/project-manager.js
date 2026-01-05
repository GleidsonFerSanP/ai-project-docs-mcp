import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
export class ProjectManager {
    config;
    configPath;
    currentProject;
    constructor(configPath) {
        this.configPath = configPath || this.getGlobalConfigPath();
        this.ensureConfigExists();
        this.config = this.loadConfig();
    }
    /**
     * Retorna o caminho global do diretório de configuração
     */
    getGlobalConfigPath() {
        const globalDir = join(homedir(), '.project-docs-mcp');
        return join(globalDir, 'mcp-config.json');
    }
    /**
     * Garante que a estrutura de diretórios e config padrão existem
     */
    ensureConfigExists() {
        const configDir = dirname(this.configPath);
        // Criar diretório se não existir
        if (!existsSync(configDir)) {
            mkdirSync(configDir, { recursive: true });
        }
        // Criar knowledge base directory
        const knowledgeDir = join(configDir, 'knowledge');
        if (!existsSync(knowledgeDir)) {
            mkdirSync(knowledgeDir, { recursive: true });
        }
        // Criar docs directory
        const docsDir = join(configDir, 'docs');
        if (!existsSync(docsDir)) {
            mkdirSync(docsDir, { recursive: true });
        }
        // Criar config padrão se não existir
        if (!existsSync(this.configPath)) {
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
            writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
            console.log(`[Project Docs MCP] Created default config at: ${this.configPath}`);
        }
    }
    loadConfig() {
        try {
            const data = readFileSync(this.configPath, 'utf-8');
            const config = JSON.parse(data);
            // Expandir variáveis de ambiente em workspaceRoots
            if (config.workspaceRoots) {
                config.workspaceRoots = config.workspaceRoots.map((path) => this.expandEnvVars(path));
            }
            return config;
        }
        catch (error) {
            throw new Error(`Failed to load MCP config from ${this.configPath}: ${error}`);
        }
    }
    /**
     * Expande variáveis de ambiente em um path
     * Suporta ${HOME} (Linux/macOS), ${USERPROFILE} (Windows), e qualquer outra variável
     */
    expandEnvVars(path) {
        return path.replace(/\$\{(\w+)\}/g, (match, varName) => {
            // No Windows, ${HOME} deve ser mapeado para USERPROFILE se HOME não existir
            if (varName === 'HOME' && !process.env.HOME && process.env.USERPROFILE) {
                return process.env.USERPROFILE;
            }
            return process.env[varName] || match;
        });
    }
    /**
     * Retorna o diretório global base (~/.project-docs-mcp)
     */
    getGlobalDir() {
        return dirname(this.configPath);
    }
    /**
     * Retorna o root path de um projeto específico
     */
    getProjectRoot(projectId) {
        const config = this.getProjectConfig(projectId);
        if (!config || !config.paths || config.paths.length === 0) {
            return null;
        }
        return this.expandEnvVars(config.paths[0]);
    }
    /**
     * Detecta projeto baseado no caminho do arquivo
     */
    detectProject(filePath) {
        const normalizedPath = filePath.toLowerCase();
        for (const [projectId, projectConfig] of Object.entries(this.config.projects)) {
            for (const pathPattern of projectConfig.paths) {
                const normalizedPattern = pathPattern.toLowerCase();
                if (normalizedPath.includes(normalizedPattern)) {
                    return projectId;
                }
            }
        }
        return null;
    }
    /**
     * Define projeto atual
     */
    setCurrentProject(projectId) {
        if (!this.config.projects[projectId]) {
            return false;
        }
        this.currentProject = projectId;
        return true;
    }
    /**
     * Retorna projeto atual ou padrão
     */
    getCurrentProject() {
        return this.currentProject || this.config.defaultProject;
    }
    /**
     * Retorna configuração do projeto
     */
    getProjectConfig(projectId) {
        const id = projectId || this.getCurrentProject();
        return this.config.projects[id] || null;
    }
    /**
     * Cria um novo projeto dinamicamente
     */
    createProject(projectId, config, baseDocsDir, baseKnowledgeDir) {
        // Validar ID do projeto
        if (!/^[a-z0-9-_]+$/.test(projectId)) {
            return {
                success: false,
                error: 'ID do projeto deve conter apenas letras minúsculas, números, hífens e underscores'
            };
        }
        // Verificar se já existe
        if (this.config.projects[projectId]) {
            return {
                success: false,
                error: `Projeto '${projectId}' já existe`
            };
        }
        try {
            // Adicionar ao config
            this.config.projects[projectId] = config;
            // Salvar config atualizado
            writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
            // Criar estrutura de diretórios
            const projectDocsDir = join(baseDocsDir, projectId);
            const projectKnowledgeDir = join(baseKnowledgeDir, projectId);
            if (!existsSync(projectDocsDir)) {
                mkdirSync(projectDocsDir, { recursive: true });
            }
            if (!existsSync(projectKnowledgeDir)) {
                mkdirSync(projectKnowledgeDir, { recursive: true });
            }
            // Criar arquivos vazios de knowledge base
            const emptyContracts = { contracts: [] };
            const emptyPatterns = { patterns: [] };
            const emptyDecisions = { decisions: [] };
            const emptyFeatures = { features: [] };
            writeFileSync(join(projectKnowledgeDir, 'contracts.json'), JSON.stringify(emptyContracts, null, 2), 'utf-8');
            writeFileSync(join(projectKnowledgeDir, 'patterns.json'), JSON.stringify(emptyPatterns, null, 2), 'utf-8');
            writeFileSync(join(projectKnowledgeDir, 'decisions.json'), JSON.stringify(emptyDecisions, null, 2), 'utf-8');
            writeFileSync(join(projectKnowledgeDir, 'features.json'), JSON.stringify(emptyFeatures, null, 2), 'utf-8');
            // Criar project-overview.md básico
            const overview = this.generateProjectOverview(projectId, config);
            writeFileSync(join(projectDocsDir, 'project-overview.md'), overview, 'utf-8');
            // Criar .copilot-instructions.md no root do projeto (primeiro path)
            // NOTA: Este arquivo é apenas documentação local para a equipe
            // As instruções reais são carregadas via chatInstructions da extensão
            if (config.paths && config.paths.length > 0) {
                const projectRoot = this.expandEnvVars(config.paths[0]);
                const copilotInstructionsPath = join(projectRoot, '.copilot-instructions.md');
                // Criar apenas se não existir
                if (!existsSync(copilotInstructionsPath)) {
                    const copilotInstructions = this.generateCopilotInstructions(projectId, config);
                    writeFileSync(copilotInstructionsPath, copilotInstructions, 'utf-8');
                }
            }
            // Recarregar config
            this.config = this.loadConfig();
            return {
                success: true,
                message: `✅ Projeto '${projectId}' criado com sucesso!\n\nEstrutura criada:\n- docs/${projectId}/\n- knowledge/${projectId}/\n- .copilot-instructions.md (no root do projeto)\n\nArquivos criados:\n- project-overview.md\n- contracts.json\n- patterns.json\n- decisions.json`
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Erro ao criar projeto: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Gera project-overview.md básico
     */
    generateProjectOverview(projectId, config) {
        const stackItems = Object.entries(config.stack)
            .map(([key, value]) => `- **${key}**: ${value}`)
            .join('\n');
        const principlesItems = config.principles
            .map(p => `- ${p}`)
            .join('\n');
        return `# ${config.name}

## 📋 Visão Geral

${config.description}

## 🛠️ Stack Tecnológico

${stackItems}

## 🎯 Princípios e Convenções

${principlesItems}

## 📁 Estrutura de Diretórios

\`\`\`
projeto/
├── ...
└── ...
\`\`\`

## 🔧 Configuração e Setup

### Requisitos

- (Adicionar requisitos aqui)

### Instalação

\`\`\`bash
# Adicionar comandos de instalação
\`\`\`

## 📖 Guidelines de Desenvolvimento

### Boas Práticas

1. (Adicionar práticas aqui)
2. ...

### Padrões de Código

- (Adicionar padrões aqui)

## 🧪 Testes

\`\`\`bash
# Adicionar comandos de teste
\`\`\`

## 🚀 Deploy

\`\`\`bash
# Adicionar comandos de deploy
\`\`\`

## 📚 Recursos Adicionais

- (Adicionar links e referências)

---

**Criado em:** ${new Date().toISOString().split('T')[0]}
**Projeto ID:** ${projectId}
`;
    }
    /**
     * Gera .copilot-instructions.md personalizado para o projeto
     */
    generateCopilotInstructions(projectId, config) {
        const stackList = Object.entries(config.stack)
            .map(([key, value]) => `- **${key}**: ${value}`)
            .join('\n');
        const principlesList = config.principles
            .map(p => `- ${p}`)
            .join('\n');
        return `# 🤖 GitHub Copilot Instructions - ${config.name}

> **Este projeto usa Project Docs MCP para gerenciar documentação e contratos**

## 📋 Workflow Obrigatório

### Antes de Qualquer Mudança

1. **Identifique o contexto**: Use MCP tool \`identify_context\` com file_path
2. **Consulte contratos**: Use MCP tool \`get_contracts\` para o contexto
3. **Valide código**: Use MCP tool \`validate_contract\` antes de commit

### Antes de Criar Documentação

1. **Verifique duplicação**: Use MCP tool \`check_existing_documentation\`
2. **Registre metadata**: Use MCP tool \`manage_documentation\` após criar .md

### Ao Fazer Decisões Arquiteturais

1. **Registre decisões**: Use MCP tool \`add_decision\` com contexto e alternativas

## 🛠️ Stack do Projeto

${stackList}

## 🎯 Princípios

${principlesList}

## 🔧 Como Usar o MCP

| Ação | Tool MCP |
|------|----------|
| Identificar contexto de arquivo | \`identify_context\` |
| Listar contratos | \`get_contracts\` |
| Validar implementação | \`validate_contract\` |
| Verificar docs existentes | \`check_existing_documentation\` |
| Registrar padrão | \`learn_pattern\` |
| Adicionar decisão | \`add_decision\` |
| Registrar feature | \`register_feature\` |

## 📚 Acesso Rápido ao Contexto

Use o prompt MCP \`project-context\` para obter:
- Contratos críticos do projeto
- Padrões aprendidos
- Decisões arquiteturais
- Guidelines globais

## 🚫 Regras

- ❌ Nunca criar documentação sem verificar duplicação
- ❌ Nunca modificar contratos sem validar implementações
- ❌ Nunca fazer decisões sem registrá-las
- ✅ Sempre consultar MCP antes de mudanças significativas

---
**Projeto**: ${projectId} | **MCP**: project-docs
`;
    }
    /**
     * Gera arquivo .copilot-instructions.md no root do projeto
     * NOTA: Este arquivo é apenas documentação local para a equipe.
     * As instruções reais são carregadas automaticamente via chatInstructions da extensão.
     * @deprecated Use chatInstructions da extensão para instruções automáticas do Copilot
     */
    generateCopilotInstructionsFile(projectId, force = false) {
        const config = this.config.projects[projectId];
        if (!config) {
            return {
                success: false,
                error: `Projeto '${projectId}' não encontrado`
            };
        }
        if (!config.paths || config.paths.length === 0) {
            return {
                success: false,
                error: `Projeto '${projectId}' não tem paths configurados`
            };
        }
        const projectRoot = this.expandEnvVars(config.paths[0]);
        const copilotInstructionsPath = join(projectRoot, '.copilot-instructions.md');
        // Verificar se já existe
        if (existsSync(copilotInstructionsPath) && !force) {
            return {
                success: false,
                error: 'Arquivo .copilot-instructions.md já existe. Use force: true para sobrescrever.',
                file_path: copilotInstructionsPath
            };
        }
        try {
            const content = this.generateCopilotInstructions(projectId, config);
            writeFileSync(copilotInstructionsPath, content, 'utf-8');
            return {
                success: true,
                message: `✅ Arquivo .copilot-instructions.md criado com sucesso!`,
                file_path: copilotInstructionsPath
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Erro ao criar arquivo: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Lista todos os projetos
     */
    listProjects() {
        return Object.keys(this.config.projects);
    }
    /**
     * Retorna informações sobre projeto atual
     */
    getProjectInfo() {
        const id = this.getCurrentProject();
        const config = this.getProjectConfig(id);
        if (!config) {
            return null;
        }
        return {
            id,
            config,
            isDefault: id === this.config.defaultProject,
        };
    }
    /**
     * Retorna caminho do knowledge base para projeto
     */
    getKnowledgePath(baseDir, projectId) {
        const id = projectId || this.getCurrentProject();
        return join(baseDir, id);
    }
    /**
     * Retorna caminho dos docs para projeto
     */
    getDocsPath(baseDir, projectId) {
        const id = projectId || this.getCurrentProject();
        return join(baseDir, id);
    }
    /**
     * Verifica se projeto existe
     */
    projectExists(projectId) {
        return !!this.config.projects[projectId];
    }
    /**
     * Retorna stack do projeto
     */
    getProjectStack(projectId) {
        const config = this.getProjectConfig(projectId);
        return config?.stack || null;
    }
    /**
     * Identifica contexto (backend/frontend/infra) baseado em arquivo e projeto
     */
    identifyContext(filePath, projectId) {
        const detectedProject = this.detectProject(filePath) || projectId;
        const project = detectedProject || this.getCurrentProject();
        const config = this.getProjectConfig(project);
        if (!config) {
            return {
                project: this.config.defaultProject,
                context: 'unknown',
                detected: false,
            };
        }
        let context = 'unknown';
        const lowerPath = filePath.toLowerCase();
        // Detecta contexto baseado no stack do projeto
        if (config.stack.backend) {
            if (lowerPath.includes('backend') ||
                lowerPath.includes('api') ||
                lowerPath.includes('server') ||
                lowerPath.includes('.controller.') ||
                lowerPath.includes('.service.') ||
                lowerPath.includes('.entity.')) {
                context = 'backend';
            }
        }
        if (config.stack.frontend) {
            if (lowerPath.includes('frontend') ||
                lowerPath.includes('web') ||
                lowerPath.includes('app') ||
                lowerPath.includes('.component.') ||
                lowerPath.includes('angular') ||
                lowerPath.includes('react')) {
                context = 'frontend';
            }
        }
        if (config.stack.infrastructure) {
            if (lowerPath.includes('terraform') ||
                lowerPath.includes('infra') ||
                lowerPath.includes('.tf') ||
                lowerPath.includes('cloudformation') ||
                lowerPath.includes('.github/workflows')) {
                context = 'infrastructure';
            }
        }
        if (config.stack.scripting) {
            if (lowerPath.includes('scripts') ||
                lowerPath.includes('.sh') ||
                lowerPath.includes('bash')) {
                context = 'scripting';
            }
        }
        return {
            project,
            context,
            detected: !!detectedProject,
        };
    }
}
