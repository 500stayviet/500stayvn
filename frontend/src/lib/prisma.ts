import { PrismaClient } from "@prisma/client";

function getNormalizedDatabaseUrl(): string | null {
  const raw = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!raw) return null;
  // Amplify/console copy-paste can accidentally include quotes, trailing commas, or spaces.
  const normalized = raw.trim().replace(/^['"]+|['"]+$/g, "").replace(/,+$/g, "");
  return normalized || null;
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
  const normalizedUrl = getNormalizedDatabaseUrl();
  if (normalizedUrl) {
    process.env.DATABASE_URL = normalizedUrl;
  }
  const base = normalizedUrl
    ? new PrismaClient({ datasources: { db: { url: normalizedUrl } } })
    : new PrismaClient();
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

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
