---
name: lgtm-plan
description: Open the current plan file in lgtm for user review
allowed-tools: Bash(lgtm *), Bash(tmux *), Read
---

Open the plan file in lgtm so the user can review and add feedback. After the user quits the TUI, read their feedback and return it to the conversation.

## When to use
After generating a plan file, invoke this skill to open it for user review.

## Steps

1. Determine the export path based on the plan file basename:
   ```
   /tmp/lgtm-plan-{basename}.md
   ```

2. Run lgtm with export-on-quit (use the unique export path from step 1):
   ```bash
   lgtm $ARGUMENTS --export-on-quit /tmp/lgtm-plan-{basename}.md
   ```

3. After the TUI exits, read the exported feedback file:
   ```bash
   Read /tmp/lgtm-plan-{basename}.md
   ```

4. Present the user's feedback and incorporate it into your response.

Note: If the user has `LGTM_TMUX=1` set, this will open in a tmux split. Otherwise it opens in the current terminal.
