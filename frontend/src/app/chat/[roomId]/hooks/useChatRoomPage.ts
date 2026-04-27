'use client';

import { useState, useEffect, useRef, useCallback, useMemo, type KeyboardEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getChatRoom,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToChatMessages,
  mergeChatMessageWindow,
  CHAT_MESSAGE_PAGE_SIZE,
  CHAT_POLL_WINDOW_SIZE,
  type ChatRoom,
  type ChatMessage as ChatMessageType,
} from '@/lib/api/chat';
import { getUIText } from '@/utils/i18n';

/**
 * 채팅방 단일 페이지: 방 로드·권한·메시지 구독·과거 로드·전송까지 한 훅에 묶는다.
 */
export function useChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isInitialMessagesLoad, setIsInitialMessagesLoad] = useState(true);
  const [loadingMoreOlder, setLoadingMoreOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const didSetHasMoreRef = useRef(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const isAtBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return false;
    const threshold = 100;
    return container.scrollHeight - container.scrollTop <= container.clientHeight + threshold;
  };

  useEffect(() => {
    setMessages([]);
    setIsInitialMessagesLoad(true);
    didSetHasMoreRef.current = false;
    setHasMoreOlder(true);
  }, [roomId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnUrl=' + encodeURIComponent(`/chat/${roomId}`));
    }
  }, [user, authLoading, router, roomId]);

  useEffect(() => {
    const loadChatRoom = async () => {
      if (!user || !roomId) return;

      try {
        const room = await getChatRoom(roomId, user.uid);
        if (!room) {
          router.push('/chat');
          return;
        }

        if (room.ownerId !== user.uid && room.guestId !== user.uid) {
          router.push('/my-bookings');
          return;
        }

        setChatRoom(room);
      } catch (error) {
        console.error('Chat room load failed:', error);
        router.push('/my-bookings');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      void loadChatRoom();
    }
  }, [user, roomId, router]);

  useEffect(() => {
    if (!user || !roomId) return;

    const unsubscribe = subscribeToChatMessages(roomId, (slice) => {
      setMessages((prev) => mergeChatMessageWindow(prev, slice));
      if (!didSetHasMoreRef.current) {
        didSetHasMoreRef.current = true;
        setHasMoreOlder(slice.length >= CHAT_POLL_WINDOW_SIZE);
      }
      void markMessagesAsRead(roomId, user.uid);
    });

    return () => unsubscribe();
  }, [user, roomId]);

  const loadOlderMessages = useCallback(async () => {
    if (!user || !roomId || loadingMoreOlder || !hasMoreOlder) return;
    const container = scrollContainerRef.current;
    const first = messages[0];
    if (!first) return;
    setLoadingMoreOlder(true);
    const prevH = container?.scrollHeight ?? 0;
    const prevTop = container?.scrollTop ?? 0;
    try {
      const older = await getChatMessages(roomId, {
        limit: CHAT_MESSAGE_PAGE_SIZE,
        before: first.createdAt,
      });
      if (older.length === 0) {
        setHasMoreOlder(false);
        return;
      }
      setMessages((prev) => mergeChatMessageWindow(prev, older));
      if (older.length < CHAT_MESSAGE_PAGE_SIZE) setHasMoreOlder(false);
      requestAnimationFrame(() => {
        const el = scrollContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight - prevH + prevTop;
      });
    } finally {
      setLoadingMoreOlder(false);
    }
  }, [user, roomId, loadingMoreOlder, hasMoreOlder, messages]);

  const onMessagesScroll = () => {
    const el = scrollContainerRef.current;
    if (!el || loadingMoreOlder || !hasMoreOlder) return;
    if (el.scrollTop < 72) void loadOlderMessages();
  };

  useEffect(() => {
    if (messages.length === 0) return;
    if (isInitialMessagesLoad) {
      scrollToBottom('auto');
      setIsInitialMessagesLoad(false);
    } else if (isAtBottom()) {
      scrollToBottom('smooth');
    }
  }, [messages, isInitialMessagesLoad]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !chatRoom || sending) return;

    setSending(true);
    try {
      await sendMessage({
        chatRoomId: roomId,
        senderId: user.uid,
        senderName: user.displayName || user.email || '',
        content: newMessage.trim(),
      });
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Chat message send failed:', error);
      alert(getUIText('chatSendFailed', currentLanguage));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const otherParty = useMemo(() => {
    if (!user || !chatRoom) return { name: '', role: '' };

    if (chatRoom.ownerId === user.uid) {
      const tenant = getUIText('chatRoleTenant', currentLanguage);
      return {
        name: chatRoom.guestName || tenant,
        role: tenant,
      };
    }
    const landlord = getUIText('chatRoleLandlord', currentLanguage);
    return {
      name: chatRoom.ownerName || landlord,
      role: landlord,
    };
  }, [user, chatRoom, currentLanguage]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return getUIText('chatDateToday', currentLanguage);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return getUIText('chatDateYesterday', currentLanguage);
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].createdAt).toDateString();
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();
    return currentDate !== prevDate;
  };

  return {
    router,
    user,
    authLoading,
    loading,
    chatRoom,
    messages,
    newMessage,
    setNewMessage,
    sending,
    loadingMoreOlder,
    hasMoreOlder,
    scrollContainerRef,
    messagesEndRef,
    inputRef,
    onMessagesScroll,
    handleSend,
    handleKeyPress,
    currentLanguage,
    otherParty,
    formatTime,
    formatDateSeparator,
    shouldShowDateSeparator,
  };
}

export type ChatRoomPageViewModel = ReturnType<typeof useChatRoomPage>;
