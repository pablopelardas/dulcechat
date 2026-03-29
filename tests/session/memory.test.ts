import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionStore, Session } from '../../src/session/memory.js';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new SessionStore({ ttlMinutes: 1, maxHistory: 3 });
  });

  afterEach(() => {
    store.destroy();
    vi.useRealTimers();
  });

  it('creates a new session for unknown chatId', () => {
    const session = store.get('chat1');
    expect(session.chatId).toBe('chat1');
    expect(session.history).toEqual([]);
  });

  it('returns the same session for the same chatId', () => {
    const s1 = store.get('chat1');
    s1.history.push({ role: 'user', content: 'hello' });
    const s2 = store.get('chat1');
    expect(s2.history).toHaveLength(1);
  });

  it('adds messages and trims history to maxHistory', () => {
    const session = store.get('chat1');
    store.addMessage('chat1', 'user', 'msg1');
    store.addMessage('chat1', 'assistant', 'reply1');
    store.addMessage('chat1', 'user', 'msg2');
    store.addMessage('chat1', 'assistant', 'reply2');
    expect(session.history).toHaveLength(3);
    expect(session.history[0].content).toBe('reply1');
  });

  it('expires sessions after TTL', () => {
    store.get('chat1');
    vi.advanceTimersByTime(2 * 60 * 1000);
    store.cleanup();
    const session = store.get('chat1');
    expect(session.history).toEqual([]);
  });

  it('does not expire active sessions', () => {
    store.addMessage('chat1', 'user', 'hello');
    vi.advanceTimersByTime(30 * 1000);
    store.cleanup();
    const session = store.get('chat1');
    expect(session.history).toHaveLength(1);
  });
});
