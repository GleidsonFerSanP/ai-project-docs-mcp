import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
} from "fs";
import { join, extname, dirname } from "path";
export class KnowledgeBase {
  baseDir;
  projectDir;
  globalDir;
  contractsPath;
  patternsPath;
  decisionsPath;
  featuresPath;
  documentationPath;
  globalGuidelinesPath;
  constructor(knowledgeDir, projectId = "default") {
    this.baseDir = knowledgeDir;
    this.projectDir = join(knowledgeDir, projectId);
    this.globalDir = join(knowledgeDir, "global");
    this.contractsPath = join(this.projectDir, "contracts.json");
    this.patternsPath = join(this.projectDir, "patterns.json");
    this.decisionsPath = join(this.projectDir, "decisions.json");
    this.featuresPath = join(this.projectDir, "features.json");
    this.documentationPath = join(this.projectDir, "documentation.json");
    this.globalGuidelinesPath = join(this.globalDir, "guidelines.json");
    this.documentationPath = join(this.projectDir, "documentation.json");
  }
  /**
   * Cria nova instância para projeto específico
   */
  forProject(projectId) {
    return new KnowledgeBase(this.baseDir, projectId);
  }
  // ===== CONTRACTS =====
  loadContracts() {
    try {
      const data = readFileSync(this.contractsPath, "utf-8");
      return JSON.parse(data).contracts || {};
    } catch {
      return {};
    }
  }
  saveContracts(contracts) {
    const data = {
      contracts,
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
    };
    writeFileSync(this.contractsPath, JSON.stringify(data, null, 2));
  }
  registerContract(contract) {
    const contracts = this.loadContracts();
    const id = this.generateId(contract.name);
    const newContract = {
      ...contract,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    contracts[id] = newContract;
    this.saveContracts(contracts);
    return newContract;
  }
  getContract(id) {
    const contracts = this.loadContracts();
    return contracts[id] || null;
  }
  getAllContracts(context) {
    const contracts = this.loadContracts();
    const all = Object.values(contracts);
    if (context) {
      return all.filter((c) => c.context === context);
    }
    return all;
  }
  searchContracts(query) {
    const contracts = this.getAllContracts();
    const lowerQuery = query.toLowerCase();
    return contracts.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery) ||
        c.interfaceCode.toLowerCase().includes(lowerQuery)
    );
  }
  // ===== PATTERNS =====
  loadPatterns() {
    try {
      const data = readFileSync(this.patternsPath, "utf-8");
      return JSON.parse(data).patterns || {};
    } catch {
      return {};
    }
  }
  savePatterns(patterns) {
    const data = {
      patterns,
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
    };
    writeFileSync(this.patternsPath, JSON.stringify(data, null, 2));
  }
  learnPattern(pattern) {
    const patterns = this.loadPatterns();
    const id = this.generateId(pattern.name);
    const existingPattern = patterns[id];
    if (existingPattern) {
      // Update occurrences and examples
      existingPattern.occurrences += 1;
      existingPattern.examples = [
        ...new Set([...existingPattern.examples, ...pattern.examples]),
      ].slice(0, 10); // Keep max 10 examples
      patterns[id] = existingPattern;
    } else {
      const newPattern = {
        ...pattern,
        id,
        createdAt: new Date(),
      };
      patterns[id] = newPattern;
    }
    this.savePatterns(patterns);
    return patterns[id];
  }
  getAllPatterns(context) {
    const patterns = this.loadPatterns();
    const all = Object.values(patterns);
    if (context) {
      return all.filter((p) => p.context === context);
    }
    return all;
  }
  // ===== DECISIONS =====
  loadDecisions() {
    try {
      const data = readFileSync(this.decisionsPath, "utf-8");
      return JSON.parse(data).decisions || [];
    } catch {
      return [];
    }
  }
  saveDecisions(decisions) {
    const data = {
      decisions,
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
    };
    writeFileSync(this.decisionsPath, JSON.stringify(data, null, 2));
  }
  addDecision(decision) {
    const decisions = this.loadDecisions();
    const id = `ADR-${String(decisions.length + 1).padStart(3, "0")}`;
    const newDecision = {
      ...decision,
      id,
      createdAt: new Date(),
    };
    decisions.push(newDecision);
    this.saveDecisions(decisions);
    return newDecision;
  }
  getAllDecisions() {
    return this.loadDecisions();
  }
  // ===== CODE ANALYSIS =====
  scanDirectory(projectPath, context) {
    const results = {
      interfaces: [],
      classes: [],
      files: [],
    };
    const extensions = [".ts", ".tsx", ".js", ".jsx"];
    const walkDir = (dir) => {
      try {
        const files = readdirSync(dir);
        for (const file of files) {
          const filePath = join(dir, file);
          try {
            const stat = statSync(filePath);
            if (stat.isDirectory()) {
              // Skip node_modules, dist, etc.
              if (
                !file.startsWith(".") &&
                file !== "node_modules" &&
                file !== "dist"
              ) {
                walkDir(filePath);
              }
            } else if (extensions.includes(extname(file))) {
              results.files.push(filePath);
              const content = readFileSync(filePath, "utf-8");
              // Extract interfaces
              const interfaceMatches = content.matchAll(
                /(?:export\s+)?interface\s+(\w+)/g
              );
              for (const match of interfaceMatches) {
                results.interfaces.push(match[1]);
              }
              // Extract classes
              const classMatches = content.matchAll(
                /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g
              );
              for (const match of classMatches) {
                results.classes.push(match[1]);
              }
            }
          } catch (error) {
            // Skip files we can't read
            continue;
          }
        }
      } catch (error) {
        // Skip directories we can't access
        return;
      }
    };
    walkDir(projectPath);
    return results;
  }
  extractInterfaceDetails(filePath, interfaceName) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const regex = new RegExp(
        `(?:export\\s+)?interface\\s+${interfaceName}\\s*{[^}]*}`,
        "s"
      );
      const match = content.match(regex);
      return match ? match[0] : null;
    } catch {
      return null;
    }
  }
  // ===== UTILITIES =====
  generateId(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  validateContract(code, contractId) {
    const contract = this.getContract(contractId);
    if (!contract) {
      return {
        valid: false,
        violations: ["Contract not found"],
      };
    }
    const violations = [];
    // Check if interface is implemented
    const implementsRegex = new RegExp(`implements\\s+${contract.name}`);
    if (!implementsRegex.test(code)) {
      violations.push(`Does not implement ${contract.name} interface`);
    }
    // Check rules (basic validation)
    for (const rule of contract.rules) {
      // Extract method names from rules (e.g., "must have execute()")
      const methodMatch = rule.match(/(\w+)\(\)/);
      if (methodMatch) {
        const methodName = methodMatch[1];
        const methodRegex = new RegExp(`${methodName}\\s*\\(`);
        if (!methodRegex.test(code)) {
          violations.push(`Missing required method: ${methodName}()`);
        }
      }
    }
    return {
      valid: violations.length === 0,
      violations,
    };
  }
  // ==================== FEATURES ====================
  /**
   * Registra uma nova feature
   */
  registerFeature(feature) {
    const data = this.loadFeatures();
    const newFeature = {
      id: `feat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...feature,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    data.features.push(newFeature);
    this.saveFeatures(data);
    return newFeature;
  }
  /**
   * Lista todas as features
   */
  getAllFeatures(filter) {
    const data = this.loadFeatures();
    let features = data.features;
    if (filter?.context) {
      features = features.filter((f) => f.context === filter.context);
    }
    if (filter?.status) {
      features = features.filter((f) => f.status === filter.status);
    }
    if (filter?.tags && filter.tags.length > 0) {
      features = features.filter((f) =>
        filter.tags.some((tag) => f.tags.includes(tag))
      );
    }
    return features;
  }
  /**
   * Busca feature por nome ou descrição
   */
  searchFeatures(query) {
    const data = this.loadFeatures();
    const lowerQuery = query.toLowerCase();
    return data.features.filter(
      (f) =>
        f.name.toLowerCase().includes(lowerQuery) ||
        f.description.toLowerCase().includes(lowerQuery) ||
        f.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  }
  /**
   * Busca feature por ID
   */
  getFeatureById(id) {
    const data = this.loadFeatures();
    return data.features.find((f) => f.id === id) || null;
  }
  /**
   * Atualiza status de uma feature
   */
  updateFeatureStatus(id, status) {
    const data = this.loadFeatures();
    const feature = data.features.find((f) => f.id === id);
    if (!feature) return null;
    feature.status = status;
    feature.updatedAt = new Date();
    this.saveFeatures(data);
    return feature;
  }
  /**
   * Atualiza feature completa
   */
  updateFeature(id, updates) {
    const data = this.loadFeatures();
    const feature = data.features.find((f) => f.id === id);
    if (!feature) return null;
    Object.assign(feature, updates, { updatedAt: new Date() });
    this.saveFeatures(data);
    return feature;
  }
  /**
   * Busca contexto completo de uma feature (feature + contratos + padrões relacionados)
   */
  getFeatureContext(featureId) {
    const feature = this.getFeatureById(featureId);
    if (!feature) {
      return {
        feature: null,
        relatedContracts: [],
        relatedPatterns: [],
      };
    }
    const contractsData = this.loadContracts();
    const patternsData = this.loadPatterns();
    const relatedContracts = Object.values(contractsData).filter(
      (c) =>
        feature.relatedContracts.includes(c.id) ||
        feature.relatedContracts.includes(c.name)
    );
    const relatedPatterns = Object.values(patternsData).filter(
      (p) =>
        feature.relatedPatterns.includes(p.id) ||
        feature.relatedPatterns.includes(p.name)
    );
    return {
      feature,
      relatedContracts,
      relatedPatterns,
    };
  }
  loadFeatures() {
    try {
      const data = readFileSync(this.featuresPath, "utf-8");
      return JSON.parse(data);
    } catch {
      return { features: [] };
    }
  }
  saveFeatures(data) {
    writeFileSync(this.featuresPath, JSON.stringify(data, null, 2), "utf-8");
  }
  // ===== DOCUMENTATION MANAGEMENT =====
  loadDocumentation() {
    try {
      const data = readFileSync(this.documentationPath, "utf-8");
      return JSON.parse(data).documentation || {};
    } catch {
      return {};
    }
  }
  saveDocumentation(documentation) {
    const data = {
      documentation,
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
    };
    writeFileSync(this.documentationPath, JSON.stringify(data, null, 2));
  }
  /**
   * Registra um novo documento de documentação
   */
  registerDocument(doc) {
    const documentation = this.loadDocumentation();
    const id = this.generateId(doc.title);
    const newDoc = {
      ...doc,
      id,
      createdAt: new Date(),
      lastUpdated: new Date(),
      version: 1,
    };
    documentation[id] = newDoc;
    this.saveDocumentation(documentation);
    return newDoc;
  }
  /**
   * Atualiza um documento existente
   */
  updateDocument(id, updates) {
    const documentation = this.loadDocumentation();
    const doc = documentation[id];
    if (!doc) return null;
    const updatedDoc = {
      ...doc,
      ...updates,
      lastUpdated: new Date(),
      version: doc.version + 1,
    };
    documentation[id] = updatedDoc;
    this.saveDocumentation(documentation);
    return updatedDoc;
  }
  /**
   * Lista todos os documentos, opcionalmente filtrados
   */
  listDocuments(filters) {
    const documentation = this.loadDocumentation();
    let docs = Object.values(documentation);
    if (filters?.context) {
      docs = docs.filter((d) => d.context === filters.context);
    }
    if (filters?.type) {
      docs = docs.filter((d) => d.type === filters.type);
    }
    if (filters?.keywords && filters.keywords.length > 0) {
      docs = docs.filter((d) =>
        filters.keywords.some(
          (kw) =>
            d.keywords.some((docKw) =>
              docKw.toLowerCase().includes(kw.toLowerCase())
            ) ||
            d.topics.some((topic) =>
              topic.toLowerCase().includes(kw.toLowerCase())
            ) ||
            d.title.toLowerCase().includes(kw.toLowerCase())
        )
      );
    }
    return docs.sort(
      (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
    );
  }
  /**
   * Busca documentos similares baseado em título, tópicos e keywords
   * Retorna documentos ordenados por relevância
   */
  findSimilarDocuments(title, topics = [], keywords = []) {
    const documentation = this.loadDocumentation();
    const docs = Object.values(documentation);
    const results = docs.map((doc) => {
      let score = 0;
      const titleLower = title.toLowerCase();
      const docTitleLower = doc.title.toLowerCase();
      // Título exato ou muito similar
      if (docTitleLower === titleLower) {
        score += 100;
      } else if (
        docTitleLower.includes(titleLower) ||
        titleLower.includes(docTitleLower)
      ) {
        score += 50;
      }
      // Palavras do título que aparecem
      const titleWords = titleLower.split(/\s+/).filter((w) => w.length > 3);
      const docTitleWords = docTitleLower
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const commonTitleWords = titleWords.filter((w) =>
        docTitleWords.some((dw) => dw.includes(w) || w.includes(dw))
      );
      score += commonTitleWords.length * 10;
      // Tópicos em comum
      const commonTopics = topics.filter((t) =>
        doc.topics.some(
          (dt) =>
            dt.toLowerCase().includes(t.toLowerCase()) ||
            t.toLowerCase().includes(dt.toLowerCase())
        )
      );
      score += commonTopics.length * 20;
      // Keywords em comum
      const commonKeywords = keywords.filter((k) =>
        doc.keywords.some(
          (dk) =>
            dk.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(dk.toLowerCase())
        )
      );
      score += commonKeywords.length * 15;
      return { document: doc, similarity: score };
    });
    return results
      .filter((r) => r.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity);
  }
  /**
   * Obtém documento por ID
   */
  getDocumentById(id) {
    const documentation = this.loadDocumentation();
    return documentation[id] || null;
  }
  /**
   * Obtém documento por caminho do arquivo
   */
  getDocumentByPath(filePath) {
    const documentation = this.loadDocumentation();
    return (
      Object.values(documentation).find((d) => d.filePath === filePath) || null
    );
  }
  // ==================== GLOBAL GUIDELINES ====================
  loadGlobalGuidelines() {
    if (!existsSync(this.globalGuidelinesPath)) {
      const dir = dirname(this.globalGuidelinesPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.globalGuidelinesPath, JSON.stringify({}, null, 2));
      return {};
    }
    const data = readFileSync(this.globalGuidelinesPath, "utf-8");
    return JSON.parse(data);
  }
  saveGlobalGuidelines(guidelines) {
    writeFileSync(
      this.globalGuidelinesPath,
      JSON.stringify(guidelines, null, 2)
    );
  }
  /**
   * Define ou atualiza uma guideline global
   */
  setGlobalGuideline(guideline) {
    const guidelines = this.loadGlobalGuidelines();
    // Verificar se já existe guideline similar para evitar duplicação
    const existing = Object.values(guidelines).find(
      (g) =>
        g.title.toLowerCase() === guideline.title.toLowerCase() &&
        g.category === guideline.category
    );
    if (existing) {
      // Update existente
      existing.content = guideline.content;
      existing.context = guideline.context;
      existing.principles = guideline.principles;
      existing.rules = guideline.rules;
      existing.examples = guideline.examples;
      existing.priority = guideline.priority;
      existing.applyToAllProjects = guideline.applyToAllProjects;
      existing.updatedAt = new Date();
      guidelines[existing.id] = existing;
      this.saveGlobalGuidelines(guidelines);
      return existing;
    }
    // Criar novo
    const newGuideline = {
      id: Date.now().toString(),
      ...guideline,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    guidelines[newGuideline.id] = newGuideline;
    this.saveGlobalGuidelines(guidelines);
    return newGuideline;
  }
  /**
   * Lista todas as guidelines globais
   */
  getGlobalGuidelines(filters) {
    const guidelines = this.loadGlobalGuidelines();
    let result = Object.values(guidelines);
    if (filters) {
      if (filters.category) {
        result = result.filter((g) => g.category === filters.category);
      }
      if (filters.context) {
        result = result.filter(
          (g) =>
            !g.context || g.context === filters.context || g.context === "all"
        );
      }
      if (filters.priority) {
        result = result.filter((g) => g.priority === filters.priority);
      }
      if (filters.applyToAllProjects !== undefined) {
        result = result.filter(
          (g) => g.applyToAllProjects === filters.applyToAllProjects
        );
      }
    }
    return result.sort((a, b) => {
      // Ordenar por prioridade: mandatory > recommended > optional
      const priorityOrder = { mandatory: 0, recommended: 1, optional: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  /**
   * Remove uma guideline global
   */
  removeGlobalGuideline(id) {
    const guidelines = this.loadGlobalGuidelines();
    if (guidelines[id]) {
      delete guidelines[id];
      this.saveGlobalGuidelines(guidelines);
      return true;
    }
    return false;
  }
  /**
   * Obtém guidelines mescladas (global + project-specific)
   * Guidelines globais são aplicadas primeiro, depois project-specific sobrescreve se houver conflito
   */
  getMergedGuidelines(context) {
    const globalGuidelines = this.getGlobalGuidelines({
      context: context,
      applyToAllProjects: true,
    });
    // Formatar para texto legível
    let merged = "";
    if (globalGuidelines.length > 0) {
      merged += "# Global Guidelines\n\n";
      const byCategory = globalGuidelines.reduce((acc, g) => {
        if (!acc[g.category]) acc[g.category] = [];
        acc[g.category].push(g);
        return acc;
      }, {});
      for (const [category, guidelines] of Object.entries(byCategory)) {
        merged += `## ${category.toUpperCase()}\n\n`;
        for (const g of guidelines) {
          merged += `### ${g.title} (${g.priority})\n`;
          merged += `${g.content}\n\n`;
          if (g.principles && g.principles.length > 0) {
            merged += `**Principles:** ${g.principles.join(", ")}\n\n`;
          }
          if (g.rules && g.rules.length > 0) {
            merged += `**Rules:**\n`;
            g.rules.forEach((r) => (merged += `- ${r}\n`));
            merged += "\n";
          }
          if (g.examples && g.examples.length > 0) {
            merged += `**Examples:**\n`;
            g.examples.forEach((e) => (merged += `\`\`\`\n${e}\n\`\`\`\n`));
            merged += "\n";
          }
        }
      }
    }
    return {
      global: globalGuidelines,
      projectSpecific: [], // TODO: Implementar guidelines específicas do projeto se necessário
      merged,
    };
  }
}
