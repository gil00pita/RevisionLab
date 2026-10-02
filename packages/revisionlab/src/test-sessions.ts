export interface TestSession {
  id: string;
  name: string;
  route: string;
  participant: string | null;
  createdBy: string;
  status: "waiting" | "live" | "completed" | "expired";
  maxMinutes: number;
  createdAt: number;
  expiresAt: number;
  startedAt: number | null;
  endedAt: number | null;
  flowId: string | null;
}
export interface TestEvent {
  id: string;
  t: number;
  type: "screen" | "move" | "click" | "key" | "scroll";
  route: string;
  screenId?: string;
  x?: number;
  y?: number;
  key?: string;
}
export interface TestScreen {
  id: string;
  title: string;
  route: string;
  screenshot: string | null;
}
export interface TestDetail {
  session: TestSession;
  events: TestEvent[];
  screens: TestScreen[];
}
/** Attribute input arriving during an upload to the timestamped screen it belongs to. */
export function timelineEvents(events: TestEvent[]): TestEvent[] {
  let current: TestEvent | undefined;
  return [...events]
    .sort(
      (a, b) =>
        a.t - b.t ||
        Number(b.type === "screen") - Number(a.type === "screen") ||
        Number(Boolean(a.screenId)) - Number(Boolean(b.screenId)),
    )
    .map((event) => {
      if (event.type === "screen") current = event;
      return event.type !== "screen" &&
        current?.route === event.route &&
        current.screenId
        ? { ...event, screenId: current.screenId }
        : event;
    });
}
export function sessionMetrics(
  session: TestSession,
  events: TestEvent[],
  now = Date.now(),
) {
  const duration =
    session.startedAt === null
      ? 0
      : Math.max(
          0,
          Math.min(session.endedAt ?? now, session.expiresAt) -
            session.startedAt,
        );
  const screens = new Map<
    string,
    { duration: number; clicks: number; route: string }
  >();
  let current = "",
    previous = 0,
    clicks = 0;
  for (const event of timelineEvents(events)) {
    if (event.t > duration) continue;
    const key = event.screenId ?? event.route;
    if (key !== current) {
      if (current)
        screens.get(current)!.duration += Math.max(0, event.t - previous);
      current = key;
      previous = event.t;
    }
    if (!screens.has(key))
      screens.set(key, { duration: 0, clicks: 0, route: event.route });
    if (event.type === "click") {
      clicks++;
      screens.get(key)!.clicks++;
    }
  }
  if (current)
    screens.get(current)!.duration += Math.max(0, duration - previous);
  return { duration, clicks, screens };
}
export const testKeys = [
  "[masked]",
  "Enter",
  "Tab",
  "Escape",
  "Backspace",
  "Delete",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Shift",
  "Control",
  "Alt",
  "Meta",
] as const;
