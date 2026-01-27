import type { Comment } from '../canvases/review/types';
import type { ClientMessage, ServerMessage } from './types';
import { getSocketPathForFile } from './types';

export interface IPCServerCallbacks {
  onGetComments: () => Comment[];
  onGetStatus: () => { filePath: string; totalComments: number; unresolvedCount: number };
  onClose: () => void;
}

export class IPCServer {
  private server: ReturnType<typeof Bun.serve> | null = null;
  private socketPath: string;
  private callbacks: IPCServerCallbacks;

  constructor(filePath: string, callbacks: IPCServerCallbacks) {
    this.socketPath = getSocketPathForFile(filePath);
    this.callbacks = callbacks;
  }

  async start(): Promise<void> {
    // Clean up existing socket
    try {
      await Bun.$`rm -f ${this.socketPath}`.quiet();
    } catch {
      // Ignore
    }

    this.server = Bun.serve({
      unix: this.socketPath,
      fetch: async (req) => {
        const text = await req.text();
        const message = JSON.parse(text) as ClientMessage;
        const response = this.handleMessage(message);
        return new Response(JSON.stringify(response));
      },
    });
  }

  private handleMessage(message: ClientMessage): ServerMessage {
    switch (message.type) {
      case 'getComments': {
        const comments = this.callbacks.onGetComments();
        return {
          type: 'comments',
          data: comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          })),
        };
      }
      case 'getStatus': {
        const status = this.callbacks.onGetStatus();
        return {
          type: 'status',
          data: status,
        };
      }
      case 'close': {
        this.callbacks.onClose();
        return { type: 'ready', filePath: '' };
      }
      default:
        return { type: 'ready', filePath: '' };
    }
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
    // Clean up socket file
    Bun.$`rm -f ${this.socketPath}`.quiet().catch(() => {});
  }
}
