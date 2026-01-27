export type CommentType = 'blocker' | 'concern' | 'question' | 'suggestion' | 'praise' | 'acknowledge';

export interface Comment {
  id: string;
  lineNumber: number;
  lineContent: string;
  content: string;
  type: CommentType;
  createdAt: Date;
  resolved: boolean;
}

export interface DocumentLine {
  number: number;
  content: string;
  isCodeBlock: boolean;
  codeLanguage?: string;
}

export interface Document {
  name: string;
  filePath: string;
  content: string;
  lines: DocumentLine[];
  loadedAt: Date;
}

export interface ReviewSession {
  id: string;
  filePath: string;
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export type ViewMode = 'document' | 'summary';

export type CommentFilter = CommentType | 'all' | 'unresolved';

export type FocusPanel = 'document' | 'comments';

export interface ReviewState {
  document: Document | null;
  comments: Comment[];
  viewMode: ViewMode;
  selectedLineNumber: number;
  selectedCommentIndex: number;
  commentFilter: CommentFilter;
  isCommentFormOpen: boolean;
  editingCommentId: string | null;
  focusPanel: FocusPanel;
  scrollOffset: number;
  showHelp: boolean;
}

export type ReviewAction =
  | { type: 'SET_DOCUMENT'; payload: Document }
  | { type: 'ADD_COMMENT'; payload: Comment }
  | { type: 'UPDATE_COMMENT'; payload: { id: string; updates: Partial<Comment> } }
  | { type: 'DELETE_COMMENT'; payload: string }
  | { type: 'TOGGLE_RESOLVE'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_SELECTED_LINE'; payload: number }
  | { type: 'SET_SELECTED_COMMENT'; payload: number }
  | { type: 'SET_COMMENT_FILTER'; payload: CommentFilter }
  | { type: 'OPEN_COMMENT_FORM' }
  | { type: 'CLOSE_COMMENT_FORM' }
  | { type: 'SET_EDITING_COMMENT'; payload: string | null }
  | { type: 'SET_FOCUS_PANEL'; payload: FocusPanel }
  | { type: 'SET_SCROLL_OFFSET'; payload: number }
  | { type: 'TOGGLE_HELP' }
  | { type: 'LOAD_COMMENTS'; payload: Comment[] };

export interface CanvasOptions {
  session?: string;
  commentsFile?: string;
  readonly?: boolean;
  socketPath?: string;
}
