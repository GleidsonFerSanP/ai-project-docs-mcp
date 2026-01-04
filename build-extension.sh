#!/bin/bash

# Build completo do MCP + Extensão VS Code

set -e

echo "🔨 Building Project Docs MCP Extension..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Build MCP Server
echo -e "${BLUE}📦 Step 1: Building MCP Server${NC}"
cd "$(dirname "$0")"
npm install
npm run build
echo -e "${GREEN}✅ MCP Server built successfully${NC}"
echo ""

# 2. Build Extension
echo -e "${BLUE}📦 Step 2: Building VS Code Extension${NC}"
cd extension
npm install
npm run compile
echo -e "${GREEN}✅ Extension compiled successfully${NC}"
echo ""

# 3. Package Extension
echo -e "${BLUE}📦 Step 3: Packaging Extension${NC}"
npm run package
echo -e "${GREEN}✅ Extension packaged successfully${NC}"
echo ""

# 4. Resultado
VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)

if [ -n "$VSIX_FILE" ]; then
    echo -e "${GREEN}🎉 Build completed!${NC}"
    echo ""
    echo "📦 Package created: extension/$VSIX_FILE"
    echo ""
    echo "To install locally:"
    echo "  code --install-extension extension/$VSIX_FILE"
    echo ""
    echo "To publish:"
    echo "  cd extension"
    echo "  vsce login <publisher-id>"
    echo "  vsce publish"
else
    echo "❌ No .vsix file found"
    exit 1
fi
