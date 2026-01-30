# Progressive Context Setup - Plano de Implementação

> Feature para gerar automaticamente estrutura de disclosure context em projetos

## Visão Geral

A extensão detectará quando um projeto não possui a estrutura de Progressive Context e oferecerá ao usuário a opção de gerá-la automaticamente, usando LLM para contextualizar os arquivos ao projeto específico.

## Arquitetura da Feature

```
┌─────────────────────────────────────────────────────────────────┐
│                    Extension Activation                          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              ContextSetupManager.checkWorkspace()                │
│  - Verifica se estrutura existe                                  │
│  - Verifica se usuário já rejeitou                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
          ┌───────┴───────┐
          │ Estrutura     │
          │ existe?       │
          └───────┬───────┘
            NO    │    YES
            │     │     │
            ▼     │     └──► Nada a fazer
┌───────────────┐ │
│ Usuário já    │ │
│ rejeitou?     │ │
└───────┬───────┘ │
   NO   │   YES   │
   │    │    │    │
   ▼    │    └────┴──► Nada a fazer
┌───────────────────────────────────────────────────────────────┐
│                    showSetupPrompt()                           │
│  - Modal com explicação                                        │
│  - Link para documentação                                      │
│  - Botões: [Setup Now] [Learn More] [Don't Ask Again]         │
└───────────────────┬───────────────────────────────────────────┘
                    │
            ┌───────┴───────┐
            │ Resposta      │
            └───────┬───────┘
     Setup    │  Learn  │  Don't Ask
       │      │   More  │     │
       ▼      │    │    │     ▼
┌─────────────┐│   │    │ ┌──────────────┐
│ runSetup()  ││   │    │ │ saveRejection│
└──────┬──────┘│   │    │ └──────────────┘
       │       │   ▼    │
       │       │ openDocs
       ▼       │
┌─────────────────────────────────────────────────────────────────┐
│                    ProjectAnalyzer                               │
│  - Detecta linguagem/framework                                   │
│  - Analisa estrutura de pastas                                   │
│  - Identifica stack tecnológico                                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FileGenerator                                 │
│  - Gera AGENTS.md contextualizado                               │
│  - Gera docs/skills/SKILL.md                                    │
│  - Gera .github/copilot-instructions.md                         │
│  - Usa LLM para personalizar conteúdo                           │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VSCodeConfigurer                              │
│  - Atualiza .vscode/settings.json                               │
│  - Aponta chatInstructions para arquivos locais                 │
└─────────────────────────────────────────────────────────────────┘
```

## Estrutura de Arquivos a Serem Gerados

```
<workspace_root>/
├── AGENTS.md                          # Instruções para agentes AI (contextualizado)
├── .github/
│   └── copilot-instructions.md        # Instruções para Copilot (contextualizado)
├── docs/
│   └── skills/
│       └── SKILL.md                   # Skill overview (contextualizado)
└── .vscode/
    └── settings.json                  # Configurações apontando para arquivos
```

## Componentes a Implementar

### 1. ContextSetupManager (context-setup-manager.ts)

```typescript
interface IContextSetupManager {
    checkWorkspace(): Promise<void>;
    showSetupPrompt(): Promise<SetupResponse>;
    runSetup(): Promise<void>;
    hasUserRejected(): boolean;
    saveRejection(): void;
}
```

Responsabilidades:
* Verificar se estrutura de disclosure context existe
* Verificar preferência salva do usuário
* Mostrar prompt com explicação
* Orquestrar processo de setup

### 2. ProjectAnalyzer (project-analyzer.ts)

```typescript
interface IProjectAnalyzer {
    analyze(): Promise<ProjectInfo>;
}

interface ProjectInfo {
    name: string;
    language: string[];
    frameworks: string[];
    hasTests: boolean;
    hasDocker: boolean;
    hasCICD: boolean;
    buildSystem: string;
    structure: FolderStructure;
}
```

Responsabilidades:
* Detectar linguagens (package.json, requirements.txt, go.mod, etc.)
* Identificar frameworks
* Mapear estrutura de pastas
* Detectar ferramentas de build/test

### 3. TemplateEngine (template-engine.ts)

```typescript
interface ITemplateEngine {
    generateAgentsMd(projectInfo: ProjectInfo): Promise<string>;
    generateSkillMd(projectInfo: ProjectInfo): Promise<string>;
    generateCopilotInstructions(projectInfo: ProjectInfo): Promise<string>;
}
```

Responsabilidades:
* Templates base para cada arquivo
* Placeholders para contextualização
* Integração com LLM para personalização

