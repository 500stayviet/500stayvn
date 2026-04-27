/**
 * BookingDetailsModal Component
 *
 * 예약 상세 내역을 보여주는 모달 컴포넌트
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingData } from "@/lib/api/bookings";
import { getParentPropertyId } from "@/lib/api/properties";
import { useLanguage } from "@/contexts/LanguageContext";
import { SupportedLanguage } from "@/lib/api/translation";
import { X, Copy, Check, ExternalLink } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  formatBookingGuestSummary,
  getDateLocaleForLanguage,
  getUIText,
} from "@/utils/i18n";

interface BookingDetailsModalProps {
  booking: BookingData;
  onClose: () => void;
}

function getPaymentMethodLabel(
  method: string | undefined,
  lang: SupportedLanguage,
): string {
  if (!method) return "—";
  switch (method) {
    case "momo":
      return getUIText("paymentMethodLabelMomo", lang);
    case "zalopay":
      return getUIText("paymentMethodLabelZalopay", lang);
    case "bank_transfer":
      return getUIText("paymentMethodLabelBankTransfer", lang);
    case "pay_at_property":
      return getUIText("paymentMethodLabelPayAtProperty", lang);
    default:
      return method;
  }
}

export default function BookingDetailsModal({
  booking,
  onClose,
}: BookingDetailsModalProps) {
  const router = useRouter();
  const { currentLanguage } = useLanguage();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const locale = getDateLocaleForLanguage(currentLanguage);

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights(booking.checkInDate, booking.checkOutDate);

  const formatPrice = (price: number, unit: string) => {
    if (unit === "vnd") {
      const n = price.toLocaleString(locale);
      return `${n} ${getUIText("priceUnitVndSuffix", currentLanguage)}`;
    }
    return `$${price.toLocaleString(locale)}`;
  };

  const copyIdToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyAddressToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleOpenPropertyPage = async () => {
    if (!booking.propertyId) return;
    onClose();
    const displayId = await getParentPropertyId(booking.propertyId);
    router.push(`/properties/${displayId}`);
  };

  const weeks = Math.ceil(booking.nights / 7);
  const basePrice = booking.totalPrice;

  const statusLabel =
    booking.status === "confirmed"
      ? getUIText("bookingBadgeConfirmed", currentLanguage)
      : booking.status === "cancelled"
        ? getUIText("bookingBadgeCancelled", currentLanguage)
        : getUIText("bookingBadgePending", currentLanguage);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-[400px] max-h-[92vh] rounded-[32px] overflow-hidden shadow-xl flex flex-col border border-gray-100"
      >
        <div className="relative px-6 py-6 border-b border-gray-50 flex-shrink-0">
          <h2 className="text-[17px] font-semibold text-gray-900 text-center">
            {getUIText("bookingDetailTitle", currentLanguage)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 stroke-[1.5]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-6">
          <div className="flex justify-between items-center py-4 border-b border-gray-100">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                {getUIText("bookingNumberLabel", currentLanguage)}
              </span>
              <button
                type="button"
                onClick={() => copyIdToClipboard(booking.id!)}
                className="flex items-center gap-1.5 group transition-colors"
              >
                <span
                  className={`text-[15px] font-bold transition-colors ${copiedId ? "text-blue-600" : "text-gray-900 group-hover:text-blue-600"}`}
                >
                  {booking.id}
                </span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-600 transition-colors stroke-[2]" />
                )}
              </button>
            </div>
            <div className="text-right">
              <span
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg inline-block ${
                  booking.status === "confirmed"
                    ? "bg-green-50 text-green-600"
                    : booking.status === "cancelled"
                      ? "bg-red-50 text-red-600"
                      : "bg-orange-50 text-orange-600"
                }`}
              >
                {statusLabel}
              </span>
              <p className="text-[10px] text-gray-400 mt-1">
                {booking.createdAt && formatDateFull(booking.createdAt)}
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
              {getUIText("propertyInfoHeading", currentLanguage)}
            </h3>
            <div className="flex gap-4 items-start">
              {booking.propertyImage && (
                <button
                  type="button"
                  onClick={handleOpenPropertyPage}
                  disabled={!booking.propertyId}
                  className="w-16 h-16 relative rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 hover:border-blue-400 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Image
                    src={booking.propertyImage}
                    alt=""
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              )}
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (booking.propertyId) {
                      void handleOpenPropertyPage();
                    } else {
                      copyAddressToClipboard(
                        booking.propertyAddress || booking.propertyTitle || "",
                      );
                    }
                  }}
                  disabled={
                    !booking.propertyId &&
                    !(booking.propertyAddress || booking.propertyTitle)
                  }
                  className="text-left group w-full flex items-start justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-1">
                    <p
                      className={`text-[14px] font-bold leading-tight mb-1 transition-colors ${copiedAddress ? "text-blue-600" : "text-gray-900 group-hover:text-blue-600"}`}
                    >
                      {booking.propertyAddress || booking.propertyTitle}
                    </p>
                    <div className="text-[12px] text-gray-500 font-medium">
                      {formatDateFull(booking.checkInDate)} ~{" "}
                      {formatDateFull(booking.checkOutDate)}
                      {nights > 0
                        ? ` · ${nights}${getUIText("stayNightsUnit", currentLanguage)}`
                        : ""}
                    </div>
                  </div>
                  {booking.propertyId && (
                    <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-600 mt-1 flex-shrink-0" />
                  )}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">
                  {getUIText("checkIn", currentLanguage)}
                </p>
                <p className="text-[13px] font-bold text-gray-700">
                  {booking.checkInTime || "14:00"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">
                  {getUIText("checkOut", currentLanguage)}
                </p>
                <p className="text-[13px] font-bold text-gray-700">
                  {booking.checkOutTime || "12:00"}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
              {getUIText("guestInfoSectionTitle", currentLanguage)}
            </h3>
            <div className="space-y-4 p-4 border border-gray-100 rounded-2xl">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">
                  {getUIText("fullName", currentLanguage)}
                </p>
                <p className="text-[13px] font-bold text-gray-900">
                  {booking.guestName}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">
                  {getUIText("phoneFieldLabel", currentLanguage)}
                </p>
                <p className="text-[13px] font-bold text-gray-900">
                  {booking.guestPhone}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">
                  {getUIText("bookingOccupancyLabel", currentLanguage)}
                </p>
                <p className="text-[13px] font-bold text-gray-900">
                  {formatBookingGuestSummary(
                    currentLanguage,
                    booking.adults,
                    booking.children,
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">
                  {getUIText("rentalPeriod", currentLanguage)}
                </p>
                <p className="text-[13px] font-bold text-gray-900">
                  {nights}
                  {getUIText("stayNightsUnit", currentLanguage)}
                  {weeks > 0
                    ? ` (${weeks}${getUIText("bookingWeeksUnit", currentLanguage)})`
                    : ""}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                {getUIText("bookingDetailsPaymentHeading", currentLanguage)}
              </h3>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  booking.paymentStatus === "paid"
                    ? "text-green-600 bg-green-50"
                    : "text-orange-600 bg-orange-50"
                }`}
              >
                {booking.paymentStatus === "paid"
                  ? getUIText("paymentStatusPaidLabel", currentLanguage)
                  : getUIText("paymentStatusPendingLabel", currentLanguage)}
              </span>
            </div>
            <div className="space-y-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">
                  {getUIText("bookingDetailsPayMethodRowLabel", currentLanguage)}
                </span>
                <span className="font-bold">
                  {getPaymentMethodLabel(booking.paymentMethod, currentLanguage)}
                </span>
              </div>
              <div className="space-y-1.5 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">
                    {getUIText("bookingDetailsAccommodationLine", currentLanguage)}
                  </span>
                  <span className="font-medium">
                    {formatPrice(basePrice, booking.priceUnit)}
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">
                    {getUIText("bookingDetailsFeesVatLine", currentLanguage)}
                  </span>
                  <span className="font-medium">
                    {formatPrice(0, booking.priceUnit)}
                  </span>
                </div>
                <div className="flex justify-between text-[15px] pt-2">
                  <span className="font-bold text-gray-900">
                    {getUIText("bookingDetailsTotalRow", currentLanguage)}
                  </span>
                  <span className="font-black text-blue-600">
                    {formatPrice(booking.totalPrice, booking.priceUnit)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-[15px] hover:bg-black transition-all"
          >
            {getUIText("confirm", currentLanguage)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
