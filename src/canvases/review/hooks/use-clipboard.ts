import { useState, useCallback } from 'react';

export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    // If running inside tmux, try tmux buffer first
    if (process.env.TMUX) {
      try {
        const tmuxResult = await Bun.$`tmux set-buffer ${text}`.quiet();
        if (tmuxResult.exitCode === 0) {
          markCopied();
          return true;
        }
      } catch {
        // tmux set-buffer failed, continue to other methods
      }
    }

    try {
      // Try xclip first (Linux)
      const xclipResult = await Bun.$`echo ${text} | xclip -selection clipboard`.quiet();
      if (xclipResult.exitCode === 0) {
        markCopied();
        return true;
      }
    } catch {
      // xclip not available
    }

    try {
      // Try xsel (Linux alternative)
      const xselResult = await Bun.$`echo ${text} | xsel --clipboard --input`.quiet();
      if (xselResult.exitCode === 0) {
        markCopied();
        return true;
      }
    } catch {
      // xsel not available
    }

    try {
      // Try pbcopy (macOS)
      const pbcopyResult = await Bun.$`echo ${text} | pbcopy`.quiet();
      if (pbcopyResult.exitCode === 0) {
        markCopied();
        return true;
      }
    } catch {
      // pbcopy not available
    }

    try {
      // Try wl-copy (Wayland)
      const wlResult = await Bun.$`echo ${text} | wl-copy`.quiet();
      if (wlResult.exitCode === 0) {
        markCopied();
        return true;
      }
    } catch {
      // wl-copy not available
    }

    // Final fallback: try tmux even if TMUX env isn't set (nested sessions)
    try {
      const tmuxFallback = await Bun.$`tmux set-buffer ${text}`.quiet();
      if (tmuxFallback.exitCode === 0) {
        markCopied();
        return true;
      }
    } catch {
      // tmux not available
    }

    return false;
  }, []);

  return {
    copied,
    copyToClipboard,
  };
}
