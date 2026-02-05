#!/usr/bin/env bash
# Setup script for lgtm plugin
# Installs dependencies and ensures the lgtm binary is available

PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Install dependencies if not present
if [ ! -d "$PLUGIN_ROOT/node_modules" ]; then
  if command -v bun &>/dev/null; then
    cd "$PLUGIN_ROOT" && bun install --frozen-lockfile 2>/dev/null || bun install
  else
    echo "lgtm plugin: bun is required. Install from https://bun.sh" >&2
    exit 1
  fi
fi

# Link the lgtm binary if not already on PATH
if ! command -v lgtm &>/dev/null; then
  if command -v bun &>/dev/null; then
    cd "$PLUGIN_ROOT" && bun link 2>/dev/null || true
  fi
fi
