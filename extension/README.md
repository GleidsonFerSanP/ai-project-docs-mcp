# Project Docs MCP - VS Code Extension

Sistema Universal de Documentação Multi-Projeto para GitHub Copilot e AI Assistants.

## 🚀 Instalação

1. **Via Marketplace** (recomendado):
   - Abra VS Code
   - Procure por "Project Docs MCP"
   - Clique em "Install"

2. **Manual** (desenvolvimento):
   

```bash
   cd extension
   npm install
   npm run compile
   vsce package
   code --install-extension project-docs-mcp-2.4.0.vsix
   ```

## ✨ Recursos

### 🤖 Integração Automática com Copilot

* ✅ Configuração automática ao instalar
* ✅ Disponível via `@project-docs` no Copilot Chat
* ✅ Sem configuração manual necessária

### 📚 Sistema de Documentação Inteligente

* ✅ Prevenção automática de duplicação
* ✅ Versionamento de documentos
* ✅ Busca por similaridade
* ✅ Multi-projeto

### 🧠 Auto-Learning

* ✅ Registro de contratos/interfaces
* ✅ Padrões de código
* ✅ Decisões arquiteturais
* ✅ Features e casos de uso

### 🌍 Totalmente Portátil

* ✅ Variáveis de ambiente
* ✅ Funciona em qualquer máquina
* ✅ Knowledge base compartilhável

## 🎯 Como Usar

### 1. Instale a Extensão

A extensão configura tudo automaticamente!

### 2. Use no Copilot Chat

```
@project-docs list_projects
```

```
@project-docs register_feature {
  "name": "Authentication",
  "context": "backend",
  "description": "JWT authentication system",
  ...
}
```

```
@project-docs check_existing_documentation {
  "title": "API Documentation",
  "topics": ["api", "rest", "endpoints"]
}
```

### 3. Comandos da Extensão

* **Project Docs: Configure** - Reconfigura o MCP
* **Project Docs: Restart MCP Server** - Reinicia o servidor
* **Project Docs: Open Documentation** - Abre documentação

## 📖 Ferramentas Disponíveis

### Gerenciamento de Documentação

* `check_existing_documentation` - Verifica docs existentes
* `manage_documentation` - Cria/atualiza documentação
* `list_documentation` - Lista documentos

### Contratos e Padrões

* `register_contract` - Registra interface crítica
* `get_contracts` - Lista contratos
* `validate_contract` - Valida implementação
* `learn_pattern` - Registra padrão

### Features e Casos de Uso

* `register_feature` - Registra feature completa
* `get_features` - Lista features
* `get_feature_context` - Contexto completo
* `update_feature` - Atualiza feature

### Decisões Arquiteturais

* `add_decision` - Registra ADR
* `scan_project` - Escaneia código automaticamente

### Contexto e Guidelines

* `identify_context` - Identifica backend/frontend
* `get_guidelines` - Obtém guidelines específicos
* `should_document` - Decide se precisa documentar

### Projetos

* `create_project` - Cria novo projeto
* `list_projects` - Lista projetos
* `switch_project` - Muda projeto ativo

## ⚙️ Configurações

Acesse via `Preferences > Settings > Project Docs MCP` :

* **Auto Start**: Inicia MCP automaticamente (padrão: `true`)
* **Log Level**: Nível de log (`error`,  `warn`,  `info`,  `debug`)
* **Default Project**: Projeto padrão quando nenhum é detectado

## 📚 Documentação Completa

* [Sistema de Gerenciamento de Documentação](../docs/_shared/DOCUMENTATION-MANAGEMENT.md)
* [Guia de Portabilidade](../docs/_shared/PORTABILITY-SETUP.md)
* [Exemplos de Configuração](../docs/_shared/MCP-CONFIG-EXAMPLES.md)
* [Guia de Auto-Aprendizado](../docs/_shared/AUTO-LEARNING.md)

## 🐛 Troubleshooting

### MCP não aparece no Copilot Chat

1. Execute: **Project Docs: Configure**
2. Reinicie VS Code
3. Verifique se Copilot está ativo

### Erro ao instalar

```bash
# Limpe cache e reinstale
rm -rf node_modules
npm install
npm run compile
```

### Logs de Debug

1. Abra: `View > Output`
2. Selecione: "Project Docs MCP"
3. Configure: `Log Level = debug`

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📝 Licença

MIT License - veja [LICENSE](../LICENSE)

## 🔗 Links

* [GitHub Repository](https://github.com/seu-usuario/jarvis-docs-mcp)
* [Issues](https://github.com/seu-usuario/jarvis-docs-mcp/issues)
* [Changelog](../CHANGELOG.md)

---

**Desenvolvido com ❤️ para melhorar a experiência com AI Assistants**
