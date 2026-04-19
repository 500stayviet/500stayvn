import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/server/adminAuthServer";
import { prisma } from "@/lib/prisma";
import { reportApiException, reportSlowOperation } from "@/lib/server/apiMonitoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 관리자 전용 SSE — `AdminDomainEvent` 테이블을 커서로 읽어 변경을 푸시합니다.
 * (서버는 DB 이벤트 원장을 폴링하지만, 클라이언트는 구독 한 번으로 수신)
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const latest = await prisma.adminDomainEvent.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  let cursor = latest?.id ?? 0;

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      send({ type: "connected", afterSeq: cursor });

      const pollMs = 1200;
      const pollRoute = "poll /api/admin/domain-events/stream";
      const interval = setInterval(async () => {
        const pollStarted = Date.now();
        try {
          if (request.signal.aborted) return;
          const rows = await prisma.adminDomainEvent.findMany({
            where: { id: { gt: cursor } },
            orderBy: { id: "asc" },
            take: 200,
          });
          reportSlowOperation(pollRoute, pollStarted, { rowCount: rows.length });
          for (const row of rows) {
            cursor = row.id;
            send({
              type: "event",
              seq: row.id,
              resource: row.resource,
              action: row.action,
              resourceId: row.resourceId,
              createdAt: row.createdAt.toISOString(),
            });
          }
        } catch (e) {
          console.error("[admin-domain-events stream] poll", e);
          reportApiException(pollRoute, e, pollStarted);
        }
      }, pollMs);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": hb\n\n"));
        } catch {
          /* closed */
        }
      }, 20000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
