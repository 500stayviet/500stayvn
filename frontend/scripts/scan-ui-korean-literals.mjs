#!/usr/bin/env node
/**
 * src/ 하위 .ts/.tsx 에서 한글이 포함된 줄을 수집합니다.
 * 정책·전처리·제외 경로는 scan-ui-korean-literals-lib.mjs 를 참고하세요.
 *
 * 사용: npm run scan:ui-ko
 *       node scripts/scan-ui-korean-literals.mjs --max-hits 400  (초과 시 exit 1)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  shouldSkipScanFile,
  preprocessSourceForScan,
  stripLineEndComment,
} from "./scan-ui-korean-literals-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.join(__dirname, "../src");
const HANGUL = /[가-힣]/;

const SKIP_DIR_NAMES = new Set([
  "__tests__",
  "test",
  "tests",
  ".next",
  "node_modules",
]);

const EXT_OK = new Set([".ts", ".tsx"]);

function parseMaxHits() {
  const i = process.argv.indexOf("--max-hits");
  if (i < 0 || i + 1 >= process.argv.length) return null;
  const n = Number(process.argv[i + 1]);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function walkFiles(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIR_NAMES.has(ent.name)) continue;
      walkFiles(full, acc);
    } else if (EXT_OK.has(path.extname(ent.name))) {
      acc.push(full);
    }
  }
  return acc;
}

function main() {
  const maxHits = parseMaxHits();
  const files = walkFiles(SRC_ROOT).filter((f) => !shouldSkipScanFile(f));
  /** @type {{ file: string; line: number; snippet: string }[]} */
  const hits = [];
  /** @type {Map<string, number>} */
  const byFile = new Map();

  for (const file of files) {
    const ext = path.extname(file);
    const raw = fs.readFileSync(file, "utf8");
    const text =
      ext === ".tsx" ? preprocessSourceForScan(raw, ".tsx") : preprocessSourceForScan(raw, ".ts");
    const lines = text.split("\n");
    const rel = path.relative(path.join(__dirname, ".."), file);
    lines.forEach((line, i) => {
      const code = stripLineEndComment(line);
      if (!HANGUL.test(code)) return;
      byFile.set(rel, (byFile.get(rel) ?? 0) + 1);
      hits.push({
        file: rel,
        line: i + 1,
        snippet: code.trim().slice(0, 140),
      });
    });
  }

  const ranked = [...byFile.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([file, count]) => ({ file, count }));

  console.log(
    `한글 리터럴(후보) 줄: 총 ${hits.length} — 파일 ${ranked.length}개\n`,
  );
  console.log("우선순위 (파일별 히트 수 내림차순, 상위 40):\n");
  ranked.slice(0, 40).forEach((r, j) => {
    console.log(
      `${String(j + 1).padStart(2)}. ${r.count.toString().padStart(4)}  ${r.file}`,
    );
  });
  console.log("\n전체 상세는 stdout JSON 블록 참고.\n");
  console.log(
    JSON.stringify(
      {
        totalHits: hits.length,
        filesWithHits: ranked.length,
        topFiles: ranked.slice(0, 80),
        hits,
      },
      null,
      2,
    ),
  );

  if (maxHits != null && hits.length > maxHits) {
    console.error(
      `\nscan:ui-ko: 한글 후보 줄 ${hits.length}개 > 허용치 ${maxHits} (--max-hits)\n`,
    );
    process.exit(1);
  }
}

main();
