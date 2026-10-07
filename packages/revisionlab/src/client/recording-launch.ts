export const recordingLaunchParameter = "revisionlabRecord";

/** Preserve the prototype destination while asking its widget to open setup. */
export function recordingLaunchHref(prototypeUrl: string): string {
  const url = new URL(prototypeUrl, "http://revisionlab.local");
  url.searchParams.set(recordingLaunchParameter, "1");
  return prototypeUrl.startsWith("/")
    ? `${url.pathname}${url.search}${url.hash}`
    : url.toString();
}
