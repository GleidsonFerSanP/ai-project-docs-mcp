import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
export class SessionManager {
    sessionsPath;
    constructor(knowledgeDir) {
        const isProjectContext = knowledgeDir.endsWith('.project-docs-mcp');
        if (isProjectContext) {
            this.sessionsPath = join(knowledgeDir, 'sessions.json');
        }
        else {
            this.sessionsPath = join(knowledgeDir, 'sessions.json');
        }
        this.ensureSessionsFile();
    }
    /**
     * Garante que o arquivo de sessões existe
     */
    ensureSessionsFile() {
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
    loadSessions() {
        const data = readFileSync(this.sessionsPath, 'utf-8');
        const sessions = JSON.parse(data);
        // Converter strings de data em objetos Date
        Object.values(sessions).forEach((session) => {
            session.lastContextRefresh = new Date(session.lastContextRefresh);
            session.createdAt = new Date(session.createdAt);
            session.updatedAt = new Date(session.updatedAt);
            if (session.checkpoints) {
                session.checkpoints.forEach((cp) => {
                    cp.timestamp = new Date(cp.timestamp);
                });
            }
            if (session.violations) {
                session.violations.forEach((v) => {
                    v.timestamp = new Date(v.timestamp);
                });
            }
        });
        return sessions;
    }
    /**
     * Salva todas as sessões
     */
    saveSessions(sessions) {
        writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2));
    }
    /**
     * Cria uma nova sessão
     */
    createSession(params) {
        const sessions = this.loadSessions();
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newSession = {
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
    getSession(sessionId) {
        const sessions = this.loadSessions();
        return sessions[sessionId] || null;
    }
    /**
     * Atualiza uma sessão existente
     */
    updateSession(sessionId, updates) {
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
    incrementTurn(sessionId) {
        const session = this.getSession(sessionId);
        if (!session)
            return null;
        const turnCount = session.turnCount + 1;
        return this.updateSession(sessionId, { turnCount });
    }
    /**
     * Adiciona um checkpoint à sessão
     */
    addCheckpoint(sessionId, checkpoint) {
        const session = this.getSession(sessionId);
        if (!session)
            return null;
        const newCheckpoint = {
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
    addViolation(sessionId, violation) {
        const session = this.getSession(sessionId);
        if (!session)
            return null;
        const newViolation = {
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
    resolveViolation(sessionId, violationId) {
        const session = this.getSession(sessionId);
        if (!session)
            return null;
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
    refreshContext(sessionId) {
        return this.updateSession(sessionId, { lastContextRefresh: new Date() });
    }
    /**
     * Lista todas as sessões ativas
     */
    getActiveSessions(projectId) {
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
    getSessionSummary(sessionId) {
        const session = this.getSession(sessionId);
        if (!session)
            return null;
        const duration = Math.round((session.updatedAt.getTime() - session.createdAt.getTime()) / 1000 / 60);
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
    completeSession(sessionId) {
        return this.updateSession(sessionId, { status: 'completed' });
    }
    /**
     * Pausa uma sessão
     */
    pauseSession(sessionId) {
        return this.updateSession(sessionId, { status: 'paused' });
    }
    /**
     * Reativa uma sessão pausada
     */
    resumeSession(sessionId) {
        return this.updateSession(sessionId, { status: 'active' });
    }
    /**
     * Atualiza o foco da sessão
     */
    updateFocus(sessionId, newFocus, reason) {
        const session = this.getSession(sessionId);
        if (!session)
            return null;
        // Adicionar checkpoint para registrar a mudança de foco
        const checkpoint = {
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
    getCurrentFocus(projectId, sessionId) {
        if (sessionId) {
            return this.getSession(sessionId);
        }
        const activeSessions = this.getActiveSessions(projectId);
        return activeSessions[0] || null;
    }
    /**
     * Verifica se precisa de refresh de contexto (a cada 10 turnos ou 30 min)
     */
    needsContextRefresh(sessionId) {
        const session = this.getSession(sessionId);
        if (!session)
            return { needed: false };
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
    cleanupOldSessions(daysOld = 7) {
        const sessions = this.loadSessions();
        const now = Date.now();
        const cutoffTime = now - (daysOld * 24 * 60 * 60 * 1000);
        let removed = 0;
        Object.keys(sessions).forEach(sessionId => {
            const session = sessions[sessionId];
            if (session.status === 'completed' &&
                session.updatedAt.getTime() < cutoffTime) {
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
