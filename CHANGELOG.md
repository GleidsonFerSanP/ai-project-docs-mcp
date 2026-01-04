# Changelog - JARVIS Docs MCP

## [2.1.0] - 2026-01-04 - Runtime Project Creation 🚀

### 🆕 Nova Feature: Criação Dinâmica de Projetos

#### `create_project` Tool

* ✅ **Cria projetos em runtime** diretamente do chat, sem editar arquivos
* ✅ Atualiza automaticamente `mcp-config.json`
* ✅ Cria estrutura de diretórios (`docs/{projeto}/`,  `knowledge/{projeto}/`)
* ✅ Gera arquivos vazios de knowledge base (contracts, patterns, decisions)
* ✅ Cria `project-overview.md` inicial personalizado
* ✅ Validação de ID de projeto (apenas lowercase, números, hífens, underscores)
* ✅ Verificação de duplicação
* ✅ Projeto imediatamente disponível para uso

#### Melhorias no ProjectManager

* ✅ Método `createProject()` com validação completa
* ✅ Geração automática de `project-overview.md` baseado em template
* ✅ Criação automática de estrutura de diretórios
* ✅ Persistência automática em disco

#### Documentação

* ✅ [docs/_shared/creating-projects.md](docs/_shared/creating-projects.md) - Guia completo
* ✅ [docs/_shared/example-create-project.md](docs/_shared/example-create-project.md) - Exemplo prático passo a passo
* ✅ README atualizado com destaque para nova funcionalidade

### 📝 Exemplo de Uso

```typescript
create_project({
  project_id: "ecommerce-api",
  name: "E-commerce API",
  description: "API REST para e-commerce",
  paths: ["/ecommerce-api", "/ecommerce"],
  stack: { backend: "FastAPI", database: "PostgreSQL" },
  principles: ["Clean Architecture", "TDD"]
})
```

**Total de Tools:** 13 (1 novo + 12 existentes)

---

## [2.0.0] - 2026-01-04 - Multi-Project Architecture 🏗️

### 🎯 Transformação Completa: Sistema Multi-Projeto

#### Arquitetura

* ✅ Sistema universal de documentação para múltiplos projetos
* ✅ Knowledge base isolada por projeto
* ✅ Auto-detecção de projeto por caminho de arquivo
* ✅ Suporte a contextos personalizados por stack

#### Projetos Configurados

* ✅ **jarvis** - NestJS + Angular
* ✅ **automacao-n8n** - AWS + Terraform + GitHub Actions

---

## [1.1.0] - 2026-01-04 - Sistema de Auto-Aprendizado 🧠

### 🆕 Novas Features

#### Contract Registry

* ✅ `register_contract`: Registra interfaces/contratos críticos
* ✅ `get_contracts`: Lista contratos registrados
* ✅ `validate_contract`: Valida implementações contra contratos
* ✅ Persistência em `knowledge/contracts.json`

#### Pattern Learning

* ✅ `learn_pattern`: Ensina padrões ao MCP
* ✅ Tracking de ocorrências de padrões
* ✅ Persistência em `knowledge/patterns.json`

#### Project Scanning

* ✅ `scan_project`: Análise automática de código
* ✅ Extração de interfaces e classes
* ✅ Identificação de padrões no projeto

#### Architectural Decisions

* ✅ `add_decision`: Registra ADRs (Architectural Decision Records)
* ✅ Tracking de decisões arquiteturais
* ✅ Persistência em `knowledge/decisions.json`

### 📚 Documentação Nova

* ✅ `docs/AUTO-LEARNING.md`: Guia completo de uso
* ✅ `docs/contracts/EXAMPLE.md`: Exemplo prático
* ✅ `QUICKSTART.md`: Setup em 5 minutos
* ✅ `SOLUTION-SUMMARY.md`: Resumo executivo

### 🔧 Infraestrutura

* ✅ `src/knowledge-base.ts`: Sistema de persistência
* ✅ `knowledge/`: Diretório para dados persistentes
* ✅ Estrutura de contratos, padrões e decisões

### 🎯 Problema Resolvido

**Antes:** Agent esquecia contratos e interfaces importantes, exigindo repetição constante de instruções.

**Agora:** MCP aprende e lembra permanentemente de:
* Contratos críticos
* Padrões específicos do projeto
* Decisões arquiteturais
* Estrutura do projeto

---

## [1.0.0] - 2026-01-04 - Release Inicial

### Features Básicas

#### Resources

* ✅ `project-overview`: Visão geral do projeto JARVIS
* ✅ `backend-guidelines`: Guidelines NestJS
* ✅ `frontend-guidelines`: Guidelines Angular
* ✅ `documentation-rules`: Regras de documentação

#### Tools

* ✅ `identify_context`: Identifica backend/frontend automaticamente
* ✅ `get_guidelines`: Busca guidelines específicos
* ✅ `should_document`: Decide sobre documentação necessária

#### Documentação

* ✅ Princípios SOLID e Clean Architecture
* ✅ Padrões de backend (NestJS)
* ✅ Padrões de frontend (Angular)
* ✅ Regras sobre quando documentar

### Objetivo

Fornecer contexto consistente sobre o projeto JARVIS para AI agents, eliminando ambiguidade entre backend e frontend.

---

## Roadmap Futuro

### v1.2.0 (Planejado)

* [ ] Integration com ferramentas de linting
* [ ] Validação automática em pre-commit hooks
* [ ] Dashboard de conformidade
* [ ] Export/Import de knowledge base

### v1.3.0 (Planejado)

* [ ] Support para mais stacks (Python, Go, etc.)
* [ ] AI-powered pattern detection
* [ ] Auto-sugestão de contratos baseado em código
* [ ] Integração com CI/CD

### v2.0.0 (Futuro)

* [ ] Multi-projeto support
* [ ] Shared knowledge base entre projetos
* [ ] Team collaboration features
* [ ] Web UI para gerenciar conhecimento

---

## Como Contribuir

1. Identifique necessidade/bug
2. Crie issue descrevendo
3. Implemente solução
4. Adicione testes
5. Atualize documentação
6. Faça PR

---

## Versionamento

Seguimos [Semantic Versioning](https://semver.org/):

* **MAJOR**: Mudanças incompatíveis na API
* **MINOR**: Novas features compatíveis
* **PATCH**: Bug fixes compatíveis

---

**Última atualização:** 2026-01-04
