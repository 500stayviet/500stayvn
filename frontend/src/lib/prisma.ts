import { PrismaClient } from "@prisma/client";

function normalizeDatabaseUrlEnv() {
  const raw = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!raw) return;
  // Amplify/console copy-paste can accidentally include quotes, trailing commas, or spaces.
  const normalized = raw.trim().replace(/^['"]+|['"]+$/g, "").replace(/,+$/g, "");
  process.env.DATABASE_URL = normalized;
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const READ_OPS = new Set([
  "findUnique",
  "findFirst",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

function createPrismaClient() {
  normalizeDatabaseUrlEnv();
  const base = new PrismaClient();
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);
          if (!model || READ_OPS.has(operation)) return result;
          const { scheduleAdminDomainEventFromMiddleware } = await import(
            "@/lib/server/adminDomainEvents"
          );
          void scheduleAdminDomainEventFromMiddleware(
            base,
            { model, action: operation, args },
            result,
          );
          return result;
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

/** `$extends` 적용 후 클라이언트 — 동적 import 경로에서도 동일 타입을 쓰기 위함 */
export type AppPrismaClient = typeof prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
