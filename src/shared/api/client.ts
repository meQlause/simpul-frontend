import type { ZodType } from 'zod';
import { errorEnvelope } from './error.schema';
import { ApiError } from './error';

export function apiUrl(path: string) {
  return `${import.meta.env.VITE_API_BASE ?? ''}/api/v1${path}`;
}

export async function getResponse<ResponseData>(
  path: string,
  schema: ZodType<ResponseData>,
): Promise<ResponseData> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    throw new ApiError(errorEnvelope.parse(body).error);
  }
  return schema.parse(body);
}
