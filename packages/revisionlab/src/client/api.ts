export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  apiPath: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiPath}/${path}`, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      data.error ?? `Request failed (${response.status}).`,
      data,
    );
  }
  return (await response.json()) as T;
}
