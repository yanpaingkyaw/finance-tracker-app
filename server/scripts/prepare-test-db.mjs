import { spawnSync } from "node:child_process";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  console.error("TEST_DATABASE_URL is required for backend tests.");
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  DIRECT_URL: process.env.DIRECT_URL ?? testDatabaseUrl,
};
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npx, ["prisma", "migrate", "deploy"], {
  cwd: new URL("..", import.meta.url),
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
