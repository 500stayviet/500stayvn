"use client";

import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import TopBar from "@/components/TopBar";
import InternationalPhoneInput from "@/components/auth/InternationalPhoneInput";
import type { BookingPageViewModel } from "../hooks/useBookingPage";
import { getUIText } from "@/utils/i18n";

const PAYMENT_METHODS: readonly {
  id: string;
  labelKey:
    | "paymentMethodLabelMomo"
    | "paymentMethodLabelZalopay"
    | "paymentMethodLabelBankTransfer"
    | "paymentMethodLabelPayAtProperty";
  icon: string;
}[] = [
  { id: "momo", labelKey: "paymentMethodLabelMomo", icon: "💜" },
  { id: "zalopay", labelKey: "paymentMethodLabelZalopay", icon: "💙" },
  { id: "bank_transfer", labelKey: "paymentMethodLabelBankTransfer", icon: "🏦" },
  { id: "pay_at_property", labelKey: "paymentMethodLabelPayAtProperty", icon: "🏠" },
] as const;

type Props = { vm: BookingPageViewModel };

export function BookingPageView({ vm }: Props) {
  const {
    router,
    currentLanguage,
    setCurrentLanguage,
    property,
    loading,
    submitting,
    step,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    guestInfo,
    setGuestInfo,
    setPhoneNumber,
    agreeTerms,
    setAgreeTerms,
    agreePaymentTerms,
    setAgreePaymentTerms,
    checkInDate,
    checkOutDate,
    petsCount,
    nights,
    accommodationTotal,
    petTotal,
    serviceFee,
    serviceFeePercent,
    totalPrice,
    formatDate,
    formatPrice,
    handleCreateBooking,
    handleCompletePayment,
  } = vm;

  if (loading || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col shadow-xl relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        <div className="p-4 border-b flex items-center gap-2">
          <button type="button" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">
            {getUIText("bookPropertyTitle", currentLanguage)}
          </h1>
        </div>

        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex gap-3">
            <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              <Image
                src={property?.images?.[0] || "https://via.placeholder.com/80"}
                alt={property?.address || "property"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {property?.address || ""}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 font-medium">
                <Calendar className="w-3 h-3" />
                <span>
                  {checkInDate && checkOutDate
                    ? `${formatDate(checkInDate)} ~ ${formatDate(checkOutDate)}`
                    : getUIText("bookingDatesLoadError", currentLanguage)}
                </span>
              </div>
              <p className="text-sm font-bold text-blue-600 mt-1">
                {formatPrice(totalPrice)} ({nights}
                {getUIText("nightShort", currentLanguage)})
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {step === "info" ? (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">
                {getUIText("guestInfoSectionTitle", currentLanguage)}
              </h2>
              <input
                type="text"
                placeholder={getUIText(
                  "bookingGuestNamePlaceholder",
                  currentLanguage,
                )}
                className="w-full p-3 border rounded-xl text-sm"
                value={guestInfo.name}
                onChange={(e) =>
                  setGuestInfo({ ...guestInfo, name: e.target.value })
                }
              />
              <div className="space-y-4">
                <InternationalPhoneInput
                  currentLanguage={currentLanguage}
                  onPhoneChange={(normalized, isComplete) => {
                    void isComplete;
                    setPhoneNumber(normalized);
                  }}
                  initialValue={""}
                />
              </div>
              <label className="flex items-start gap-3 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>
                  {getUIText("agreeTermsPrivacyBooking", currentLanguage)}
                </span>
              </label>
              <button
                type="button"
                onClick={() => void handleCreateBooking()}
                disabled={!agreeTerms || submitting || !guestInfo.name}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold disabled:bg-gray-300 transition-colors"
              >
                {submitting
                  ? getUIText("processingInProgress", currentLanguage)
                  : getUIText("proceedToPaymentStep", currentLanguage)}
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="text-center">
                <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <h2 className="font-bold text-lg">
                  {getUIText("selectPaymentMethod", currentLanguage)}
                </h2>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {getUIText("priceBreakdown", currentLanguage)}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {nights}
                    {getUIText("nightShort", currentLanguage)} ×{" "}
                    {formatPrice(property?.price ?? 0)}
                    {getUIText("perWeekSlash", currentLanguage)}
                  </span>
                  <span className="font-medium">
                    {formatPrice(accommodationTotal)}
                  </span>
                </div>
                {petsCount > 0 && (property?.petFee ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {getUIText("petsShort", currentLanguage)}{" "}
                      {petsCount}
                      {getUIText("petCountClassifier", currentLanguage)} ×{" "}
                      {formatPrice(property?.petFee ?? 0)}
                      {getUIText("perPetPerWeekSlash", currentLanguage)}
                    </span>
                    <span className="font-medium">{formatPrice(petTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {getUIText("bookingServiceFee", currentLanguage)} (
                    {serviceFeePercent}%)
                  </span>
                  <span className="font-medium">{formatPrice(serviceFee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-base font-bold">
                  <span>{getUIText("totalAmountLabel", currentLanguage)}</span>
                  <span className="text-blue-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setSelectedPaymentMethod(m.id)}
                    className={`w-full p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${selectedPaymentMethod === m.id ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="font-bold">
                      {getUIText(m.labelKey, currentLanguage)}
                    </span>
                  </button>
                ))}
              </div>
              <label className="flex items-start gap-3 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={agreePaymentTerms}
                  onChange={(e) => setAgreePaymentTerms(e.target.checked)}
                />
                <span>
                  {getUIText("agreePaymentTermsCheckbox", currentLanguage)}
                </span>
              </label>
              <button
                type="button"
                onClick={() => void handleCompletePayment()}
                disabled={
                  !selectedPaymentMethod || !agreePaymentTerms || submitting
                }
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold disabled:bg-gray-300"
              >
                {submitting
                  ? getUIText("processingInProgress", currentLanguage)
                  : getUIText("payNow", currentLanguage)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
