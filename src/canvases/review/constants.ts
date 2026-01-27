import type { CommentType } from './types';

export interface CommentTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  key: string;
}

export const COMMENT_TYPE_CONFIG: Record<CommentType, CommentTypeConfig> = {
  blocker: {
    label: 'BLOCKER',
    color: 'red',
    bgColor: 'bgRed',
    icon: '!',
    key: '1',
  },
  concern: {
    label: 'CONCERN',
    color: 'yellow',
    bgColor: 'bgYellow',
    icon: '~',
    key: '2',
  },
  question: {
    label: 'QUESTION',
    color: 'blue',
    bgColor: 'bgBlue',
    icon: '?',
    key: '3',
  },
  suggestion: {
    label: 'SUGGEST',
    color: 'magenta',
    bgColor: 'bgMagenta',
    icon: '*',
    key: '4',
  },
  praise: {
    label: 'PRAISE',
    color: 'green',
    bgColor: 'bgGreen',
    icon: '+',
    key: '5',
  },
  acknowledge: {
    label: 'ACK',
    color: 'cyan',
    bgColor: 'bgCyan',
    icon: '.',
    key: '6',
  },
};

export const COMMENT_TYPE_ORDER: CommentType[] = [
  'blocker',
  'concern',
  'question',
  'suggestion',
  'praise',
  'acknowledge',
];

export const FILTER_OPTIONS: Array<{ key: string; label: string; value: CommentType | 'all' | 'unresolved' }> = [
  { key: '0', label: 'All', value: 'all' },
  { key: '1', label: 'Blockers', value: 'blocker' },
  { key: '2', label: 'Concerns', value: 'concern' },
  { key: '3', label: 'Questions', value: 'question' },
  { key: '4', label: 'Suggestions', value: 'suggestion' },
  { key: '5', label: 'Praise', value: 'praise' },
  { key: '6', label: 'Acknowledge', value: 'acknowledge' },
  { key: 'u', label: 'Unresolved', value: 'unresolved' },
];

export const KEYBINDINGS = {
  // Document navigation
  scrollDown: ['j', 'down'],
  scrollUp: ['k', 'up'],
  goToTop: ['g'],
  goToBottom: ['G'],
  addComment: ['c'],
  switchPanel: ['tab'],

  // Comment panel navigation
  nextComment: ['j', 'down'],
  prevComment: ['k', 'up'],
  editComment: ['e'],
  deleteComment: ['d'],
  toggleResolved: ['r'],
  jumpToLine: ['return'],

  // Global
  cycleFilter: ['f'],
  toggleSummary: ['v'],
  copyToClipboard: ['y'],
  saveSession: ['s'],
  toggleHelp: ['?'],
  quit: ['q', 'escape'],
};
