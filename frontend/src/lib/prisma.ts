import { PrismaClient } from "@prisma/client";

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

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
