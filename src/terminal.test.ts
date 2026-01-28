import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { detectTerminal } from './terminal';

describe('detectTerminal', () => {
  const originalTmux = process.env.TMUX;

  afterEach(() => {
    // Restore original value
    if (originalTmux !== undefined) {
      process.env.TMUX = originalTmux;
    } else {
      delete process.env.TMUX;
    }
  });

  test('returns inTmux: true when TMUX env is set', () => {
    process.env.TMUX = '/tmp/tmux-1000/default,12345,0';
    const result = detectTerminal();
    expect(result.inTmux).toBe(true);
    expect(result.summary).toBe('tmux');
  });

  test('returns inTmux: false when TMUX env is not set', () => {
    delete process.env.TMUX;
    const result = detectTerminal();
    expect(result.inTmux).toBe(false);
    expect(result.summary).toBe('no tmux');
  });

  test('returns inTmux: false when TMUX env is empty string', () => {
    process.env.TMUX = '';
    const result = detectTerminal();
    expect(result.inTmux).toBe(false);
    expect(result.summary).toBe('no tmux');
  });
});
