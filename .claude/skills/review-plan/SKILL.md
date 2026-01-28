---
name: review-plan
description: Open the current plan file in LGTuiM for user review
allowed-tools: Bash(bun *), Bash(tmux *)
---

Open the plan file in LGTuiM so the user can review and add feedback.

## When to use
After generating a plan file, invoke this skill to open it for user review.

## Command
```bash
bun run /home/dev/workspace/LGTuiM/src/cli.ts $ARGUMENTS
```

Note: If the user has `LGTUIM_TMUX=1` set, this will open in a tmux split. Otherwise it opens in the current terminal.
