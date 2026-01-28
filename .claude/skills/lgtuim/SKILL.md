---
name: lgtuim
description: Launch LGTuiM TUI to review a markdown file with line-by-line commenting
argument-hint: <file-path> [--stdin]
allowed-tools: Bash(bun *), Bash(tmux *), Read
---

Launch LGTuiM to review the specified markdown file or piped content.

## Usage
/lgtuim path/to/plan.md          # Opens TUI for review (auto-spawns in tmux pane)
/lgtuim @CLAUDE.md               # @ prefix is stripped automatically
/lgtuim --stdin                  # Review content piped from stdin

## What it does
Opens an interactive TUI for reviewing markdown documents with:
- Line-by-line navigation (j/k)
- Comment types: Blocker, Concern, Question, Suggestion, Praise, Acknowledge
- Syntax highlighting for code blocks
- Export to markdown (E) or clipboard (y)
- Summary view (v)

## Instructions

When this skill is invoked, follow these steps:

1. **Parse arguments**: Extract the file path from `$ARGUMENTS`. If it starts with `@`, strip that prefix. Ignore `--tmux` if present (it's automatic).
2. **Resolve path**: Convert the file path to an absolute path if it isn't already.
3. **Create export path**: Generate `/tmp/lgtuim-export-{basename-without-extension}.md`
4. **Run the TUI**: Execute the command below. The `--export-on-quit` flag automatically enables tmux mode and waits for the user to quit.
   ```bash
   bun run /home/dev/workspace/LGTuiM/src/cli.ts "<resolved-file-path>" --export-on-quit "<export-path>"
   ```
5. **Return feedback**: After the command returns (user has quit the TUI), use the Read tool to read the export file and present its contents to the user.
