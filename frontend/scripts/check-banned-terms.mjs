/**
 * 금지·유사 표현 회귀 방지: 중개·broker·中介·môi giới 등.
 * 소스 트리를 순회하며 매칭 시 비종료 코드 1로 종료합니다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..", "src");
const EXT = /\.(ts|tsx|js|jsx|md)$/;

/** @type {{ label: string; test: (line: string) => boolean }[]} */
const RULES = [
  { label: "중개", test: (line) => line.includes("중개") },
  { label: "中介", test: (line) => line.includes("中介") },
  {
    label: "broker (word)",
    test: (line) => /\bbrokers?\b/i.test(line) || /\bbrokerage\b/i.test(line),
  },
  { label: "môi giới", test: (line) => /môi giới/i.test(line) },
];

function walk(dir, files) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walk(p, files);
    } else if (ent.isFile() && EXT.test(ent.name)) {
      files.push(p);
    }
  }
}

const files = [];
walk(ROOT, files);

let failed = false;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { label, test } of RULES) {
      if (test(line)) {
        failed = true;
        const rel = path.relative(path.join(import.meta.dirname, ".."), file);
        console.error(`${rel}:${i + 1}: banned term (${label}): ${line.trim().slice(0, 200)}`);
      }
    }
  });
}

if (failed) {
  console.error("\ncheck-banned-terms: fix or remove the above matches (legal copy must stay non-broker wording).");
  process.exit(1);
}
