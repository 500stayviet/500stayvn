/**
 * Chat API (PostgreSQL 원장 + 폴링 구독)
 */

import { withAppActor } from '@/lib/api/withAppActor';
import { getCurrentUserId } from '@/lib/api/auth';

// 채팅방 인터페이스
export interface ChatRoom {
  id: string;
  bookingId: string;
  propertyId: string;
  propertyTitle?: string;
  propertyImage?: string;
  ownerId: string;
  ownerName?: string;
  guestId: string;
  guestName?: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
}

// 메시지 인터페이스
export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export type ChatUnreadSnapshot = {
  asGuest: number;
  asOwner: number;
  byRoom: Record<string, number>;
};

export const CHAT_UNREAD_UPDATED_EVENT = 'chatUnreadUpdated';

type GetMessagesOptions = {
  limit?: number;
  before?: string;
};

/** 한 번에 더 보기(스크롤 업) */
export const CHAT_MESSAGE_PAGE_SIZE = 50;
/** 폴링 시 최근 N개만 가져와 기존 목록과 병합 (전체 교체 방지) */
export const CHAT_POLL_WINDOW_SIZE = 80;

/** id 기준 병합 후 시간순 — 폴링 윈도우 + 위로 불러온 과거 메시지 공존 */
export function mergeChatMessageWindow(prev: ChatMessage[], windowSlice: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  for (const m of prev) map.set(m.id, m);
  for (const m of windowSlice) map.set(m.id, m);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * 모든 채팅방 가져오기
 */
export async function getAllChatRooms(): Promise<ChatRoom[]> {
  const uid = typeof window !== 'undefined' ? getCurrentUserId() : null;
  if (!uid) return [];
  return getUserChatRooms(uid);
}

/**
 * 사용자의 채팅방 목록 가져오기
 */
export async function getUserChatRooms(userId: string): Promise<ChatRoom[]> {
  if (!userId) return [];
  let rooms: ChatRoom[] = [];
  try {
    const res = await fetch(
      `/api/app/chat/rooms?userId=${encodeURIComponent(userId)}`,
      withAppActor({ cache: 'no-store' })
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { rooms?: ChatRoom[] };
    rooms = Array.isArray(data.rooms) ? data.rooms : [];
  } catch {
    rooms = [];
  }
  return rooms
    .filter(room => room.ownerId === userId || room.guestId === userId)
    .sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA; // 최신순
    });
}

/**
 * 예약 ID로 채팅방 찾기
 */
