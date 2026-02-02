import { spawn, spawnSync } from "child_process";
import path from "path";
import { TMUX_PANE_SPLIT_RATIO } from "./lib/constants";

export interface TerminalEnvironment {
  inTmux: boolean;
  summary: string;
}

export function detectTerminal(): TerminalEnvironment {
  const inTmux = !!process.env.TMUX;
  const summary = inTmux ? "tmux" : "no tmux";
  return { inTmux, summary };
}

export interface SpawnResult {
  method: string;
  pid?: number;
  paneId?: string;
}

export interface SpawnOptions {
  session?: string;
  commentsFile?: string;
  readonly?: boolean;
  exportOnQuit?: string;
  wait?: boolean;
}

function getCanvasPaneFilePath(): string {
  // Use tmux session and window to create a unique pane file per context
  // This prevents conflicts when running multiple lgtm instances in different windows
  const sessionResult = spawnSync("tmux", ["display-message", "-p", "#{session_id}"]);
  const windowResult = spawnSync("tmux", ["display-message", "-p", "#{window_id}"]);
  const sessionId = sessionResult.stdout?.toString().trim() || "default";
  const windowId = windowResult.stdout?.toString().trim() || "0";
  return `/tmp/lgtm-pane-${sessionId}-${windowId}`;
}

async function getCanvasPaneId(): Promise<string | null> {
  try {
    const paneFile = getCanvasPaneFilePath();
    const file = Bun.file(paneFile);
    if (await file.exists()) {
      const paneId = (await file.text()).trim();
      const result = spawnSync("tmux", ["display-message", "-t", paneId, "-p", "#{pane_id}"]);
      const output = result.stdout?.toString().trim();
      if (result.status === 0 && output === paneId) {
        return paneId;
      }
      await Bun.write(paneFile, "");
    }
  } catch {
    // Ignore errors
  }
  return null;
}

async function saveCanvasPaneId(paneId: string): Promise<void> {
  await Bun.write(getCanvasPaneFilePath(), paneId);
}

function getTargetPaneWidth(): number {
  // Get the width of the target pane to calculate split size
  const targetPane = process.env.TMUX_PANE || "";
  const result = spawnSync("tmux", [
    "display-message",
    ...(targetPane ? ["-t", targetPane] : []),
    "-p",
    "#{pane_width}",
  ]);
  const width = parseInt(result.stdout?.toString().trim() || "0", 10);
  return width || 160; // fallback to reasonable default
}

interface CreatePaneResult {
  success: boolean;
  paneId?: string;
}

function wrapCommandWithErrorHandling(command: string): string {
  return `_ec=0; ${command} || _ec=$?; if [ $_ec -ne 0 ]; then echo ""; echo "Command failed with exit code $_ec"; echo "Press Enter to close..."; read; fi`;
}

async function createNewPane(command: string): Promise<CreatePaneResult> {
  return new Promise((resolve) => {
    // Use absolute width instead of percentage to avoid "size missing" error
    // when running from non-TTY context (like Claude Code)
    const paneWidth = getTargetPaneWidth();
    const newPaneWidth = Math.floor(paneWidth * TMUX_PANE_SPLIT_RATIO);
    const targetPane = process.env.TMUX_PANE;

    const wrappedCommand = wrapCommandWithErrorHandling(command);

    const args = [
      "split-window",
      "-h",
      ...(targetPane ? ["-t", targetPane] : []),
      "-l", String(newPaneWidth),
      "-P",
      "-F", "#{pane_id}",
      wrappedCommand
    ];
    const proc = spawn("tmux", args);
    let paneId = "";
    let stderr = "";
    proc.stdout?.on("data", (data) => {
      paneId += data.toString();
    });
    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    proc.on("close", async (code) => {
      if (code === 0 && paneId.trim()) {
        const trimmedPaneId = paneId.trim();
        await saveCanvasPaneId(trimmedPaneId);
        resolve({ success: true, paneId: trimmedPaneId });
      } else {
        console.error(`tmux split-window failed (exit ${code}): ${stderr.trim() || 'unknown error'}`);
        resolve({ success: false });
      }
    });
    proc.on("error", (err) => {
      console.error(`tmux spawn error: ${err.message}`);
      resolve({ success: false });
    });
  });
}

