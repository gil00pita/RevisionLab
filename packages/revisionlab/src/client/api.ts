export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
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
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error ?? `Request failed (${response.status}).`,
    );
  }
  return data as T;
}
