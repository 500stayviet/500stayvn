/**
 * 채팅 모달 컴포넌트
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  getChatRoom, 
  sendMessage, 
  markMessagesAsRead,
  subscribeToChatMessages,
  ChatRoom, 
  ChatMessage as ChatMessageType 
} from '@/lib/api/chat';
import { ChatMessage } from '@/components/ChatMessage';
import { detectMessageLanguage } from '@/lib/utils/languageDetection';
import { X, Send, Loader2, Home, MessageSquare, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ChatModalProps {
  roomId: string;
  onClose: () => void;
}

export default function ChatModal({ roomId, onClose }: ChatModalProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 채팅방 정보 로드
  useEffect(() => {
    const loadChatRoom = async () => {
      if (!roomId) return;
      setLoading(true);
      try {
        const room = await getChatRoom(roomId);
        setChatRoom(room);
      } catch (error) {
        console.error('채팅방 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatRoom();
  }, [roomId]);

  // 스크롤이 맨 아래에 있는지 확인
  const isAtBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return false;
    const threshold = 100; // 하단에서 100px 이내면 맨 아래로 간주
    return container.scrollHeight - container.scrollTop <= container.clientHeight + threshold;
  };

  // 스크롤을 맨 아래로
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 메시지 구독
  useEffect(() => {
    if (!user || !roomId) return;

    const unsubscribe = subscribeToChatMessages(roomId, (msgs) => {
      setMessages(prev => {
        // 메시지 내용이 완전히 같으면 업데이트하지 않아 리렌더링 및 스크롤 튕김 방지
        if (JSON.stringify(prev) === JSON.stringify(msgs)) return prev;
        return msgs;
      });
      // 읽음 처리
      markMessagesAsRead(roomId, user.uid);
    });

    return () => unsubscribe();
  }, [user, roomId]);

  // 메시지가 업데이트되면 스크롤 처리
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad) {
        scrollToBottom('auto');
        setIsInitialLoad(false);
      } else if (isAtBottom()) {
        scrollToBottom('smooth');
      }
    }
  }, [messages, isInitialLoad]);

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!chatRoom) return null;

  const otherParty = getOtherParty();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden">
      <div className="bg-white w-full max-w-[380px] h-[80vh] rounded-3xl shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-200">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 rounded-t-3xl">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">{otherParty.name.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate leading-tight">
                  {otherParty.name}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                  {otherParty.role}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 매물 정보 미니바 */}
          <div 
            className="mx-4 mb-3 px-3 py-2 bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
            onClick={() => router.push(`/properties/${chatRoom.propertyId}`)}
          >
            <div className="w-8 h-8 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
              {chatRoom.propertyImage ? (
                <Image
                  src={chatRoom.propertyImage}
                  alt={chatRoom.propertyTitle || ''}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-gray-800 truncate">
                {chatRoom.propertyTitle}
              </p>
              <p className="text-[10px] text-blue-500 font-medium">
                {currentLanguage === 'ko' ? '매물 보기' : 'Xem phòng'}
              </p>
            </div>
          </div>

          {/* 거주신고 공지: 훨씬 깜찍하고 친근한 디자인으로 변경 */}
          <div className="mx-4 mb-3 p-3 bg-[#FFF9E6] border border-orange-100 rounded-2xl flex items-start gap-2.5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-orange-200/20 rounded-full -mr-3 -mt-3 blur-xl" />
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-orange-50">
              <span className="text-[16px]">✨</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-orange-700 flex items-center gap-1">
                {currentLanguage === 'ko' ? '입주 전 꼭 확인해 주세요!' : 
                 currentLanguage === 'vi' ? 'Lưu ý quan trọng!' : 
                 'Quick Note for You!'}
              </p>
              <p className="text-[10px] text-orange-600/90 mt-0.5 leading-relaxed font-bold">
                {currentLanguage === 'ko' ? '베트남 법에 따라 거주신고(Khai báo tạm trú)가 필수예요! 쾌적하고 안전한 숙박을 위해 꼭 진행해 주세요 ✈️' : 
                 currentLanguage === 'vi' ? 'Đừng quên đăng ký tạm trú nhé! Đây là quy định bắt buộc để đảm bảo quyền lợi và an toàn cho bạn ✈️' : 
                 'Residency registration is required! Please ensure it is completed for a safe and comfortable stay ✈️'}
              </p>
            </div>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F8F9FA]"
        >
          {/* 예약 확정 시스템 안내 (첫 머리에 표시) */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl px-4 py-3 shadow-sm max-w-[90%]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">
                  {currentLanguage === 'ko' ? '예약 확정 안내' : 
                   currentLanguage === 'vi' ? 'Thông báo xác nhận' : 
                   'Booking Confirmed'}
                </span>
              </div>
              <p className="text-[12px] text-gray-600 leading-relaxed font-medium">
                {currentLanguage === 'ko' ? '안전하고 즐거운 숙박을 위해 입주 직후 거주신고(Khai báo tạm trú)를 진행해 주세요.' : 
                 currentLanguage === 'vi' ? 'Để có một kỳ nghỉ an toàn, vui lòng thực hiện đăng ký tạm trú ngay sau khi nhận phòng.' : 
                 'For a safe stay, please complete the resident registration immediately after check-in.'}
              </p>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-400 text-xs">
                {currentLanguage === 'ko' ? '메시지를 보내 대화를 시작하세요' : 'Gửi tin nhắn để bắt đầu trò chuyện'}
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMe = message.senderId === user?.uid;
              const showDateSeparator = shouldShowDateSeparator(index);
              const senderName = isMe ? (user?.displayName || user?.email || '') : otherParty.name;

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-6">
                      <span className="bg-gray-200/50 text-gray-500 text-[10px] px-3 py-1 rounded-full font-medium">
                        {formatDateSeparator(message.createdAt)}
                      </span>
                    </div>
                  )}

                  <ChatMessage
                    message={message.content}
                    sender={{
                      id: message.senderId,
                      name: senderName,
                      isCurrentUser: isMe,
                    }}
                    timestamp={formatTime(message.createdAt)}
                    sourceLanguage={isMe ? currentLanguage : detectMessageLanguage(message.content)}
                    targetLanguage={currentLanguage}
                    cacheKey={`chat-modal-${message.id}`}
                    className="mb-1"
                  />
                  {isMe && message.isRead && (
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mt-0.5 mr-1`}>
                      <span className="text-[10px] text-blue-500 font-bold">
                        {currentLanguage === 'ko' ? '읽음' : 'Đã xem'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 bg-white border-t border-gray-100 rounded-b-3xl">
          <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentLanguage === 'ko' ? '메시지 입력...' : 'Nhập tin nhắn...'}
              className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="p-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:grayscale transition-all shadow-md active:scale-95"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

