/**
 * Reads Claude Code session data to extract the last assistant response
 */

import path from "path";
import os from "os";

interface MessageContent {
  type: string;
  text?: string;
  thinking?: string;
}

interface SessionMessage {
  type: "user" | "assistant" | "file-history-snapshot";
  message?: {
    role: string;
    content: string | MessageContent[];
  };
  sessionId?: string;
  cwd?: string;
}

/**
 * Convert a project path to the slug format used by Claude Code
 * e.g., /home/dev/workspace/myproject -> -home-dev-workspace-myproject
 */
function projectPathToSlug(projectPath: string): string {
  return projectPath.replace(/\//g, "-");
}

/**
 * Find the most recently modified session file for a project.
 * Used as a fallback when CLAUDE_SESSION_ID is not available.
 *
 * @param projectPath - The project directory path
 * @returns The session ID of the most recent session, or null if not found
 */
export async function findMostRecentSession(
  projectPath: string
): Promise<string | null> {
  const slug = projectPathToSlug(projectPath);
  const sessionsDir = path.join(os.homedir(), ".claude", "projects", slug);

  try {
    const glob = new Bun.Glob("*.jsonl");
    let mostRecent: { id: string; mtime: number } | null = null;

    for await (const file of glob.scan(sessionsDir)) {
      const filePath = path.join(sessionsDir, file);
      const stat = await Bun.file(filePath).stat();
      if (!mostRecent || stat.mtime > mostRecent.mtime) {
        mostRecent = { id: file.replace(".jsonl", ""), mtime: stat.mtime };
      }
    }

    return mostRecent?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Extract text content from a message, handling both string and array formats
 */
function extractTextContent(content: string | MessageContent[]): string {
  if (typeof content === "string") {
    return content;
  }

  // Filter for text blocks, ignore thinking blocks
  return content
    .filter(
      (block): block is MessageContent & { text: string } =>
        block.type === "text" && typeof block.text === "string"
    )
    .map((block) => block.text)
    .join("\n\n");
}

/**
 * Get the last Claude response from the current session
 *
 * @param sessionId - The CLAUDE_SESSION_ID from environment
 * @param projectPath - The current working directory / project path
 * @returns The last assistant response text, or null if not found
 */
export async function getLastClaudeResponse(
  sessionId?: string,
  projectPath?: string
): Promise<string | null> {
  if (!sessionId || !projectPath) {
    return null;
  }

  const claudeDir = path.join(os.homedir(), ".claude");
  const slug = projectPathToSlug(projectPath);
  const sessionFile = path.join(claudeDir, "projects", slug, `${sessionId}.jsonl`);

  try {
    const file = Bun.file(sessionFile);
    if (!(await file.exists())) {
      return null;
    }

    const content = await file.text();
    const lines = content.trim().split("\n").reverse();

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as SessionMessage;
        if (entry.type === "assistant" && entry.message?.content) {
          const text = extractTextContent(entry.message.content);
          if (text.trim()) {
            return text;
          }
        }
      } catch {
        // Skip malformed lines
        continue;
      }
    }
  } catch {
    return null;
  }

  return null;
}
