---
name: lgtm-plan
description: Open the current plan file in lgtm for user review
allowed-tools: Bash(bun run *), Bash(bunx *), Bash(tmux *), Read
---

Open the plan file in lgtm so the user can review and add feedback. After the user quits the TUI, read their feedback and return it to the conversation.

## When to use
After generating a plan file, invoke this skill to open it for user review.

## Steps

1. Determine the export path based on the plan file basename:
   ```
   /tmp/lgtm-plan-{basename}.md
   ```

2. Run lgtm with export-on-quit (use the unique export path from step 1). Check if `${CLAUDE_PLUGIN_ROOT}/node_modules` exists to determine the run command:
   - If `${CLAUDE_PLUGIN_ROOT}/node_modules` exists (local dev):
     ```bash
     bun run ${CLAUDE_PLUGIN_ROOT}/src/cli.ts $ARGUMENTS --export-on-quit /tmp/lgtm-plan-{basename}.md
     ```
   - If `node_modules` does not exist (marketplace install):
     ```bash
     bunx @hapticdata/lgtm $ARGUMENTS --export-on-quit /tmp/lgtm-plan-{basename}.md
     ```

3. After the TUI exits, read the exported feedback file:
   ```bash
   Read /tmp/lgtm-plan-{basename}.md
   ```

4. Present the user's feedback and incorporate it into your response.

Note: If the user has `LGTM_TMUX=1` set, this will open in a tmux split. Otherwise it opens in the current terminal.
