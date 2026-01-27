import { useState, useCallback } from 'react';

export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      // Try xclip first (Linux)
      const xclipResult = await Bun.$`echo ${text} | xclip -selection clipboard`.quiet();
      if (xclipResult.exitCode === 0) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      }
    } catch {
      // xclip not available
    }

    try {
      // Try xsel (Linux alternative)
      const xselResult = await Bun.$`echo ${text} | xsel --clipboard --input`.quiet();
      if (xselResult.exitCode === 0) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      }
    } catch {
      // xsel not available
    }

    try {
      // Try pbcopy (macOS)
      const pbcopyResult = await Bun.$`echo ${text} | pbcopy`.quiet();
      if (pbcopyResult.exitCode === 0) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      }
    } catch {
      // pbcopy not available
    }

    try {
      // Try wl-copy (Wayland)
      const wlResult = await Bun.$`echo ${text} | wl-copy`.quiet();
      if (wlResult.exitCode === 0) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      }
    } catch {
      // wl-copy not available
    }

    return false;
  }, []);

  return {
    copied,
    copyToClipboard,
  };
}
