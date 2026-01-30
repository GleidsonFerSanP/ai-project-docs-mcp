import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface SessionState {
  sessionId: string;
  projectId: string;
  context: 'backend' | 'frontend' | 'infrastructure' | 'shared' | 'all';
  activeContracts: string[]; // IDs dos contratos relevantes
  activeFeatures: string[]; // IDs das features sendo trabalhadas
  currentFocus: string; // Descrição do foco atual da sessão
  turnCount: number; // Número de mensagens/interações
  lastContextRefresh: Date;
  focusReminders: string[]; // Lembretes específicos para manter o foco
  checkpoints: SessionCheckpoint[];
  violations: FocusViolation[]; // Violações detectadas
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>; // Dados extras customizáveis
}

export interface SessionCheckpoint {
  id: string;
  timestamp: Date;
  turnCount: number;
  summary: string; // O que foi feito até aqui
  nextFocus: string; // Próxima etapa planejada
  activeGuidelines: string[]; // Guidelines ativas no momento
  filesModified: string[]; // Arquivos modificados desde último checkpoint
}

export interface FocusViolation {
  id: string;
  timestamp: Date;
  type: 'contract' | 'guideline' | 'context' | 'principle';
  severity: 'warning' | 'error' | 'info';
  description: string;
  suggestedFix?: string;
  resolved: boolean;
}

export interface SessionSummary {
  sessionId: string;
  projectId: string;
  context: string;
  duration: number; // em minutos
  turnCount: number;
  checkpointsCount: number;
  violationsCount: number;
  status: string;
  createdAt: Date;
  lastActivity: Date;
}

export class SessionManager {
  private sessionsPath: string;
  private projectId?: string; // Para garantir isolamento por projeto

  constructor(knowledgeDir: string, projectId?: string) {
    this.projectId = projectId;
    const isProjectContext = knowledgeDir.endsWith('.project-docs-mcp');
    
    if (isProjectContext) {
      // Contexto do projeto: sessions.json dentro do .project-docs-mcp/
      this.sessionsPath = join(knowledgeDir, 'sessions.json');
    } else {
      // Contexto global: sessions-{projectId}.json para isolar por projeto
      if (projectId) {
        this.sessionsPath = join(knowledgeDir, `sessions-${projectId}.json`);
      } else {
        this.sessionsPath = join(knowledgeDir, 'sessions.json');
      }
    }
    
    this.ensureSessionsFile();
  }

  /**
   * Garante que o arquivo de sessões existe
   */
  private ensureSessionsFile(): void {
    const dir = dirname(this.sessionsPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    if (!existsSync(this.sessionsPath)) {
      writeFileSync(this.sessionsPath, JSON.stringify({}, null, 2));
    }
  }

  /**
   * Carrega todas as sessões
   */
  private loadSessions(): Record<string, SessionState> {
    const data = readFileSync(this.sessionsPath, 'utf-8');
    const sessions = JSON.parse(data);
    
    // Converter strings de data em objetos Date
    Object.values(sessions).forEach((session: any) => {
      session.lastContextRefresh = new Date(session.lastContextRefresh);
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);
      
      if (session.checkpoints) {
        session.checkpoints.forEach((cp: any) => {
          cp.timestamp = new Date(cp.timestamp);
        });
      }
      
      if (session.violations) {
        session.violations.forEach((v: any) => {
          v.timestamp = new Date(v.timestamp);
        });
      }
    });
    
    return sessions;
  }

