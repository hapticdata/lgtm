import path from 'path';

export function getStoragePath(filePath: string, session?: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  const dir = path.dirname(filePath);
  const sessionSuffix = session ? `-${session}` : '';
  return path.join(dir, `.lgtm-${basename}${sessionSuffix}.json`);
}
