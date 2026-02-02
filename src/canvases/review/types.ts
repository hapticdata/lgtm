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

export interface CanvasOptions {
  session?: string;
  commentsFile?: string;
  readonly?: boolean;
  exportOnQuit?: string;
}
