import { spawn, spawnSync } from "child_process";
import path from "path";

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

const CANVAS_PANE_FILE = "/tmp/lgtuim-pane-id";

async function getCanvasPaneId(): Promise<string | null> {
  try {
    const file = Bun.file(CANVAS_PANE_FILE);
    if (await file.exists()) {
      const paneId = (await file.text()).trim();
      const result = spawnSync("tmux", ["display-message", "-t", paneId, "-p", "#{pane_id}"]);
      const output = result.stdout?.toString().trim();
      if (result.status === 0 && output === paneId) {
        return paneId;
      }
      await Bun.write(CANVAS_PANE_FILE, "");
    }
  } catch {
    // Ignore errors
  }
  return null;
}

async function saveCanvasPaneId(paneId: string): Promise<void> {
  await Bun.write(CANVAS_PANE_FILE, paneId);
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

async function createNewPane(command: string): Promise<CreatePaneResult> {
  return new Promise((resolve) => {
    // Use absolute width instead of percentage to avoid "size missing" error
    // when running from non-TTY context (like Claude Code)
    const paneWidth = getTargetPaneWidth();
    const newPaneWidth = Math.floor(paneWidth * 0.67); // 67% of current width
    const targetPane = process.env.TMUX_PANE;

    const args = [
      "split-window",
      "-h",
      ...(targetPane ? ["-t", targetPane] : []),
      "-l", String(newPaneWidth),
      "-P",
      "-F", "#{pane_id}",
      command
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
    // First, kill any running process
    const killProc = spawn("tmux", ["send-keys", "-t", paneId, "C-c"]);
    killProc.on("close", () => {
      // Clear tmux scrollback history
      spawnSync("tmux", ["clear-history", "-t", paneId]);

      setTimeout(() => {
        // Use reset command which properly resets terminal state including cursor position
        const args = ["send-keys", "-t", paneId, `reset && ${command}`, "Enter"];
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
    await Bun.write(CANVAS_PANE_FILE, "");
  }

  return createNewPane(command);
}

function generateSentinelPath(): string {
  return `/tmp/lgtuim-done-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

  const scriptDir = import.meta.dir.replace("/src", "");
  const cliPath = `${scriptDir}/src/cli.ts`;

  let command = `bun ${cliPath} show "${filePath}"`;
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
    command += ` --auto-export "${options.exportOnQuit}"`;
  }

  // If wait is requested, wrap command to write sentinel file when done
  let sentinelPath: string | undefined;
  if (options?.wait) {
    sentinelPath = generateSentinelPath();
    command = `${command}; touch ${sentinelPath}`;
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
