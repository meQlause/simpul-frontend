import type { ZodType } from 'zod';
import { errorEnvelope } from './error.schema';
import { ApiError } from './error';

export async function getResponse<ResponseData>(
  path: string,
  schema: ZodType<ResponseData>,
): Promise<ResponseData> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/v1${path}`, {
    credentials: 'include',
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    throw new ApiError(errorEnvelope.parse(body).error.code);
  }
  return schema.parse(body);
}
