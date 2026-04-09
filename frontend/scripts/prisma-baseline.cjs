/**
 * 이미 적용된 DB에 Prisma 이력만 맞출 때: 마이그레이션 폴더명 순으로 resolve.
 * 실행: npm run db:baseline
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const migrationsDir = path.join(root, 'prisma', 'migrations');

if (!fs.existsSync(migrationsDir)) {
  console.error('No prisma/migrations');
  process.exit(1);
}

const dirs = fs
  .readdirSync(migrationsDir)
  .filter((d) => fs.statSync(path.join(migrationsDir, d)).isDirectory())
  .sort();

for (const d of dirs) {
  console.log('resolve --applied', d);
  execSync(`npx prisma migrate resolve --applied ${d} --schema prisma/schema.prisma`, {
    stdio: 'inherit',
    cwd: root,
  });
}
