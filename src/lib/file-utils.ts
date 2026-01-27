import path from 'path';

export async function fileExists(filePath: string): Promise<boolean> {
  const file = Bun.file(filePath);
  return file.exists();
}

export async function readFile(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  return file.text();
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await Bun.write(filePath, content);
}

export function resolvePath(filePath: string): string {
  return path.resolve(filePath);
}

export function getBasename(filePath: string): string {
  return path.basename(filePath);
}

export function getDirname(filePath: string): string {
  return path.dirname(filePath);
}

export function joinPath(...parts: string[]): string {
  return path.join(...parts);
}
