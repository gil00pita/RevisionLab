import { RevisionLabWorkspace } from "revisionlab";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["view", "flow", "screen", "session", "workspace"]) {
    const value = params[key];
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
  }
  return <RevisionLabWorkspace initialSearch={query.toString()} />;
}
