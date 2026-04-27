'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import TopBar from '@/components/TopBar';
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  MapPin,
  Trash2,
} from 'lucide-react';
import { getUIText } from '@/utils/i18n';
import type { ReservationsPageViewModel } from '../hooks/useReservationsPage';

type Props = { vm: ReservationsPageViewModel };

/** 임대인 예약 관리 UI — 상태는 `useReservationsPage` 전용 */
export function ReservationsPageView({ vm }: Props) {
  const {
    router,
    user,
    authLoading,
    loading,
    currentLanguage,
    setCurrentLanguage,
    reservations,
    activeTab,
    setActiveTab,
    updatingId,
    serverTimeError,
    handleUpdateStatus,
    handleDeleteReservation,
    formatDate,
    getStatusText,
    getStatusColor,
    activeCount,
    completedCount,
  } = vm;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {getUIText('loading', currentLanguage)}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (serverTimeError) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
          <TopBar currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} hideLanguageSelector={false} />
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <p className="text-lg font-semibold text-red-600 text-center mb-2">
              {getUIText('serverTimeSyncError', currentLanguage)}
            </p>
            <p className="text-sm text-gray-600 text-center mb-6">
              {getUIText('systemMaintenance', currentLanguage)}
            </p>
            <p className="text-xs text-gray-500 text-center">
              {getUIText('reservationServerTimeDetail', currentLanguage)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} hideLanguageSelector={false} />

        <div className="px-6 py-6">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">
                {getUIText('backNavLabel', currentLanguage)}
              </span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {getUIText('hostManageBookedPropertiesTitle', currentLanguage)}
            </h1>
          </div>

          <div className="mb-6 flex gap-2 bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'active' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {currentLanguage === 'ko' ? '예약된 매물' : currentLanguage === 'vi' ? 'Đặt phòng' : 'Active Reservations'}
              {activeCount > 0 && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{activeCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'completed' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getUIText('hostTabCompletedReservations', currentLanguage)}
              {completedCount > 0 && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{completedCount}</span>
              )}
            </button>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {activeTab === 'active'
                  ? getUIText('emptyNoActiveReservations', currentLanguage)
                  : getUIText('emptyNoCompletedReservations', currentLanguage)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => {
                const property = reservation.property;
                const imageUrl =
                  property?.images && property.images.length > 0
                    ? property.images[0]
                    : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';

                return (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden"
                  >
                    <div className="relative h-48 w-full">
                      <Image
                        src={imageUrl}
                        alt={property?.title || 'Property'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 430px) 100vw, 430px"
                      />
                      <div className="absolute top-4 left-4">
                        <span
                          className={`${getStatusColor(reservation.status, reservation)} text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg`}
                        >
                          {getStatusText(reservation.status, reservation)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {property && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{property.address || property.title || ''}</h3>
                          {property.address && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {property.address}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>
                          {formatDate(reservation.checkInDate)} ~ {formatDate(reservation.checkOutDate)}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 pt-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          {getUIText('tenantInfoHeading', currentLanguage)}
                        </p>
                        {reservation.tenantName && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>{reservation.tenantName}</span>
                          </div>
                        )}
                        {reservation.tenantEmail && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span>{reservation.tenantEmail}</span>
                          </div>
                        )}
                        {reservation.tenantPhone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{reservation.tenantPhone}</span>
                          </div>
                        )}
                      </div>

                      {activeTab === 'active' && reservation.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => void handleUpdateStatus(reservation.id!, 'confirmed')}
                            disabled={updatingId === reservation.id}
                            className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {updatingId === reservation.id
                              ? getUIText('processingInProgress', currentLanguage)
                              : getUIText('confirmReservationBtn', currentLanguage)}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleUpdateStatus(reservation.id!, 'cancelled')}
                            disabled={updatingId === reservation.id}
                            className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {activeTab === 'active' && reservation.status === 'confirmed' && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => void handleUpdateStatus(reservation.id!, 'completed')}
                            disabled={updatingId === reservation.id}
                            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {updatingId === reservation.id
                              ? getUIText('processingInProgress', currentLanguage)
                              : getUIText('markStayCompletedBtn', currentLanguage)}
                          </button>
                        </div>
                      )}

                      {reservation.status === 'cancelled' && (
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleDeleteReservation(reservation.id!)}
                            disabled={updatingId === reservation.id}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title={getUIText('deleteHistoryRecordTitle', currentLanguage)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
