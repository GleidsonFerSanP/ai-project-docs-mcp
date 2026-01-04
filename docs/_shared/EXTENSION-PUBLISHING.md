# Guia de Publicação da Extensão VS Code

## 📦 Pré-requisitos

### 1. Conta Azure DevOps / Visual Studio Marketplace

1. Acesse: https://marketplace.visualstudio.com/manage
2. Crie uma conta se não tiver
3. Crie um **Publisher** (ID único, ex: `seu-nome`)

### 2. Personal Access Token (PAT)

1. Vá para: https://dev.azure.com
2. Clique no ícone de usuário > **Personal Access Tokens**
3. **New Token** com:
   - **Name**: `vscode-marketplace`

   - **Organization**: All accessible organizations
   - **Scopes**: **Marketplace** > **Manage**
4. Copie o token gerado!

### 3. Instalar VSCE

```bash
npm install -g @vscode/vsce
```

## 🚀 Processo de Publicação

### Passo 1: Prepare o Código

```bash
cd /Users/gleidsonfersanp/workspace/AI/jarvis-docs-mcp

# Build do MCP server principal
npm install
npm run build

# Build da extensão
cd extension
npm install
npm run compile
```

### Passo 2: Atualize Informações

Edite `extension/package.json` :

```json
{
  "publisher": "seu-publisher-id",  // ← SEU PUBLISHER ID
  "repository": {
    "type": "git",
    "url": "https://github.com/seu-usuario/jarvis-docs-mcp.git"
  }
}
```

### Passo 3: Crie Ícone (Opcional mas Recomendado)

Crie `extension/icon.png` :
* Tamanho: 128x128 pixels
* Formato: PNG
* Conteúdo: Logo do projeto

### Passo 4: Gere o Pacote

```bash
cd extension

# Gerar .vsix (pacote da extensão)
vsce package

# Resultado: project-docs-mcp-2.4.0.vsix
```

### Passo 5: Teste Localmente

```bash
# Instalar no VS Code local
code --install-extension project-docs-mcp-2.4.0.vsix

# Testar:
# 1. Abra VS Code
# 2. Vá para Extensions
# 3. Procure "Project Docs MCP"
# 4. Verifique se aparece e funciona
```

### Passo 6: Publique no Marketplace

```bash
# Login com PAT
vsce login seu-publisher-id
# Cole o Personal Access Token quando solicitado

# Publicar
vsce publish

# Ou publicar uma versão específica
vsce publish 2.4.0

# Ou publicar major/minor/patch
vsce publish minor  # 2.4.0 → 2.5.0
```

## 📝 Publicação Manual (Alternativa)

Se preferir publicar manualmente:

1. Acesse: https://marketplace.visualstudio.com/manage
2. Clique no seu **Publisher**
3. **New Extension** > **Visual Studio Code**
4. Arraste o arquivo `.vsix`
5. Preencha informações adicionais
6. **Upload**

## 🔄 Atualizar Extensão

```bash
# Incrementar versão
npm version patch  # 2.4.0 → 2.4.1
npm version minor  # 2.4.0 → 2.5.0
npm version major  # 2.4.0 → 3.0.0

# Rebuild
npm run compile

# Republicar
vsce publish
```

## 📊 Estrutura Final da Extensão

```
jarvis-docs-mcp/
├── dist/                     # MCP server compilado
│   └── index.js
├── docs/                     # Documentação
├── knowledge/                # Knowledge base
├── extension/
│   ├── dist/                # Extensão compilada
│   │   └── extension.js
│   ├── src/
│   │   └── extension.ts    # Código da extensão
│   ├── package.json         # Manifesto da extensão
│   ├── README.md
│   ├── icon.png            # Ícone 128x128
│   ├── .vscodeignore
│   └── tsconfig.json
└── project-docs-mcp-2.4.0.vsix  # Pacote gerado
```

## 🎨 Melhorias para o Marketplace

### 1. Screenshots

Crie `extension/screenshots/` :
* `screenshot1.png` - Copilot Chat usando MCP
* `screenshot2.png` - Comandos da extensão
* `screenshot3.png` - Configurações

Adicione no `README.md` :

```markdown

## Screenshots

![Using in Copilot Chat](screenshots/screenshot1.png)

![Extension Commands](screenshots/screenshot2.png)

```

### 2. Badges

Adicione no `README.md` :

```markdown
[![Version](https://img.shields.io/visual-studio-marketplace/v/seu-publisher.project-docs-mcp)](https://marketplace.visualstudio.com/items?itemName=seu-publisher.project-docs-mcp)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/seu-publisher.project-docs-mcp)](https://marketplace.visualstudio.com/items?itemName=seu-publisher.project-docs-mcp)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/seu-publisher.project-docs-mcp)](https://marketplace.visualstudio.com/items?itemName=seu-publisher.project-docs-mcp)
```

### 3. CHANGELOG.md

Crie `extension/CHANGELOG.md` :

```markdown
# Change Log

## [2.4.0] - 2026-01-04

### Added

- Auto-configuração do MCP no Copilot Chat
- Comandos da extensão (configure, restart, viewDocs)
- Suporte a variáveis de ambiente
- Prevenção automática de duplicação

### Fixed

- Path duplicado em projetos
- Portabilidade entre máquinas

## [2.3.0] - 2026-01-03

...
```

### 4. LICENSE

Crie `extension/LICENSE` :

```
MIT License

Copyright (c) 2026 Seu Nome

Permission is hereby granted...
```

## 🐛 Troubleshooting

### Erro: "Missing publisher name"

```bash
# Adicione publisher no package.json
{
  "publisher": "seu-publisher-id"
}
```

### Erro: "Authentication failed"

```bash
# Refaça login
vsce login seu-publisher-id
# Cole novo PAT
```

### Erro: "Icon must be 128x128"

```bash
# Redimensione o ícone
# macOS/Linux:
convert icon.png -resize 128x128 icon.png

# Ou use ferramenta online
```

## ✅ Checklist Final

Antes de publicar:

* [ ] `publisher` configurado no `package.json`
* [ ] Repository URL atualizada
* [ ] Ícone 128x128 criado (`icon.png`)
* [ ] README com screenshots e badges
* [ ] CHANGELOG atualizado
* [ ] LICENSE incluída
* [ ] Testado localmente com `.vsix`
* [ ] Versão correta no `package.json`
* [ ] Build do MCP e extensão executados
* [ ] Personal Access Token válido

## 🎉 Pós-Publicação

Após publicar:

1. **Verifique no Marketplace**
   - https://marketplace.visualstudio.com/items?itemName=seu-publisher.project-docs-mcp

2. **Teste Instalação**
   

```bash
   # Desinstale versão local
   code --uninstall-extension seu-publisher.project-docs-mcp
   
   # Instale do marketplace
   # Extensions > Search "Project Docs MCP" > Install
   ```

3. **Promova**
   - Compartilhe no Twitter/LinkedIn
   - Adicione no README do projeto
   - Faça anúncio no Discord/Slack da comunidade

4. **Monitore**
   - Acompanhe ratings/reviews
   - Responda issues no GitHub
   - Atualize regularmente

## 📚 Recursos

* [VS Code Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
* [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
* [Marketplace](https://marketplace.visualstudio.com/vscode)

---

**🚀 Boa sorte com a publicação!**
