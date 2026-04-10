import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';
import { rejectAppReadUnlessRoomParticipant } from '@/lib/server/appApiReadGuard';

/**
 * SSE: 방 메시지/읽지 않음 변화를 서버에서 폴링해 푸시 (클라이언트 폴링 대체)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const roomId = (id || '').trim();
  if (!roomId) {
    return new Response(JSON.stringify({ error: 'invalid_room_id' }), { status: 400 });
  }
  const denied = await rejectAppReadUnlessRoomParticipant(request, roomId);
  if (denied) return denied;

  const actor = getAppActorId(request);
  if (!actor) {
    return new Response(JSON.stringify({ error: 'actor_required' }), { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      let lastSig = '';
      const tick = async () => {
        try {
          const rows = (await prisma.$queryRaw<
            Array<{ latest_id: string | null; latest_at: Date | null; unread: bigint }>
          >`
            SELECT
              (
                SELECT m."id"
                FROM "Message" m
                WHERE m."roomId" = ${roomId}
                ORDER BY m."createdAt" DESC
                LIMIT 1
              ) AS latest_id,
              (
                SELECT m."createdAt"
                FROM "Message" m
                WHERE m."roomId" = ${roomId}
                ORDER BY m."createdAt" DESC
                LIMIT 1
              ) AS latest_at,
              (
                SELECT COUNT(*)::bigint
                FROM "Message" m
                WHERE m."roomId" = ${roomId}
                  AND m."isRead" = false
                  AND m."senderId" <> ${actor}
              ) AS unread
          `) as Array<{ latest_id: string | null; latest_at: Date | null; unread: bigint }>;

          const row = rows[0];
          const latestId = row?.latest_id ?? null;
          const latestAt = row?.latest_at ? row.latest_at.toISOString() : null;
          const unread = Number(row?.unread ?? 0);
          const sig = `${latestId ?? ''}|${latestAt ?? ''}|${unread}`;
          if (sig !== lastSig) {
            lastSig = sig;
            send({
              type: 'room_activity',
              latestMessageId: latestId,
              latestCreatedAt: latestAt,
              unreadNotFromActor: unread,
            });
          }
        } catch {
          send({ type: 'error', message: 'tick_failed' });
        }
      };

      send({ type: 'connected', roomId });
      await tick();
      const interval = setInterval(() => {
        void tick();
      }, 2000);

      const onAbort = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      };
      request.signal.addEventListener('abort', onAbort);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
