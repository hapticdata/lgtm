#!/usr/bin/env bun
import { program } from "commander";
import { detectTerminal, spawnCanvas } from "./terminal";
import path from "path";

function setWindowTitle(title: string) {
  process.stdout.write(`\x1b]0;${title}\x07`);
}

function resetTerminal() {
  // Send terminal reset sequence to clear screen and reset cursor to 0,0
  // This ensures Ink starts rendering from a clean state
  process.stdout.write('\x1bc');
}

program
  .name("lgtuim")
  .description("TUI application for reviewing markdown plans with line-by-line commenting")
  .version("0.1.0");

// Default command: show the file in current terminal (or tmux if LGTUIM_TMUX=1)
program
  .argument("[file]", "Markdown file to review")
  .option("--session <name>", "Named session for persistence")
  .option("--comments <file>", "Load comments from specific file")
  .option("--readonly", "View-only mode")
  .option("--socket <path>", "Unix socket path for IPC")
  .option("--tmux", "Open in tmux split pane instead of current terminal")
  .option("--export-on-quit <path>", "Export comments to file when quitting")
  .action(async (file, options) => {
    if (!file) {
      program.help();
      return;
    }

    const filePath = path.resolve(file);
    // Use tmux if explicitly requested, or if export-on-quit is set (Claude Code use case)
    const useTmux = options.tmux || options.exportOnQuit || process.env.LGTUIM_TMUX === '1';

    if (useTmux) {
      const result = await spawnCanvas(filePath, {
        session: options.session,
        commentsFile: options.comments,
        readonly: options.readonly,
        exportOnQuit: options.exportOnQuit,
        wait: !!options.exportOnQuit, // Wait if export-on-quit is set
      });
      console.log(`Spawned lgtuim for '${path.basename(filePath)}' via ${result.method}`);
    } else {
      resetTerminal();
      setWindowTitle(`lgtuim: ${path.basename(filePath)}`);
      const { renderCanvas } = await import("./canvases");
      await renderCanvas("review", filePath, {
        session: options.session,
        commentsFile: options.comments,
        readonly: options.readonly,
        socketPath: options.socket,
        exportOnQuit: options.exportOnQuit,
      });
    }
  });

program
  .command("show <file>")
  .description("Display review TUI in current terminal")
  .option("--session <name>", "Named session for persistence")
  .option("--comments <file>", "Load comments from specific file")
  .option("--readonly", "View-only mode")
  .option("--socket <path>", "Unix socket path for IPC")
  .option("--auto-export <path>", "Export comments to file when quitting")
  .action(async (file, options) => {
    const filePath = path.resolve(file);
    resetTerminal();
    setWindowTitle(`lgtuim: ${path.basename(filePath)}`);

    const { renderCanvas } = await import("./canvases");
    await renderCanvas("review", filePath, {
      session: options.session,
      commentsFile: options.comments,
      readonly: options.readonly,
      socketPath: options.socket,
      exportOnQuit: options.autoExport,
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
    const result = await spawnCanvas(filePath, options);
    console.log(`Spawned lgtuim for '${path.basename(filePath)}' via ${result.method}`);
  });

program
  .command("export <file>")
  .description("Export comments to stdout")
  .option("--session <name>", "Named session for persistence")
  .option("--comments <file>", "Load comments from specific file")
  .option("--format <type>", "Output format: markdown (default) or json", "markdown")
  .action(async (file, options) => {
    const filePath = path.resolve(file);
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
