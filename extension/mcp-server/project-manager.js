import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
export class ProjectManager {
    config;
    configPath;
    currentProject;
    constructor(configPath) {
        this.configPath = configPath;
        this.config = this.loadConfig();
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
     */
    expandEnvVars(path) {
        return path.replace(/\$\{(\w+)\}/g, (match, varName) => {
            return process.env[varName] || match;
        });
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
            // Recarregar config
            this.config = this.loadConfig();
            return {
                success: true,
                message: `✅ Projeto '${projectId}' criado com sucesso!\n\nEstrutura criada:\n- docs/${projectId}/\n- knowledge/${projectId}/\n\nArquivos criados:\n- project-overview.md\n- contracts.json\n- patterns.json\n- decisions.json`
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
