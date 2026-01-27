# LGTuiM - Plan Review Skill

Review markdown planning documents with line-by-line commenting in a TUI interface.

## Usage

```
/lgtuim <file.md>
```

This skill opens a terminal-based interface for reviewing planning documents. You can add comments to specific lines, categorize feedback by type (blocker, concern, question, suggestion, praise, acknowledge), and export feedback summaries.

## Features

- **Line-by-line commenting**: Navigate through the document and add comments to any line
- **Comment types**: Categorize feedback as blockers, concerns, questions, suggestions, praise, or acknowledgments
- **Persistence**: Comments are saved automatically and persist between sessions
- **Summary view**: Toggle a summary view showing all comments grouped by type
- **Export**: Copy formatted feedback to clipboard for sharing

## Keybindings

### Document Navigation
- `j`/`↓` - Scroll down
- `k`/`↑` - Scroll up
- `g` - Go to top
- `G` - Go to bottom
- `c` - Add comment to current line
- `Tab` - Switch between document and comment panel

### Comment Panel
- `j`/`↓` - Next comment
- `k`/`↑` - Previous comment
- `e` - Edit selected comment
- `d` - Delete selected comment
- `r` - Toggle resolved status
- `Enter` - Jump to comment's line

### Global
- `f` - Cycle through filters
- `0-6` - Quick filter (0=all, 1-6=type)
- `v` - Toggle summary view
- `y` - Copy feedback to clipboard
- `s` - Save session
- `?` - Toggle help
- `q`/`Esc` - Quit

## Comment Types

| Key | Type | Color | Purpose |
|-----|------|-------|---------|
| 1 | Blocker | Red | Must fix before approval |
| 2 | Concern | Orange | Significant issue to review |
| 3 | Question | Blue | Needs clarification |
| 4 | Suggestion | Purple | Optional improvement |
| 5 | Praise | Green | Positive feedback |
| 6 | Acknowledge | Teal | Noted/understood |

## CLI Commands

```bash
# Open review TUI
lgtuim <file.md>
lgtuim plans.md

# Named session
lgtuim plans.md --session review1

# Export comments
lgtuim export plans.md
lgtuim export plans.md --format json

# Spawn in tmux pane
lgtuim spawn plans.md
```

## Integration with Claude Code

When you want to review a plan document:

1. Use `/lgtuim path/to/plan.md` to open the review interface
2. Navigate through the document and add your feedback
3. Press `y` to copy the formatted feedback to clipboard
4. Paste the feedback back into Claude Code for the assistant to address

The feedback will be formatted as a markdown summary with all comments grouped by type and priority.
