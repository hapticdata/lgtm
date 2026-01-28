---
name: lgtuim-context
description: Review Claude's last response in LGTuiM for line-by-line feedback
allowed-tools: Bash(bun *), Bash(tmux *), Read
---

Open Claude's last response in LGTuiM so the user can review it with line-by-line commenting.

## When to use
When the user wants to review your previous response and provide detailed feedback on specific parts.

## Steps

1. Run LGTuiM with the --context flag and export-on-quit:
   ```bash
   bun run /home/dev/workspace/LGTuiM/src/cli.ts --context --export-on-quit /tmp/lgtuim-context-feedback.md
   ```

2. After the TUI exits, read the exported feedback file:
   ```bash
   Read /tmp/lgtuim-context-feedback.md
   ```

3. Present the user's feedback and address their comments.

## Requirements

This skill requires the `CLAUDE_SESSION_ID` environment variable to be set, which Claude Code sets automatically.

Note: If the user has `LGTUIM_TMUX=1` set, this will open in a tmux split. Otherwise it opens in the current terminal.
