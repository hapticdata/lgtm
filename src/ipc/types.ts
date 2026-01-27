import path from 'path';

export interface IPCMessage {
  type: string;
  [key: string]: unknown;
}

export interface UpdateMessage extends IPCMessage {
  type: 'update';
  comments?: Array<{
    lineNumber: number;
    content: string;
    type: string;
  }>;
}

export interface CloseMessage extends IPCMessage {
  type: 'close';
}

export interface GetCommentsMessage extends IPCMessage {
  type: 'getComments';
}

export interface GetStatusMessage extends IPCMessage {
  type: 'getStatus';
}

export interface CommentsResponse extends IPCMessage {
  type: 'comments';
  data: Array<{
    id: string;
    lineNumber: number;
    lineContent: string;
    content: string;
    type: string;
    createdAt: string;
    resolved: boolean;
  }>;
}

export interface StatusResponse extends IPCMessage {
  type: 'status';
  data: {
    filePath: string;
    totalComments: number;
    unresolvedCount: number;
  };
}

export interface ReadyMessage extends IPCMessage {
  type: 'ready';
  filePath: string;
}

export type ClientMessage = UpdateMessage | CloseMessage | GetCommentsMessage | GetStatusMessage;
export type ServerMessage = CommentsResponse | StatusResponse | ReadyMessage;

export function getSocketPath(id: string): string {
  return `/tmp/lgtuim-${id}.sock`;
}

export function getSocketPathForFile(filePath: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  return `/tmp/lgtuim-${basename}.sock`;
}
