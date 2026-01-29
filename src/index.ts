// Public CLI API
export { spawnCanvas, detectTerminal } from './terminal';
export type { SpawnOptions, SpawnResult, TerminalEnvironment } from './terminal';

// Export functionality
export { formatFeedbackForExport, formatFeedbackForClaudeCode, exportComments } from './lib/export-formatter';

// Types
export type { Comment, CommentType, CanvasOptions, ReviewSession } from './canvases/review/types';
