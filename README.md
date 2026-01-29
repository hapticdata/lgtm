# LGTuiM

A terminal UI for reviewing documents with line-by-line commenting. Perfect for reviewing AI-generated plans, code proposals, or any text document that needs structured feedback.

## Features

- Line-by-line commenting with 6 comment types (blocker, concern, question, suggestion, praise, acknowledge)
- Syntax highlighting for code blocks
- Session persistence (comments saved to JSON files)
- Export feedback in markdown or JSON format
- tmux integration for side-by-side review workflows
- Claude Code integration for AI-assisted development

## Installation

```bash
bun add -g lgtuim
```

Requires [Bun](https://bun.sh) v1.0.0 or later.

## Usage

### Basic Usage

Review a file in your terminal:

```bash
lgtuim document.md
```

### Commands

```bash
# Review in current terminal (default)
lgtuim <file>

# Explicitly show in current terminal
lgtuim show <file>

# Open in tmux split pane
lgtuim spawn <file>

# Export comments to stdout
lgtuim export <file>

# Show terminal environment info
lgtuim env
```

### Options

| Option | Description |
|--------|-------------|
| `--session <name>` | Named session for separate comment storage |
| `--comments <file>` | Load comments from a specific file |
| `--readonly` | View-only mode (no editing) |
| `--export-on-quit <path>` | Export comments to file when quitting |
| `--stdin` | Read content from stdin instead of file |
| `--context` | Load Claude's last response from current session |
| `--tmux` | Open in tmux split pane |

### Export Options

```bash
# Export as markdown (default)
lgtuim export document.md

# Export as JSON
lgtuim export document.md --format json

# Export specific session
lgtuim export document.md --session my-review
```

## Keybindings

### Navigation

| Key | Action |
|-----|--------|
| `j` / `Down` | Scroll down / Next comment |
| `k` / `Up` | Scroll up / Previous comment |
| `g` | Go to top |
| `G` | Go to bottom |
| `Tab` | Switch between document and comments panel |
| `Enter` | Jump to commented line (in comments panel) |

### Comments

| Key | Action |
|-----|--------|
| `c` | Add comment on current line |
| `e` | Edit selected comment |
| `d` | Delete selected comment |
| `r` | Toggle resolved status |
| `1-6` | Select comment type when adding |

### Comment Types

| Key | Type | Purpose |
|-----|------|---------|
| `1` | Blocker | Critical issues that must be addressed |
| `2` | Concern | Potential issues to evaluate |
| `3` | Question | Need clarification |
| `4` | Suggestion | Improvements to consider |
| `5` | Praise | Highlight good work |
| `6` | Acknowledge | Noted/acknowledged |

### Other

| Key | Action |
|-----|--------|
| `f` | Cycle through comment filters |
| `v` | Toggle summary view |
| `y` | Copy feedback to clipboard |
| `s` | Save session |
| `?` | Toggle help |
| `q` / `Esc` | Quit |

## Configuration

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `LGTUIM_TMUX=1` | Default to tmux mode (skip `--tmux` flag) |
| `TMUX_PANE` | Target pane for tmux splits |

### Comment Storage

Comments are stored in JSON files alongside the reviewed document:

```
document.md           # Original file
.lgtuim-document.json # Comments file
```

With sessions:
```
.lgtuim-document-mysession.json
```

## Claude Code Integration

LGTuiM integrates with Claude Code for AI-assisted review workflows. When used with `--export-on-quit`, comments are automatically exported when you quit.

```bash
# Claude Code can spawn lgtuim and wait for your review
lgtuim document.md --export-on-quit /tmp/feedback.md
```

The `--context` flag loads Claude's last response for review:

```bash
lgtuim --context
```

## License

MIT
