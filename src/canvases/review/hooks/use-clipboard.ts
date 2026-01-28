import { useState, useCallback, useRef, useEffect } from 'react';

const COPY_NOTIFICATION_TIMEOUT = 2000;

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const markCopied = () => {
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), COPY_NOTIFICATION_TIMEOUT);
    };

    // If running inside tmux, try tmux buffer first
    if (process.env.TMUX) {
      try {
        const proc = Bun.spawn(['tmux', 'set-buffer', '--', text], { stdout: 'ignore', stderr: 'ignore' });
        const exitCode = await proc.exited;
        if (exitCode === 0) {
          markCopied();
          return true;
        }
      } catch {
        // tmux set-buffer failed, continue to other methods
      }
    }

    // Try xclip (Linux)
    try {
      const proc = Bun.spawn(['xclip', '-selection', 'clipboard'], {
        stdin: new Response(text).body,
        stdout: 'ignore',
        stderr: 'ignore',
      });
      const exitCode = await proc.exited;
      if (exitCode === 0) {
        markCopied();
        return true;
      }
    } catch {
      // xclip not available
    }

    // Try xsel (Linux alternative)
    try {
      const proc = Bun.spawn(['xsel', '--clipboard', '--input'], {
        stdin: new Response(text).body,
        stdout: 'ignore',
        stderr: 'ignore',
      });
      const exitCode = await proc.exited;
      if (exitCode === 0) {
        markCopied();
        return true;
      }
    } catch {
      // xsel not available
    }

    // Try pbcopy (macOS)
    try {
      const proc = Bun.spawn(['pbcopy'], {
        stdin: new Response(text).body,
        stdout: 'ignore',
        stderr: 'ignore',
      });
      const exitCode = await proc.exited;
      if (exitCode === 0) {
        markCopied();
        return true;
      }
    } catch {
      // pbcopy not available
    }

    // Try wl-copy (Wayland)
    try {
      const proc = Bun.spawn(['wl-copy'], {
        stdin: new Response(text).body,
        stdout: 'ignore',
        stderr: 'ignore',
      });
      const exitCode = await proc.exited;
      if (exitCode === 0) {
        markCopied();
        return true;
      }
    } catch {
      // wl-copy not available
    }

    // No clipboard method worked
    return false;
  }, []);

  return {
    copied,
    copyToClipboard,
  };
}
