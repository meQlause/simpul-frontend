export class ApiError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'ApiError';
  }
}
