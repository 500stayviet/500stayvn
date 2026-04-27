"use client";

import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Heart,
  Home,
  Languages,
  LogOut,
  Star,
  Tag,
  User,
  Wallet,
} from "lucide-react";
import { getUIText, getLanguageEndonym } from "@/utils/i18n";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { VerificationStatus } from "@/types/kyc.types";
import type { ProfileListButtonConfig } from "../hooks/useProfileButtonConfig";
import ProfileMenuCard from "./ProfileMenuCard";

type KycSteps = {
  step1: boolean;
  step2: boolean;
  step3: boolean;
};

interface ProfileMainSectionsProps {
  currentLanguage: SupportedLanguage;
  kycSteps: KycSteps;
  allStepsCompleted: boolean;
  verificationStatus: VerificationStatus;
  effectiveIsOwner: boolean;
  buttonConfig: ProfileListButtonConfig;
  onOpenLanguageMenu: () => void;
  onOpenLogoutConfirm: () => void;
  onOpenMyProperties: () => void;
  onOpenHostBookings: () => void;
  onOpenSettlement: () => void;
  onOpenMyBookings: () => void;
}

export default function ProfileMainSections({
  currentLanguage,
  kycSteps,
  allStepsCompleted,
  verificationStatus,
  effectiveIsOwner,
  buttonConfig,
  onOpenLanguageMenu,
  onOpenLogoutConfirm,
  onOpenMyProperties,
  onOpenHostBookings,
  onOpenSettlement,
  onOpenMyBookings,
}: ProfileMainSectionsProps) {
  const kycCount = Object.values(kycSteps).filter(Boolean).length;

  return (
    <div className="px-5 py-4">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              {getUIText("hostMenu", currentLanguage)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {allStepsCompleted ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-tight">
                  {getUIText("verified", currentLanguage)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-tight">
                  {getUIText("profileKycCoinsProgress", currentLanguage).replace(
                    "{n}",
                    String(kycCount),
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-xl overflow-hidden">
            <button
              onClick={buttonConfig.onClick}
              disabled={buttonConfig.disabled}
              className={`w-full rounded-xl py-3 px-4 flex items-center justify-between transition-all ${buttonConfig.disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : "bg-gradient-to-br from-green-50 to-green-100 hover:shadow cursor-pointer"}`}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg">
                  <Home
                    className={`w-4 h-4 ${verificationStatus === "verified" && effectiveIsOwner ? "text-green-600" : verificationStatus === "pending" ? "text-yellow-600" : "text-blue-600"}`}
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {getUIText("listYourProperty", currentLanguage)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {allStepsCompleted
                      ? getUIText("registerPropertyDesc", currentLanguage)
                      : getUIText("kycRequired", currentLanguage)}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {allStepsCompleted && (
            <>
              <ProfileMenuCard
                onClick={onOpenMyProperties}
                icon={<Building2 className="w-4 h-4 text-purple-600" />}
                title={getUIText("manageMyProperties", currentLanguage)}
                description={getUIText("manageMyPropertiesDesc", currentLanguage)}
                containerClassName="bg-gradient-to-br from-purple-50 to-purple-100"
              />

              <ProfileMenuCard
                onClick={onOpenHostBookings}
                icon={<Calendar className="w-4 h-4 text-orange-600" />}
                title={getUIText("bookingManagement", currentLanguage)}
                description={getUIText("bookingManagementDesc", currentLanguage)}
                containerClassName="bg-gradient-to-br from-orange-50 to-orange-100"
              />

              <ProfileMenuCard
                onClick={onOpenSettlement}
                icon={<Wallet className="w-4 h-4 text-amber-600" />}
                title={getUIText("settlementAccount", currentLanguage)}
                description={getUIText("settlementAccountDesc", currentLanguage)}
                containerClassName="bg-gradient-to-br from-amber-50 to-amber-100"
              />

              <ProfileMenuCard
                onClick={() => {}}
                icon={<Star className="w-4 h-4 text-yellow-600" />}
                title={getUIText("reviewManagement", currentLanguage)}
                description={getUIText("reviewManagementDesc", currentLanguage)}
                containerClassName="bg-gradient-to-br from-yellow-50 to-yellow-100"
              />
            </>
          )}

          {!allStepsCompleted && (
            <div className="px-4 py-2.5 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 text-center">
                {getUIText("profileKycEncourageWithCount", currentLanguage).replace(
                  "{n}",
                  String(kycCount),
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-50 rounded-lg">
            <User className="w-5 h-5 text-teal-600" />
          </div>
          <h2 className="text-base font-bold text-gray-900">
            {getUIText("guestMenu", currentLanguage)}
          </h2>
        </div>
        <div className="space-y-2">
          <ProfileMenuCard
            onClick={onOpenMyBookings}
            icon={<Calendar className="w-4 h-4 text-teal-600" />}
            title={getUIText("myBookings", currentLanguage)}
            description={getUIText("myBookingsDesc", currentLanguage)}
            containerClassName="bg-gradient-to-br from-teal-50 to-teal-100"
          />

          <ProfileMenuCard
            onClick={() => {}}
            icon={<Heart className="w-4 h-4 text-pink-600" />}
            title={getUIText("wishlist", currentLanguage)}
            description={getUIText("wishlistDesc", currentLanguage)}
            containerClassName="bg-gradient-to-br from-pink-50 to-pink-100"
          />

          <ProfileMenuCard
            onClick={() => {}}
            icon={<CreditCard className="w-4 h-4 text-blue-600" />}
            title={getUIText("paymentMethodManagement", currentLanguage)}
            description={getUIText("paymentMethodManagementDesc", currentLanguage)}
            containerClassName="bg-gradient-to-br from-blue-50 to-blue-100"
          />

          <ProfileMenuCard
            onClick={() => {}}
            icon={<Tag className="w-4 h-4 text-yellow-600" />}
            title={getUIText("coupons", currentLanguage)}
            description={getUIText("couponsDesc", currentLanguage)}
            containerClassName="bg-gradient-to-br from-yellow-50 to-yellow-100"
          />

          <div className="px-4 py-2.5 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 text-center">
              {getUIText("paymentMethodRequired", currentLanguage)}:{" "}
              {getUIText("paymentMethodRequiredDesc", currentLanguage)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg">
            <Languages className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-base font-bold text-gray-900">
            {getUIText("language", currentLanguage)}
          </h2>
        </div>
        <div className="space-y-2">
          <div>
            <button
              onClick={onOpenLanguageMenu}
              className="w-full rounded-xl py-3 px-4 bg-gradient-to-br from-indigo-50 to-indigo-100 transition-all cursor-pointer hover:shadow flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg">
                  <Languages className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {getUIText("languageChange", currentLanguage)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {getLanguageEndonym(currentLanguage)}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={onOpenLogoutConfirm}
          className="w-full py-3 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-[#E63946] text-white hover:opacity-90 transition-opacity"
        >
          <LogOut className="w-4 h-4" />
          {getUIText("logout", currentLanguage)}
        </button>
      </div>
    </div>
  );
}
