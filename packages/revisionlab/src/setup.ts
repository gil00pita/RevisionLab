export interface SetupProgress {
  step: number;
  completed: boolean;
  name: string;
  email: string;
}

export function detectLiveUrl(origin: string): string {
  try {
    const url = new URL(origin);
    return ["http:", "https:"].includes(url.protocol) ? url.origin : "";
  } catch {
    return "";
  }
}
