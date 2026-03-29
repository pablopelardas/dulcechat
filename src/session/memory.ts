export interface Session {
  chatId: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  authToken?: string;
  lastActivity: number;
}

interface SessionStoreOptions {
  ttlMinutes: number;
  maxHistory: number;
}

export class SessionStore {
  private sessions = new Map<string, Session>();
  private ttlMs: number;
  private maxHistory: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(options: SessionStoreOptions) {
    this.ttlMs = options.ttlMinutes * 60 * 1000;
    this.maxHistory = options.maxHistory;
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get(chatId: string): Session {
    let session = this.sessions.get(chatId);
    if (!session) {
      session = { chatId, history: [], lastActivity: Date.now() };
      this.sessions.set(chatId, session);
    }
    return session;
  }

  addMessage(chatId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.get(chatId);
    session.history.push({ role, content });
    if (session.history.length > this.maxHistory) {
      session.history = session.history.slice(-this.maxHistory);
    }
    session.lastActivity = Date.now();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [chatId, session] of this.sessions) {
      if (now - session.lastActivity > this.ttlMs) {
        this.sessions.delete(chatId);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}
