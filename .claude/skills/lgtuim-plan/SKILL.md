---
name: lgtuim-plan
description: Open the current plan file in LGTuiM for user review
allowed-tools: Bash(lgtuim *), Bash(tmux *), Read
---

Open the plan file in LGTuiM so the user can review and add feedback. After the user quits the TUI, read their feedback and return it to the conversation.

## When to use
After generating a plan file, invoke this skill to open it for user review.

## Steps

1. Determine the export path based on the plan file basename:
   ```
   /tmp/lgtuim-plan-{basename}.md
   ```

2. Run LGTuiM with export-on-quit (use the unique export path from step 1):
   ```bash
   lgtuim $ARGUMENTS --export-on-quit /tmp/lgtuim-plan-{basename}.md
   ```

3. After the TUI exits, read the exported feedback file:
   ```bash
   Read /tmp/lgtuim-plan-{basename}.md
   ```

4. Present the user's feedback and incorporate it into your response.

Note: If the user has `LGTUIM_TMUX=1` set, this will open in a tmux split. Otherwise it opens in the current terminal.
