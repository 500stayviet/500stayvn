import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaMiddlewareParams = {
  model?: string;
  action: string;
  args: unknown;
};

const SKIP_MODELS = new Set([
  "AdminDomainEvent",
  "AdminAckState",
  "Session",
  "Account",
  "VerificationToken",
  /** 채팅 메시지마다 이벤트가 너무 많아지므로 제외 — 방 단위는 ChatRoom으로 감지 */
  "Message",
]);

const WRITE = new Set([
  "create",
  "update",
  "upsert",
  "delete",
  "createMany",
  "updateMany",
  "deleteMany",
]);

function modelToResource(model: string): string | null {
  switch (model) {
    case "User":
      return "user";
    case "Property":
      return "property";
    case "Booking":
      return "booking";
    case "PaymentRecord":
      return "payment";
    case "Message":
    case "ChatRoom":
      return "chat";
    case "LessorProfile":
      return "lessor_profile";
    case "AdminModerationAudit":
      return "audit";
    case "AdminSystemLog":
      return "system_log";
    case "AdminAccount":
      return "admin_account";
    case "AdminSharedMemo":
      return "admin_memo";
    default:
      return null;
  }
}

function extractResourceId(
  params: PrismaMiddlewareParams,
  result: unknown,
): string | undefined {
  try {
    const args = params.args as {
      where?: { id?: string; roomId?: string; bookingId?: string };
    };
    if (args?.where?.id && typeof args.where.id === "string") return args.where.id;
    if (args?.where?.roomId && typeof args.where.roomId === "string")
      return args.where.roomId;
    if (args?.where?.bookingId && typeof args.where.bookingId === "string")
      return args.where.bookingId;
    if (result && typeof result === "object" && result !== null && "id" in result) {
      const id = (result as { id?: unknown }).id;
      if (typeof id === "string") return id;
      if (typeof id === "number") return String(id);
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

/**
 * Prisma 미들웨어에서 호출 — 동일 요청 내 재귀 방지(SKIP_MODELS) 및 비동기 기록
 */
export async function scheduleAdminDomainEventFromMiddleware(
  prisma: PrismaClient,
  params: PrismaMiddlewareParams,
  result: unknown,
): Promise<void> {
  const model = params.model;
  if (!model || SKIP_MODELS.has(model)) return;
  if (!WRITE.has(params.action)) return;

  const resource = modelToResource(model);
  if (!resource) return;

  const resourceId = extractResourceId(params, result);

  try {
    await prisma.adminDomainEvent.create({
      data: {
        resource,
        action: `${model}.${params.action}`,
        resourceId: resourceId ?? null,
        payload: { model } as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    console.error("[admin-domain-event] insert failed", e);
  }
}
