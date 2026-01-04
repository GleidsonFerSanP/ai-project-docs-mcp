import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

export interface ProjectStack {
  [key: string]: any;
}

export interface ProjectConfig {
  name: string;
  description: string;
  paths: string[];
  stack: ProjectStack;
  principles: string[];
}

export interface McpConfig {
  version: string;
  defaultProject: string;
  workspaceRoots?: string[];
  projects: Record<string, ProjectConfig>;
}

export class ProjectManager {
  private config: McpConfig;
  private configPath: string;
  private currentProject?: string;

  constructor(configPath?: string) {
    this.configPath = configPath || this.getGlobalConfigPath();
    this.ensureConfigExists();
    this.config = this.loadConfig();
  }

  /**
   * Retorna o caminho global do diretório de configuração
   */
  private getGlobalConfigPath(): string {
    const globalDir = join(homedir(), '.project-docs-mcp');
    return join(globalDir, 'mcp-config.json');
  }

  /**
   * Garante que a estrutura de diretórios e config padrão existem
   */
  private ensureConfigExists(): void {
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
      const defaultConfig: McpConfig = {
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

  private loadConfig(): McpConfig {
    try {
      const data = readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(data);
      
      // Expandir variáveis de ambiente em workspaceRoots
      if (config.workspaceRoots) {
        config.workspaceRoots = config.workspaceRoots.map((path: string) => 
          this.expandEnvVars(path)
        );
      }
      
      return config;
    } catch (error) {
      throw new Error(`Failed to load MCP config from ${this.configPath}: ${error}`);
    }
  }

  /**
   * Expande variáveis de ambiente em um path
   */
  private expandEnvVars(path: string): string {
    return path.replace(/\$\{(\w+)\}/g, (match, varName) => {
      return process.env[varName] || match;
    });
  }

  /**
   * Detecta projeto baseado no caminho do arquivo
   */
  detectProject(filePath: string): string | null {
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
  setCurrentProject(projectId: string): boolean {
    if (!this.config.projects[projectId]) {
      return false;
    }
    
    this.currentProject = projectId;
    return true;
  }

  /**
   * Retorna projeto atual ou padrão
   */
  getCurrentProject(): string {
    return this.currentProject || this.config.defaultProject;
  }

  /**
   * Retorna configuração do projeto
   */
  getProjectConfig(projectId?: string): ProjectConfig | null {
    const id = projectId || this.getCurrentProject();
    return this.config.projects[id] || null;
  }

  /**
   * Cria um novo projeto dinamicamente
   */
  createProject(
    projectId: string,
    config: ProjectConfig,
    baseDocsDir: string,
    baseKnowledgeDir: string
  ): { success: boolean; error?: string; message?: string } {
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

      writeFileSync(
        join(projectKnowledgeDir, 'contracts.json'),
        JSON.stringify(emptyContracts, null, 2),
        'utf-8'
      );

      writeFileSync(
        join(projectKnowledgeDir, 'patterns.json'),
        JSON.stringify(emptyPatterns, null, 2),
        'utf-8'
      );

      writeFileSync(
        join(projectKnowledgeDir, 'decisions.json'),
        JSON.stringify(emptyDecisions, null, 2),
        'utf-8'
      );

      writeFileSync(
        join(projectKnowledgeDir, 'features.json'),
        JSON.stringify(emptyFeatures, null, 2),
        'utf-8'
      );

      // Criar project-overview.md básico
      const overview = this.generateProjectOverview(projectId, config);
      writeFileSync(
        join(projectDocsDir, 'project-overview.md'),
        overview,
        'utf-8'
      );

      // Recarregar config
      this.config = this.loadConfig();

      return {
        success: true,
        message: `✅ Projeto '${projectId}' criado com sucesso!\n\nEstrutura criada:\n- docs/${projectId}/\n- knowledge/${projectId}/\n\nArquivos criados:\n- project-overview.md\n- contracts.json\n- patterns.json\n- decisions.json`
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao criar projeto: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Gera project-overview.md básico
   */
  private generateProjectOverview(projectId: string, config: ProjectConfig): string {
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
  listProjects(): string[] {
    return Object.keys(this.config.projects);
  }

  /**
   * Retorna informações sobre projeto atual
   */
  getProjectInfo(): {
    id: string;
    config: ProjectConfig;
    isDefault: boolean;
  } | null {
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
  getKnowledgePath(baseDir: string, projectId?: string): string {
    const id = projectId || this.getCurrentProject();
    return join(baseDir, id);
  }

  /**
   * Retorna caminho dos docs para projeto
   */
  getDocsPath(baseDir: string, projectId?: string): string {
    const id = projectId || this.getCurrentProject();
    return join(baseDir, id);
  }

  /**
   * Verifica se projeto existe
   */
  projectExists(projectId: string): boolean {
    return !!this.config.projects[projectId];
  }

  /**
   * Retorna stack do projeto
   */
  getProjectStack(projectId?: string): ProjectStack | null {
    const config = this.getProjectConfig(projectId);
    return config?.stack || null;
  }

  /**
   * Identifica contexto (backend/frontend/infra) baseado em arquivo e projeto
   */
  identifyContext(
    filePath: string,
    projectId?: string
  ): {
    project: string;
    context: string;
    detected: boolean;
  } {
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
      if (
        lowerPath.includes('backend') ||
        lowerPath.includes('api') ||
        lowerPath.includes('server') ||
        lowerPath.includes('.controller.') ||
        lowerPath.includes('.service.') ||
        lowerPath.includes('.entity.')
      ) {
        context = 'backend';
      }
    }

    if (config.stack.frontend) {
      if (
        lowerPath.includes('frontend') ||
        lowerPath.includes('web') ||
        lowerPath.includes('app') ||
        lowerPath.includes('.component.') ||
        lowerPath.includes('angular') ||
        lowerPath.includes('react')
      ) {
        context = 'frontend';
      }
    }

    if (config.stack.infrastructure) {
      if (
        lowerPath.includes('terraform') ||
        lowerPath.includes('infra') ||
        lowerPath.includes('.tf') ||
        lowerPath.includes('cloudformation') ||
        lowerPath.includes('.github/workflows')
      ) {
        context = 'infrastructure';
      }
    }

    if (config.stack.scripting) {
      if (
        lowerPath.includes('scripts') ||
        lowerPath.includes('.sh') ||
        lowerPath.includes('bash')
      ) {
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
