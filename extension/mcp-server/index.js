#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { KnowledgeBase } from './knowledge-base.js';
import { ProjectManager } from './project-manager.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
class ProjectDocsServer {
    server;
    projectManager;
    constructor() {
        this.projectManager = new ProjectManager(join(__dirname, '../mcp-config.json'));
        this.server = new Server({
            name: 'project-docs-mcp',
            version: '2.1.0',
        }, {
            capabilities: {
                resources: {},
                tools: {},
                prompts: {},
            },
        });
        this.setupHandlers();
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupHandlers() {
        // List available resources (documentation files)
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            const projects = this.projectManager.listProjects();
            const resources = [];
            for (const projectId of projects) {
                const docsDir = this.projectManager.getDocsPath(join(__dirname, '../docs'), projectId);
                const config = this.projectManager.getProjectConfig(projectId);
                // Add project overview
                resources.push({
                    uri: `${projectId}://docs/project-overview`,
                    mimeType: 'text/markdown',
                    name: `Project Overview - ${config?.name || projectId}`,
                    description: `Visão geral do projeto ${projectId}`,
                });
                // Add project-specific docs based on stack
                if (config?.stack.backend) {
                    resources.push({
                        uri: `${projectId}://docs/backend-guidelines`,
                        mimeType: 'text/markdown',
                        name: `Backend Guidelines - ${projectId}`,
                        description: 'Guidelines para desenvolvimento backend',
                    });
                }
                if (config?.stack.frontend) {
                    resources.push({
                        uri: `${projectId}://docs/frontend-guidelines`,
                        mimeType: 'text/markdown',
                        name: `Frontend Guidelines - ${projectId}`,
                        description: 'Guidelines para desenvolvimento frontend',
                    });
                }
            }
            // Add shared documentation
            resources.push({
                uri: 'shared://docs/documentation-rules',
                mimeType: 'text/markdown',
                name: 'Documentation Rules (Shared)',
                description: 'Regras gerais sobre documentação (compartilhadas entre projetos)',
            });
            return { resources };
        });
        // Read specific resource
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const uri = request.params.uri.toString();
            // Handle shared docs
            if (uri.startsWith('shared://docs/')) {
                const docName = uri.replace('shared://docs/', '');
                const docPath = join(__dirname, '../docs/_shared', `${docName}.md`);
                const content = readFileSync(docPath, 'utf-8');
                return {
                    contents: [{
                            uri: request.params.uri,
                            mimeType: 'text/markdown',
                            text: content,
                        }],
                };
            }
            // Handle project-specific docs
            const match = uri.match(/^(\w+):\/\/docs\/(.+)$/);
            if (match) {
                const [, projectId, docName] = match;
                const docPath = join(__dirname, '../docs', projectId, `${docName}.md`);
                const content = readFileSync(docPath, 'utf-8');
                return {
                    contents: [{
                            uri: request.params.uri,
                            mimeType: 'text/markdown',
                            text: content,
                        }],
                };
            }
            throw new Error(`Unknown resource: ${uri}`);
        });
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'create_project',
                    description: 'Cria um novo projeto dinamicamente com toda a estrutura necessária (docs, knowledge base)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID único do projeto (lowercase, alfanumérico, hífens e underscores permitidos)',
                            },
                            name: {
                                type: 'string',
                                description: 'Nome completo do projeto',
                            },
                            description: {
                                type: 'string',
                                description: 'Descrição detalhada do projeto',
                            },
                            paths: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Padrões de caminho para auto-detecção (ex: ["/projeto", "/app"])',
                            },
                            stack: {
                                type: 'object',
                                description: 'Stack tecnológico (ex: {"backend": "FastAPI", "frontend": "React"})',
                                additionalProperties: { type: 'string' },
                            },
                            principles: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Princípios e convenções (ex: ["DDD", "Clean Architecture"])',
                            },
                        },
                        required: ['project_id', 'name', 'description', 'paths', 'stack', 'principles'],
                    },
                },
                {
                    name: 'list_projects',
                    description: 'Lista todos os projetos disponíveis no MCP',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                {
                    name: 'get_project_info',
                    description: 'Obtém informações detalhadas sobre um projeto específico',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (ex: jarvis, automacao-n8n)',
                            },
                        },
                        required: ['project_id'],
                    },
                },
                {
                    name: 'switch_project',
                    description: 'Muda o contexto para outro projeto',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto para mudar',
                            },
                        },
                        required: ['project_id'],
                    },
                },
                {
                    name: 'identify_context',
                    description: 'Identifica o projeto e contexto (backend/frontend/infra) baseado em arquivo ou caminho. Auto-detecta o projeto.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            file_path: {
                                type: 'string',
                                description: 'Caminho do arquivo atual (absoluto ou relativo)',
                            },
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, será auto-detectado se omitido)',
                            },
                        },
                        required: ['file_path'],
                    },
                },
                {
                    name: 'get_guidelines',
                    description: 'Retorna guidelines específicos baseado no contexto e projeto',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual se omitido)',
                            },
                            context: {
                                type: 'string',
                                enum: ['backend', 'frontend', 'infrastructure', 'both', 'all'],
                                description: 'Contexto para buscar guidelines',
                            },
                            topic: {
                                type: 'string',
                                description: 'Tópico específico (ex: "testing", "terraform", "github-actions")',
                            },
                        },
                        required: ['context'],
                    },
                },
                {
                    name: 'should_document',
                    description: 'Verifica se determinada mudança/feature precisa de documentação .md ou apenas comentários',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            change_type: {
                                type: 'string',
                                enum: ['feature', 'bugfix', 'refactor', 'architecture', 'config'],
                                description: 'Tipo de mudança',
                            },
                            complexity: {
                                type: 'string',
                                enum: ['simple', 'medium', 'complex'],
                                description: 'Complexidade da mudança',
                            },
                            description: {
                                type: 'string',
                                description: 'Descrição da mudança',
                            },
                        },
                        required: ['change_type', 'complexity'],
                    },
                },
                {
                    name: 'check_existing_documentation',
                    description: 'Verifica se já existe documentação sobre um tópico antes de criar nova. SEMPRE use esta ferramenta antes de criar documentação .md',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            title: {
                                type: 'string',
                                description: 'Título proposto para a nova documentação',
                            },
                            topics: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Tópicos principais que seriam abordados',
                            },
                            keywords: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Palavras-chave relacionadas',
                            },
                            context: {
                                type: 'string',
                                enum: ['backend', 'frontend', 'infrastructure', 'shared', 'general'],
                                description: 'Contexto da documentação',
                            },
                        },
                        required: ['title'],
                    },
                },
                {
                    name: 'manage_documentation',
                    description: 'Cria NOVO documento ou ATUALIZA existente. ATENÇÃO: ao criar (action=create), AUTOMATICAMENTE verifica se já existe doc similar e BLOQUEIA duplicação! Use action=update quando o documento já existe.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            action: {
                                type: 'string',
                                enum: ['create', 'update'],
                                description: 'Ação: criar novo ou atualizar existente',
                            },
                            document_id: {
                                type: 'string',
                                description: 'ID do documento (obrigatório para update)',
                            },
                            title: {
                                type: 'string',
                                description: 'Título do documento',
                            },
                            file_path: {
                                type: 'string',
                                description: 'Caminho relativo do arquivo .md (ex: docs/jarvis/authentication-flow.md)',
                            },
                            topics: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Tópicos principais do documento',
                            },
                            keywords: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Palavras-chave para busca',
                            },
                            summary: {
                                type: 'string',
                                description: 'Resumo do conteúdo do documento',
                            },
                            context: {
                                type: 'string',
                                enum: ['backend', 'frontend', 'infrastructure', 'shared', 'general'],
                                description: 'Contexto do documento',
                            },
                            type: {
                                type: 'string',
                                enum: ['architecture', 'api', 'guide', 'troubleshooting', 'setup', 'business-flow', 'other'],
                                description: 'Tipo de documentação',
                            },
                            related_contracts: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'IDs de contratos mencionados',
                            },
                            related_features: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'IDs de features mencionadas',
                            },
                            force_create: {
                                type: 'boolean',
                                description: 'Força criação mesmo se encontrar documento similar (use apenas se realmente necessário)',
                            },
                        },
                        required: ['action', 'title', 'file_path', 'context', 'type'],
                    },
                },
                {
                    name: 'list_documentation',
                    description: 'Lista todos os documentos do projeto, com filtros opcionais',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            context: {
                                type: 'string',
                                enum: ['backend', 'frontend', 'infrastructure', 'shared', 'general'],
                                description: 'Filtrar por contexto',
                            },
                            type: {
                                type: 'string',
                                enum: ['architecture', 'api', 'guide', 'troubleshooting', 'setup', 'business-flow', 'other'],
                                description: 'Filtrar por tipo',
                            },
                            keywords: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Filtrar por palavras-chave',
                            },
                        },
                    },
                },
                {
                    name: 'register_contract',
                    description: 'Registra um contrato/interface crítico que DEVE ser respeitado em todas as implementações',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            name: {
                                type: 'string',
                                description: 'Nome do contrato/interface (ex: ISolutionAdapter)',
                            },
                            context: {
                                type: 'string',
                                enum: ['backend', 'frontend', 'infrastructure', 'shared'],
                                description: 'Onde o contrato é usado',
                            },
                            description: {
                                type: 'string',
                                description: 'Descrição do propósito do contrato',
                            },
                            interface_code: {
                                type: 'string',
                                description: 'Código TypeScript/Python/outro da interface',
                            },
                            rules: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Regras que implementações devem seguir',
                            },
                            examples: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Exemplos de implementação correta',
                            },
                            file_path: {
                                type: 'string',
                                description: 'Caminho do arquivo onde está definido',
                            },
                        },
                        required: ['name', 'context', 'description', 'interface_code', 'rules'],
                    },
                },
                {
                    name: 'get_contracts',
                    description: 'Lista todos os contratos registrados ou busca contratos específicos de um projeto',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            context: {
                                type: 'string',
                                enum: ['backend', 'frontend', 'infrastructure', 'shared', 'all'],
                                description: 'Filtrar por contexto',
                            },
                            search: {
                                type: 'string',
                                description: 'Buscar por nome ou descrição',
                            },
                        },
                    },
                },
                {
                    name: 'validate_contract',
                    description: 'Valida se um código respeita um contrato específico',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            contract_name: {
                                type: 'string',
                                description: 'Nome do contrato a validar',
                            },
                            code: {
                                type: 'string',
                                description: 'Código a ser validado',
                            },
                        },
                        required: ['contract_name', 'code'],
                    },
                },
                {
                    name: 'register_feature',
                    description: 'Registra uma nova feature completa com suas regras de negócio, casos de uso, contratos e padrões relacionados',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            name: {
                                type: 'string',
                                description: 'Nome da feature (ex: "Autenticação JWT")',
                            },
                            context: {
                                type: 'string',
                                description: 'Contexto da feature (ex: "Security", "API", "Frontend")',
                            },
                            description: {
                                type: 'string',
                                description: 'Descrição detalhada da feature',
                            },
                            business_rules: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Regras de negócio da feature',
                            },
                            use_cases: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        steps: {
                                            type: 'array',
                                            items: { type: 'string' },
                                        },
                                    },
                                },
                                description: 'Casos de uso com seus passos',
                            },
                            related_contracts: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'IDs ou nomes de contratos relacionados',
                            },
                            related_patterns: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'IDs ou nomes de padrões relacionados',
                            },
                            dependencies: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Dependências da feature (pacotes, serviços, etc)',
                            },
                            api_endpoints: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        method: { type: 'string' },
                                        path: { type: 'string' },
                                        description: { type: 'string' },
                                    },
                                },
                                description: 'Endpoints da API relacionados',
                            },
                            status: {
                                type: 'string',
                                enum: ['planning', 'in-progress', 'completed', 'deprecated'],
                                description: 'Status atual da feature',
                            },
                            tags: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Tags para categorização',
                            },
                            notes: {
                                type: 'string',
                                description: 'Notas adicionais',
                            },
                            file_paths: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Arquivos onde a feature está implementada',
                            },
                        },
                        required: ['name', 'context', 'description'],
                    },
                },
                {
                    name: 'get_features',
                    description: 'Lista features do projeto, com filtros opcionais por contexto, status ou tags',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            context: {
                                type: 'string',
                                description: 'Filtrar por contexto',
                            },
                            status: {
                                type: 'string',
                                description: 'Filtrar por status',
                            },
                            tags: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Filtrar por tags',
                            },
                            search: {
                                type: 'string',
                                description: 'Buscar por nome ou descrição',
                            },
                        },
                    },
                },
                {
                    name: 'update_feature',
                    description: 'Atualiza uma feature existente (status, adiciona casos de uso, atualiza relacionamentos)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            feature_id: {
                                type: 'string',
                                description: 'ID da feature a atualizar',
                            },
                            status: {
                                type: 'string',
                                enum: ['planning', 'in-progress', 'completed', 'deprecated'],
                                description: 'Novo status',
                            },
                            description: {
                                type: 'string',
                                description: 'Nova descrição',
                            },
                            business_rules: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Regras de negócio atualizadas',
                            },
                            use_cases: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        steps: { type: 'array', items: { type: 'string' } },
                                    },
                                },
                                description: 'Casos de uso atualizados',
                            },
                            notes: {
                                type: 'string',
                                description: 'Notas adicionais',
                            },
                        },
                        required: ['feature_id'],
                    },
                },
                {
                    name: 'get_feature_context',
                    description: 'Busca contexto completo de uma feature, incluindo contratos e padrões relacionados',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            feature_id: {
                                type: 'string',
                                description: 'ID da feature',
                            },
                        },
                        required: ['feature_id'],
                    },
                },
                {
                    name: 'learn_pattern',
                    description: 'Ensina ao MCP um novo padrão identificado no projeto',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            name: {
                                type: 'string',
                                description: 'Nome do padrão',
                            },
                            context: {
                                type: 'string',
                                enum: ['backend', 'frontend', 'infrastructure', 'shared'],
                                description: 'Onde o padrão é usado',
                            },
                            description: {
                                type: 'string',
                                description: 'Descrição do padrão',
                            },
                            pattern: {
                                type: 'string',
                                description: 'Código ou estrutura do padrão',
                            },
                            examples: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Exemplos de uso',
                            },
                        },
                        required: ['name', 'context', 'description', 'pattern'],
                    },
                },
                {
                    name: 'scan_project',
                    description: 'Escaneia o projeto e extrai interfaces, classes e padrões automaticamente',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            project_path: {
                                type: 'string',
                                description: 'Caminho absoluto do projeto',
                            },
                            context: {
                                type: 'string',
                                enum: ['backend', 'frontend', 'infrastructure', 'all'],
                                description: 'Contexto a escanear',
                            },
                        },
                        required: ['project_path', 'context'],
                    },
                },
                {
                    name: 'add_decision',
                    description: 'Registra uma decisão arquitetural importante (ADR)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            title: {
                                type: 'string',
                                description: 'Título da decisão',
                            },
                            context: {
                                type: 'string',
                                description: 'Contexto/motivo da decisão',
                            },
                            decision: {
                                type: 'string',
                                description: 'O que foi decidido',
                            },
                            positive_consequences: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Consequências positivas',
                            },
                            negative_consequences: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Trade-offs/consequências negativas',
                            },
                            alternatives: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Alternativas consideradas',
                            },
                        },
                        required: ['title', 'context', 'decision'],
                    },
                },
            ],
        }));
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            // Helper function to get project ID and KnowledgeBase
            const getProjectContext = (providedProjectId, filePath) => {
                let projectId = providedProjectId || this.projectManager.getCurrentProject();
                // Auto-detect from file path if provided
                if (!providedProjectId && filePath) {
                    const detected = this.projectManager.detectProject(filePath);
                    if (detected)
                        projectId = detected;
                }
                // Default to jarvis if no project found
                if (!projectId)
                    projectId = 'jarvis';
                // ✅ FIX: Passar apenas o base path, não incluir projectId
                const knowledgeBasePath = join(__dirname, '../knowledge');
                const kb = new KnowledgeBase(knowledgeBasePath, projectId);
                return { projectId, kb };
            };
            switch (name) {
                case 'create_project': {
                    const projectId = args?.project_id;
                    const projectName = args?.name;
                    const description = args?.description;
                    const paths = args?.paths;
                    const stack = args?.stack;
                    const principles = args?.principles;
                    // Validar inputs
                    if (!projectId || !projectName || !description || !paths || !stack || !principles) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        error: 'Todos os campos são obrigatórios',
                                        required: ['project_id', 'name', 'description', 'paths', 'stack', 'principles'],
                                    }),
                                }],
                        };
                    }
                    // Criar projeto
                    const result = this.projectManager.createProject(projectId, {
                        name: projectName,
                        description,
                        paths,
                        stack,
                        principles,
                    }, join(__dirname, '../docs'), join(__dirname, '../knowledge'));
                    if (!result.success) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        error: result.error,
                                    }),
                                }],
                        };
                    }
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: result.message,
                                    project_id: projectId,
                                    next_steps: [
                                        `Use 'switch_project' para mudar para o novo projeto`,
                                        `Edite docs/${projectId}/project-overview.md com guidelines específicos`,
                                        `Use 'register_contract' para adicionar contratos importantes`,
                                        `Use 'learn_pattern' para registrar padrões do projeto`,
                                    ],
                                }),
                            }],
                    };
                }
                case 'list_projects': {
                    const projects = this.projectManager.listProjects();
                    const projectsInfo = projects.map(id => {
                        const config = this.projectManager.getProjectConfig(id);
                        return {
                            id,
                            name: config?.name || id,
                            description: config?.description,
                            stack: config?.stack,
                        };
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    message: `📋 ${projects.length} projeto(s) disponível(is)`,
                                    current_project: this.projectManager.getCurrentProject(),
                                    projects: projectsInfo,
                                }),
                            }],
                    };
                }
                case 'get_project_info': {
                    const projectId = args?.project_id;
                    if (!this.projectManager.projectExists(projectId)) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        error: `Projeto '${projectId}' não encontrado`,
                                        available_projects: this.projectManager.listProjects(),
                                    }),
                                }],
                        };
                    }
                    const config = this.projectManager.getProjectConfig(projectId);
                    if (!config) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        error: `Projeto '${projectId}' não encontrado`,
                                    }),
                                }],
                        };
                    }
                    const info = {
                        id: projectId,
                        name: config.name,
                        description: config.description,
                        stack: config.stack,
                        principles: config.principles,
                    };
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    project: info,
                                    docs_path: this.projectManager.getDocsPath(join(__dirname, '../docs'), projectId),
                                    knowledge_path: this.projectManager.getKnowledgePath(join(__dirname, '../knowledge'), projectId),
                                }),
                            }],
                    };
                }
                case 'switch_project': {
                    const projectId = args?.project_id;
                    if (!this.projectManager.projectExists(projectId)) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        error: `Projeto '${projectId}' não encontrado`,
                                        available_projects: this.projectManager.listProjects(),
                                    }),
                                }],
                        };
                    }
                    this.projectManager.setCurrentProject(projectId);
                    const config = this.projectManager.getProjectConfig(projectId);
                    const info = {
                        id: projectId,
                        config,
                        isDefault: projectId === 'jarvis'
                    };
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: `✅ Projeto alterado para '${projectId}'`,
                                    project: info,
                                }),
                            }],
                    };
                }
                case 'identify_context': {
                    const filePath = args?.file_path || '';
                    const providedProjectId = args?.project_id;
                    const result = this.projectManager.identifyContext(filePath, providedProjectId);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify(result),
                            }],
                    };
                }
                case 'get_guidelines': {
                    const providedProjectId = args?.project_id;
                    const context = args?.context;
                    const topic = args?.topic;
                    const { projectId } = getProjectContext(providedProjectId);
                    const docsDir = this.projectManager.getDocsPath(join(__dirname, '../docs'), projectId);
                    let guidelines = '';
                    const config = this.projectManager.getProjectConfig(projectId);
                    try {
                        if (context === 'backend' && config?.stack.includes('nestjs')) {
                            guidelines += readFileSync(join(docsDir, 'backend-guidelines.md'), 'utf-8');
                        }
                        if (context === 'frontend' && config?.stack.includes('angular')) {
                            if (guidelines)
                                guidelines += '\n\n---\n\n';
                            guidelines += readFileSync(join(docsDir, 'frontend-guidelines.md'), 'utf-8');
                        }
                        if (context === 'infrastructure' || context === 'all') {
                            if (guidelines)
                                guidelines += '\n\n---\n\n';
                            const overviewPath = join(docsDir, 'project-overview.md');
                            guidelines += readFileSync(overviewPath, 'utf-8');
                        }
                        // Filter by topic if specified
                        if (topic && guidelines) {
                            const sections = guidelines.split('\n## ');
                            const relevantSections = sections.filter((section) => section.toLowerCase().includes(topic.toLowerCase()));
                            if (relevantSections.length > 0) {
                                guidelines = '## ' + relevantSections.join('\n## ');
                            }
                        }
                    }
                    catch (error) {
                        guidelines = `Erro ao carregar guidelines do projeto ${projectId}`;
                    }
                    return {
                        content: [{
                                type: 'text',
                                text: guidelines || 'No guidelines found for specified context',
                            }],
                    };
                }
                case 'should_document': {
                    const changeType = args?.change_type;
                    const complexity = args?.complexity;
                    const description = args?.description || '';
                    const rulesPath = join(__dirname, '../docs/_shared/documentation-rules.md');
                    const rules = readFileSync(rulesPath, 'utf-8');
                    let recommendation = '';
                    let shouldCreateMd = false;
                    if (changeType === 'architecture' ||
                        (complexity === 'complex' && changeType === 'feature')) {
                        shouldCreateMd = true;
                        recommendation =
                            '📝 CRIAR DOCUMENTAÇÃO .md - Esta mudança é significativa e afeta a arquitetura ou é uma feature complexa.';
                    }
                    else if (complexity === 'medium' || complexity === 'complex') {
                        recommendation =
                            '💬 DOCUMENTAR via JSDoc/Comments - Use comentários inline detalhados explicando a lógica.';
                    }
                    else {
                        recommendation =
                            '✅ Código auto-explicativo suficiente - Use bons nomes de variáveis/funções. Sem documentação extra necessária.';
                    }
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    should_create_md: shouldCreateMd,
                                    recommendation,
                                    guidelines_excerpt: 'Consulte documentation-rules.md para detalhes completos sobre quando documentar.',
                                }),
                            }],
                    };
                }
                case 'check_existing_documentation': {
                    const providedProjectId = args?.project_id;
                    const title = args?.title;
                    const topics = args?.topics || [];
                    const keywords = args?.keywords || [];
                    const context = args?.context;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const similarDocs = kb.findSimilarDocuments(title, topics, keywords);
                    if (similarDocs.length === 0) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        exists: false,
                                        message: `✅ Nenhuma documentação similar encontrada no projeto '${projectId}'`,
                                        recommendation: 'Pode criar NOVO documento com segurança',
                                        action: 'create',
                                        project: projectId,
                                    }),
                                }],
                        };
                    }
                    const topMatch = similarDocs[0];
                    const highSimilarity = topMatch.similarity >= 50;
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    exists: true,
                                    message: `⚠️ Encontrada ${similarDocs.length} documentação(ões) similar(es) no projeto '${projectId}'`,
                                    recommendation: highSimilarity
                                        ? `ATUALIZAR documento existente em vez de criar novo! Documento mais similar: "${topMatch.document.title}" (${topMatch.similarity}% similaridade)`
                                        : `Verificar documentos existentes antes de criar novo. Maior similaridade: ${topMatch.similarity}%`,
                                    action: highSimilarity ? 'update' : 'review_and_decide',
                                    similar_documents: similarDocs.slice(0, 5).map(({ document, similarity }) => ({
                                        id: document.id,
                                        title: document.title,
                                        file_path: document.filePath,
                                        similarity_score: similarity,
                                        topics: document.topics,
                                        keywords: document.keywords,
                                        context: document.context,
                                        type: document.type,
                                        last_updated: document.lastUpdated,
                                        version: document.version,
                                    })),
                                    project: projectId,
                                }),
                            }],
                    };
                }
                case 'manage_documentation': {
                    const providedProjectId = args?.project_id;
                    const action = args?.action;
                    const documentId = args?.document_id;
                    const title = args?.title;
                    const filePath = args?.file_path;
                    const topics = args?.topics || [];
                    const keywords = args?.keywords || [];
                    const summary = args?.summary || '';
                    const context = args?.context;
                    const type = args?.type;
                    const relatedContracts = args?.related_contracts || [];
                    const relatedFeatures = args?.related_features || [];
                    const forceCreate = args?.force_create;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    if (action === 'create') {
                        // 🔍 VERIFICAÇÃO AUTOMÁTICA: Busca documentos similares antes de criar
                        const similarDocs = kb.findSimilarDocuments(title, topics, keywords);
                        if (similarDocs.length > 0 && similarDocs[0].similarity >= 50 && !forceCreate) {
                            // ⚠️ DOCUMENTO SIMILAR ENCONTRADO - Bloqueia criação para evitar duplicação
                            const topMatch = similarDocs[0];
                            return {
                                content: [{
                                        type: 'text',
                                        text: JSON.stringify({
                                            success: false,
                                            action: 'blocked',
                                            message: `⚠️ DOCUMENTAÇÃO SIMILAR JÁ EXISTE! Bloqueado para evitar duplicação.`,
                                            reason: 'duplicate_prevention',
                                            project: projectId,
                                            similar_document: {
                                                id: topMatch.document.id,
                                                title: topMatch.document.title,
                                                file_path: topMatch.document.filePath,
                                                similarity_score: topMatch.similarity,
                                                version: topMatch.document.version,
                                                last_updated: topMatch.document.lastUpdated,
                                            },
                                            recommendation: `Use manage_documentation com action='update' e document_id='${topMatch.document.id}' para atualizar o documento existente.`,
                                            alternative: 'Se realmente deseja criar novo documento separado, use force_create=true',
                                        }),
                                    }],
                            };
                        }
                        // ✅ Seguro para criar - nenhuma similaridade alta encontrada (ou force_create=true)
                        const doc = kb.registerDocument({
                            title,
                            filePath,
                            topics,
                            keywords,
                            summary,
                            context,
                            type,
                            relatedContracts,
                            relatedFeatures,
                        });
                        const response = {
                            success: true,
                            action: 'created',
                            message: `✅ Documentação '${title}' registrada no projeto '${projectId}'`,
                            project: projectId,
                            document: {
                                id: doc.id,
                                title: doc.title,
                                file_path: doc.filePath,
                                version: doc.version,
                                created_at: doc.createdAt,
                            },
                            auto_check_performed: true,
                            similar_docs_found: similarDocs.length,
                            next_steps: [
                                `Crie o arquivo: ${doc.filePath}`,
                                'Use replace_string_in_file ou create_file para criar o conteúdo',
                                'O documento está registrado e será consultável pelo MCP',
                            ],
                        };
                        // Aviso se force_create foi usado
                        if (forceCreate && similarDocs.length > 0) {
                            response.warning = `⚠️ force_create=true foi usado. ${similarDocs.length} documento(s) similar(es) foram ignorados.`;
                            response.ignored_similar_docs = similarDocs.slice(0, 3).map(({ document, similarity }) => ({
                                title: document.title,
                                similarity_score: similarity,
                            }));
                        }
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify(response),
                                }],
                        };
                    }
                    else if (action === 'update') {
                        if (!documentId) {
                            return {
                                content: [{
                                        type: 'text',
                                        text: JSON.stringify({
                                            success: false,
                                            error: 'document_id é obrigatório para action=update',
                                        }),
                                    }],
                            };
                        }
                        const updates = {};
                        if (title)
                            updates.title = title;
                        if (filePath)
                            updates.filePath = filePath;
                        if (topics.length > 0)
                            updates.topics = topics;
                        if (keywords.length > 0)
                            updates.keywords = keywords;
                        if (summary)
                            updates.summary = summary;
                        if (context)
                            updates.context = context;
                        if (type)
                            updates.type = type;
                        if (relatedContracts.length > 0)
                            updates.relatedContracts = relatedContracts;
                        if (relatedFeatures.length > 0)
                            updates.relatedFeatures = relatedFeatures;
                        const doc = kb.updateDocument(documentId, updates);
                        if (!doc) {
                            return {
                                content: [{
                                        type: 'text',
                                        text: JSON.stringify({
                                            success: false,
                                            error: `Documento '${documentId}' não encontrado no projeto '${projectId}'`,
                                        }),
                                    }],
                            };
                        }
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: true,
                                        action: 'updated',
                                        message: `✅ Documentação '${doc.title}' atualizada no projeto '${projectId}'`,
                                        project: projectId,
                                        document: {
                                            id: doc.id,
                                            title: doc.title,
                                            file_path: doc.filePath,
                                            version: doc.version,
                                            last_updated: doc.lastUpdated,
                                        },
                                        next_steps: [
                                            `Atualize o arquivo: ${doc.filePath}`,
                                            'Use replace_string_in_file para modificar o conteúdo',
                                            `Versão incrementada: v${doc.version}`,
                                        ],
                                    }),
                                }],
                        };
                    }
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: false,
                                    error: 'action deve ser "create" ou "update"',
                                }),
                            }],
                    };
                }
                case 'list_documentation': {
                    const providedProjectId = args?.project_id;
                    const context = args?.context;
                    const type = args?.type;
                    const keywords = args?.keywords || [];
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const filters = {};
                    if (context)
                        filters.context = context;
                    if (type)
                        filters.type = type;
                    if (keywords.length > 0)
                        filters.keywords = keywords;
                    const docs = kb.listDocuments(filters);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    project: projectId,
                                    message: `📚 ${docs.length} documento(s) encontrado(s) no projeto '${projectId}'`,
                                    filters_applied: filters,
                                    documents: docs.map(doc => ({
                                        id: doc.id,
                                        title: doc.title,
                                        file_path: doc.filePath,
                                        context: doc.context,
                                        type: doc.type,
                                        topics: doc.topics,
                                        keywords: doc.keywords,
                                        summary: doc.summary,
                                        version: doc.version,
                                        last_updated: doc.lastUpdated,
                                        created_at: doc.createdAt,
                                    })),
                                }),
                            }],
                    };
                }
                case 'register_contract': {
                    const providedProjectId = args?.project_id;
                    const name = args?.name;
                    const context = args?.context;
                    const description = args?.description;
                    const interfaceCode = args?.interface_code;
                    const rules = args?.rules;
                    const examples = args?.examples || [];
                    const filePath = args?.file_path;
                    const { projectId, kb } = getProjectContext(providedProjectId, filePath);
                    const contract = kb.registerContract({
                        name,
                        context,
                        description,
                        interfaceCode,
                        rules,
                        examples,
                        filePath,
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: `✅ Contrato '${name}' registrado no projeto '${projectId}'`,
                                    project: projectId,
                                    contract: {
                                        id: contract.id,
                                        name: contract.name,
                                        context: contract.context,
                                        rules: contract.rules,
                                    },
                                    reminder: `A partir de agora, TODAS as implementações de '${name}' no projeto '${projectId}' devem respeitar estas regras:\n${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
                                }),
                            }],
                    };
                }
                case 'get_contracts': {
                    const providedProjectId = args?.project_id;
                    const context = args?.context;
                    const search = args?.search;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    let contracts;
                    if (search) {
                        contracts = kb.searchContracts(search);
                    }
                    else if (context && context !== 'all') {
                        contracts = kb.getAllContracts(context);
                    }
                    else {
                        contracts = kb.getAllContracts();
                    }
                    if (contracts.length === 0) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        project: projectId,
                                        message: `Nenhum contrato encontrado no projeto '${projectId}'. Use register_contract para adicionar.`,
                                        contracts: [],
                                    }),
                                }],
                        };
                    }
                    const contractsSummary = contracts.map((c) => ({
                        id: c.id,
                        name: c.name,
                        context: c.context,
                        description: c.description,
                        rules: c.rules,
                        examples: c.examples,
                    }));
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    project: projectId,
                                    message: `📋 ${contracts.length} contrato(s) encontrado(s) no projeto '${projectId}'`,
                                    contracts: contractsSummary,
                                    reminder: 'SEMPRE respeite estes contratos ao criar novas implementações!',
                                }),
                            }],
                    };
                }
                case 'register_feature': {
                    const providedProjectId = args?.project_id;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const feature = kb.registerFeature({
                        name: args?.name,
                        context: args?.context,
                        description: args?.description,
                        businessRules: args?.business_rules || [],
                        useCases: args?.use_cases || [],
                        relatedContracts: args?.related_contracts || [],
                        relatedPatterns: args?.related_patterns || [],
                        dependencies: args?.dependencies || [],
                        apiEndpoints: args?.api_endpoints || [],
                        status: args?.status || 'planning',
                        tags: args?.tags || [],
                        notes: args?.notes || '',
                        filePaths: args?.file_paths || [],
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    project: projectId,
                                    message: `✅ Feature "${feature.name}" registrada com sucesso!`,
                                    feature: {
                                        id: feature.id,
                                        name: feature.name,
                                        context: feature.context,
                                        status: feature.status,
                                        businessRules: feature.businessRules.length,
                                        useCases: feature.useCases.length,
                                        relatedContracts: feature.relatedContracts.length,
                                        relatedPatterns: feature.relatedPatterns.length,
                                    },
                                }),
                            }],
                    };
                }
                case 'get_features': {
                    const providedProjectId = args?.project_id;
                    const context = args?.context;
                    const status = args?.status;
                    const tags = args?.tags;
                    const search = args?.search;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    let features;
                    if (search) {
                        features = kb.searchFeatures(search);
                    }
                    else {
                        features = kb.getAllFeatures({ context, status, tags });
                    }
                    if (features.length === 0) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        project: projectId,
                                        message: `Nenhuma feature encontrada no projeto '${projectId}'. Use register_feature para adicionar.`,
                                        features: [],
                                    }),
                                }],
                        };
                    }
                    const featuresSummary = features.map(f => ({
                        id: f.id,
                        name: f.name,
                        context: f.context,
                        description: f.description,
                        status: f.status,
                        businessRules: f.businessRules.length,
                        useCases: f.useCases.length,
                        tags: f.tags,
                    }));
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    project: projectId,
                                    message: `🎯 ${features.length} feature(s) encontrada(s) no projeto '${projectId}'`,
                                    features: featuresSummary,
                                }),
                            }],
                    };
                }
                case 'update_feature': {
                    const providedProjectId = args?.project_id;
                    const featureId = args?.feature_id;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const updates = {};
                    if (args?.status)
                        updates.status = args.status;
                    if (args?.description)
                        updates.description = args.description;
                    if (args?.business_rules)
                        updates.businessRules = args.business_rules;
                    if (args?.use_cases)
                        updates.useCases = args.use_cases;
                    if (args?.notes)
                        updates.notes = args.notes;
                    const feature = kb.updateFeature(featureId, updates);
                    if (!feature) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        project: projectId,
                                        error: `Feature com ID "${featureId}" não encontrada.`,
                                    }),
                                }],
                        };
                    }
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    project: projectId,
                                    message: `✅ Feature "${feature.name}" atualizada com sucesso!`,
                                    feature: {
                                        id: feature.id,
                                        name: feature.name,
                                        status: feature.status,
                                        updatedAt: feature.updatedAt,
                                    },
                                }),
                            }],
                    };
                }
                case 'get_feature_context': {
                    const providedProjectId = args?.project_id;
                    const featureId = args?.feature_id;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const context = kb.getFeatureContext(featureId);
                    if (!context.feature) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        project: projectId,
                                        error: `Feature com ID "${featureId}" não encontrada.`,
                                    }),
                                }],
                        };
                    }
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    project: projectId,
                                    message: `📦 Contexto completo da feature "${context.feature.name}"`,
                                    feature: context.feature,
                                    relatedContracts: context.relatedContracts.map(c => ({
                                        id: c.id,
                                        name: c.name,
                                        description: c.description,
                                    })),
                                    relatedPatterns: context.relatedPatterns.map(p => ({
                                        id: p.id,
                                        name: p.name,
                                        description: p.description,
                                    })),
                                }),
                            }],
                    };
                }
                case 'validate_contract': {
                    const providedProjectId = args?.project_id;
                    const contractName = args?.contract_name;
                    const code = args?.code;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const contracts = kb.searchContracts(contractName);
                    if (contracts.length === 0) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        project: projectId,
                                        error: `Contrato '${contractName}' não encontrado no projeto '${projectId}'. Use get_contracts para ver contratos disponíveis.`,
                                    }),
                                }],
                        };
                    }
                    const contract = contracts[0];
                    const validation = kb.validateContract(code, contract.id);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    project: projectId,
                                    contract_name: contract.name,
                                    valid: validation.valid,
                                    message: validation.valid
                                        ? `✅ Código respeita o contrato '${contract.name}' no projeto '${projectId}'`
                                        : `❌ Código VIOLA o contrato '${contract.name}' no projeto '${projectId}'`,
                                    violations: validation.violations,
                                    rules: contract.rules,
                                    suggestion: validation.valid
                                        ? null
                                        : 'Corrija as violações antes de prosseguir. Use o contrato como referência.',
                                }),
                            }],
                    };
                }
                case 'learn_pattern': {
                    const providedProjectId = args?.project_id;
                    const name = args?.name;
                    const context = args?.context;
                    const description = args?.description;
                    const pattern = args?.pattern;
                    const examples = args?.examples || [];
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const learnedPattern = kb.learnPattern({
                        name,
                        context,
                        description,
                        pattern,
                        examples,
                        occurrences: 1,
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: `🧠 Padrão '${name}' aprendido no projeto '${projectId}'`,
                                    project: projectId,
                                    pattern: {
                                        name: learnedPattern.name,
                                        context: learnedPattern.context,
                                        occurrences: learnedPattern.occurrences,
                                    },
                                    reminder: `Use este padrão como referência para código similar no ${context} do projeto '${projectId}'.`,
                                }),
                            }],
                    };
                }
                case 'scan_project': {
                    const providedProjectId = args?.project_id;
                    const projectPath = args?.project_path;
                    const context = args?.context;
                    const { projectId, kb } = getProjectContext(providedProjectId, projectPath);
                    try {
                        const analysis = kb.scanDirectory(projectPath, context);
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: true,
                                        project: projectId,
                                        message: `🔍 Projeto '${projectId}' escaneado: ${analysis.files.length} arquivos`,
                                        analysis: {
                                            files_scanned: analysis.files.length,
                                            interfaces_found: analysis.interfaces.length,
                                            classes_found: analysis.classes.length,
                                        },
                                        interfaces: analysis.interfaces.slice(0, 20),
                                        classes: analysis.classes.slice(0, 20),
                                        suggestion: 'Use register_contract para registrar interfaces críticas encontradas.',
                                    }),
                                }],
                        };
                    }
                    catch (error) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        project: projectId,
                                        error: 'Erro ao escanear projeto',
                                        message: error instanceof Error ? error.message : 'Unknown error',
                                    }),
                                }],
                        };
                    }
                }
                case 'add_decision': {
                    const providedProjectId = args?.project_id;
                    const title = args?.title;
                    const context = args?.context;
                    const decision = args?.decision;
                    const positiveConsequences = args?.positive_consequences || [];
                    const negativeConsequences = args?.negative_consequences || [];
                    const alternatives = args?.alternatives || [];
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const adr = kb.addDecision({
                        title,
                        context,
                        decision,
                        consequences: {
                            positive: positiveConsequences,
                            negative: negativeConsequences,
                        },
                        alternatives,
                        status: 'accepted',
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    project: projectId,
                                    message: `📝 Decisão arquitetural registrada no projeto '${projectId}': ${adr.id}`,
                                    adr: {
                                        id: adr.id,
                                        title: adr.title,
                                        status: adr.status,
                                    },
                                    reminder: `Esta decisão deve ser respeitada em todo o projeto '${projectId}'.`,
                                }),
                            }],
                    };
                }
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Project Docs MCP Server running on stdio');
    }
}
const server = new ProjectDocsServer();
server.run().catch(console.error);