  /**
   * Salva todas as sessões
   */
  private saveSessions(sessions: Record<string, SessionState>): void {
    writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2));
  }

  /**
   * Cria uma nova sessão
   */
  createSession(params: {
    projectId: string;
    context: SessionState['context'];
    currentFocus: string;
    activeContracts?: string[];
    activeFeatures?: string[];
    focusReminders?: string[];
  }): SessionState {
    const sessions = this.loadSessions();
    
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newSession: SessionState = {
      sessionId,
      projectId: params.projectId,
      context: params.context,
      activeContracts: params.activeContracts || [],
      activeFeatures: params.activeFeatures || [],
      currentFocus: params.currentFocus,
      turnCount: 0,
      lastContextRefresh: new Date(),
      focusReminders: params.focusReminders || [],
      checkpoints: [],
      violations: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    sessions[sessionId] = newSession;
    this.saveSessions(sessions);
    
    return newSession;
  }

  /**
   * Obtém uma sessão específica
   */
  getSession(sessionId: string): SessionState | null {
    const sessions = this.loadSessions();
    return sessions[sessionId] || null;
  }

  /**
   * Atualiza uma sessão existente
   */
  updateSession(sessionId: string, updates: Partial<SessionState>): SessionState | null {
    const sessions = this.loadSessions();
    const session = sessions[sessionId];
    
    if (!session) {
      return null;
    }
    
    Object.assign(session, updates, { updatedAt: new Date() });
    sessions[sessionId] = session;
    this.saveSessions(sessions);
    
    return session;
  }

  /**
   * Incrementa o contador de turnos
   */
  incrementTurn(sessionId: string): SessionState | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    
    const turnCount = session.turnCount + 1;
    return this.updateSession(sessionId, { turnCount });
  }

  /**
   * Adiciona um checkpoint à sessão
   */
  addCheckpoint(sessionId: string, checkpoint: Omit<SessionCheckpoint, 'id' | 'timestamp'>): SessionState | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    
    const newCheckpoint: SessionCheckpoint = {
      id: `cp-${Date.now()}`,
      timestamp: new Date(),
      ...checkpoint,
    };
    
    session.checkpoints.push(newCheckpoint);
    return this.updateSession(sessionId, { checkpoints: session.checkpoints });
  }

  /**
   * Adiciona uma violação detectada
   */
  addViolation(sessionId: string, violation: Omit<FocusViolation, 'id' | 'timestamp'>): SessionState | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    
    const newViolation: FocusViolation = {
      id: `viol-${Date.now()}`,
      timestamp: new Date(),
      ...violation,
      resolved: violation.resolved ?? false,
    };
    
    session.violations.push(newViolation);
    return this.updateSession(sessionId, { violations: session.violations });
  }

  /**
   * Marca violação como resolvida
   */
  resolveViolation(sessionId: string, violationId: string): SessionState | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    
    const violation = session.violations.find(v => v.id === violationId);
    if (violation) {
      violation.resolved = true;
      return this.updateSession(sessionId, { violations: session.violations });
    }
    
    return session;
  }

  /**
   * Atualiza timestamp de último refresh
   */
  refreshContext(sessionId: string): SessionState | null {
    return this.updateSession(sessionId, { lastContextRefresh: new Date() });
  }

  /**
   * Lista todas as sessões ativas
   */
  getActiveSessions(projectId?: string): SessionState[] {
    const sessions = this.loadSessions();
    let active = Object.values(sessions).filter(s => s.status === 'active');
    
    if (projectId) {
      active = active.filter(s => s.projectId === projectId);
    }
    
    return active.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Obtém resumo de uma sessão
   */
  getSessionSummary(sessionId: string): SessionSummary | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    
    const duration = Math.round(
      (session.updatedAt.getTime() - session.createdAt.getTime()) / 1000 / 60
    );
    
    return {
      sessionId: session.sessionId,
      projectId: session.projectId,
      context: session.context,
      duration,
      turnCount: session.turnCount,
      checkpointsCount: session.checkpoints.length,
      violationsCount: session.violations.filter(v => !v.resolved).length,
      status: session.status,
      createdAt: session.createdAt,
      lastActivity: session.updatedAt,
    };
  }

  /**
   * Finaliza uma sessão
   */
  completeSession(sessionId: string): SessionState | null {
    return this.updateSession(sessionId, { status: 'completed' });
  }

  /**
   * Pausa uma sessão
   */
  pauseSession(sessionId: string): SessionState | null {
    return this.updateSession(sessionId, { status: 'paused' });
  }

  /**
   * Reativa uma sessão pausada
   */
  resumeSession(sessionId: string): SessionState | null {
    return this.updateSession(sessionId, { status: 'active' });
  }

  /**
   * Atualiza o foco da sessão
   */
  updateFocus(sessionId: string, newFocus: string, reason?: string): SessionState | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    // Adicionar checkpoint para registrar a mudança de foco
    const checkpoint: Omit<SessionCheckpoint, 'id' | 'timestamp'> = {
      turnCount: session.turnCount,
      summary: `Foco alterado: "${session.currentFocus}" → "${newFocus}"`,
      nextFocus: newFocus,
      activeGuidelines: [],
      filesModified: [],
    };

    session.checkpoints.push({
      id: `cp-${Date.now()}`,
      timestamp: new Date(),
      ...checkpoint,
    });

    return this.updateSession(sessionId, { 
      currentFocus: newFocus,
      checkpoints: session.checkpoints,
    });
  }

  /**
   * Obtém a última sessão ativa ou uma específica por ID
   */
  getCurrentFocus(projectId?: string, sessionId?: string): SessionState | null {
    if (sessionId) {
      return this.getSession(sessionId);
    }

    const activeSessions = this.getActiveSessions(projectId);
    return activeSessions[0] || null;
  }

  /**
   * Verifica se precisa de refresh de contexto (a cada 10 turnos ou 30 min)
   */
  needsContextRefresh(sessionId: string): { needed: boolean; reason?: string } {
    const session = this.getSession(sessionId);
    if (!session) return { needed: false };
    
    // Verificar turnos
    if (session.turnCount > 0 && session.turnCount % 10 === 0) {
      return { needed: true, reason: `Após ${session.turnCount} interações` };
    }
    
    // Verificar tempo (30 minutos)
    const timeSinceRefresh = Date.now() - session.lastContextRefresh.getTime();
    const minutesSinceRefresh = timeSinceRefresh / 1000 / 60;
    
    if (minutesSinceRefresh >= 30) {
      return { needed: true, reason: `Após ${Math.round(minutesSinceRefresh)} minutos` };
    }
    
    return { needed: false };
  }

  /**
   * Remove sessões antigas (> 7 dias e status completed)
   */
  cleanupOldSessions(daysOld: number = 7): number {
    const sessions = this.loadSessions();
    const now = Date.now();
    const cutoffTime = now - (daysOld * 24 * 60 * 60 * 1000);
    
    let removed = 0;
    
    Object.keys(sessions).forEach(sessionId => {
      const session = sessions[sessionId];
      if (
        session.status === 'completed' &&
        session.updatedAt.getTime() < cutoffTime
      ) {
        delete sessions[sessionId];
        removed++;
      }
    });
    
    if (removed > 0) {
      this.saveSessions(sessions);
    }
    
    return removed;
  }
}