export async function getChatRoomByBookingId(bookingId: string): Promise<ChatRoom | null> {
  try {
    const res = await fetch(
      `/api/app/chat/rooms?bookingId=${encodeURIComponent(bookingId)}`,
      withAppActor({ cache: 'no-store' })
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { rooms?: ChatRoom[] };
    const list = Array.isArray(data.rooms) ? data.rooms : [];
    return list[0] || null;
  } catch {
    return null;
  }
}

/**
 * 채팅방 ID로 채팅방 찾기
 */
export async function getChatRoom(
  roomId: string,
  actorUserId?: string | null
): Promise<ChatRoom | null> {
  const uid =
    (actorUserId && String(actorUserId).trim()) ||
    (typeof window !== 'undefined' ? getCurrentUserId() : null);
  if (!uid) return null;
  const rooms = await getUserChatRooms(uid);
  return rooms.find((room) => room.id === roomId) || null;
}

/**
 * 속성별 채팅방 찾기
 */
export async function findChatRoom(propertyId: string, ownerId: string, guestId: string): Promise<ChatRoom | null> {
  const rooms = await getAllChatRooms();
  return rooms.find(room => 
    room.propertyId === propertyId && 
    room.ownerId === ownerId && 
    room.guestId === guestId
  ) || null;
}

/**
 * 채팅방 생성
 */
export async function createChatRoom(data: {
  bookingId: string;
  propertyId: string;
  propertyTitle?: string;
  propertyImage?: string;
  ownerId: string;
  ownerName?: string;
  guestId: string;
  guestName?: string;
}): Promise<ChatRoom> {
  const existingRoom = await getChatRoomByBookingId(data.bookingId);
  if (existingRoom) return existingRoom;
  const res = await fetch(
    '/api/app/chat/rooms',
    withAppActor({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  );
  if (!res.ok) throw new Error(`create_chat_room_failed_${res.status}`);
  const created = (await res.json()) as { id: string; bookingId: string; createdAt: string };
  const room = await getChatRoomByBookingId(created.bookingId);
  if (room) return room;
  return {
    id: created.id,
    bookingId: created.bookingId,
    propertyId: data.propertyId,
    propertyTitle: data.propertyTitle,
    propertyImage: data.propertyImage,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
    guestId: data.guestId,
    guestName: data.guestName,
    createdAt: created.createdAt,
  };
}

/**
 * 채팅방의 모든 메시지 가져오기
 */
export async function getChatMessages(chatRoomId: string, options?: GetMessagesOptions): Promise<ChatMessage[]> {
  if (typeof window === 'undefined') return [];
  try {
    const qp = new URLSearchParams();
    if (options?.limit) qp.set('limit', String(options.limit));
    if (options?.before) qp.set('before', options.before);
    const suffix = qp.toString() ? `?${qp.toString()}` : '';
    const res = await fetch(
      `/api/app/chat/rooms/${encodeURIComponent(chatRoomId)}/messages${suffix}`,
      withAppActor({ cache: 'no-store' })
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { messages?: ChatMessage[] };
    const messages: ChatMessage[] = Array.isArray(data.messages) ? data.messages : [];
    return messages
      .filter(msg => msg.chatRoomId === chatRoomId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

/**
 * 메시지 전송
 */
export async function sendMessage(data: {
  chatRoomId: string;
  senderId: string;
  senderName?: string;
  content: string;
}): Promise<ChatMessage> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot send message on server side');
  }
  const res = await fetch(
    `/api/app/chat/rooms/${encodeURIComponent(data.chatRoomId)}/messages`,
    withAppActor({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: data.senderId, content: data.content }),
    })
  );
  if (!res.ok) throw new Error(`send_message_failed_${res.status}`);
  const msg = (await res.json()) as ChatMessage;
  return { ...msg, senderName: data.senderName };
}

/**
 * 메시지 읽음 처리
 */
export async function markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await fetch(
    `/api/app/chat/rooms/${encodeURIComponent(chatRoomId)}/read`,
    withAppActor({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
  );
  window.dispatchEvent(new CustomEvent(CHAT_UNREAD_UPDATED_EVENT, { detail: { userId } }));
}

/**
 * 채팅방의 모든 메시지를 읽음 처리 (취소 시 등)
 */
export async function markAllMessagesInRoomAsRead(chatRoomId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await fetch(
    `/api/app/chat/rooms/${encodeURIComponent(chatRoomId)}/read`,
    withAppActor({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
  );
  const uid = getCurrentUserId();
  if (uid) {
    window.dispatchEvent(new CustomEvent(CHAT_UNREAD_UPDATED_EVENT, { detail: { userId: uid } }));
  }
}

/**
 * 읽지 않은 메시지 수 가져오기 (전체)
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  if (typeof window === 'undefined') return 0;
  
  try {
    const c = await getUnreadCountsByRole(userId);
    return c.asGuest + c.asOwner;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * 역할별 읽지 않은 메시지 수 가져오기
 */
export async function getUnreadCountsByRole(userId: string): Promise<{ asGuest: number; asOwner: number }> {
  if (typeof window === 'undefined') return { asGuest: 0, asOwner: 0 };
  
  try {
    const res = await fetch(
      `/api/app/chat/unread-counts?userId=${encodeURIComponent(userId)}`,
      withAppActor({ cache: 'no-store' })
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { asGuest?: number; asOwner?: number };
    return {
      asGuest: Number(data.asGuest || 0),
      asOwner: Number(data.asOwner || 0),
    };
  } catch (error) {
    console.error('Error getting unread counts by role:', error);
    return { asGuest: 0, asOwner: 0 };
  }
}

/**
 * 역할별 읽지 않은 메시지 모두 읽음 처리
 */
export async function markAllChatAsReadByRole(userId: string, role: 'guest' | 'owner'): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const rooms = await getUserChatRooms(userId);
    const targetRooms = rooms.filter((room) =>
      (role === 'guest' && room.guestId === userId) || (role === 'owner' && room.ownerId === userId)
    );
    await Promise.all(targetRooms.map((room) => markMessagesAsRead(room.id, userId)));
    window.dispatchEvent(new CustomEvent(CHAT_UNREAD_UPDATED_EVENT, { detail: { userId } }));
  } catch (error) {
    console.error('Error marking all chat as read by role:', error);
  }
}

/**
 * 채팅방별 읽지 않은 메시지 수
 */
export async function getUnreadCountByRoom(chatRoomId: string, userId: string): Promise<number> {
  if (typeof window === 'undefined') return 0;
  try {
    const messages = await getChatMessages(chatRoomId);
    return messages.filter(msg => 
      msg.chatRoomId === chatRoomId && 
      msg.senderId !== userId && 
      !msg.isRead
    ).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

export async function refreshChatUnreadSnapshot(
  userId: string,
  roomIds: string[]
): Promise<ChatUnreadSnapshot> {
  if (typeof window === 'undefined' || !userId) {
    return { asGuest: 0, asOwner: 0, byRoom: {} };
  }
  const roleCounts = await getUnreadCountsByRole(userId);
  const byRoom: Record<string, number> = {};
  for (const roomId of roomIds) {
    if (!roomId) continue;
    byRoom[roomId] = await getUnreadCountByRoom(roomId, userId);
  }
  const snap: ChatUnreadSnapshot = {
    asGuest: roleCounts.asGuest,
    asOwner: roleCounts.asOwner,
    byRoom,
  };
  window.dispatchEvent(
    new CustomEvent(CHAT_UNREAD_UPDATED_EVENT, {
      detail: { userId, snapshot: snap },
    })
  );
  return snap;
}

export function subscribeChatUnreadUpdates(
  userId: string,
  callback: (snapshot?: ChatUnreadSnapshot) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ userId?: string; snapshot?: ChatUnreadSnapshot }>;
    const targetUid = custom.detail?.userId;
    if (targetUid && targetUid !== userId) return;
    callback(custom.detail?.snapshot);
  };
  window.addEventListener(CHAT_UNREAD_UPDATED_EVENT, handler as EventListener);
  return () => {
    window.removeEventListener(CHAT_UNREAD_UPDATED_EVENT, handler as EventListener);
  };
}

/**
 * 채팅방 실시간 구독
 */
export function subscribeToChatRooms(
  userId: string,
  callback: (rooms: ChatRoom[]) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  // 초기 데이터 로드
  getUserChatRooms(userId).then(callback);
  const interval = setInterval(() => {
    getUserChatRooms(userId).then(callback);
  }, 3000);
  return () => {
    clearInterval(interval);
  };
}

/**
 * 최근 윈도우만 가져와 콜백에 넘김. 호출측에서 mergeChatMessageWindow 로 합치면
 * 위로 불러온 과거 메시지가 덮어쓰이지 않음.
 *
 * 1) SSE `/api/app/chat/rooms/[id]/events` 우선
 * 2) 연결 실패·스트림 종료 시 폴링 폴백
 */
export function subscribeToChatMessages(
  chatRoomId: string,
  callback: (recentWindow: ChatMessage[]) => void,
  options?: { pollMs?: number; windowLimit?: number; backgroundPollMs?: number }
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const pollMs = options?.pollMs ?? 2000;
  const backgroundPollMs = options?.backgroundPollMs ?? 6000;
  const windowLimit = options?.windowLimit ?? CHAT_POLL_WINDOW_SIZE;

  const pull = () => {
    getChatMessages(chatRoomId, { limit: windowLimit }).then(callback);
  };

  pull();
  const ac = new AbortController();
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;
  let ended = false;
  let inFlight = false;

  const nextPollDelay = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return backgroundPollMs;
    }
    return pollMs;
  };

  const stopPoll = () => {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  };

  const schedulePoll = () => {
    if (ended) return;
    stopPoll();
    pollTimer = setTimeout(async () => {
      if (ended) return;
      if (!inFlight) {
        inFlight = true;
        try {
          await getChatMessages(chatRoomId, { limit: windowLimit }).then(callback);
        } finally {
          inFlight = false;
        }
      }
      schedulePoll();
    }, nextPollDelay());
  };

  const startPollFallback = () => {
    if (pollTimer) return;
    schedulePoll();
  };

  const scheduleReconnect = () => {
    if (ended || reconnectTimer) return;
    reconnectAttempt += 1;
    const delay = Math.min(1000 * 2 ** Math.min(reconnectAttempt - 1, 4), 15000);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!ended) {
        void runSseLoop();
      }
    }, delay);
  };

  const clearReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const runSseLoop = async () => {
    try {
      stopPoll();
      const res = await fetch(
        `/api/app/chat/rooms/${encodeURIComponent(chatRoomId)}/events`,
        withAppActor({
          signal: ac.signal,
          headers: { Accept: 'text/event-stream' },
        })
      );
      if (!res.ok || !res.body) {
        startPollFallback();
        scheduleReconnect();
        return;
      }
      reconnectAttempt = 0;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (!ac.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let sep: number;
        while ((sep = buf.indexOf('\n\n')) !== -1) {
          const block = buf.slice(0, sep);
          buf = buf.slice(sep + 2);
          for (const line of block.split('\n')) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const payload = t.slice(5).trim();
            try {
              const data = JSON.parse(payload) as { type?: string };
              if (data.type === 'room_activity') {
                pull();
                const uid = getCurrentUserId();
                if (uid) {
                  window.dispatchEvent(
                    new CustomEvent(CHAT_UNREAD_UPDATED_EVENT, { detail: { userId: uid } })
                  );
                }
              }
            } catch {
              /* ignore */
            }
          }
        }
      }
      if (!ac.signal.aborted) {
        startPollFallback();
        scheduleReconnect();
      }
    } catch {
      if (!ac.signal.aborted) {
        startPollFallback();
        scheduleReconnect();
      }
    }
  };

  void runSseLoop();

  const onVisibility = () => {
    if (!pollTimer) return;
    schedulePoll();
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }

  return () => {
    ended = true;
    ac.abort();
    stopPoll();
    clearReconnect();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}
