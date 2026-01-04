#!/bin/bash

# Prepara extensão limpa para distribuição
# Remove projetos pessoais, mantém apenas estrutura base

set -e

echo "🧹 Preparing clean extension for distribution..."
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Diretório base
BASE_DIR="$(dirname "$0")"
cd "$BASE_DIR"

# 1. Criar backup dos projetos pessoais
echo -e "${BLUE}📦 Step 1: Backing up personal projects${NC}"

BACKUP_DIR="../.backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -d "knowledge/jarvis" ]; then
    cp -r knowledge/jarvis "$BACKUP_DIR/"
fi
if [ -d "knowledge/automacao-n8n" ]; then
    cp -r knowledge/automacao-n8n "$BACKUP_DIR/"
fi
if [ -d "knowledge/educate" ]; then
    cp -r knowledge/educate "$BACKUP_DIR/"
fi
if [ -f "mcp-config.json" ]; then
    cp mcp-config.json "$BACKUP_DIR/"
fi

echo -e "${GREEN}✅ Backup created at: $BACKUP_DIR${NC}"
echo ""

# 2. Criar estrutura limpa
echo -e "${BLUE}📦 Step 2: Creating clean structure${NC}"

# Limpar knowledge/ (manter apenas estrutura)
rm -rf knowledge/jarvis knowledge/automacao-n8n knowledge/educate knowledge/jarvis-docs-mcp knowledge/project-docs-mcp

# Criar estrutura de exemplo vazia
mkdir -p knowledge/example-project
cat > knowledge/example-project/contracts.json << 'EOF'
{
  "contracts": {},
  "lastUpdated": "2026-01-04T00:00:00.000Z",
  "version": "1.0.0"
}
EOF

cat > knowledge/example-project/patterns.json << 'EOF'
{
  "patterns": {},
  "lastUpdated": "2026-01-04T00:00:00.000Z",
  "version": "1.0.0"
}
EOF

cat > knowledge/example-project/decisions.json << 'EOF'
{
  "decisions": [],
  "lastUpdated": "2026-01-04T00:00:00.000Z",
  "version": "1.0.0"
}
EOF

cat > knowledge/example-project/features.json << 'EOF'
{
  "features": [],
  "lastUpdated": "2026-01-04T00:00:00.000Z"
}
EOF

cat > knowledge/example-project/documentation.json << 'EOF'
{
  "documentation": {},
  "lastUpdated": "2026-01-04T00:00:00.000Z",
  "version": "1.0.0"
}
EOF

# Limpar docs de projetos específicos
rm -rf docs/jarvis docs/automacao-n8n docs/educate

# Usar config de exemplo
cp mcp-config.example.json mcp-config.json

echo -e "${GREEN}✅ Clean structure created${NC}"
echo ""

# 3. Build do MCP
echo -e "${BLUE}📦 Step 3: Building MCP Server${NC}"
npm install
npm run build
echo -e "${GREEN}✅ MCP Server built${NC}"
echo ""

# 4. Build da extensão
echo -e "${BLUE}📦 Step 4: Building Extension${NC}"
cd extension
npm install
npm run compile
echo -e "${GREEN}✅ Extension compiled${NC}"
echo ""

# 5. Package
echo -e "${BLUE}📦 Step 5: Packaging Extension${NC}"
npm run package
echo -e "${GREEN}✅ Extension packaged${NC}"
echo ""

# 6. Resultado
VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)

if [ -n "$VSIX_FILE" ]; then
    echo -e "${GREEN}🎉 Clean extension ready for distribution!${NC}"
    echo ""
    echo "📦 Package: extension/$VSIX_FILE"
    echo "💾 Backup: $BACKUP_DIR"
    echo ""
    echo -e "${YELLOW}⚠️  To restore your projects:${NC}"
    echo "  cp -r $BACKUP_DIR/* ."
    echo ""
    echo "To publish:"
    echo "  cd extension"
    echo "  vsce login <publisher-id>"
    echo "  vsce publish"
else
    echo "❌ Package creation failed"
    exit 1
fi
