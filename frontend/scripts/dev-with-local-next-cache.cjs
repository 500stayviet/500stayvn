/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Put Next.js output under os.tmpdir() to avoid OneDrive/Desktop file-lock errors
 * (UNKNOWN / errno -4094) when opening compiled files under `.next/server/...`.
 */
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const root = path.join(__dirname, "..");
const cacheDir = path.join(os.tmpdir(), "500stayviet-next");
process.env.NEXT_DIST_DIR = cacheDir;

const child = spawn("npx", ["next", "dev", "-p", "3000"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