### 4. FileGenerator (file-generator.ts)

```typescript
interface IFileGenerator {
    generateAll(projectInfo: ProjectInfo): Promise<GeneratedFiles>;
    writeFiles(files: GeneratedFiles): Promise<void>;
}
```

Responsabilidades:
* Criar diretórios necessários
* Gerar conteúdo contextualizado
* Escrever arquivos no workspace

### 5. VSCodeConfigurer (vscode-configurer.ts)

```typescript
interface IVSCodeConfigurer {
    configureWorkspace(): Promise<void>;
    updateChatInstructions(): Promise<void>;
}
```

Responsabilidades:
* Criar/atualizar .vscode/settings.json
* Configurar caminhos para chat instructions

## Fluxo de Persistência de Preferências

```
Rejeição do usuário:
1. Salvar em context.globalState (persiste entre sessões)
2. Key: `progressiveContextSetup.rejected.${workspaceId}`
3. Valor: { rejectedAt: timestamp, reason?: string }

Verificação:
1. Checar globalState primeiro
2. Se rejeitado há mais de 30 dias, perguntar novamente
```

## Configurações a Adicionar (package.json)

```json
{
    "aiProjectContext.progressiveContext.autoPrompt": {
        "type": "boolean",
        "default": true,
        "description": "Automatically prompt to setup Progressive Context structure"
    },
    "aiProjectContext.progressiveContext.promptDelay": {
        "type": "number",
        "default": 5000,
        "description": "Delay in ms before showing setup prompt"
    }
}
```

## Comandos a Adicionar

```json
{
    "command": "ai-project-context.setupProgressiveContext",
    "title": "Setup Progressive Context Structure",
    "category": "AI Project Context"
},
{
    "command": "ai-project-context.resetProgressiveContextPreference",
    "title": "Reset Progressive Context Preference",
    "category": "AI Project Context"
}
```

## Integração com LLM

Para contextualização, usaremos os próprios tools do MCP:

```typescript
// Usar identify_context para obter info do projeto
// Usar scan_project para extrair padrões
// Gerar conteúdo baseado nas informações coletadas
```

## UI/UX Design

### Modal de Prompt

```
┌─────────────────────────────────────────────────────────────┐
│  🚀 Enhance Your AI Coding Experience                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  This workspace doesn't have Progressive Context setup.     │
│                                                             │
│  Setting up Progressive Context will:                       │
│  ✅ Help AI understand your project structure               │
│  ✅ Provide better code suggestions                         │
│  ✅ Maintain context across conversations                   │
│  ✅ Follow your project's coding standards                  │
│                                                             │
│  Files to be created:                                       │
│  • AGENTS.md - Instructions for AI agents                   │
│  • .github/copilot-instructions.md                          │
│  • docs/skills/SKILL.md                                     │
│                                                             │
│  📖 Learn more about Progressive Context                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Setup Now]  [Learn More]  [Not Now]  [Don't Ask Again]   │
└─────────────────────────────────────────────────────────────┘
```

## Checklist de Implementação

* [ ] 1. Criar estrutura de arquivos do módulo
* [ ] 2. Implementar ProjectAnalyzer
* [ ] 3. Implementar TemplateEngine com templates base
* [ ] 4. Implementar FileGenerator
* [ ] 5. Implementar VSCodeConfigurer
* [ ] 6. Implementar ContextSetupManager
* [ ] 7. Atualizar extension.ts para usar ContextSetupManager
* [ ] 8. Atualizar package.json com configs e comandos
* [ ] 9. Criar página de documentação/explicação
* [ ] 10. Testar em diferentes tipos de projetos
* [ ] 11. Criar release notes
* [ ] 12. Publicar nova versão

## Timeline Estimado

| Fase | Tarefa | Tempo |
|------|--------|-------|
| 1 | ProjectAnalyzer + TemplateEngine | 30min |
| 2 | FileGenerator + VSCodeConfigurer | 30min |
| 3 | ContextSetupManager + UI | 30min |
| 4 | Integração + Testes | 20min |
| 5 | Release + Publicação | 10min |

**Total: ~2 horas**

## Notas de Implementação

1. **Não sobrescrever arquivos existentes** - Verificar antes de criar
2. **Backup opcional** - Oferecer criar backup se arquivo existe
3. **Gitignore friendly** - Não adicionar nada ao .gitignore automaticamente
4. **Cross-platform** - Usar path.join e normalizar caminhos
5. **Erro handling** - Tratar todos os erros de I/O graciosamente
