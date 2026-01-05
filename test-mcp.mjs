#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, "extension/mcp-server/index.js");

const server = spawn("node", [serverPath], {
  stdio: ["pipe", "pipe", "inherit"],
});

let messageId = 1;

function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: "2.0",
    id: messageId++,
    method,
    params,
  };
  server.stdin.write(JSON.stringify(request) + "\n");
}

let buffer = "";

server.stdout.on("data", (data) => {
  buffer += data.toString();
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log("Response:", JSON.stringify(response, null, 2));
      } catch (e) {
        console.log("Raw output:", line);
      }
    }
  }
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

// Initialize
setTimeout(() => {
  console.log("=== Initializing ===");
  sendRequest("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
  });
}, 100);

// Test set_global_guideline after initialization
setTimeout(() => {
  console.log("\n=== Testing set_global_guideline ===");
  sendRequest("tools/call", {
    name: "set_global_guideline",
    arguments: {
      title: "Princípios SOLID",
      category: "architecture",
      content: "Todos os projetos devem seguir SOLID",
      context: "all",
      priority: "mandatory",
      applyToAllProjects: true,
      principles: ["Single Responsibility", "Open/Closed"],
      rules: ["Cada classe deve ter apenas uma razão para mudar"],
      examples: ["// SRP: Separar lógica de negócio"],
    },
  });
}, 2000);

// Test get_global_guidelines
setTimeout(() => {
  console.log("\n=== Testing get_global_guidelines ===");
  sendRequest("tools/call", {
    name: "get_global_guidelines",
    arguments: {},
  });
}, 3000);

// Test list projects
setTimeout(() => {
  console.log("\n=== Testing list_projects ===");
  sendRequest("tools/call", {
    name: "list_projects",
    arguments: {},
  });
}, 4000);

// Test create_project
setTimeout(() => {
  console.log("\n=== Testing create_project ===");
  sendRequest("tools/call", {
    name: "create_project",
    arguments: {
      project_id: "ai-project-docs-mcp",
      name: "AI Project Docs MCP",
      description: "MCP server for managing project documentation",
      paths: ["/Users/gleidsonfersanp/workspace/AI/ai-project-docs-mcp"],
      stack: {
        backend: "Node.js + TypeScript",
        mcp: "@modelcontextprotocol/sdk",
      },
      principles: ["SOLID", "DRY", "Clean Architecture"],
    },
  });
}, 5000);
