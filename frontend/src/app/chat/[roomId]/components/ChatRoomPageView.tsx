'use client';

import { ChatMessage } from '@/components/ChatMessage';
import { detectMessageLanguage } from '@/lib/utils/languageDetection';
import { ArrowLeft, Send, Loader2, Home } from 'lucide-react';
import Image from 'next/image';
import type { ChatRoomPageViewModel } from '../hooks/useChatRoomPage';
import { getUIText } from '@/utils/i18n';

type Props = { vm: ChatRoomPageViewModel };

export function ChatRoomPageView({ vm }: Props) {
  const {
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
  } = vm;

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

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{otherParty.name}</p>
              <p className="text-xs text-gray-500">{otherParty.role}</p>
            </div>
          </div>

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
              <p className="text-sm font-medium text-gray-900 truncate">{chatRoom.propertyTitle}</p>
              <p className="text-xs text-blue-600">
                {getUIText('chatViewListingDetail', currentLanguage)}
              </p>
            </div>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={onMessagesScroll}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3"
        >
          {loadingMoreOlder ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : null}
          {!loadingMoreOlder && hasMoreOlder && messages.length > 0 ? (
            <p className="text-center text-[10px] text-gray-400">
              {currentLanguage === 'ko'
                ? '위로 스크롤하면 이전 메시지'
                : currentLanguage === 'vi'
                  ? 'Cuộn lên để xem tin cũ hơn'
                  : 'Scroll up for older messages'}
            </p>
          ) : null}
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">
                {getUIText('chatEmptyState', currentLanguage)}
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
                    <div className="flex items-center justify-center my-4">
                      <span className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">
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
                    cacheKey={`chat-${message.id}`}
                    className="mb-1"
                  />
                  {isMe && message.isRead && (
                    <div className="flex justify-end mt-0.5 mr-1">
                      <span className="text-xs text-blue-500">
                        {getUIText('chatReadReceipt', currentLanguage)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={getUIText('chatInputPlaceholderFull', currentLanguage)}
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!newMessage.trim() || sending}
              className="p-2.5 bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
