/**
 * 채팅 목록 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserChatRooms, getUnreadCountByRoom, ChatRoom } from '@/lib/api/chat';
import { MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import TopBar from '@/components/TopBar';
import Image from 'next/image';

export default function ChatListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnUrl=' + encodeURIComponent('/chat'));
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user) return;

      try {
        const rooms = await getUserChatRooms(user.uid);
        setChatRooms(rooms);
        
        // 각 채팅방의 읽지 않은 메시지 수 가져오기
        const counts: Record<string, number> = {};
        for (const room of rooms) {
          counts[room.id] = await getUnreadCountByRoom(room.id, user.uid);
        }
        setUnreadCounts(counts);
      } catch (error) {
        console.error('채팅방 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadChatRooms();
      
      // 2초마다 새로고침
      const interval = setInterval(loadChatRooms, 2000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // 베트남식 날짜/시간 포맷
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return currentLanguage === 'ko' ? '방금' : 'Vừa xong';
    } else if (diffMins < 60) {
      return currentLanguage === 'ko' ? `${diffMins}분 전` : `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return currentLanguage === 'ko' ? `${diffHours}시간 전` : `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return currentLanguage === 'ko' ? `${diffDays}일 전` : `${diffDays} ngày trước`;
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    }
  };

  // 상대방 이름 가져오기
  const getOtherPartyName = (room: ChatRoom) => {
    if (!user) return '';
    if (room.ownerId === user.uid) {
      return room.guestName || (currentLanguage === 'ko' ? '임차인' : 'Người thuê');
    }
    return room.ownerName || (currentLanguage === 'ko' ? '임대인' : 'Chủ nhà');
  };

  // 내 역할 표시
  const getMyRole = (room: ChatRoom) => {
    if (!user) return '';
    if (room.ownerId === user.uid) {
      return currentLanguage === 'ko' ? '(임대인)' : '(Chủ nhà)';
    }
    return currentLanguage === 'ko' ? '(임차인)' : '(Người thuê)';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={() => {}} />

        {/* 헤더 */}
        <div className="px-4 py-4 border-b border-gray-200">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">
              {currentLanguage === 'ko' ? '뒤로' : currentLanguage === 'vi' ? 'Quay lại' : 'Back'}
            </span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {currentLanguage === 'ko' ? '채팅' : 
             currentLanguage === 'vi' ? 'Tin nhắn' : 
             'Messages'}
          </h1>
        </div>

        {/* 채팅방 목록 */}
        <div className="divide-y divide-gray-100">
          {chatRooms.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {currentLanguage === 'ko' ? '채팅 내역이 없습니다' : 
                 currentLanguage === 'vi' ? 'Không có tin nhắn' : 
                 'No messages yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {currentLanguage === 'ko' ? '예약이 확정되면 채팅을 시작할 수 있습니다' : 
                 currentLanguage === 'vi' ? 'Bạn có thể chat sau khi đặt phòng được xác nhận' : 
                 'You can start chatting after booking is confirmed'}
              </p>
            </div>
          ) : (
            chatRooms.map((room) => {
              const unreadCount = unreadCounts[room.id] || 0;
              const otherPartyName = getOtherPartyName(room);
              const myRole = getMyRole(room);
              
              return (
                <button
                  key={room.id}
                  onClick={() => router.push(`/chat/${room.id}`)}
                  className="w-full px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* 매물 이미지 */}
                  <div className="w-14 h-14 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {room.propertyImage ? (
                      <Image
                        src={room.propertyImage}
                        alt={room.propertyTitle || ''}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* 채팅 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-gray-900 truncate">
                          {otherPartyName}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {myRole}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatDateTime(room.lastMessageAt || room.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {room.propertyTitle}
                    </p>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                        {room.lastMessage || (currentLanguage === 'ko' ? '채팅을 시작하세요' : 'Bắt đầu trò chuyện')}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
