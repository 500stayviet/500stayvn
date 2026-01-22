/**
 * Chat API (LocalStorage 버전)
 * 
 * 임대인과 임차인 간의 채팅 기능
 */

const CHAT_ROOMS_KEY = 'chatRooms';
const MESSAGES_KEY = 'chatMessages';

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

// 고유 ID 생성
function generateId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 모든 채팅방 가져오기
 */
export async function getAllChatRooms(): Promise<ChatRoom[]> {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(CHAT_ROOMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting chat rooms:', error);
    return [];
  }
}

/**
 * 사용자의 채팅방 목록 가져오기
 */
export async function getUserChatRooms(userId: string): Promise<ChatRoom[]> {
  const rooms = await getAllChatRooms();
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
  const rooms = await getAllChatRooms();
  return rooms.find(room => room.bookingId === bookingId) || null;
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
  const rooms = await getAllChatRooms();
  
  // 이미 해당 예약에 대한 채팅방이 있는지 확인
  const existingRoom = rooms.find(room => room.bookingId === data.bookingId);
  if (existingRoom) {
    return existingRoom;
  }
  
  const newRoom: ChatRoom = {
    id: generateId(),
    bookingId: data.bookingId,
    propertyId: data.propertyId,
    propertyTitle: data.propertyTitle,
    propertyImage: data.propertyImage,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
    guestId: data.guestId,
    guestName: data.guestName,
    createdAt: new Date().toISOString(),
  };
  
  rooms.push(newRoom);
  localStorage.setItem(CHAT_ROOMS_KEY, JSON.stringify(rooms));
  
  // 커스텀 이벤트 발생
  window.dispatchEvent(new CustomEvent('chatRoomsUpdated'));
  
  return newRoom;
}

/**
 * 채팅방의 모든 메시지 가져오기
 */
export async function getChatMessages(chatRoomId: string): Promise<ChatMessage[]> {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(MESSAGES_KEY);
    const messages: ChatMessage[] = data ? JSON.parse(data) : [];
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
  
  const messagesData = localStorage.getItem(MESSAGES_KEY);
  const messages: ChatMessage[] = messagesData ? JSON.parse(messagesData) : [];
  
  const newMessage: ChatMessage = {
    id: generateMessageId(),
    chatRoomId: data.chatRoomId,
    senderId: data.senderId,
    senderName: data.senderName,
    content: data.content,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
  
  messages.push(newMessage);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  
  // 채팅방의 마지막 메시지 업데이트
  const rooms = await getAllChatRooms();
  const roomIndex = rooms.findIndex(room => room.id === data.chatRoomId);
  if (roomIndex !== -1) {
    rooms[roomIndex] = {
      ...rooms[roomIndex],
      lastMessage: data.content,
      lastMessageAt: newMessage.createdAt,
      lastMessageSenderId: data.senderId,
    };
    localStorage.setItem(CHAT_ROOMS_KEY, JSON.stringify(rooms));
  }
  
  // 커스텀 이벤트 발생
  window.dispatchEvent(new CustomEvent('chatMessagesUpdated', { detail: { chatRoomId: data.chatRoomId } }));
  window.dispatchEvent(new CustomEvent('chatRoomsUpdated'));
  
  return newMessage;
}

/**
 * 메시지 읽음 처리
 */
export async function markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const messagesData = localStorage.getItem(MESSAGES_KEY);
  const messages: ChatMessage[] = messagesData ? JSON.parse(messagesData) : [];
  
  let updated = false;
  const updatedMessages = messages.map(msg => {
    // 해당 채팅방의 메시지 중 내가 보낸 게 아닌 읽지 않은 메시지
    if (msg.chatRoomId === chatRoomId && msg.senderId !== userId && !msg.isRead) {
      updated = true;
      return { ...msg, isRead: true };
    }
    return msg;
  });
  
  if (updated) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
    window.dispatchEvent(new CustomEvent('chatMessagesUpdated', { detail: { chatRoomId } }));
  }
}

/**
 * 채팅방의 모든 메시지를 읽음 처리 (취소 시 등)
 */
