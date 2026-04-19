/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.join(__dirname, "..");
const toRemove = new Set();

toRemove.add(path.join(root, ".next"));
toRemove.add(path.join(os.tmpdir(), "500stayviet-next"));

const envDir = process.env.NEXT_DIST_DIR?.trim();
if (envDir) {
  toRemove.add(path.isAbsolute(envDir) ? envDir : path.join(root, envDir));
}

for (const dir of toRemove) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log("Removed", dir);
  }
}
