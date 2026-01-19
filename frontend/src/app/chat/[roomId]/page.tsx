/**
 * 채팅방 페이지
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  getChatRoom, 
  getChatMessages, 
  sendMessage, 
  markMessagesAsRead,
  subscribeToChatMessages,
  ChatRoom, 
  ChatMessage 
} from '@/lib/api/chat';
import { ArrowLeft, Send, Loader2, Home } from 'lucide-react';
import Image from 'next/image';

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnUrl=' + encodeURIComponent(`/chat/${roomId}`));
    }
  }, [user, authLoading, router, roomId]);

  // 채팅방 정보 로드
  useEffect(() => {
    const loadChatRoom = async () => {
      if (!user || !roomId) return;

      try {
        const room = await getChatRoom(roomId);
        if (!room) {
          router.push('/chat');
          return;
        }
        
        // 참여자 확인
        if (room.ownerId !== user.uid && room.guestId !== user.uid) {
          router.push('/chat');
          return;
        }
        
        setChatRoom(room);
      } catch (error) {
        console.error('채팅방 로드 실패:', error);
        router.push('/chat');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadChatRoom();
    }
  }, [user, roomId, router]);

  // 메시지 구독
  useEffect(() => {
    if (!user || !roomId) return;

    const unsubscribe = subscribeToChatMessages(roomId, (msgs) => {
      setMessages(msgs);
      // 읽음 처리
      markMessagesAsRead(roomId, user.uid);
    });

    return () => unsubscribe();
  }, [user, roomId]);

  // 메시지가 업데이트되면 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송
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
      console.error('메시지 전송 실패:', error);
      alert(currentLanguage === 'ko' ? '메시지 전송에 실패했습니다.' : 'Gửi tin nhắn thất bại.');
    } finally {
      setSending(false);
    }
  };

  // Enter 키로 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 상대방 정보
  const getOtherParty = () => {
    if (!user || !chatRoom) return { name: '', role: '' };
    
    if (chatRoom.ownerId === user.uid) {
      return {
        name: chatRoom.guestName || (currentLanguage === 'ko' ? '임차인' : 'Người thuê'),
        role: currentLanguage === 'ko' ? '임차인' : 'Người thuê',
      };
    }
    return {
      name: chatRoom.ownerName || (currentLanguage === 'ko' ? '임대인' : 'Chủ nhà'),
      role: currentLanguage === 'ko' ? '임대인' : 'Chủ nhà',
    };
  };

  // 날짜/시간 포맷
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
      return currentLanguage === 'ko' ? '오늘' : 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return currentLanguage === 'ko' ? '어제' : 'Hôm qua';
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  // 날짜 구분선이 필요한지 확인
  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].createdAt).toDateString();
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();
    return currentDate !== prevDate;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!chatRoom) {
    return null;
  }

  const otherParty = getOtherParty();

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.push('/chat')}
              className="p-1 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* 상대방 정보 */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {otherParty.name}
              </p>
              <p className="text-xs text-gray-500">
                {otherParty.role}
              </p>
            </div>
          </div>

          {/* 매물 정보 */}
          <div 
            className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-100"
            onClick={() => router.push(`/properties/${chatRoom.propertyId}`)}
          >
            <div className="w-10 h-10 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
              {chatRoom.propertyImage ? (
                <Image
                  src={chatRoom.propertyImage}
                  alt={chatRoom.propertyTitle || ''}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {chatRoom.propertyTitle}
              </p>
              <p className="text-xs text-blue-600">
                {currentLanguage === 'ko' ? '매물 상세보기 →' : 'Xem chi tiết →'}
              </p>
            </div>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">
                {currentLanguage === 'ko' ? '메시지를 보내 대화를 시작하세요' : 'Gửi tin nhắn để bắt đầu trò chuyện'}
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMe = message.senderId === user?.uid;
              const showDateSeparator = shouldShowDateSeparator(index);

              return (
                <div key={message.id}>
                  {/* 날짜 구분선 */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <span className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">
                        {formatDateSeparator(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* 메시지 */}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isMe ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isMe
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-400">
                          {formatTime(message.createdAt)}
                        </span>
                        {isMe && message.isRead && (
                          <span className="text-xs text-blue-500">
                            {currentLanguage === 'ko' ? '읽음' : 'Đã xem'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentLanguage === 'ko' ? '메시지를 입력하세요...' : 'Nhập tin nhắn...'}
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="p-2.5 bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
