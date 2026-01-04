# Distribuição Limpa da Extensão

## 🎯 Objetivo

Garantir que a extensão distribuída:
* ✅ **NÃO** inclua seus projetos pessoais (jarvis, automacao-n8n, etc)
* ✅ **INCLUA** apenas estrutura base e exemplos
* ✅ Permita que usuários criem seus próprios projetos
* ✅ Esteja limpa e profissional

## 📦 Estrutura de Distribuição

### O Que É Incluído

```
project-docs-mcp-2.5.0.vsix
├── dist/                          # MCP Server compilado
│   └── index.js
├── docs/
│   ├── _shared/                   # ✅ Docs compartilhados
│   │   ├── AUTO-LEARNING.md
│   │   ├── DOCUMENTATION-MANAGEMENT.md
│   │   ├── PORTABILITY-SETUP.md
│   │   └── ...
│   └── architecture-decisions/    # ✅ Estrutura vazia
├── knowledge/
│   └── example-project/          # ✅ Projeto exemplo vazio
│       ├── contracts.json
│       ├── patterns.json
│       ├── decisions.json
│       ├── features.json
│       └── documentation.json
├── mcp-config.example.json       # ✅ Config exemplo
└── extension/
    └── dist/extension.js         # ✅ Extensão compilada
```

### O Que NÃO É Incluído

```
❌ knowledge/jarvis/               # Seus projetos pessoais
❌ knowledge/automacao-n8n/
❌ knowledge/educate/
❌ docs/jarvis/
❌ docs/automacao-n8n/
❌ mcp-config.json                # Sua config pessoal
❌ .backup-*/                     # Backups
```

## 🚀 Processo de Build Limpo

### Script Automatizado

```bash
./build-extension-clean.sh
```

**O que faz:**

1. 📦 **Backup** - Salva seus projetos em `.backup-TIMESTAMP/`
2. 🧹 **Limpa** - Remove projetos pessoais
3. 📝 **Cria** - Estrutura exemplo vazia
4. 🔨 **Build** - Compila MCP + Extensão
5. 📦 **Package** - Gera `.vsix` limpo

### Resultado

```
✅ extension/project-docs-mcp-2.5.0.vsix  (LIMPO!)
✅ .backup-20260104-143025/                (Seus dados)
```

## 🔄 Restaurar Seus Projetos

Após build limpo:

```bash
# Restaurar do backup mais recente
cp -r .backup-*/jarvis knowledge/
cp -r .backup-*/automacao-n8n knowledge/
cp -r .backup-*/mcp-config.json .

# Rebuild local
npm run build
```

## 📤 Publicação

### Checklist

* [ ] Executou `./build-extension-clean.sh`
* [ ] Verificou que `.vsix` está limpo
* [ ] Backup dos seus projetos foi criado
* [ ] Configurou publisher no `extension/package.json`
* [ ] Criou ícone 128x128 (opcional)

### Publicar

```bash
cd extension
vsce login seu-publisher-id
vsce publish

# Publicado! 🎉
```

### Após Publicação

Restaure seus projetos:

```bash
cd ..
cp -r .backup-<timestamp>/* .
npm run build
```

## 🔒 Proteção no Git

O `.gitignore` já protege:

```gitignore
# Projetos pessoais (não versionar)
knowledge/jarvis/
knowledge/automacao-n8n/
docs/jarvis/
mcp-config.json

# Manter apenas exemplo
!knowledge/example-project/
!mcp-config.example.json
```

## 👥 Experiência do Usuário

Quando alguém instala sua extensão:

```bash
# 1. Instala do marketplace
Extensions > Search "Project Docs MCP" > Install

# 2. Extensão auto-configura MCP

# 3. Usuário cria primeiro projeto
@project-docs create_project {
  "project_id": "meu-projeto",
  "name": "Meu Projeto",
  ...
}

# 4. Estrutura criada automaticamente
knowledge/meu-projeto/
docs/meu-projeto/
```

**Zero conflito com seus projetos!**

## 🐛 Troubleshooting

### Erro: "Projetos aparecendo na distribuição"

```bash
# Verifique .vscodeignore
cat extension/.vscodeignore

# Deve ter:
../knowledge/jarvis/**
../knowledge/automacao-n8n/**
```

### Erro: "Backup não criado"

```bash
# Script cria backup automático
# Localização: .backup-YYYYMMDD-HHMMSS/
ls -la | grep backup
```

### Erro: "Extensão não funciona sem projetos"

**Normal!** Usuários criam próprios projetos:

```bash
@project-docs create_project { ... }
```

## 📊 Comparação

| Aspecto | Build Normal | Build Limpo |
|---------|--------------|-------------|
| Tamanho | ~5MB | ~1MB |
| Projetos | Seus projetos incluídos | Apenas exemplo |
| Privacidade | ❌ Expõe seus dados | ✅ Limpo |
| Profissional | ❌ Bagunçado | ✅ Limpo |
| Publicável | ❌ Não recomendado | ✅ Pronto! |

## 📚 Arquivos Relacionados

* `build-extension.sh` - Build local com seus projetos
* `build-extension-clean.sh` - **Build limpo para distribuição**
* `.gitignore` - Protege projetos pessoais
* `extension/.vscodeignore` - Exclui da extensão
* `mcp-config.example.json` - Config exemplo limpa

## ✅ Checklist Final

Antes de publicar:

* [ ] Executado `build-extension-clean.sh`
* [ ] Verificado conteúdo do `.vsix` (descompactar e conferir)
* [ ] Backup dos projetos pessoais existe
* [ ] `mcp-config.json` não está incluído
* [ ] Apenas `example-project` em knowledge/
* [ ] Docs pessoais não incluídos
* [ ] Testado instalação limpa em outra máquina

---

**🎉 Sua extensão está pronta para o mundo, sem expor seus projetos pessoais!**
