# 🚀 Quick Start - JARVIS MCP

## Instalação Rápida (5 minutos)

### 1. Build do MCP

```bash
cd /Users/gleidsonfersanp/workspace/AI/jarvis-docs-mcp
npm install
npm run build
```

✅ Pronto! MCP compilado em `dist/`

### 2. Configurar no GitHub Copilot

**Abrir settings do VS Code:**
* Mac: `Cmd + ,`
* Windows: `Ctrl + ,`

**Buscar por:** `settings.json`

**Adicionar:**

```json
{
  "github.copilot.advanced": {
    "mcp": {
      "servers": {
        "jarvis-docs": {
          "command": "node",
          "args": [
            "/Users/gleidsonfersanp/workspace/AI/jarvis-docs-mcp/dist/index.js"
          ]
        }
      }
    }
  }
}
```

**⚠️ IMPORTANTE:** Ajuste o caminho acima para o caminho ABSOLUTO no seu sistema!

### 3. Reiniciar VS Code

Feche e abra novamente o VS Code para carregar o MCP.

### 4. Testar

Abra qualquer arquivo do projeto JARVIS e pergunte:

```
"Identifique o contexto deste projeto"
```

Você verá:

```
🔧 Você está trabalhando no BACKEND do projeto JARVIS (NestJS)
```

ou

```
🎨 Você está trabalhando no FRONTEND do projeto JARVIS (Angular)
```

---

## 🧠 Primeiro Uso - Ensinando o MCP

### Passo 1: Escanear Projeto

```
"Escanei o projeto backend em /caminho/completo/do/seu/projeto/backend"
```

### Passo 2: Registrar Contratos Críticos

Se você tem uma interface importante (ex: `ISolutionAdapter` ):

```
"Registre a interface ISolutionAdapter como um contrato crítico. 
Ela está em src/core/interfaces/solution-adapter.interface.ts e 
TODAS as soluções devem implementá-la."
```

### Passo 3: Pronto!

Agora desenvolva normalmente. O agent:
* ✅ Identifica automaticamente backend/frontend
* ✅ Aplica guidelines corretos
* ✅ Respeita contratos registrados
* ✅ Não esquece mais padrões importantes

---

## 📚 Próximos Passos

* **[Guia Completo de Auto-Aprendizado](AUTO-LEARNING.md)**
* **[Exemplo: Primeiro Contrato](contracts/EXAMPLE.md)**
* **[Project Overview](project-overview.md)**

---

## 🐛 Troubleshooting

### MCP não está funcionando

1. **Verificar build:**

```bash
cd /Users/gleidsonfersanp/workspace/AI/jarvis-docs-mcp
ls dist/  # Deve ter index.js
```

2. **Verificar caminho no settings.json:**
   - Deve ser caminho ABSOLUTO
   - Deve apontar para `dist/index.js`

3. **Reiniciar VS Code completamente**

### Agent não respeita contratos

```
"Liste todos os contratos registrados"
```

Se lista vazia:

```
"Registre [nome da interface] como contrato crítico"
```

### Mudei documentação mas agent não vê

```bash
npm run build  # Rebuild
```

Reinicie VS Code.

---

## 💡 Comandos Úteis

```bash
# Rebuild após mudanças
npm run build

# Watch mode (auto-rebuild)
npm run dev

# Testar MCP localmente
npm start
```

---

## ✨ Features Principais

| Feature | Descrição |
|---------|-----------|
| 🎯 **Context Awareness** | Identifica automaticamente backend/frontend |
| 📚 **Guidelines** | SOLID, Clean Architecture sempre presentes |
| 🧠 **Contract Registry** | Registra interfaces críticas |
| ✅ **Validation** | Valida implementações contra contratos |
| 📝 **Smart Documentation** | Só documenta o necessário |
| 🔍 **Project Scanning** | Analisa código automaticamente |
| 💾 **Persistent Memory** | Conhecimento persiste entre sessões |

---

**Pronto para começar! 🚀**

Qualquer dúvida: [README.md](../README.md) | [AUTO-LEARNING.md](AUTO-LEARNING.md)
