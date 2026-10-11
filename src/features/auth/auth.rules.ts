export function returnPath(path: unknown): string {
  if (typeof path === 'string' && /^\/(?![/\\])/.test(path)) {
    return path;
  }

  return '/';
}
