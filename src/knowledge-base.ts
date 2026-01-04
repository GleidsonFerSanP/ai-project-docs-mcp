import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface Contract {
  id: string;
  name: string;
  context: 'backend' | 'frontend' | 'shared' | 'infrastructure';
  description: string;
  interfaceCode: string;
  rules: string[];
  examples?: string[];
  filePath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pattern {
  id: string;
  name: string;
  context: 'backend' | 'frontend' | 'shared' | 'infrastructure';
  description: string;
  pattern: string;
  occurrences: number;
  examples: string[];
  createdAt: Date;
}

export interface ArchitecturalDecision {
  id: string;
  title: string;
  context: string;
  decision: string;
  consequences: {
    positive: string[];
    negative: string[];
  };
  alternatives?: string[];
  status: 'proposed' | 'accepted' | 'rejected' | 'deprecated';
  createdAt: Date;
}

export interface DocumentationEntry {
  id: string;
  title: string;
  filePath: string; // Caminho relativo do .md no projeto
  topics: string[]; // Tópicos principais do documento
  keywords: string[]; // Palavras-chave para busca
  summary: string; // Resumo do conteúdo
  context: 'backend' | 'frontend' | 'infrastructure' | 'shared' | 'general';
  type: 'architecture' | 'api' | 'guide' | 'troubleshooting' | 'setup' | 'business-flow' | 'other';
  relatedContracts?: string[]; // Contratos mencionados
  relatedFeatures?: string[]; // Features mencionadas
  lastUpdated: Date;
  createdAt: Date;
  version: number; // Contador de atualizações
}

export interface Feature {
  id: string;
  name: string;
  context: 'backend' | 'frontend' | 'shared' | 'infrastructure' | 'fullstack';
  description: string;
  businessRules: string[];
  useCases: Array<{
    name: string;
    description: string;
    steps: string[];
  }>;
  relatedContracts: string[]; // IDs de contratos relacionados
  relatedPatterns: string[]; // IDs de padrões relacionados
  dependencies: string[]; // Outras features ou serviços necessários
  apiEndpoints?: Array<{
    method: string;
    path: string;
    description: string;
  }>;
  status: 'planned' | 'in-progress' | 'completed' | 'deprecated';
  tags: string[];
  notes?: string;
  filePaths?: string[]; // Arquivos relacionados
  createdAt: Date;
  updatedAt: Date;
}

export class KnowledgeBase {
  private baseDir: string;
  private projectDir: string;
  private contractsPath: string;
  private patternsPath: string;
  private decisionsPath: string;
  private featuresPath: string;
  private documentationPath: string;

  constructor(knowledgeDir: string, projectId: string = 'default') {
    this.baseDir = knowledgeDir;
    this.projectDir = join(knowledgeDir, projectId);
    this.contractsPath = join(this.projectDir, 'contracts.json');
    this.patternsPath = join(this.projectDir, 'patterns.json');
    this.decisionsPath = join(this.projectDir, 'decisions.json');
    this.featuresPath = join(this.projectDir, 'features.json');
    this.documentationPath = join(this.projectDir, 'documentation.json');
  }

  /**
   * Cria nova instância para projeto específico
   */
  forProject(projectId: string): KnowledgeBase {
    return new KnowledgeBase(this.baseDir, projectId);
  }

  // ===== CONTRACTS =====

  loadContracts(): Record<string, Contract> {
    try {
      const data = readFileSync(this.contractsPath, 'utf-8');
      return JSON.parse(data).contracts || {};
    } catch {
      return {};
    }
  }

  saveContracts(contracts: Record<string, Contract>): void {
    const data = {
      contracts,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };
    writeFileSync(this.contractsPath, JSON.stringify(data, null, 2));
  }

  registerContract(contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Contract {
    const contracts = this.loadContracts();
    const id = this.generateId(contract.name);

    const newContract: Contract = {
      ...contract,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    contracts[id] = newContract;
    this.saveContracts(contracts);

    return newContract;
  }

  getContract(id: string): Contract | null {
    const contracts = this.loadContracts();
    return contracts[id] || null;
  }

  getAllContracts(context?: 'backend' | 'frontend' | 'shared' | 'infrastructure'): Contract[] {
    const contracts = this.loadContracts();
    const all = Object.values(contracts);

    if (context) {
      return all.filter((c) => c.context === context);
    }

    return all;
  }

  searchContracts(query: string): Contract[] {
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

  loadPatterns(): Record<string, Pattern> {
    try {
      const data = readFileSync(this.patternsPath, 'utf-8');
      return JSON.parse(data).patterns || {};
    } catch {
      return {};
    }
  }

  savePatterns(patterns: Record<string, Pattern>): void {
    const data = {
      patterns,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };
    writeFileSync(this.patternsPath, JSON.stringify(data, null, 2));
  }

  learnPattern(pattern: Omit<Pattern, 'id' | 'createdAt'>): Pattern {
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
      const newPattern: Pattern = {
        ...pattern,
        id,
        createdAt: new Date(),
      };
      patterns[id] = newPattern;
    }

    this.savePatterns(patterns);
    return patterns[id];
  }

  getAllPatterns(context?: 'backend' | 'frontend' | 'shared'): Pattern[] {
    const patterns = this.loadPatterns();
    const all = Object.values(patterns);

    if (context) {
      return all.filter((p) => p.context === context);
    }

    return all;
  }

  // ===== DECISIONS =====

  loadDecisions(): ArchitecturalDecision[] {
    try {
      const data = readFileSync(this.decisionsPath, 'utf-8');
      return JSON.parse(data).decisions || [];
    } catch {
      return [];
    }
  }

  saveDecisions(decisions: ArchitecturalDecision[]): void {
    const data = {
      decisions,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };
    writeFileSync(this.decisionsPath, JSON.stringify(data, null, 2));
  }

  addDecision(
    decision: Omit<ArchitecturalDecision, 'id' | 'createdAt'>
  ): ArchitecturalDecision {
    const decisions = this.loadDecisions();
    const id = `ADR-${String(decisions.length + 1).padStart(3, '0')}`;

    const newDecision: ArchitecturalDecision = {
      ...decision,
      id,
      createdAt: new Date(),
    };

    decisions.push(newDecision);
    this.saveDecisions(decisions);

    return newDecision;
  }

  getAllDecisions(): ArchitecturalDecision[] {
    return this.loadDecisions();
  }

  // ===== CODE ANALYSIS =====

  scanDirectory(
    projectPath: string,
    context: 'backend' | 'frontend' | 'infrastructure' | 'all'
  ): {
    interfaces: string[];
    classes: string[];
    files: string[];
  } {
    const results = {
      interfaces: [] as string[],
      classes: [] as string[],
      files: [] as string[],
    };

    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    const walkDir = (dir: string) => {
      try {
        const files = readdirSync(dir);

        for (const file of files) {
          const filePath = join(dir, file);
          
          try {
            const stat = statSync(filePath);

            if (stat.isDirectory()) {
              // Skip node_modules, dist, etc.
              if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
                walkDir(filePath);
              }
            } else if (extensions.includes(extname(file))) {
              results.files.push(filePath);

              const content = readFileSync(filePath, 'utf-8');

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

  extractInterfaceDetails(filePath: string, interfaceName: string): string | null {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const regex = new RegExp(
        `(?:export\\s+)?interface\\s+${interfaceName}\\s*{[^}]*}`,
        's'
      );
      const match = content.match(regex);
      return match ? match[0] : null;
    } catch {
      return null;
    }
  }

  // ===== UTILITIES =====

  private generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  validateContract(code: string, contractId: string): {
    valid: boolean;
    violations: string[];
  } {
    const contract = this.getContract(contractId);

    if (!contract) {
      return {
        valid: false,
        violations: ['Contract not found'],
      };
    }

    const violations: string[] = [];

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
  registerFeature(feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>): Feature {
    const data = this.loadFeatures();
    
    const newFeature: Feature = {
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
  getAllFeatures(filter?: {
    context?: string;
    status?: string;
    tags?: string[];
  }): Feature[] {
    const data = this.loadFeatures();
    let features = data.features;

    if (filter?.context) {
      features = features.filter(f => f.context === filter.context);
    }

    if (filter?.status) {
      features = features.filter(f => f.status === filter.status);
    }

    if (filter?.tags && filter.tags.length > 0) {
      features = features.filter(f => 
        filter.tags!.some(tag => f.tags.includes(tag))
      );
    }

    return features;
  }

  /**
   * Busca feature por nome ou descrição
   */
  searchFeatures(query: string): Feature[] {
    const data = this.loadFeatures();
    const lowerQuery = query.toLowerCase();

    return data.features.filter(
      f =>
        f.name.toLowerCase().includes(lowerQuery) ||
        f.description.toLowerCase().includes(lowerQuery) ||
        f.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Busca feature por ID
   */
  getFeatureById(id: string): Feature | null {
    const data = this.loadFeatures();
    return data.features.find(f => f.id === id) || null;
  }

  /**
   * Atualiza status de uma feature
   */
  updateFeatureStatus(id: string, status: Feature['status']): Feature | null {
    const data = this.loadFeatures();
    const feature = data.features.find(f => f.id === id);

    if (!feature) return null;

    feature.status = status;
    feature.updatedAt = new Date();

    this.saveFeatures(data);
    return feature;
  }

  /**
   * Atualiza feature completa
   */
  updateFeature(id: string, updates: Partial<Omit<Feature, 'id' | 'createdAt'>>): Feature | null {
    const data = this.loadFeatures();
    const feature = data.features.find(f => f.id === id);

    if (!feature) return null;

    Object.assign(feature, updates, { updatedAt: new Date() });

    this.saveFeatures(data);
    return feature;
  }

  /**
   * Busca contexto completo de uma feature (feature + contratos + padrões relacionados)
   */
  getFeatureContext(featureId: string): {
    feature: Feature | null;
    relatedContracts: Contract[];
    relatedPatterns: Pattern[];
  } {
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

    const relatedContracts = Object.values(contractsData).filter((c: Contract) => 
      feature.relatedContracts.includes(c.id) || 
      feature.relatedContracts.includes(c.name)
    );

    const relatedPatterns = Object.values(patternsData).filter((p: Pattern) => 
      feature.relatedPatterns.includes(p.id) || 
      feature.relatedPatterns.includes(p.name)
    );

    return {
      feature,
      relatedContracts,
      relatedPatterns,
    };
  }

  private loadFeatures(): { features: Feature[] } {
    try {
      const data = readFileSync(this.featuresPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return { features: [] };
    }
  }

  private saveFeatures(data: { features: Feature[] }): void {
    writeFileSync(this.featuresPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // ===== DOCUMENTATION MANAGEMENT =====

  loadDocumentation(): Record<string, DocumentationEntry> {
    try {
      const data = readFileSync(this.documentationPath, 'utf-8');
      return JSON.parse(data).documentation || {};
    } catch {
      return {};
    }
  }

  saveDocumentation(documentation: Record<string, DocumentationEntry>): void {
    const data = {
      documentation,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };
    writeFileSync(this.documentationPath, JSON.stringify(data, null, 2));
  }

  /**
   * Registra um novo documento de documentação
   */
  registerDocument(doc: Omit<DocumentationEntry, 'id' | 'createdAt' | 'lastUpdated' | 'version'>): DocumentationEntry {
    const documentation = this.loadDocumentation();
    const id = this.generateId(doc.title);

    const newDoc: DocumentationEntry = {
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
  updateDocument(
    id: string, 
    updates: Partial<Omit<DocumentationEntry, 'id' | 'createdAt' | 'version'>>
  ): DocumentationEntry | null {
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
  listDocuments(filters?: {
    context?: DocumentationEntry['context'];
    type?: DocumentationEntry['type'];
    keywords?: string[];
  }): DocumentationEntry[] {
    const documentation = this.loadDocumentation();
    let docs = Object.values(documentation);

    if (filters?.context) {
      docs = docs.filter(d => d.context === filters.context);
    }

    if (filters?.type) {
      docs = docs.filter(d => d.type === filters.type);
    }

    if (filters?.keywords && filters.keywords.length > 0) {
      docs = docs.filter(d => 
        filters.keywords!.some(kw => 
          d.keywords.some(docKw => docKw.toLowerCase().includes(kw.toLowerCase())) ||
          d.topics.some(topic => topic.toLowerCase().includes(kw.toLowerCase())) ||
          d.title.toLowerCase().includes(kw.toLowerCase())
        )
      );
    }

    return docs.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  /**
   * Busca documentos similares baseado em título, tópicos e keywords
   * Retorna documentos ordenados por relevância
   */
  findSimilarDocuments(
    title: string,
    topics: string[] = [],
    keywords: string[] = []
  ): Array<{ document: DocumentationEntry; similarity: number }> {
    const documentation = this.loadDocumentation();
    const docs = Object.values(documentation);

    const results = docs.map(doc => {
      let score = 0;
      const titleLower = title.toLowerCase();
      const docTitleLower = doc.title.toLowerCase();

      // Título exato ou muito similar
      if (docTitleLower === titleLower) {
        score += 100;
      } else if (docTitleLower.includes(titleLower) || titleLower.includes(docTitleLower)) {
        score += 50;
      }

      // Palavras do título que aparecem
      const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
      const docTitleWords = docTitleLower.split(/\s+/).filter(w => w.length > 3);
      const commonTitleWords = titleWords.filter(w => docTitleWords.some(dw => dw.includes(w) || w.includes(dw)));
      score += commonTitleWords.length * 10;

      // Tópicos em comum
      const commonTopics = topics.filter(t => 
        doc.topics.some(dt => 
          dt.toLowerCase().includes(t.toLowerCase()) ||
          t.toLowerCase().includes(dt.toLowerCase())
        )
      );
      score += commonTopics.length * 20;

      // Keywords em comum
      const commonKeywords = keywords.filter(k =>
        doc.keywords.some(dk =>
          dk.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(dk.toLowerCase())
        )
      );
      score += commonKeywords.length * 15;

      return { document: doc, similarity: score };
    });

    return results
      .filter(r => r.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Obtém documento por ID
   */
  getDocumentById(id: string): DocumentationEntry | null {
    const documentation = this.loadDocumentation();
    return documentation[id] || null;
  }

  /**
   * Obtém documento por caminho do arquivo
   */
  getDocumentByPath(filePath: string): DocumentationEntry | null {
    const documentation = this.loadDocumentation();
    return Object.values(documentation).find(d => d.filePath === filePath) || null;
  }
}



