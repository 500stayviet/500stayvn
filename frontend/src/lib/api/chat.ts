/**
 * Chat API (PostgreSQL 원장 + 폴링 구독)
 */

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

type GetMessagesOptions = {
  limit?: number;
  before?: string;
};

/**
 * 모든 채팅방 가져오기
 */
export async function getAllChatRooms(): Promise<ChatRoom[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/app/chat/rooms', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { rooms?: ChatRoom[] };
    return Array.isArray(data.rooms) ? data.rooms : [];
  } catch (error) {
    console.error('Error getting chat rooms:', error);
    return [];
  }
}

/**
 * 사용자의 채팅방 목록 가져오기
 */
export async function getUserChatRooms(userId: string): Promise<ChatRoom[]> {
  if (!userId) return [];
  let rooms: ChatRoom[] = [];
  try {
    const res = await fetch(`/api/app/chat/rooms?userId=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
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
    const res = await fetch(`/api/app/chat/rooms?bookingId=${encodeURIComponent(bookingId)}`, {
      cache: 'no-store',
    });
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
export async function getChatRoom(roomId: string): Promise<ChatRoom | null> {
  const rooms = await getAllChatRooms();
  return rooms.find(room => room.id === roomId) || null;
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
  const res = await fetch('/api/app/chat/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
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
      { cache: 'no-store' }
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
  const res = await fetch(`/api/app/chat/rooms/${encodeURIComponent(data.chatRoomId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId: data.senderId, content: data.content }),
  });
  if (!res.ok) throw new Error(`send_message_failed_${res.status}`);
  const msg = (await res.json()) as ChatMessage;
  return { ...msg, senderName: data.senderName };
}

/**
 * 메시지 읽음 처리
 */
export async function markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await fetch(`/api/app/chat/rooms/${encodeURIComponent(chatRoomId)}/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

/**
 * 채팅방의 모든 메시지를 읽음 처리 (취소 시 등)
 */
export async function markAllMessagesInRoomAsRead(chatRoomId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await fetch(`/api/app/chat/rooms/${encodeURIComponent(chatRoomId)}/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true }),
  });
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
    const res = await fetch(`/api/app/chat/unread-counts?userId=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
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
 * 메시지 실시간 구독
 */
export function subscribeToChatMessages(
  chatRoomId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  // 초기 데이터 로드
  getChatMessages(chatRoomId).then(callback);
  // 주기적 새로고침 (1초) - 실시간 느낌
  const interval = setInterval(() => {
    getChatMessages(chatRoomId).then(callback);
  }, 2000);
  return () => {
    clearInterval(interval);
  };
}
