import type { ClientMessage, CommentsResponse, StatusResponse } from './types';
import { getSocketPathForFile } from './types';

export class IPCClient {
  private socketPath: string;

  constructor(filePath: string) {
    this.socketPath = getSocketPathForFile(filePath);
  }

  private async sendMessage<T>(message: ClientMessage): Promise<T> {
    const response = await fetch(`unix://${this.socketPath}`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
    return response.json() as Promise<T>;
  }

  async getComments(): Promise<CommentsResponse['data']> {
    const response = await this.sendMessage<CommentsResponse>({ type: 'getComments' });
    return response.data;
  }

  async getStatus(): Promise<StatusResponse['data']> {
    const response = await this.sendMessage<StatusResponse>({ type: 'getStatus' });
    return response.data;
  }

  async close(): Promise<void> {
    await this.sendMessage({ type: 'close' });
  }
}
