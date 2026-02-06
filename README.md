# lgtm

A terminal UI for reviewing documents with line-by-line commenting. Perfect for reviewing AI-generated plans, code proposals, or any text document that needs structured feedback.

## Features

- Line-by-line commenting with 6 comment types (blocker, concern, question, suggestion, praise, acknowledge)
- Syntax highlighting for code blocks
- Session persistence (comments saved to JSON files)
- Export feedback in markdown or JSON format
- tmux integration for side-by-side review workflows
- Claude Code integration for AI-assisted development

## Installation

### Quick Start (No Install)

Run lgtm directly without installing:

```bash
bunx @hapticdata/lgtm document.md
```
- Requires [Bun](https://bun.sh) v1.0.0 or later.
- Claude Code Skill integration requires being inside `tmux`

### Marketplace Installation (Recommended)

Install lgtm as a Claude Code plugin from the marketplace:

```bash
# In Claude Code, run these commands:
/plugin marketplace add hapticdata/lgtm
/plugin install lgtm@lgtm

```

Or locally after cloning the repository:

```bash
claude plugin install lgtm --plugin-dir .
```

### Claude Code Skills

Once installed, three skills are available:

- `/lgtm <file>` - Open a file in the review TUI. Claude reads the file first, then spawns lgtm in a tmux pane. When you quit (`q`), Claude receives your feedback and responds to it.
- `/lgtm-plan` - Review the current plan file in the TUI after Claude generates a plan.
- `/lgtm-context` - Load Claude's last response into the TUI for line-by-line review.

The plugin automatically spawns a tmux pane for side-by-side review. When you quit (press `q`), your feedback is sent back to Claude for discussion.

### Global CLI Installation (Optional)

For standalone command-line usage without Claude Code:

```bash
bun install
bun link
```

Then use the `lgtm` command directly:

```bash
lgtm document.md
```

### Requirements

- [Bun](https://bun.sh) v1.0.0 or later (required)
- tmux (optional, for side-by-side review with Claude Code)

**Why Bun?** lgtm uses Bun-specific APIs (`Bun.file()`, `Bun.write()`, `Bun.stdin`) for better performance and simpler code. These APIs are not available in Node.js or other runtimes.

## Usage

### Basic Usage

Review a file in your terminal:

```bash
lgtm document.md
```

### Commands

```bash
# Review in current terminal (default)
lgtm <file>

# Explicitly show in current terminal
lgtm show <file>

# Open in tmux split pane
lgtm spawn <file>

# Export comments to stdout
lgtm export <file>

# Show terminal environment info
lgtm env
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
lgtm export document.md

# Export as JSON
lgtm export document.md --format json

# Export specific session
lgtm export document.md --session my-review
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
| `LGTM_TMUX=1` | Default to tmux mode (skip `--tmux` flag) |
| `TMUX_PANE` | Target pane for tmux splits |

### Comment Storage

Comments are stored in JSON files alongside the reviewed document:

```
document.md           # Original file
.lgtm-document.json # Comments file
```

With sessions:
```
.lgtm-document-mysession.json
```

## Claude Code Integration

lgtm integrates with Claude Code for AI-assisted review workflows. When used with `--export-on-quit`, comments are automatically exported when you quit.

```bash
# Claude Code can spawn lgtm and wait for your review
lgtm document.md --export-on-quit /tmp/feedback.md
```

The `--context` flag loads Claude's last response for review:

```bash
lgtm --context
```

## License

MIT