async function reuseExistingPane(paneId: string, command: string): Promise<CreatePaneResult> {
  return new Promise((resolve) => {
    // Verify the pane actually exists and is responsive
    const checkResult = spawnSync("tmux", ["list-panes", "-F", "#{pane_id}"]);
    const existingPanes = checkResult.stdout?.toString().split('\n').map(p => p.trim()) || [];
    if (!existingPanes.includes(paneId)) {
      resolve({ success: false });
      return;
    }

    // First, kill any running process
    const killProc = spawn("tmux", ["send-keys", "-t", paneId, "C-c"]);
    killProc.on("close", () => {
      // Clear tmux scrollback history
      spawnSync("tmux", ["clear-history", "-t", paneId]);

      setTimeout(() => {
        // Use reset command which properly resets terminal state including cursor position
        const wrappedCommand = wrapCommandWithErrorHandling(command);
        const args = ["send-keys", "-t", paneId, `reset && ${wrappedCommand}`, "Enter"];
        const proc = spawn("tmux", args);
        proc.on("close", (code) => resolve({ success: code === 0, paneId: code === 0 ? paneId : undefined }));
        proc.on("error", () => resolve({ success: false }));
      }, 150);
    });
    killProc.on("error", () => resolve({ success: false }));
  });
}

async function spawnTmux(command: string): Promise<CreatePaneResult> {
  const existingPaneId = await getCanvasPaneId();

  if (existingPaneId) {
    const result = await reuseExistingPane(existingPaneId, command);
    if (result.success) {
      return result;
    }
    await Bun.write(getCanvasPaneFilePath(), "");
  }

  return createNewPane(command);
}

function generateSentinelPath(): string {
  return `/tmp/lgtm-done-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForSentinelFile(sentinelPath: string, timeoutMs: number = 600000): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 500;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = spawnSync("test", ["-f", sentinelPath]);
      if (result.status === 0) {
        // Sentinel file exists - clean it up and return
        spawnSync("rm", ["-f", sentinelPath]);
        return;
      }
    } catch {
      // Continue polling
    }
    await sleep(pollInterval);
  }

  throw new Error(`Timeout waiting for TUI to exit`);
}

export async function spawnCanvas(
  filePath: string,
  options?: SpawnOptions
): Promise<SpawnResult> {
  const env = detectTerminal();

  if (!env.inTmux) {
    throw new Error("Spawning requires tmux. Please run inside a tmux session.");
  }

  // Determine how to invoke the CLI - compiled binary vs source
  // For compiled binaries, process.execPath is the binary itself
  // For source, we need to run via bun
  const isCompiled = !import.meta.dir.includes('/src');
  let command: string;
  if (isCompiled) {
    // Running as compiled binary - invoke self directly
    command = `"${process.execPath}" show "${filePath}"`;
  } else {
    // Running from source - use bun to run the CLI
    const scriptDir = import.meta.dir.replace("/src", "");
    const cliPath = `${scriptDir}/src/cli.ts`;
    command = `bun "${cliPath}" show "${filePath}"`;
  }
  if (options?.session) {
    command += ` --session "${options.session}"`;
  }
  if (options?.commentsFile) {
    command += ` --comments "${options.commentsFile}"`;
  }
  if (options?.readonly) {
    command += ` --readonly`;
  }
  if (options?.exportOnQuit) {
    command += ` --export-on-quit "${options.exportOnQuit}"`;
  }

  // If wait is requested, wrap command to write sentinel file when done
  // Capture exit code, touch sentinel, then exit with original code (preserves error for wrapper)
  let sentinelPath: string | undefined;
  if (options?.wait) {
    sentinelPath = generateSentinelPath();
    command = `${command}; _lgtm_ec=$?; touch ${sentinelPath}; exit $_lgtm_ec`;
  }

  const result = await spawnTmux(command);
  if (!result.success) {
    throw new Error(`Failed to spawn tmux pane. TMUX env: ${process.env.TMUX || 'not set'}`);
  }

  // If wait is requested, poll for sentinel file
  if (sentinelPath) {
    await waitForSentinelFile(sentinelPath);
  }

  return { method: "tmux", paneId: result.paneId };
}
