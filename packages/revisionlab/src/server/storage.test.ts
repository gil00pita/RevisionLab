import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import { getDatabase, write } from "./database.js";
import { insertArtifact, prepareArtifact, readArtifact } from "./artifacts.js";
import { resolveConfig } from "./config.js";
import { HttpError } from "./security.js";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHoQAAAAASUVORK5CYII=";

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), "revisionlab-storage-"));
  const config = {
    projectId: randomUUID(),
    projectName: "Storage test",
    databaseUrl: `file:${join(directory, "db.sqlite")}`,
  };
  const client = await getDatabase(config);
  t.after(async () => {
    client.close();
    await rm(directory, { recursive: true, force: true });
  });
  return { client, config, directory };
}

test("remote deployments use bounded private database artifacts without requiring an object provider", async (t) => {
  const f = await fixture(t);
  const config = resolveConfig({
    ...f.config,
    databaseUrl: "libsql://storage-test.invalid",
  });
  const artifact = await prepareArtifact(PNG, config);
  assert.ok(artifact);
  assert.equal(artifact.storage, "database");
  await write(f.client, async (transaction) => {
    await insertArtifact(transaction, artifact);
  });
  const response = await readArtifact(artifact.id, f.client, config);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.deepEqual(
    Buffer.from(await response.arrayBuffer()),
    Buffer.from(PNG.split(",")[1], "base64"),
  );
});

test("server-only artifact adapters receive opaque keys and authenticated reads can retrieve them", async (t) => {
  const f = await fixture(t);
  const store = new Map<string, Uint8Array>();
  const config = resolveConfig({
    ...f.config,
    artifactStorage: {
      async put(key, bytes) {
        store.set(key, bytes);
      },
      async get(key) {
        return store.get(key) ?? null;
      },
      async delete(key) {
        store.delete(key);
      },
    },
  });
  const artifact = await prepareArtifact(PNG, config);
  assert.ok(artifact);
  assert.equal(artifact.storage, "custom");
  await write(f.client, async (transaction) => {
    await insertArtifact(transaction, artifact);
  });
  assert.equal((await readArtifact(artifact.id, f.client, config)).status, 200);
  assert.equal(store.size, 1);
});

test("blank optional configuration is treated as unset and Vercel requires durable storage", () => {
  const keys = [
    "VERCEL",
    "REVISIONLAB_DATABASE_URL",
    "REVISIONLAB_DATABASE_AUTH_TOKEN",
    "RESEND_API_KEY",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  try {
    delete process.env.VERCEL;
    process.env.REVISIONLAB_DATABASE_URL = "";
    process.env.RESEND_API_KEY = "";
    process.env.REVISIONLAB_DATABASE_AUTH_TOKEN = "";
    const config = resolveConfig({ projectId: "one", projectName: "One" });
    assert.equal(config.databaseUrl, "file:.revisionlab/revisionlab.db");
    assert.equal(config.resendApiKey, undefined);
    assert.equal(config.databaseAuthToken, undefined);
    process.env.VERCEL = "1";
    assert.throws(
      () => resolveConfig({ projectId: "one", projectName: "One" }),
      (error) => error instanceof HttpError && error.status === 503,
    );
    assert.equal(
      resolveConfig({
        projectId: "one",
        projectName: "One",
        databaseUrl: "libsql://db.invalid",
      }).databaseUrl,
      "libsql://db.invalid",
    );
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("artifact reads reject replaced file symlinks and capture rejects redirected storage roots", async (t) => {
  const f = await fixture(t);
  const artifactsDirectory = join(f.directory, "artifacts");
  const config = resolveConfig({ ...f.config, artifactsDirectory });
  const artifact = await prepareArtifact(PNG, config);
  assert.ok(artifact);
  await write(f.client, async (transaction) => {
    await insertArtifact(transaction, artifact);
  });
  const unrelated = join(f.directory, "unrelated.txt");
  await writeFile(unrelated, "not an artifact");
  await unlink(join(artifactsDirectory, artifact.id));
  await symlink(unrelated, join(artifactsDirectory, artifact.id));
  await assert.rejects(
    readArtifact(artifact.id, f.client, config),
    (error) => error instanceof HttpError && error.status === 503,
  );
  const redirected = join(f.directory, "redirected");
  await mkdir(redirected);
  const link = join(f.directory, "linked-artifacts");
  await symlink(redirected, link);
  await assert.rejects(
    prepareArtifact(PNG, { ...config, artifactsDirectory: link }),
    (error) => error instanceof HttpError && error.status === 503,
  );
});
