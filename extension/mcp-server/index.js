#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, GetPromptRequestSchema, ListPromptsRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { KnowledgeBase } from './knowledge-base.js';
import { ProjectManager } from './project-manager.js';
import { SessionManager } from './session-manager.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
class ProjectDocsServer {
    server;
    projectManager;
    constructor() {
        // ProjectManager agora usa caminho global automaticamente (~/.project-docs-mcp/)
        this.projectManager = new ProjectManager();
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
        // List available prompts
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
            const currentProject = this.projectManager.getCurrentProject();
            const config = currentProject ? this.projectManager.getProjectConfig(currentProject) : null;
            return {
                prompts: [
                    {
                        name: 'project-context',
                        description: 'Contexto completo do projeto atual incluindo arquitetura, contratos e guidelines',
                        arguments: [
                            {
                                name: 'project_id',
                                description: 'ID do projeto (opcional, usa projeto atual se omitido)',
                                required: false,
                            },
                        ],
                    },
                    {
                        name: 'coding-session',
                        description: 'Prepara o contexto para uma sessão de desenvolvimento com todas as guidelines e padrões',
                        arguments: [
                            {
                                name: 'context',
                                description: 'Contexto: backend, frontend, infrastructure',
                                required: true,
                            },
                        ],
                    },
                    {
                        name: 'session-resume',
                        description: 'Retoma uma sessão anterior com todo o contexto e histórico',
                        arguments: [
                            {
                                name: 'session_id',
                                description: 'ID da sessão a retomar',
                                required: true,
                            },
                        ],
                    },
                ],
            };
        });
        // Get specific prompt
        this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            if (name === 'project-context') {
                const projectId = args?.project_id || this.projectManager.getCurrentProject();
                if (!projectId) {
                    return {
                        messages: [{
                                role: 'user',
                                content: {
                                    type: 'text',
                                    text: 'Nenhum projeto configurado. Use create_project ou switch_project primeiro.',
                                },
                            }],
                    };
                }
                const config = this.projectManager.getProjectConfig(projectId);
                const knowledgePath = this.projectManager.getKnowledgePath(__dirname, projectId);
                const kb = new KnowledgeBase(knowledgePath);
                const contracts = kb.getAllContracts();
                const patterns = kb.getAllPatterns();
                const decisions = kb.getAllDecisions();
                let context = `# Contexto do Projeto: ${config?.name || projectId}\n\n`;
                context += `## Descrição\n${config?.description}\n\n`;
                context += `## Stack Tecnológico\n\`\`\`json\n${JSON.stringify(config?.stack, null, 2)}\n\`\`\`\n\n`;
                context += `## Princípios\n${config?.principles.map((p) => `- ${p}`).join('\n')}\n\n`;
                if (contracts && contracts.length > 0) {
                    context += `## Contratos Críticos\n`;
                    contracts.forEach((c) => {
                        context += `### ${c.name} (${c.context})\n`;
                        context += `${c.description}\n`;
                        context += `**Regras:**\n${c.rules.map((r) => `- ${r}`).join('\n')}\n\n`;
                    });
                }
                if (patterns && patterns.length > 0) {
                    context += `## Padrões do Projeto\n`;
                    patterns.forEach((p) => {
                        context += `### ${p.name} (${p.context})\n`;
                        context += `${p.description}\n\n`;
                    });
                }
                if (decisions && decisions.length > 0) {
                    context += `## Decisões Arquiteturais Recentes\n`;
                    decisions.slice(-5).forEach((d) => {
                        context += `### ${d.title}\n`;
                        context += `**Contexto:** ${d.context}\n`;
                        context += `**Decisão:** ${d.decision}\n\n`;
                    });
                }
                return {
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: context,
                            },
                        },
                    ],
                };
            }
            if (name === 'coding-session') {
                const context = args?.context;
                if (!context) {
                    throw new Error('Contexto é obrigatório (backend, frontend, infrastructure)');
                }
                const projectId = this.projectManager.getCurrentProject();
                const config = projectId ? this.projectManager.getProjectConfig(projectId) : null;
                let prompt = `# 🎯 Iniciando Sessão de Desenvolvimento - ${context}\n\n`;
                if (config) {
                    prompt += `## Projeto: ${config.name}\n\n`;
                    prompt += `### Stack (${context})\n`;
                    if (context === 'backend' && config.stack.backend) {
                        prompt += `- Framework: ${JSON.stringify(config.stack.backend)}\n`;
                    }
                    else if (context === 'frontend' && config.stack.frontend) {
                        prompt += `- Framework: ${JSON.stringify(config.stack.frontend)}\n`;
                    }
                    prompt += `\n### Princípios\n${config.principles.map((p) => `- ${p}`).join('\n')}\n\n`;
                }
                prompt += `\n## ⚡ SISTEMA DE MANUTENÇÃO DE FOCO - INSTRUÇÕES CRÍTICAS\n\n`;
                prompt += `Durante esta sessão, você DEVE seguir estas regras para manter o foco:\n\n`;
                prompt += `### 1. 🔄 Auto-Refresh de Contexto\n`;
                prompt += `- A cada 10 interações, use \`refresh_session_context\` para recarregar guidelines\n`;
                prompt += `- Se passar 30 minutos, recarregue o contexto automaticamente\n`;
                prompt += `- Mantenha contratos e padrões sempre em mente\n\n`;
                prompt += `### 2. ✅ Validação Contínua\n`;
                prompt += `- Antes de implementar, use \`validate_conversation_focus\` para verificar alinhamento\n`;
                prompt += `- Valide contra contratos usando \`get_contracts\`\n`;
                prompt += `- Se detectar violação, ALERTE imediatamente\n\n`;
                prompt += `### 3. 📍 Checkpoints Regulares\n`;
                prompt += `- A cada feature completada, crie checkpoint com \`create_checkpoint\`\n`;
                prompt += `- Documente progresso e próximos passos\n`;
                prompt += `- Mantenha histórico de decisões\n\n`;
                prompt += `### 4. 🎯 Foco da Sessão\n`;
                prompt += `- Use \`get_session_state\` para verificar foco atual\n`;
                prompt += `- Se conversa divergir, redirecione para o objetivo\n`;
                prompt += `- Consulte \`identify_context\` para entender arquivo atual\n\n`;
                prompt += `**LEMBRE-SE:** Essas diretrizes são MANDATÓRIAS durante toda a conversa.\n`;
                return {
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: prompt,
                            },
                        },
                    ],
                };
            }
            if (name === 'session-resume') {
                const sessionId = args?.session_id;
                if (!sessionId) {
                    throw new Error('session_id é obrigatório');
                }
                const projectId = this.projectManager.getCurrentProject();
                const knowledgePath = this.projectManager.getKnowledgePath(__dirname, projectId);
                const sessionManager = new SessionManager(knowledgePath);
                const session = sessionManager.getSession(sessionId);
                if (!session) {
                    throw new Error(`Sessão ${sessionId} não encontrada`);
                }
                let prompt = `# 🔄 Retomando Sessão de Desenvolvimento\n\n`;
                prompt += `## 📋 Informações da Sessão\n`;
                prompt += `- **Session ID:** ${session.sessionId}\n`;
                prompt += `- **Projeto:** ${session.projectId}\n`;
                prompt += `- **Contexto:** ${session.context}\n`;
                prompt += `- **Status:** ${session.status}\n`;
                prompt += `- **Foco Atual:** ${session.currentFocus}\n`;
                prompt += `- **Interações:** ${session.turnCount}\n`;
                prompt += `- **Criada em:** ${session.createdAt.toLocaleString()}\n`;
                prompt += `- **Última atualização:** ${session.updatedAt.toLocaleString()}\n\n`;
                if (session.activeContracts.length > 0) {
                    prompt += `## 📝 Contratos Ativos\n`;
                    prompt += session.activeContracts.map(c => `- ${c}`).join('\n') + '\n\n';
                }
                if (session.activeFeatures.length > 0) {
                    prompt += `## 🎯 Features em Progresso\n`;
                    prompt += session.activeFeatures.map(f => `- ${f}`).join('\n') + '\n\n';
                }
                if (session.checkpoints.length > 0) {
                    prompt += `## 🏁 Checkpoints Recentes\n`;
                    session.checkpoints.slice(-3).forEach(cp => {
                        prompt += `### ${cp.timestamp.toLocaleString()}\n`;
                        prompt += `- **Resumo:** ${cp.summary}\n`;
                        prompt += `- **Próximo Foco:** ${cp.nextFocus}\n\n`;
                    });
                }
                if (session.violations.filter(v => !v.resolved).length > 0) {
                    prompt += `## ⚠️ Violações Pendentes\n`;
                    session.violations.filter(v => !v.resolved).forEach(v => {
                        prompt += `- **[${v.severity.toUpperCase()}]** ${v.description}\n`;
                        if (v.suggestedFix) {
                            prompt += `  - Sugestão: ${v.suggestedFix}\n`;
                        }
                    });
                    prompt += '\n';
                }
                if (session.focusReminders.length > 0) {
                    prompt += `## 💡 Lembretes de Foco\n`;
                    session.focusReminders.forEach(r => {
                        prompt += `- ${r}\n`;
                    });
                    prompt += '\n';
                }
                prompt += `\n## ⚡ Continue de onde parou!\n`;
                prompt += `A sessão está pronta. Use as tools de sessão para manter o foco:\n`;
                prompt += `- \`get_session_state\` - Ver estado atual\n`;
                prompt += `- \`refresh_session_context\` - Recarregar guidelines\n`;
                prompt += `- \`validate_conversation_focus\` - Validar alinhamento\n`;
                prompt += `- \`create_checkpoint\` - Salvar progresso\n`;
                return {
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: prompt,
                            },
                        },
                    ],
                };
            }
            throw new Error(`Unknown prompt: ${name}`);
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
                    name: 'get_complete_project_context',
                    description: '🎯 CONTEXTO COMPLETO: Obtém sumário executivo do projeto com TUDO que o AI precisa saber - decisões arquiteturais, restrições, contratos, guidelines, features, padrões. Use SEMPRE no início de conversas sobre o projeto. NUNCA retorna contexto global/aleatório, apenas do projeto específico.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            include_features: {
                                type: 'boolean',
                                description: 'Incluir features registradas (default: true)',
                            },
                            include_patterns: {
                                type: 'boolean',
                                description: 'Incluir padrões aprendidos (default: true)',
                            },
                        },
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
                    name: 'migrate_metadata_to_project',
                    description: 'Migra metadata (JSON files) de ~/.project-docs-mcp/knowledge/{project-id}/ para {projectRoot}/.project-docs-mcp/ para serem versionados no git',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto a migrar',
                            },
                            keep_backup: {
                                type: 'boolean',
                                description: 'Manter backup dos arquivos antigos (padrão: true)',
                            },
                        },
                        required: ['project_id'],
                    },
                },
                {
                    name: 'sync_documentation_files',
                    description: 'Escaneia arquivos .md no diretório docs/ do projeto e sincroniza com metadata. Detecta docs não registrados e registra automaticamente.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            scan_path: {
                                type: 'string',
                                description: 'Caminho relativo para escanear (padrão: docs/)',
                            },
                            auto_register: {
                                type: 'boolean',
                                description: 'Registrar automaticamente docs encontrados (padrão: true)',
                            },
                        },
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
                    name: 'remove_feature',
                    description: 'Remove uma feature do projeto',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            feature_id: {
                                type: 'string',
                                description: 'ID da feature a remover',
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
                {
                    name: 'set_global_guideline',
                    description: 'Define ou atualiza uma guideline global (ex: SOLID, Clean Architecture) que se aplica a todos os seus projetos. Updates automáticos sem duplicação.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            title: {
                                type: 'string',
                                description: 'Título da guideline (ex: "SOLID Principles", "Clean Code Standards")',
                            },
                            category: {
                                type: 'string',
                                enum: ['architecture', 'coding-standards', 'testing', 'documentation', 'process', 'other'],
                                description: 'Categoria da guideline',
                            },
                            context: {
                                type: 'string',
                                enum: ['backend', 'frontend', 'infrastructure', 'shared', 'all'],
                                description: 'Contexto onde a guideline se aplica (opcional)',
                            },
                            content: {
                                type: 'string',
                                description: 'Conteúdo detalhado da guideline',
                            },
                            principles: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Princípios relacionados (ex: ["Single Responsibility", "Open/Closed"])',
                            },
                            rules: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Regras específicas a seguir',
                            },
                            examples: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Exemplos de código ou aplicação',
                            },
                            priority: {
                                type: 'string',
                                enum: ['mandatory', 'recommended', 'optional'],
                                description: 'Prioridade da guideline',
                            },
                            applyToAllProjects: {
                                type: 'boolean',
                                description: 'Se true, aplica a todos os projetos automaticamente',
                            },
                        },
                        required: ['title', 'category', 'content', 'priority', 'applyToAllProjects'],
                    },
                },
                {
                    name: 'get_global_guidelines',
                    description: 'Lista todas as guidelines globais configuradas pelo usuário',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            category: {
                                type: 'string',
                                description: 'Filtrar por categoria (opcional)',
                            },
                            context: {
                                type: 'string',
                                description: 'Filtrar por contexto (opcional)',
                            },
                            priority: {
                                type: 'string',
                                description: 'Filtrar por prioridade (opcional)',
                            },
                            applyToAllProjects: {
                                type: 'boolean',
                                description: 'Filtrar por aplicação a todos os projetos (opcional)',
                            },
                        },
                    },
                },
                {
                    name: 'remove_global_guideline',
                    description: 'Remove uma guideline global',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            guideline_id: {
                                type: 'string',
                                description: 'ID da guideline a ser removida',
                            },
                        },
                        required: ['guideline_id'],
                    },
                },
                {
                    name: 'get_merged_guidelines',
                    description: 'Obtém guidelines mescladas (globais + específicas do projeto) para um contexto. Use isso ao iniciar trabalho em qualquer arquivo.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            context: {
                                type: 'string',
                                enum: ['backend', 'frontend', 'infrastructure', 'shared'],
                                description: 'Contexto para obter guidelines (opcional)',
                            },
                        },
                    },
                },
                {
                    name: 'start_session',
                    description: 'Inicia uma nova sessão de desenvolvimento com rastreamento de foco e validação contínua',
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
                                description: 'Contexto da sessão',
                            },
                            current_focus: {
                                type: 'string',
                                description: 'Descrição do foco/objetivo atual da sessão',
                            },
                            active_contracts: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'IDs dos contratos que devem ser respeitados (opcional)',
                            },
                            active_features: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'IDs das features sendo trabalhadas (opcional)',
                            },
                            focus_reminders: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Lembretes específicos para manter o foco (opcional)',
                            },
                        },
                        required: ['context', 'current_focus'],
                    },
                },
                {
                    name: 'get_session_state',
                    description: 'Obtém o estado atual da sessão incluindo foco, contratos ativos, turnos e violações',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            session_id: {
                                type: 'string',
                                description: 'ID da sessão (opcional, usa última sessão ativa)',
                            },
                        },
                    },
                },
                {
                    name: 'refresh_session_context',
                    description: 'Recarrega guidelines, contratos e padrões do projeto. Use a cada 10 interações ou 30 minutos.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            session_id: {
                                type: 'string',
                                description: 'ID da sessão (opcional, usa última sessão ativa)',
                            },
                        },
                    },
                },
                {
                    name: 'validate_conversation_focus',
                    description: 'Valida se a conversa está alinhada com contratos, guidelines e foco da sessão. Detecta violações.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            session_id: {
                                type: 'string',
                                description: 'ID da sessão (opcional, usa última sessão ativa)',
                            },
                            proposed_code: {
                                type: 'string',
                                description: 'Código proposto para validar (opcional)',
                            },
                            proposed_action: {
                                type: 'string',
                                description: 'Descrição da ação proposta (opcional)',
                            },
                        },
                    },
                },
                {
                    name: 'create_checkpoint',
                    description: 'Cria um checkpoint na sessão documentando progresso e próximos passos',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            session_id: {
                                type: 'string',
                                description: 'ID da sessão (opcional, usa última sessão ativa)',
                            },
                            summary: {
                                type: 'string',
                                description: 'Resumo do que foi feito até aqui',
                            },
                            next_focus: {
                                type: 'string',
                                description: 'Próxima etapa planejada',
                            },
                            files_modified: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Arquivos modificados desde último checkpoint (opcional)',
                            },
                        },
                        required: ['summary', 'next_focus'],
                    },
                },
                {
                    name: 'list_active_sessions',
                    description: 'Lista todas as sessões ativas do projeto',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                        },
                    },
                },
                {
                    name: 'update_focus',
                    description: 'Atualiza o foco da sessão atual quando o usuário muda de direção ou objetivo',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            session_id: {
                                type: 'string',
                                description: 'ID da sessão (opcional, usa última sessão ativa)',
                            },
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                            new_focus: {
                                type: 'string',
                                description: 'Nova descrição do foco/objetivo da sessão',
                            },
                            reason: {
                                type: 'string',
                                description: 'Motivo da mudança de foco (opcional)',
                            },
                        },
                        required: ['new_focus'],
                    },
                },
                {
                    name: 'get_current_focus',
                    description: 'Obtém o foco atual da sessão ativa e estado completo. Use no INÍCIO de toda conversa.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            session_id: {
                                type: 'string',
                                description: 'ID da sessão (opcional, usa última sessão ativa)',
                            },
                            project_id: {
                                type: 'string',
                                description: 'ID do projeto (opcional, usa projeto atual)',
                            },
                        },
                    },
                },
                {
                    name: 'resume_session',
                    description: 'Reativa uma sessão pausada',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            session_id: {
                                type: 'string',
                                description: 'ID da sessão a reativar',
                            },
                        },
                        required: ['session_id'],
                    },
                },
                {
                    name: 'complete_session',
                    description: 'Finaliza uma sessão marcando-a como concluída',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            session_id: {
                                type: 'string',
                                description: 'ID da sessão a finalizar',
                            },
                        },
                        required: ['session_id'],
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
                // Default to default if no project found
                if (!projectId)
                    projectId = 'default';
                // ✅ FIXED: Usa diretório do projeto se disponível, senão usa global
                let knowledgeBasePath;
                const projectRoot = this.projectManager.getProjectRoot(projectId);
                if (projectRoot) {
                    // Knowledge base DENTRO do projeto (versionável no git)
                    knowledgeBasePath = join(projectRoot, '.project-docs-mcp');
                }
                else {
                    // Fallback para global (apenas para projeto 'default')
                    const globalDir = this.projectManager.getGlobalDir();
                    knowledgeBasePath = join(globalDir, 'knowledge', projectId);
                }
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
                case 'get_complete_project_context': {
                    const providedProjectId = args?.project_id;
                    const includeFeatures = args?.include_features !== false; // default true
                    const includePatterns = args?.include_patterns !== false; // default true
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const config = this.projectManager.getProjectConfig(projectId);
                    if (!config) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        error: `Projeto '${projectId}' não configurado`,
                                        hint: 'Use create_project para configurar o projeto',
                                    }),
                                }],
                        };
                    }
                    // 1. Decisões Arquiteturais
                    const decisions = kb.getAllDecisions();
                    // 2. Contratos Críticos
                    const contracts = kb.getAllContracts();
                    // 3. Guidelines (Global + Project)
                    const guidelinesBackend = kb.getMergedGuidelines('backend');
                    const guidelinesFrontend = kb.getMergedGuidelines('frontend');
                    const guidelinesInfra = kb.getMergedGuidelines('infrastructure');
                    // 4. Features (opcional)
                    const features = includeFeatures ? kb.getAllFeatures() : [];
                    // 5. Padrões (opcional)
                    const patterns = includePatterns ? kb.getAllPatterns() : [];
                    // 6. Sumário Executivo
                    const summary = {
                        overview: {
                            projectId,
                            name: config.name,
                            description: config.description,
                            stack: config.stack,
                            principles: config.principles,
                        },
                        restrictions_and_rules: {
                            total_contracts: contracts.length,
                            critical_interfaces: contracts.map(c => ({
                                name: c.name,
                                context: c.context,
                                rules_count: c.rules.length,
                            })),
                            total_decisions: decisions.length,
                            architectural_decisions: decisions.map(d => ({
                                id: d.id,
                                title: d.title,
                                status: d.status,
                                context: d.context,
                            })),
                        },
                        guidelines: {
                            backend: {
                                global_count: guidelinesBackend.global.length,
                                has_project_specific: guidelinesBackend.projectSpecific.length > 0,
                            },
                            frontend: {
                                global_count: guidelinesFrontend.global.length,
                                has_project_specific: guidelinesFrontend.projectSpecific.length > 0,
                            },
                            infrastructure: {
                                global_count: guidelinesInfra.global.length,
                                has_project_specific: guidelinesInfra.projectSpecific.length > 0,
                            },
                        },
                        features_summary: includeFeatures ? {
                            total: features.length,
                            by_status: {
                                planned: features.filter(f => f.status === 'planned').length,
                                in_progress: features.filter(f => f.status === 'in-progress').length,
                                completed: features.filter(f => f.status === 'completed').length,
                                deprecated: features.filter(f => f.status === 'deprecated').length,
                            },
                            by_context: {
                                backend: features.filter(f => f.context === 'backend').length,
                                frontend: features.filter(f => f.context === 'frontend').length,
                                infrastructure: features.filter(f => f.context === 'infrastructure').length,
                            },
                        } : undefined,
                        patterns_summary: includePatterns ? {
                            total: patterns.length,
                            by_context: {
                                backend: patterns.filter(p => p.context === 'backend').length,
                                frontend: patterns.filter(p => p.context === 'frontend').length,
                                infrastructure: patterns.filter(p => p.context === 'infrastructure').length,
                                shared: patterns.filter(p => p.context === 'shared').length,
                            },
                        } : undefined,
                    };
                    // 7. Texto formatado para o AI (pronto para usar)
                    const formattedContext = `
# 🎯 Contexto Completo do Projeto: ${config.name}

## 📋 Visão Geral
**ID:** ${projectId}
**Descrição:** ${config.description}

## 🏗️ Stack Tecnológico
${Object.entries(config.stack).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}

## 🎯 Princípios Arquiteturais
${config.principles.map(p => `- ${p}`).join('\n')}

## 🚨 Decisões Arquiteturais (ADRs) - ${decisions.length} registradas
${decisions.length > 0 ? decisions.map(d => `
### ${d.id}: ${d.title}
- **Status:** ${d.status}
- **Contexto:** ${d.context}
- **Decisão:** ${d.decision}
- **Trade-offs Positivos:** ${d.consequences?.positive?.join(', ') || 'N/A'}
- **Trade-offs Negativos:** ${d.consequences?.negative?.join(', ') || 'N/A'}
`).join('\n') : '- Nenhuma decisão registrada ainda'}

## 🔒 Contratos Críticos - ${contracts.length} registrados
${contracts.length > 0 ? contracts.map(c => `
### ${c.name} (${c.context})
${c.description}
**Regras OBRIGATÓRIAS:**
${c.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`).join('\n') : '- Nenhum contrato registrado ainda'}

## 📐 Guidelines Ativas
${guidelinesBackend.global.length > 0 ? `
### Backend (${guidelinesBackend.global.length} globais)
${guidelinesBackend.merged}
` : ''}
${guidelinesFrontend.global.length > 0 ? `
### Frontend (${guidelinesFrontend.global.length} globais)
${guidelinesFrontend.merged}
` : ''}
${guidelinesInfra.global.length > 0 ? `
### Infrastructure (${guidelinesInfra.global.length} globais)
${guidelinesInfra.merged}
` : ''}

${includeFeatures && features.length > 0 ? `
## ✨ Features Principais
${features.slice(0, 10).map(f => `- **${f.name}** (${f.status}) - ${f.context}`).join('\n')}
${features.length > 10 ? `\n... e mais ${features.length - 10} features` : ''}
` : ''}

${includePatterns && patterns.length > 0 ? `
## 🔧 Padrões Identificados
${patterns.slice(0, 5).map(p => `- **${p.name}** (${p.context})`).join('\n')}
${patterns.length > 5 ? `\n... e mais ${patterns.length - 5} padrões` : ''}
` : ''}

---
**⚠️ IMPORTANTE:** Sempre respeite decisões arquiteturais e contratos ao trabalhar neste projeto!
`;
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    project: projectId,
                                    summary,
                                    formatted_context: formattedContext,
                                    full_data: {
                                        decisions,
                                        contracts,
                                        guidelines: {
                                            backend: guidelinesBackend,
                                            frontend: guidelinesFrontend,
                                            infrastructure: guidelinesInfra,
                                        },
                                        features: includeFeatures ? features : undefined,
                                        patterns: includePatterns ? patterns : undefined,
                                    },
                                    next_steps: [
                                        'Use este contexto para alinhar seu trabalho com as regras do projeto',
                                        'Consulte contratos específicos com get_contracts quando implementar interfaces',
                                        'Valide código contra contratos com validate_contract antes de finalizar',
                                        'Registre novas decisões com add_decision',
                                    ],
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
                case 'migrate_metadata_to_project': {
                    const projectId = args?.project_id;
                    const keepBackup = args?.keep_backup !== false; // Default true
                    if (!projectId) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({ error: 'project_id é obrigatório' }),
                                }],
                        };
                    }
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    if (!projectRoot) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        error: `Projeto '${projectId}' não tem projectRoot configurado`,
                                        hint: 'Verifique se o projeto tem paths definidos no mcp-config.json',
                                    }),
                                }],
                        };
                    }
                    const globalDir = this.projectManager.getGlobalDir();
                    const oldPath = join(globalDir, 'knowledge', projectId);
                    const newPath = join(projectRoot, '.project-docs-mcp');
                    // Verificar se diretório antigo existe
                    if (!existsSync(oldPath)) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: `Nenhum metadata encontrado em ${oldPath}`,
                                        hint: 'Talvez o projeto já use a nova estrutura ou nunca teve metadata',
                                    }),
                                }],
                        };
                    }
                    const migratedFiles = [];
                    const errors = [];
                    try {
                        // Criar diretório de destino
                        if (!existsSync(newPath)) {
                            mkdirSync(newPath, { recursive: true });
                        }
                        // Migrar cada JSON file
                        const jsonFiles = ['contracts.json', 'patterns.json', 'decisions.json', 'features.json', 'documentation.json'];
                        for (const fileName of jsonFiles) {
                            const oldFile = join(oldPath, fileName);
                            const newFile = join(newPath, fileName);
                            if (existsSync(oldFile)) {
                                try {
                                    const content = readFileSync(oldFile, 'utf-8');
                                    writeFileSync(newFile, content, 'utf-8');
                                    migratedFiles.push(fileName);
                                    // Backup opcional
                                    if (keepBackup) {
                                        const backupFile = join(oldPath, `${fileName}.backup`);
                                        writeFileSync(backupFile, content, 'utf-8');
                                    }
                                    else {
                                        // Remover arquivo antigo se não quiser backup
                                        unlinkSync(oldFile);
                                    }
                                }
                                catch (err) {
                                    errors.push(`${fileName}: ${err.message}`);
                                }
                            }
                        }
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: true,
                                        message: `✅ Migração concluída! ${migratedFiles.length} arquivo(s) migrado(s)`,
                                        project: projectId,
                                        from: oldPath,
                                        to: newPath,
                                        migrated_files: migratedFiles,
                                        errors: errors.length > 0 ? errors : undefined,
                                        backup_kept: keepBackup,
                                        next_steps: [
                                            `Verifique os arquivos em: ${newPath}`,
                                            'Adicione .project-docs-mcp/ ao git: git add .project-docs-mcp/',
                                            'Commit: git commit -m "chore: add MCP metadata to project"',
                                            keepBackup ? `Remova backups depois: rm -rf ${oldPath}/*.backup` : undefined,
                                        ].filter(Boolean),
                                    }),
                                }],
                        };
                    }
                    catch (err) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        error: 'Erro durante migração',
                                        details: err.message,
                                        migrated_files: migratedFiles,
                                    }),
                                }],
                        };
                    }
                }
                case 'sync_documentation_files': {
                    const providedProjectId = args?.project_id;
                    const scanPath = args?.scan_path || 'docs';
                    const autoRegister = args?.auto_register !== false; // Default true
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    if (!projectRoot) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        error: `Projeto '${projectId}' não tem projectRoot configurado`,
                                        hint: 'Verifique se o projeto tem paths configurados no mcp-config.json',
                                        project_id: projectId,
                                    }),
                                }],
                        };
                    }
                    const docsPath = join(projectRoot, scanPath);
                    if (!existsSync(docsPath)) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: `Diretório ${docsPath} não existe`,
                                        hint: 'Crie o diretório docs/ ou especifique outro scan_path',
                                        debug: {
                                            project_id: projectId,
                                            project_root: projectRoot,
                                            scan_path: scanPath,
                                            computed_docs_path: docsPath,
                                        },
                                    }),
                                }],
                        };
                    }
                    // Escanear recursivamente por arquivos .md
                    const findMarkdownFiles = (dir, baseDir = dir) => {
                        let results = [];
                        const items = readdirSync(dir);
                        for (const item of items) {
                            const fullPath = join(dir, item);
                            const stat = statSync(fullPath);
                            if (stat.isDirectory()) {
                                // Pular diretórios ocultos e node_modules
                                if (!item.startsWith('.') && item !== 'node_modules') {
                                    results = results.concat(findMarkdownFiles(fullPath, baseDir));
                                }
                            }
                            else if (item.endsWith('.md')) {
                                // Caminho relativo ao projectRoot
                                const relativePath = fullPath.replace(projectRoot + '/', '');
                                results.push(relativePath);
                            }
                        }
                        return results;
                    };
                    const markdownFiles = findMarkdownFiles(docsPath);
                    const existingDocs = kb.loadDocumentation();
                    const registeredPaths = new Set(Object.values(existingDocs).map(d => d.filePath));
                    const unregistered = [];
                    const registered = [];
                    const errors = [];
                    // Encontrar docs não registrados
                    for (const filePath of markdownFiles) {
                        if (!registeredPaths.has(filePath)) {
                            unregistered.push(filePath);
                            if (autoRegister) {
                                try {
                                    // Ler arquivo para extrair informações
                                    const fullPath = join(projectRoot, filePath);
                                    const content = readFileSync(fullPath, 'utf-8');
                                    // Extrair título da primeira linha # 
                                    const titleMatch = content.match(/^#\s+(.+)$/m);
                                    const title = titleMatch ? titleMatch[1] : filePath.split('/').pop()?.replace('.md', '') || filePath;
                                    // Inferir contexto do caminho
                                    let context = 'general';
                                    if (filePath.includes('/backend/'))
                                        context = 'backend';
                                    else if (filePath.includes('/frontend/'))
                                        context = 'frontend';
                                    else if (filePath.includes('/infrastructure/') || filePath.includes('/infra/'))
                                        context = 'infrastructure';
                                    else if (filePath.includes('/_shared/'))
                                        context = 'shared';
                                    // Inferir tipo do caminho
                                    let type = 'other';
                                    if (filePath.includes('/architecture/') || filePath.includes('ADR-'))
                                        type = 'architecture';
                                    else if (filePath.includes('/api/'))
                                        type = 'api';
                                    else if (filePath.includes('/guides/') || filePath.includes('/guide/'))
                                        type = 'guide';
                                    else if (filePath.includes('/troubleshooting/'))
                                        type = 'troubleshooting';
                                    else if (filePath.includes('/setup/'))
                                        type = 'setup';
                                    // Extrair keywords do conteúdo (primeiras 500 palavras)
                                    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
                                    const wordFreq = new Map();
                                    words.slice(0, 500).forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));
                                    const keywords = Array.from(wordFreq.entries())
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 10)
                                        .map(([word]) => word);
                                    // Extrair tópicos dos headers ##
                                    const topics = Array.from(content.matchAll(/^##\s+(.+)$/gm))
                                        .map(m => m[1])
                                        .slice(0, 5);
                                    // Criar resumo (primeiros 200 caracteres)
                                    const summary = content.replace(/^#.+$/gm, '').trim().slice(0, 200) + '...';
                                    kb.registerDocument({
                                        title,
                                        filePath,
                                        context,
                                        type,
                                        topics: topics.length > 0 ? topics : ['documentation'],
                                        keywords,
                                        summary,
                                    });
                                    registered.push(filePath);
                                }
                                catch (err) {
                                    errors.push(`${filePath}: ${err.message}`);
                                }
                            }
                        }
                    }
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: `📊 Sincronização concluída`,
                                    project: projectId,
                                    stats: {
                                        total_md_files: markdownFiles.length,
                                        already_registered: markdownFiles.length - unregistered.length,
                                        newly_registered: registered.length,
                                        unregistered: unregistered.length - registered.length,
                                    },
                                    scan_path: docsPath,
                                    newly_registered_files: registered,
                                    unregistered_files: autoRegister ? [] : unregistered,
                                    errors: errors.length > 0 ? errors : undefined,
                                    next_steps: [
                                        registered.length > 0 ? `✅ ${registered.length} documento(s) registrado(s) automaticamente` : undefined,
                                        !autoRegister && unregistered.length > 0 ? `Use auto_register: true para registrar ${unregistered.length} arquivo(s) encontrado(s)` : undefined,
                                        'Use list_documentation para ver todos os docs registrados',
                                    ].filter(Boolean),
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
                                        last_updated: document.lastUpdated instanceof Date ? document.lastUpdated.toISOString() : document.lastUpdated,
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
                                                last_updated: topMatch.document.lastUpdated instanceof Date ? topMatch.document.lastUpdated.toISOString() : topMatch.document.lastUpdated,
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
                        // 🆕 Criar arquivo .md automaticamente se não existir
                        const projectRoot = this.projectManager.getProjectRoot(projectId);
                        let fileCreated = false;
                        let fileError;
                        if (projectRoot) {
                            const fullFilePath = join(projectRoot, doc.filePath);
                            if (!existsSync(fullFilePath)) {
                                try {
                                    // Criar diretório se não existir
                                    const fileDir = dirname(fullFilePath);
                                    if (!existsSync(fileDir)) {
                                        mkdirSync(fileDir, { recursive: true });
                                    }
                                    // Criar template básico do documento
                                    const template = `# ${doc.title}

## Resumo

${summary || 'Descrição do documento.'}

## Contexto

- **Contexto**: ${context}
- **Tipo**: ${type}
- **Tópicos**: ${topics.join(', ')}

## Conteúdo

<!-- Adicione o conteúdo principal aqui -->

## Referências

${relatedContracts.length > 0 ? `- Contratos: ${relatedContracts.join(', ')}` : ''}
${relatedFeatures.length > 0 ? `- Features: ${relatedFeatures.join(', ')}` : ''}

---
*Documento gerado automaticamente pelo MCP*
`;
                                    writeFileSync(fullFilePath, template, 'utf-8');
                                    fileCreated = true;
                                }
                                catch (err) {
                                    fileError = err.message;
                                }
                            }
                        }
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
                            file_created: fileCreated,
                            next_steps: fileCreated
                                ? [
                                    `✅ Arquivo criado: ${doc.filePath}`,
                                    'Abra o arquivo e adicione o conteúdo detalhado',
                                    'O documento está registrado e será consultável pelo MCP',
                                ]
                                : [
                                    `Crie o arquivo: ${doc.filePath}`,
                                    'Use replace_string_in_file ou create_file para criar o conteúdo',
                                    'O documento está registrado e será consultável pelo MCP',
                                ],
                        };
                        if (fileError) {
                            response.file_error = `Erro ao criar arquivo: ${fileError}`;
                        }
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
                                            last_updated: doc.lastUpdated instanceof Date ? doc.lastUpdated.toISOString() : doc.lastUpdated,
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
                                        last_updated: doc.lastUpdated instanceof Date ? doc.lastUpdated.toISOString() : doc.lastUpdated,
                                        created_at: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
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
                case 'remove_feature': {
                    const providedProjectId = args?.project_id;
                    const featureId = args?.feature_id;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    // Buscar feature antes de remover para mostrar o nome
                    const feature = kb.getFeatureById(featureId);
                    const removed = kb.removeFeature(featureId);
                    if (!removed) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        project: projectId,
                                        success: false,
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
                                    success: true,
                                    message: `✅ Feature "${feature?.name || featureId}" removida com sucesso!`,
                                    featureId,
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
                case 'set_global_guideline': {
                    const title = args?.title;
                    const category = args?.category;
                    const context = args?.context;
                    const content = args?.content;
                    const principles = args?.principles || [];
                    const rules = args?.rules || [];
                    const examples = args?.examples || [];
                    const priority = args?.priority;
                    const applyToAllProjects = args?.applyToAllProjects;
                    // Usar KB global
                    const kb = new KnowledgeBase(join(__dirname, '../knowledge'), 'global');
                    const guideline = kb.setGlobalGuideline({
                        title,
                        category,
                        context,
                        content,
                        principles,
                        rules,
                        examples,
                        priority,
                        applyToAllProjects,
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: guideline.createdAt === guideline.updatedAt
                                        ? `✅ Global guideline '${title}' criada com sucesso!`
                                        : `✅ Global guideline '${title}' atualizada com sucesso!`,
                                    guideline: {
                                        id: guideline.id,
                                        title: guideline.title,
                                        category: guideline.category,
                                        priority: guideline.priority,
                                        applyToAllProjects: guideline.applyToAllProjects,
                                    },
                                    note: applyToAllProjects
                                        ? 'Esta guideline será aplicada automaticamente a todos os seus projetos.'
                                        : 'Esta guideline está salva mas não se aplica automaticamente.',
                                }),
                            }],
                    };
                }
                case 'get_global_guidelines': {
                    const category = args?.category;
                    const context = args?.context;
                    const priority = args?.priority;
                    const applyToAllProjects = args?.applyToAllProjects;
                    const kb = new KnowledgeBase(join(__dirname, '../knowledge'), 'global');
                    const guidelines = kb.getGlobalGuidelines({
                        category,
                        context,
                        priority,
                        applyToAllProjects,
                    });
                    if (guidelines.length === 0) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: true,
                                        message: 'Nenhuma global guideline configurada ainda.',
                                        suggestion: 'Use set_global_guideline para definir suas preferências (ex: SOLID, Clean Architecture).',
                                    }),
                                }],
                        };
                    }
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    count: guidelines.length,
                                    guidelines: guidelines.map(g => ({
                                        id: g.id,
                                        title: g.title,
                                        category: g.category,
                                        context: g.context,
                                        priority: g.priority,
                                        applyToAllProjects: g.applyToAllProjects,
                                        principlesCount: g.principles?.length || 0,
                                        rulesCount: g.rules?.length || 0,
                                    })),
                                    message: `Encontradas ${guidelines.length} global guidelines.`,
                                }),
                            }],
                    };
                }
                case 'remove_global_guideline': {
                    const guidelineId = args?.guideline_id;
                    const kb = new KnowledgeBase(join(__dirname, '../knowledge'), 'global');
                    const removed = kb.removeGlobalGuideline(guidelineId);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: removed,
                                    message: removed
                                        ? `✅ Global guideline removida com sucesso!`
                                        : `❌ Guideline com ID '${guidelineId}' não encontrada.`,
                                }),
                            }],
                    };
                }
                case 'get_merged_guidelines': {
                    const providedProjectId = args?.project_id;
                    const context = args?.context;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const merged = kb.getMergedGuidelines(context);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    project: projectId,
                                    context: context || 'all',
                                    globalGuidelinesCount: merged.global.length,
                                    guidelines: merged.merged,
                                    message: merged.global.length > 0
                                        ? `📋 ${merged.global.length} global guidelines aplicadas ao contexto ${context || 'all'}`
                                        : 'Nenhuma global guideline aplicável. Configure com set_global_guideline.',
                                }),
                            }],
                    };
                }
                case 'start_session': {
                    const providedProjectId = args?.project_id;
                    const context = args?.context;
                    const currentFocus = args?.current_focus;
                    const activeContracts = args?.active_contracts || [];
                    const activeFeatures = args?.active_features || [];
                    const focusReminders = args?.focus_reminders || [];
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    // Criar SessionManager para o projeto
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    const knowledgePath = projectRoot
                        ? join(projectRoot, '.project-docs-mcp')
                        : join(this.projectManager.getGlobalDir(), 'knowledge', projectId);
                    const sessionManager = new SessionManager(knowledgePath);
                    const session = sessionManager.createSession({
                        projectId,
                        context,
                        currentFocus,
                        activeContracts,
                        activeFeatures,
                        focusReminders,
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: '🎯 Sessão iniciada com sucesso!',
                                    session: {
                                        sessionId: session.sessionId,
                                        projectId: session.projectId,
                                        context: session.context,
                                        currentFocus: session.currentFocus,
                                        activeContractsCount: session.activeContracts.length,
                                        activeFeaturesCount: session.activeFeatures.length,
                                    },
                                    reminder: `Use get_session_state para verificar status, refresh_session_context a cada 10 interações, e create_checkpoint ao completar etapas.`,
                                }),
                            }],
                    };
                }
                case 'get_session_state': {
                    const sessionId = args?.session_id;
                    const providedProjectId = args?.project_id;
                    const { projectId } = getProjectContext(providedProjectId);
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    const knowledgePath = projectRoot
                        ? join(projectRoot, '.project-docs-mcp')
                        : join(this.projectManager.getGlobalDir(), 'knowledge', projectId);
                    const sessionManager = new SessionManager(knowledgePath);
                    let session;
                    if (sessionId) {
                        session = sessionManager.getSession(sessionId);
                    }
                    else {
                        // Pegar última sessão ativa
                        const activeSessions = sessionManager.getActiveSessions(projectId);
                        session = activeSessions[0] || null;
                    }
                    if (!session) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'Nenhuma sessão ativa encontrada. Use start_session para iniciar uma nova.',
                                    }),
                                }],
                        };
                    }
                    const summary = sessionManager.getSessionSummary(session.sessionId);
                    const needsRefresh = sessionManager.needsContextRefresh(session.sessionId);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    session: {
                                        sessionId: session.sessionId,
                                        projectId: session.projectId,
                                        context: session.context,
                                        currentFocus: session.currentFocus,
                                        status: session.status,
                                        turnCount: session.turnCount,
                                        activeContracts: session.activeContracts,
                                        activeFeatures: session.activeFeatures,
                                        focusReminders: session.focusReminders,
                                        checkpointsCount: session.checkpoints.length,
                                        unresolvedViolationsCount: session.violations.filter(v => !v.resolved).length,
                                        lastContextRefresh: session.lastContextRefresh,
                                    },
                                    summary,
                                    needsContextRefresh: needsRefresh,
                                    latestCheckpoint: session.checkpoints.length > 0
                                        ? session.checkpoints[session.checkpoints.length - 1]
                                        : null,
                                    unresolvedViolations: session.violations.filter(v => !v.resolved),
                                }),
                            }],
                    };
                }
                case 'refresh_session_context': {
                    const sessionId = args?.session_id;
                    const providedProjectId = args?.project_id;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    const knowledgePath = projectRoot
                        ? join(projectRoot, '.project-docs-mcp')
                        : join(this.projectManager.getGlobalDir(), 'knowledge', projectId);
                    const sessionManager = new SessionManager(knowledgePath);
                    let session;
                    if (sessionId) {
                        session = sessionManager.getSession(sessionId);
                    }
                    else {
                        const activeSessions = sessionManager.getActiveSessions(projectId);
                        session = activeSessions[0] || null;
                    }
                    if (!session) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'Sessão não encontrada',
                                    }),
                                }],
                        };
                    }
                    // Atualizar timestamp de refresh
                    sessionManager.refreshContext(session.sessionId);
                    // Obter guidelines atualizadas
                    const contextForGuidelines = session.context === 'all' ? undefined : session.context;
                    const merged = kb.getMergedGuidelines(contextForGuidelines);
                    const contracts = kb.getAllContracts(contextForGuidelines);
                    const patterns = kb.getAllPatterns(contextForGuidelines);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: '🔄 Contexto recarregado com sucesso!',
                                    refreshed: {
                                        guidelinesCount: merged.global.length,
                                        contractsCount: contracts.length,
                                        patternsCount: patterns.length,
                                        timestamp: new Date(),
                                    },
                                    guidelines: merged.merged,
                                    contracts: contracts.map(c => ({
                                        id: c.id,
                                        name: c.name,
                                        context: c.context,
                                        rules: c.rules,
                                    })),
                                    reminder: `Guidelines e contratos recarregados. Continue respeitando os ${contracts.length} contratos ativos.`,
                                }),
                            }],
                    };
                }
                case 'validate_conversation_focus': {
                    const sessionId = args?.session_id;
                    const proposedCode = args?.proposed_code;
                    const proposedAction = args?.proposed_action;
                    const providedProjectId = args?.project_id;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    const knowledgePath = projectRoot
                        ? join(projectRoot, '.project-docs-mcp')
                        : join(this.projectManager.getGlobalDir(), 'knowledge', projectId);
                    const sessionManager = new SessionManager(knowledgePath);
                    let session;
                    if (sessionId) {
                        session = sessionManager.getSession(sessionId);
                    }
                    else {
                        const activeSessions = sessionManager.getActiveSessions(projectId);
                        session = activeSessions[0] || null;
                    }
                    if (!session) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'Sessão não encontrada',
                                    }),
                                }],
                        };
                    }
                    // Incrementar turnos
                    sessionManager.incrementTurn(session.sessionId);
                    const violations = [];
                    // Validar código proposto contra contratos
                    if (proposedCode && session.context !== 'all') {
                        const validation = kb.validateAgainstContracts(proposedCode, session.context);
                        if (!validation.valid) {
                            validation.violations.forEach(v => {
                                sessionManager.addViolation(session.sessionId, {
                                    type: v.type,
                                    severity: 'error',
                                    description: v.reason,
                                    suggestedFix: `Verifique o contrato '${v.name}' e ajuste a implementação.`,
                                    resolved: false,
                                });
                                violations.push(v);
                            });
                        }
                    }
                    // Verificar se ação está alinhada com foco da sessão
                    if (proposedAction && session.currentFocus) {
                        const focusKeywords = session.currentFocus.toLowerCase().split(' ');
                        const actionKeywords = proposedAction.toLowerCase().split(' ');
                        const overlap = focusKeywords.filter(k => actionKeywords.includes(k));
                        if (overlap.length === 0 && proposedAction.length > 10) {
                            const warning = {
                                type: 'context',
                                severity: 'warning',
                                description: `Ação proposta pode não estar alinhada com o foco da sessão: "${session.currentFocus}"`,
                                suggestedFix: 'Verifique se está trabalhando no escopo correto ou atualize o foco da sessão.',
                                resolved: false,
                            };
                            sessionManager.addViolation(session.sessionId, warning);
                            violations.push(warning);
                        }
                    }
                    // Verificar se precisa de refresh
                    const needsRefresh = sessionManager.needsContextRefresh(session.sessionId);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    valid: violations.length === 0,
                                    message: violations.length === 0
                                        ? '✅ Validação OK! Está alinhado com contratos e foco da sessão.'
                                        : `⚠️ ${violations.length} violação(ões) detectada(s)!`,
                                    violations,
                                    sessionState: {
                                        turnCount: session.turnCount + 1,
                                        currentFocus: session.currentFocus,
                                        needsContextRefresh: needsRefresh,
                                    },
                                    reminder: needsRefresh.needed
                                        ? `⚠️ ${needsRefresh.reason}. Use refresh_session_context para recarregar guidelines.`
                                        : undefined,
                                }),
                            }],
                    };
                }
                case 'create_checkpoint': {
                    const sessionId = args?.session_id;
                    const summary = args?.summary;
                    const nextFocus = args?.next_focus;
                    const filesModified = args?.files_modified || [];
                    const providedProjectId = args?.project_id;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    const knowledgePath = projectRoot
                        ? join(projectRoot, '.project-docs-mcp')
                        : join(this.projectManager.getGlobalDir(), 'knowledge', projectId);
                    const sessionManager = new SessionManager(knowledgePath);
                    let session;
                    if (sessionId) {
                        session = sessionManager.getSession(sessionId);
                    }
                    else {
                        const activeSessions = sessionManager.getActiveSessions(projectId);
                        session = activeSessions[0] || null;
                    }
                    if (!session) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'Sessão não encontrada',
                                    }),
                                }],
                        };
                    }
                    // Obter guidelines ativas
                    const contextForGuidelines = session.context === 'all' ? undefined : session.context;
                    const merged = kb.getMergedGuidelines(contextForGuidelines);
                    const activeGuidelines = merged.global.map(g => g.title);
                    sessionManager.addCheckpoint(session.sessionId, {
                        turnCount: session.turnCount,
                        summary,
                        nextFocus,
                        activeGuidelines,
                        filesModified,
                    });
                    // Atualizar foco da sessão
                    sessionManager.updateSession(session.sessionId, {
                        currentFocus: nextFocus,
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: '🏁 Checkpoint criado com sucesso!',
                                    checkpoint: {
                                        turnCount: session.turnCount,
                                        summary,
                                        nextFocus,
                                        filesModified,
                                        timestamp: new Date(),
                                    },
                                    updatedSession: {
                                        currentFocus: nextFocus,
                                        checkpointsCount: session.checkpoints.length + 1,
                                    },
                                }),
                            }],
                    };
                }
                case 'list_active_sessions': {
                    const providedProjectId = args?.project_id;
                    const { projectId } = getProjectContext(providedProjectId);
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    const knowledgePath = projectRoot
                        ? join(projectRoot, '.project-docs-mcp')
                        : join(this.projectManager.getGlobalDir(), 'knowledge', projectId);
                    const sessionManager = new SessionManager(knowledgePath);
                    const activeSessions = sessionManager.getActiveSessions(projectId);
                    const summaries = activeSessions.map(s => sessionManager.getSessionSummary(s.sessionId));
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    count: activeSessions.length,
                                    message: activeSessions.length > 0
                                        ? `📋 ${activeSessions.length} sessão(ões) ativa(s) encontrada(s)`
                                        : 'Nenhuma sessão ativa. Use start_session para iniciar.',
                                    sessions: summaries,
                                }),
                            }],
                    };
                }
                case 'update_focus': {
                    const sessionId = args?.session_id;
                    const providedProjectId = args?.project_id;
                    const newFocus = args?.new_focus;
                    const reason = args?.reason;
                    if (!newFocus) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'new_focus é obrigatório',
                                    }),
                                }],
                        };
                    }
                    const { projectId } = getProjectContext(providedProjectId);
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    const knowledgePath = projectRoot
                        ? join(projectRoot, '.project-docs-mcp')
                        : join(this.projectManager.getGlobalDir(), 'knowledge', projectId);
                    const sessionManager = new SessionManager(knowledgePath);
                    let session;
                    if (sessionId) {
                        session = sessionManager.getSession(sessionId);
                    }
                    else {
                        const activeSessions = sessionManager.getActiveSessions(projectId);
                        session = activeSessions[0] || null;
                    }
                    if (!session) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'Nenhuma sessão ativa encontrada. Use start_session primeiro.',
                                    }),
                                }],
                        };
                    }
                    const oldFocus = session.currentFocus;
                    const updatedSession = sessionManager.updateFocus(session.sessionId, newFocus, reason);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: '🎯 Foco da sessão atualizado!',
                                    change: {
                                        from: oldFocus,
                                        to: newFocus,
                                        reason: reason || 'Mudança de direção',
                                    },
                                    session: {
                                        sessionId: updatedSession?.sessionId,
                                        currentFocus: updatedSession?.currentFocus,
                                        turnCount: updatedSession?.turnCount,
                                        checkpointsCount: updatedSession?.checkpoints.length,
                                    },
                                    reminder: 'Checkpoint automático criado para registrar a mudança de foco.',
                                }),
                            }],
                    };
                }
                case 'get_current_focus': {
                    const sessionId = args?.session_id;
                    const providedProjectId = args?.project_id;
                    const { projectId, kb } = getProjectContext(providedProjectId);
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    const knowledgePath = projectRoot
                        ? join(projectRoot, '.project-docs-mcp')
                        : join(this.projectManager.getGlobalDir(), 'knowledge', projectId);
                    const sessionManager = new SessionManager(knowledgePath);
                    const session = sessionManager.getCurrentFocus(projectId, sessionId);
                    if (!session) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'Nenhuma sessão ativa encontrada',
                                        action: 'Use start_session para iniciar uma nova sessão e definir o foco',
                                        example: {
                                            tool: 'start_session',
                                            params: {
                                                context: 'backend',
                                                current_focus: 'Implementar autenticação JWT',
                                            },
                                        },
                                    }),
                                }],
                        };
                    }
                    const summary = sessionManager.getSessionSummary(session.sessionId);
                    const needsRefresh = sessionManager.needsContextRefresh(session.sessionId);
                    // Obter guidelines e contratos atuais
                    const contextForGuidelines = session.context === 'all' ? undefined : session.context;
                    const merged = kb.getMergedGuidelines(contextForGuidelines);
                    const contracts = kb.getAllContracts(contextForGuidelines);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: '🎯 Sessão ativa encontrada',
                                    session: {
                                        sessionId: session.sessionId,
                                        projectId: session.projectId,
                                        context: session.context,
                                        currentFocus: session.currentFocus,
                                        status: session.status,
                                        turnCount: session.turnCount,
                                        activeContracts: session.activeContracts,
                                        activeFeatures: session.activeFeatures,
                                        focusReminders: session.focusReminders,
                                    },
                                    progress: {
                                        checkpointsCount: session.checkpoints.length,
                                        unresolvedViolationsCount: session.violations.filter(v => !v.resolved).length,
                                        duration: summary?.duration,
                                    },
                                    latestCheckpoint: session.checkpoints.length > 0
                                        ? session.checkpoints[session.checkpoints.length - 1]
                                        : null,
                                    activeGuidelines: merged.global.map(g => ({ title: g.title, category: g.category })),
                                    activeContracts: contracts.map(c => ({ id: c.id, name: c.name, context: c.context })),
                                    needsContextRefresh: needsRefresh,
                                    reminder: needsRefresh.needed
                                        ? `⚠️ ${needsRefresh.reason}. Use refresh_session_context para recarregar.`
                                        : 'Contexto atualizado. Continue trabalhando com foco e validação.',
                                }),
                            }],
                    };
                }
                case 'resume_session': {
                    const sessionId = args?.session_id;
                    if (!sessionId) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'session_id é obrigatório',
                                    }),
                                }],
                        };
                    }
                    // Primeiro, carregar a sessão para obter o projectId
                    const currentProject = this.projectManager.getCurrentProject();
                    const tempKnowledgePath = join(this.projectManager.getGlobalDir(), 'knowledge', currentProject);
                    const tempSessionManager = new SessionManager(tempKnowledgePath);
                    const tempSession = tempSessionManager.getSession(sessionId);
                    if (!tempSession) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'Sessão não encontrada',
                                    }),
                                }],
                        };
                    }
                    // Agora usar o projectId da sessão para obter o path correto
                    const projectRoot = this.projectManager.getProjectRoot(tempSession.projectId);
                    const knowledgePath = projectRoot
                        ? join(projectRoot, '.project-docs-mcp')
                        : join(this.projectManager.getGlobalDir(), 'knowledge', tempSession.projectId);
                    const sessionManager = new SessionManager(knowledgePath);
                    const session = sessionManager.resumeSession(sessionId);
                    if (!session) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'Sessão não encontrada',
                                    }),
                                }],
                        };
                    }
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: '▶️ Sessão reativada!',
                                    session: {
                                        sessionId: session.sessionId,
                                        projectId: session.projectId,
                                        currentFocus: session.currentFocus,
                                        context: session.context,
                                        turnCount: session.turnCount,
                                        checkpointsCount: session.checkpoints.length,
                                        status: session.status,
                                    },
                                    reminder: 'Use get_current_focus para ver o estado completo e continuar de onde parou.',
                                }),
                            }],
                    };
                }
                case 'complete_session': {
                    const sessionId = args?.session_id;
                    const providedProjectId = args?.project_id;
                    if (!sessionId) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'session_id é obrigatório',
                                    }),
                                }],
                        };
                    }
                    const { projectId } = getProjectContext(providedProjectId);
                    const projectRoot = this.projectManager.getProjectRoot(projectId);
                    const knowledgePath = projectRoot
                        ? join(projectRoot, '.project-docs-mcp')
                        : join(this.projectManager.getGlobalDir(), 'knowledge', projectId);
                    const sessionManager = new SessionManager(knowledgePath);
                    const session = sessionManager.completeSession(sessionId);
                    if (!session) {
                        return {
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({
                                        success: false,
                                        message: 'Sessão não encontrada',
                                    }),
                                }],
                        };
                    }
                    const summary = sessionManager.getSessionSummary(sessionId);
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    message: '✅ Sessão finalizada com sucesso!',
                                    summary: {
                                        duration: summary?.duration,
                                        turnCount: summary?.turnCount,
                                        checkpointsCount: summary?.checkpointsCount,
                                        resolvedViolations: session.violations.filter(v => v.resolved).length,
                                        totalViolations: session.violations.length,
                                    },
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
