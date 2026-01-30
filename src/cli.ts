#!/usr/bin/env bun
import { program } from "commander";
import { detectTerminal, spawnCanvas } from "./terminal";
import path from "path";
import { unlink } from "node:fs/promises";
import { getLastClaudeResponse, findMostRecentSession } from "./lib/session-reader";
import { validateExportPath } from "./lib/export-utils";

function setWindowTitle(title: string) {
  process.stdout.write(`\x1b]0;${title}\x07`);
}

function resetTerminal() {
  // Send terminal reset sequence to clear screen and reset cursor to 0,0
  // This ensures Ink starts rendering from a clean state
  process.stdout.write('\x1bc');
}

async function validateFileExists(filePath: string): Promise<void> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }
}

async function cleanupTempFile(filePath: string | null): Promise<void> {
  if (filePath && filePath.startsWith('/tmp/lgtm-')) {
    try {
      await unlink(filePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

program
  .name("lgtm")
  .description("TUI application for reviewing markdown plans with line-by-line commenting")
  .version("0.1.0");

// Default command: show the file in current terminal (or tmux if LGTM_TMUX=1)
program
  .argument("[file]", "Markdown file to review")
  .option("--session <name>", "Named session for persistence")
  .option("--comments <file>", "Load comments from specific file")
  .option("--readonly", "View-only mode")
  .option("--tmux", "Open in tmux split pane instead of current terminal")
  .option("--export-on-quit <path>", "Export comments to file when quitting")
  .option("--stdin", "Read content from stdin instead of a file")
  .option("--context", "Load Claude's last response from current session")
  .action(async (file, options) => {
    let filePath: string;
    let tempFilePath: string | null = null;

    // Handle --stdin: read from stdin and write to temp file
    if (options.stdin) {
      const content = await Bun.stdin.text();
      if (!content.trim()) {
        console.error("Error: No content received from stdin");
        process.exit(1);
      }
      const tempPath = `/tmp/lgtm-stdin-${Date.now()}.md`;
      await Bun.write(tempPath, content);
      filePath = tempPath;
      tempFilePath = tempPath;
    }
    // Handle --context: load Claude's last response
    else if (options.context) {
      let sessionId = process.env.CLAUDE_SESSION_ID;
      const projectPath = process.cwd();

      // Fallback: find most recent session if env var not set
      if (!sessionId) {
        sessionId = await findMostRecentSession(projectPath) ?? undefined;
      }

      const content = await getLastClaudeResponse(sessionId, projectPath);
      if (!content) {
        console.error("Error: Could not find Claude context for current session");
        console.error(`Session ID: ${sessionId || "not set"}`);
        console.error(`Project path: ${projectPath}`);
        process.exit(1);
      }

      const tempPath = `/tmp/lgtm-context-${Date.now()}.md`;
      await Bun.write(tempPath, `# Claude Response Review\n\n${content}`);
      filePath = tempPath;
      tempFilePath = tempPath;
    }
    // Handle file argument
    else if (file) {
      filePath = path.resolve(file);
      await validateFileExists(filePath);
    }
    // No input provided
    else {
      program.help();
      return;
    }
    // Validate export path early if specified
    if (options.exportOnQuit) {
      const validation = await validateExportPath(options.exportOnQuit);
      if (!validation.valid) {
        console.warn(`Warning: Export path may not be writable: ${validation.error}`);
      }
    }

    // Use tmux if explicitly requested, or if export-on-quit is set (Claude Code use case)
    const useTmux = options.tmux || options.exportOnQuit || process.env.LGTM_TMUX === '1';

    try {
      if (useTmux) {
        const result = await spawnCanvas(filePath, {
          session: options.session,
          commentsFile: options.comments,
          readonly: options.readonly,
          exportOnQuit: options.exportOnQuit,
          wait: !!options.exportOnQuit, // Wait if export-on-quit is set
        });
        console.log(`Spawned lgtm for '${path.basename(filePath)}' via ${result.method}`);
      } else {
        resetTerminal();
        setWindowTitle(`lgtm: ${path.basename(filePath)}`);
        const { renderCanvas } = await import("./canvases");
        await renderCanvas("review", filePath, {
          session: options.session,
          commentsFile: options.comments,
          readonly: options.readonly,
          exportOnQuit: options.exportOnQuit,
        });
      }
    } finally {
      await cleanupTempFile(tempFilePath);
    }
  });

program
  .command("show <file>")
  .description("Display review TUI in current terminal")
  .option("--session <name>", "Named session for persistence")
  .option("--comments <file>", "Load comments from specific file")
  .option("--readonly", "View-only mode")
  .option("--export-on-quit <path>", "Export comments to file when quitting")
  .action(async (file, _options, command) => {
    // Use optsWithGlobals() to merge parent + subcommand options.
    // Commander.js v14 routes shared option names to the parent program,
    // so the subcommand's local options may be empty.
    const options = command.optsWithGlobals();
    const filePath = path.resolve(file);
    await validateFileExists(filePath);
    resetTerminal();
    setWindowTitle(`lgtm: ${path.basename(filePath)}`);

    const { renderCanvas } = await import("./canvases");
    await renderCanvas("review", filePath, {
      session: options.session,
      commentsFile: options.comments,
      readonly: options.readonly,
      exportOnQuit: options.exportOnQuit,
    });
  });

program
  .command("spawn <file>")
  .description("Open review TUI in tmux split pane")
  .option("--session <name>", "Named session for persistence")
  .option("--comments <file>", "Load comments from specific file")
  .option("--readonly", "View-only mode")
  .action(async (file, options) => {
    const filePath = path.resolve(file);
    await validateFileExists(filePath);
    const result = await spawnCanvas(filePath, options);
    console.log(`Spawned lgtm for '${path.basename(filePath)}' via ${result.method}`);
  });

program
  .command("export <file>")
  .description("Export comments to stdout")
  .option("--session <name>", "Named session for persistence")
  .option("--comments <file>", "Load comments from specific file")
  .option("--format <type>", "Output format: markdown (default) or json", "markdown")
  .action(async (file, options) => {
    const filePath = path.resolve(file);
    await validateFileExists(filePath);
    const { exportComments } = await import("./lib/export-formatter");
    const output = await exportComments(filePath, {
      session: options.session,
      commentsFile: options.comments,
      format: options.format,
    });
    console.log(output);
  });

program
  .command("env")
  .description("Show detected terminal environment")
  .action(() => {
    const env = detectTerminal();
    console.log("Terminal Environment:");
    console.log(`  In tmux: ${env.inTmux}`);
    console.log(`\nSummary: ${env.summary}`);
  });

program.parse();