export async function markAllMessagesInRoomAsRead(chatRoomId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const messagesData = localStorage.getItem(MESSAGES_KEY);
  const messages: ChatMessage[] = messagesData ? JSON.parse(messagesData) : [];
  
  let updated = false;
  const updatedMessages = messages.map(msg => {
    if (msg.chatRoomId === chatRoomId && !msg.isRead) {
      updated = true;
      return { ...msg, isRead: true };
    }
    return msg;
  });
  
  if (updated) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
    window.dispatchEvent(new CustomEvent('chatMessagesUpdated', { detail: { chatRoomId } }));
  }
}

/**
 * 읽지 않은 메시지 수 가져오기 (전체)
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  if (typeof window === 'undefined') return 0;
  
  try {
    const rooms = await getUserChatRooms(userId);
    const roomIds = rooms.map(room => room.id);
    
    const messagesData = localStorage.getItem(MESSAGES_KEY);
    const messages: ChatMessage[] = messagesData ? JSON.parse(messagesData) : [];
    
    return messages.filter(msg => 
      roomIds.includes(msg.chatRoomId) && 
      msg.senderId !== userId && 
      !msg.isRead
    ).length;
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
    const rooms = await getUserChatRooms(userId);
    const messagesData = localStorage.getItem(MESSAGES_KEY);
    const messages: ChatMessage[] = messagesData ? JSON.parse(messagesData) : [];
    
    let asGuest = 0;
    let asOwner = 0;
    
    rooms.forEach(room => {
      const unreadCount = messages.filter(msg => 
        msg.chatRoomId === room.id && 
        msg.senderId !== userId && 
        !msg.isRead
      ).length;
      
      if (room.guestId === userId) {
        asGuest += unreadCount;
      } else if (room.ownerId === userId) {
        asOwner += unreadCount;
      }
    });
    
    return { asGuest, asOwner };
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
    const messagesData = localStorage.getItem(MESSAGES_KEY);
    const messages: ChatMessage[] = messagesData ? JSON.parse(messagesData) : [];
    
    let updated = false;
    const updatedMessages = messages.map(msg => {
      // 해당 메시지가 속한 방 찾기
      const room = rooms.find(r => r.id === msg.chatRoomId);
      if (!room) return msg;
      
      // 역할 확인
      const isCorrectRole = (role === 'guest' && room.guestId === userId) || 
                            (role === 'owner' && room.ownerId === userId);
      
      // 해당 역할의 방이면서 내가 보낸 게 아닌 읽지 않은 메시지
      if (isCorrectRole && msg.senderId !== userId && !msg.isRead) {
        updated = true;
        return { ...msg, isRead: true };
      }
      return msg;
    });
    
    if (updated) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
      window.dispatchEvent(new CustomEvent('chatRoomsUpdated'));
      window.dispatchEvent(new CustomEvent('chatMessagesUpdated'));
    }
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
    const messagesData = localStorage.getItem(MESSAGES_KEY);
    const messages: ChatMessage[] = messagesData ? JSON.parse(messagesData) : [];
    
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
  
  // 커스텀 이벤트 리스너
  const handleUpdate = () => {
    getUserChatRooms(userId).then(callback);
  };
  
  window.addEventListener('chatRoomsUpdated', handleUpdate);
  
  // 주기적 새로고침 (2초)
  const interval = setInterval(handleUpdate, 2000);
  
  return () => {
    window.removeEventListener('chatRoomsUpdated', handleUpdate);
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
  
  // 커스텀 이벤트 리스너
  const handleUpdate = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (!customEvent.detail || customEvent.detail.chatRoomId === chatRoomId) {
      getChatMessages(chatRoomId).then(callback);
    }
  };
  
  window.addEventListener('chatMessagesUpdated', handleUpdate as EventListener);
  
  // storage 이벤트 (다른 탭)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === MESSAGES_KEY) {
      getChatMessages(chatRoomId).then(callback);
    }
  };
  window.addEventListener('storage', handleStorage);
  
  // 주기적 새로고침 (1초) - 실시간 느낌
  const interval = setInterval(() => {
    getChatMessages(chatRoomId).then(msgs => {
      // 컴포넌트의 subscribe 콜백이 호출될 때 리렌더링을 유발하므로
      // 여기서 데이터를 가져오는 로직은 유지하되, 실제 변경 여부는 
      // 사용하는 쪽(ChatModal)에서 판단하도록 설계되었습니다.
      callback(msgs);
    });
  }, 1000);
  
  return () => {
    window.removeEventListener('chatMessagesUpdated', handleUpdate as EventListener);
    window.removeEventListener('storage', handleStorage);
    clearInterval(interval);
  };
}
