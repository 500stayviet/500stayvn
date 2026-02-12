/**
 * Profile Page (개인정보 페이지)
 *
 * 사용자 개인정보 및 설정 페이지
 * - 우리집 내놓기 버튼 (인증 상태에 따라 동작)
 * - 임대인 인증 폼
 */

"use client";
import { uploadToS3 } from "@/lib/s3-client";
import { updateUserData } from "@/lib/api/auth";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Globe,
  Home,
  CheckCircle2,
  Building2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Wallet,
  Star,
  Heart,
  CreditCard,
  Tag,
  LogOut,
  Languages,
  Key,
  TrendingUp,
  FileCheck,
  Users,
  Lock,
  DollarSign,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getCurrentUserData,
  verifyOwner,
  OwnerVerificationData,
  UserData,
  updateUserEmail,
  updateUserPhoneNumber,
  deleteAccount,
} from "@/lib/api/auth";
import { getVerificationStatus } from "@/lib/api/kyc";
import { VerificationStatus } from "@/types/kyc.types";
import { SupportedLanguage } from "@/lib/api/translation";
import TopBar from "@/components/TopBar";
import { getUIText } from "@/utils/i18n";
import InternationalPhoneInput from "@/components/auth/InternationalPhoneInput";
import ProfileHeader from "@/components/profile/ProfileHeader";
import MenuCard from "@/components/profile/MenuCard";
import HostStatsCard from "@/components/profile/HostStatsCard";

// Mock data for demo mode
const DEMO_USER_DATA: UserData = {
  uid: "demo-user-001",
  displayName: "Demo Host",
  email: "demo@500stayviet.com",
  phoneNumber: "+84 (123) 456-789",
  photoURL: null,
  role: "owner",
  kyc_steps: {
    step1: true,
    step2: true,
    step3: true,
  },
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
};

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, logout } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("none");
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string>("");
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // 이메일/전화번호 편집 상태
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isPhoneComplete, setIsPhoneComplete] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [updateError, setUpdateError] = useState<string>("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // 조건부 인증 설정
  const requirePhoneVerification =
    process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === "true";

  // 모달 표시 여부 추적 (컴포넌트 내부에서만 사용)
  const popupShownRef = useRef(false);

  // kyc_steps 기본값 설정 함수
  const getKycSteps = () => {
    const steps = userData?.kyc_steps || {};
    // 기본값 설정: 필드가 없으면 false
    return {
      step1: steps.step1 || false,
      step2: steps.step2 || false,
      step3: steps.step3 || false,
    };
  };

  const [verificationData, setVerificationData] =
    useState<OwnerVerificationData>({
      fullName: "",
      phoneNumber: "",
    });

  // 프로필 사진 업로드 및 DB 저장 핸들러
  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const imageUrl = await uploadToS3(file, "profile-pics");
      await updateUserData(user.uid, { photoURL: imageUrl });
      setUserData((prev) => (prev ? { ...prev, photoURL: imageUrl } : null));
      alert(getUIText("profileImageUpdated", currentLanguage));
    } catch (error) {
      console.error("프로필 업로드 에러:", error);
      alert(getUIText("uploadFailed", currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for demo mode in URL params or if not authenticated
    const demoParam = searchParams.get("demo");
    
    if (demoParam === "true") {
      setIsDemoMode(true);
      setUserData(DEMO_USER_DATA);
      setLoading(false);
      return;
    }

    if (!authLoading) {
      if (!user) {
        // Option: Allow viewing demo, or redirect to login
        // For now, show demo mode if visiting without auth
        setIsDemoMode(true);
        setUserData(DEMO_USER_DATA);
        setLoading(false);
        return;
      }

      const fetchUserData = async () => {
        try {
          const data = await getCurrentUserData(user.uid);
          setUserData(data);
          const kycSteps = data?.kyc_steps || {};
          const completed =
            (kycSteps.step1 && kycSteps.step2 && kycSteps.step3) || false;
          const status = await getVerificationStatus(user.uid);
          setVerificationStatus(status as VerificationStatus);

          // KYC 완료 및 임대인 권한 부여 시 성공 팝업 표시
          if (
            completed &&
            userData?.role === "owner" &&
            !popupShownRef.current
          ) {
            const popupKey = `kyc_success_modal_${user.uid}`;
            const hasShown = localStorage.getItem(popupKey);
            if (!hasShown) {
              popupShownRef.current = true;
              setShowSuccessPopup(true);
              localStorage.setItem(popupKey, "true");
            }
          }

          if (data) {
            setVerificationData({
              fullName: data.displayName || "",
              phoneNumber: data.phoneNumber || "",
            });
          }
        } catch (error) {
          // Silent fail
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [user, authLoading, router, searchParams]);

  useEffect(() => {
    if (!user) return;
    const handleFocus = async () => {
      try {
        const data = await getCurrentUserData(user.uid);
        setUserData(data);
        const status = await getVerificationStatus(user.uid);
        setVerificationStatus(status as VerificationStatus);
      } catch (error) {}
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user]);

  // 전화번호 편집 시작
  const handleStartEditPhone = () => {
    setEditPhone(userData?.phoneNumber || "");
    setIsEditingPhone(true);
    setIsPhoneVerified(false);
    setOtpSent(false);
    setOtpCode("");
    setUpdateError("");
  };

  const handlePhoneChange = (normalizedPhone: string, isComplete: boolean) => {
    setEditPhone(normalizedPhone);
    setIsPhoneComplete(isComplete);
    if (normalizedPhone !== userData?.phoneNumber) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpCode("");
    }
  };

  const handleSendOTP = async (normalizedPhone: string): Promise<boolean> => {
    setUpdatingPhone(true);
    setUpdateError("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: normalizedPhone }),
      });

      if (response.ok) {
        setOtpSent(true);
        setOtpError("");
        return true;
      } else {
        const data = await response.json();
        setUpdateError(data.error || "Failed to send OTP");
        return false;
      }
    } catch (err) {
      setUpdateError("System error occurred");
      return false;
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    setIsVerifyingOtp(true);
    setOtpError("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: editPhone, code: otpCode }),
      });
      if (response.ok) {
        setIsPhoneVerified(true);
        setOtpError("");
      } else {
        const data = await response.json();
        setOtpError(data.error || "Invalid code");
      }
    } catch (err) {
      setOtpError("Verification error");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!user) return;

    // 조건부 인증 체크
    if (requirePhoneVerification && !isPhoneVerified) {
      setUpdateError(
        currentLanguage === "ko"
          ? "전화번호 인증이 필요합니다"
          : "Vui lòng xác thực số điện thoại",
      );
      return;
    }

    setUpdatingPhone(true);
    setUpdateError("");
    try {
      await updateUserPhoneNumber(user.uid, editPhone);
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      setIsEditingPhone(false);
      setEditPhone("");
      setIsPhoneVerified(false);
    } catch (error: any) {
      setUpdateError(
        error.message || getUIText("errorOccurred", currentLanguage),
      );
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleEmailChange = async () => {
    if (!user || !editEmail.trim()) return;
    setUpdatingEmail(true);
    setUpdateError("");
    try {
      await updateUserEmail(user.uid, editEmail.trim());
      const updatedData = await getCurrentUserData(user.uid);
      setUserData(updatedData);
      setIsEditingEmail(false);
      setEditEmail("");
    } catch (error: any) {
      setUpdateError(
        error.message || getUIText("errorOccurred", currentLanguage),
      );
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    setCurrentLanguage(langCode);
    setIsLanguageMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node)
      ) {
        setIsLanguageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLanguageMenuOpen]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (!user && !isDemoMode) return null;

  const isOwner = userData?.role === "owner" || false; // role이 'owner'인지 확인
  const kycSteps = getKycSteps();
  const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;

  // 코인 3개면 임대인으로 간주 (사용자 요구사항: "코인3개가 되면 다 사용가능한거야")
  const effectiveIsOwner = allStepsCompleted || isOwner;

  const getButtonConfig = () => {
    // 항상 매물등록 페이지로 이동
    // KYC 완료 여부는 /add-property 페이지에서 처리
    const handleClick = () => {
      console.log("우리집 내놓기 버튼 클릭, /add-property로 직접 이동");
      // router.push 대신 직접 URL 이동 (더 확실한 방법)
      window.location.href = "/add-property";
    };

    return {
      text: allStepsCompleted
        ? getUIText("registerPropertyDesc", currentLanguage)
        : getUIText("listYourProperty", currentLanguage),
      disabled: false,
      onClick: handleClick,
      className: allStepsCompleted
        ? "w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 px-6 rounded-2xl font-semibold text-base hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
        : "w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 px-6 rounded-2xl font-semibold text-base hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3",
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        {isDemoMode && !user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-xs text-amber-700 font-medium">
              {currentLanguage === "ko"
                ? "미리보기 모드 - 로그인하여 실제 프로필 확인"
                : "Preview mode - Log in to view your actual profile"}
            </p>
          </motion.div>
        )}

        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        <div className="flex-1 overflow-y-auto px-4 py-6 pb-20 space-y-6">
          <ProfileHeader
            userData={userData}
            isLoading={loading}
            isDemoMode={isDemoMode}
            onImageUpload={!isDemoMode ? handleProfileImageUpload : undefined}
          />

          {/* Host Stats Dashboard */}
          {(userData?.role === "owner" || isDemoMode) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-3"
            >
              <HostStatsCard
                icon={Home}
                label="Properties"
                value={isDemoMode ? "8" : "0"}
                color="text-emerald-600"
                bgColor="bg-emerald-50"
                index={0}
              />
              <HostStatsCard
                icon={Calendar}
                label="Bookings"
                value={isDemoMode ? "24" : "0"}
                color="text-blue-600"
                bgColor="bg-blue-50"
                index={1}
              />
              <HostStatsCard
                icon={DollarSign}
                label="Revenue"
                value={isDemoMode ? "$2.4k" : "$0"}
                color="text-purple-600"
                bgColor="bg-purple-50"
                index={2}
              />
            </motion.div>
          )}

          {/* Host Menu Section */}
          {(userData?.role === "owner" || isDemoMode) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Host Dashboard</h2>
                {allStepsCompleted && (
                  <span className="ml-auto text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                    Verified
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <MenuCard
                  icon={Home}
                  title={getUIText("listYourProperty", currentLanguage)}
                  description={
                    allStepsCompleted
                      ? getUIText("registerPropertyDesc", currentLanguage)
                      : getUIText("kycRequired", currentLanguage)
                  }
                  color={
                    allStepsCompleted ? "text-green-600" : "text-blue-600"
                  }
                  bgColor={
                    allStepsCompleted ? "bg-green-50" : "bg-blue-50"
                  }
                  onClick={() => {
                    if (!isDemoMode) window.location.href = "/add-property";
                  }}
                  disabled={isDemoMode}
                  index={0}
                />
                {allStepsCompleted && (
                  <>
                    <MenuCard
                      icon={Building2}
                      title={getUIText("manageMyProperties", currentLanguage)}
                      description={getUIText("manageMyPropertiesDesc", currentLanguage)}
                      color="text-purple-600"
                      bgColor="bg-purple-50"
                      onClick={() => {
                        if (!isDemoMode) router.push("/profile/my-properties");
                      }}
                      disabled={isDemoMode}
                      index={1}
                    />
                    <MenuCard
                      icon={Calendar}
                      title={getUIText("bookingManagement", currentLanguage)}
                      description={getUIText("bookingManagementDesc", currentLanguage)}
                      color="text-orange-600"
                      bgColor="bg-orange-50"
                      onClick={() => {
                        if (!isDemoMode) router.push("/host/bookings");
                      }}
                      disabled={isDemoMode}
                      index={2}
                    />
                    <MenuCard
                      icon={Wallet}
                      title={getUIText("settlementAccount", currentLanguage)}
                      description={getUIText("settlementAccountDesc", currentLanguage)}
                      color="text-purple-600"
                      bgColor="bg-purple-50"
                      onClick={() => {
                        if (!isDemoMode) router.push("/profile/settlement");
                      }}
                      disabled={isDemoMode}
                      index={3}
                    />
                    <MenuCard
                      icon={Star}
                      title={getUIText("reviewManagement", currentLanguage)}
                      description={getUIText("reviewManagementDesc", currentLanguage)}
                      color="text-yellow-600"
                      bgColor="bg-yellow-50"
                      onClick={() => {}}
                      disabled={true}
                      index={4}
                    />
                  </>
                )}
              </div>
              {!allStepsCompleted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <p className="text-xs text-amber-700 font-medium text-center">
                    {currentLanguage === "ko"
                      ? `KYC 인증을 완료하여 코인 3개를 모으세요! (현재 ${Object.values(kycSteps).filter(Boolean).length}/3)`
                      : `Complete KYC to collect 3 coins! (${Object.values(kycSteps).filter(Boolean).length}/3)`}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Guest Menu Section */}
          {!isDemoMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <User className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{getUIText("guestMenu", currentLanguage)}</h2>
              </div>
              <div className="space-y-2">
                <MenuCard
                  icon={Calendar}
                  title={getUIText("myBookings", currentLanguage)}
                  description={getUIText("myBookingsDesc", currentLanguage)}
                  color="text-teal-600"
                  bgColor="bg-teal-50"
                  onClick={() => router.push("/my-bookings")}
                  index={0}
                />
                <MenuCard
                  icon={Heart}
                  title={getUIText("wishlist", currentLanguage)}
                  description={getUIText("wishlistDesc", currentLanguage)}
                  color="text-pink-600"
                  bgColor="bg-pink-50"
                  onClick={() => {}}
                  disabled={true}
                  index={1}
                />
                <MenuCard
                  icon={CreditCard}
                  title={getUIText("paymentMethodManagement", currentLanguage)}
                  description={getUIText("paymentMethodManagementDesc", currentLanguage)}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                  onClick={() => {}}
                  disabled={true}
                  index={2}
                />
                <MenuCard
                  icon={Tag}
                  title={getUIText("coupons", currentLanguage)}
                  description={getUIText("couponsDesc", currentLanguage)}
                  color="text-yellow-600"
                  bgColor="bg-yellow-50"
                  onClick={() => {}}
                  disabled={true}
                  index={3}
                />
              </div>
            </motion.div>
          )}

          {/* Settings Section */}
          {!isDemoMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Lock className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Settings</h2>
              </div>
              <div className="space-y-2">
                <MenuCard
                  icon={Mail}
                  title={getUIText("editProfile", currentLanguage)}
                  description="Email, phone, language"
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                  onClick={() => router.push("/profile/edit")}
                  index={0}
                />
                <MenuCard
                  icon={LogOut}
                  title={getUIText("logout", currentLanguage)}
                  description={getUIText("logoutDesc", currentLanguage)}
                  color="text-red-600"
                  bgColor="bg-red-50"
                  onClick={() => setShowLogoutConfirm(true)}
                  index={1}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {getUIText("confirmLogout", currentLanguage)}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {getUIText("logoutDesc", currentLanguage)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                {getUIText("cancel", currentLanguage)}
              </button>
              <button
                onClick={async () => {
                  if (!user) return;
                  setLoggingOut(true);
                  try {
                    await logout();
                    setShowLogoutConfirm(false);
                    router.push("/");
                  } catch (error) {
                    console.error("로그아웃 실패:", error);
                    alert(getUIText("errorOccurred", currentLanguage));
                    setLoggingOut(false);
                  }
                }}
                disabled={loggingOut}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                {loggingOut
                  ? currentLanguage === "ko"
                    ? "처리 중..."
                    : "Processing..."
                  : getUIText("logout", currentLanguage)}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && effectiveIsOwner && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center"
          >
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {getUIText("congratulations", currentLanguage)}
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {getUIText("nowOwnerDesc", currentLanguage)}
            </p>
            <button
              onClick={() => {
                setShowSuccessPopup(false);
                popupShownRef.current = false;
              }}
              className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
            >
              {getUIText("confirm", currentLanguage)}
            </button>
          </motion.div>
        </div>
      )}

      {/* Language Selection Modal */}
      {isLanguageMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              {getUIText("selectLanguage", currentLanguage)}
            </h3>
            <div className="space-y-2">
              {[
                { code: "ko", name: "한국어", flag: "🇰🇷" },
                { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
                { code: "en", name: "English", flag: "🇺🇸" },
                { code: "ja", name: "日本語", flag: "🇯🇵" },
                { code: "zh", name: "中文", flag: "🇨🇳" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as SupportedLanguage)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-lg ${
                    currentLanguage === lang.code
                      ? "bg-blue-50 text-blue-600 font-semibold border border-blue-200"
                      : "text-gray-700 border border-transparent"
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                  {currentLanguage === lang.code && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsLanguageMenuOpen(false)}
                className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200"
              >
                {getUIText("close", currentLanguage)}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${verificationStatus === "verified" && effectiveIsOwner ? "bg-green-100" : verificationStatus === "pending" ? "bg-yellow-100" : "bg-blue-100"}`}
                  >
                    <Home
                      className={`w-5 h-5 ${verificationStatus === "verified" && effectiveIsOwner ? "text-green-600" : verificationStatus === "pending" ? "text-yellow-600" : "text-blue-600"}`}
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {getUIText("listYourProperty", currentLanguage)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {allStepsCompleted
                        ? getUIText("registerPropertyDesc", currentLanguage)
                        : getUIText("kycRequired", currentLanguage)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* 매물 관리하기 - 코인 3개(1~3단계 완료) 시에만 표시 */}
              {allStepsCompleted && (
                <button
                  onClick={() => router.push("/profile/my-properties")}
                  className="w-full py-4 px-5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {getUIText("manageMyProperties", currentLanguage)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getUIText("manageMyPropertiesDesc", currentLanguage)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )}

              {/* 예약 관리 - 코인 3개(1~3단계 완료) 시에만 표시 */}
              {allStepsCompleted && (
                <button
                  onClick={() => router.push("/host/bookings")}
                  className="w-full py-4 px-5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {getUIText("bookingManagement", currentLanguage)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getUIText("bookingManagementDesc", currentLanguage)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )}

              {/* 정산 및 계좌 - 코인 3개(1~3단계 완료) 시에만 표시 */}
              {allStepsCompleted && (
                <button
                  onClick={() => router.push("/profile/settlement")}
                  className="w-full py-4 px-5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Wallet className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {getUIText("settlementAccount", currentLanguage)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getUIText("settlementAccountDesc", currentLanguage)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )}

              {/* 리뷰 관리 - 코인 3개(1~3단계 완료) 시에만 표시 */}
              {allStepsCompleted && (
                <button
                  onClick={() => {}}
                  className="w-full py-4 px-5 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {getUIText("reviewManagement", currentLanguage)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getUIText("reviewManagementDesc", currentLanguage)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )}

              {!allStepsCompleted && (
                <div className="px-5 py-3 bg-gray-50">
                  <p className="text-xs text-gray-500 text-center">
                    {currentLanguage === "ko"
                      ? `KYC 인증을 완료하여 코인 3개를 모으세요! (현재 ${Object.values(kycSteps).filter(Boolean).length}/3)`
                      : currentLanguage === "vi"
                        ? `Hoàn thành xác thực KYC để thu thập 3 coin! (Hiện tại ${Object.values(kycSteps).filter(Boolean).length}/3)`
                        : currentLanguage === "ja"
                          ? `KYC認証を完了してコイン3枚を集めましょう！ (現在 ${Object.values(kycSteps).filter(Boolean).length}/3)`
                          : currentLanguage === "zh"
                            ? `完成KYC认证收集3个硬币！ (当前 ${Object.values(kycSteps).filter(Boolean).length}/3)`
                            : `Complete KYC verification to collect 3 coins! (Current ${Object.values(kycSteps).filter(Boolean).length}/3)`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 임차인 메뉴 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-gray-900">
                {getUIText("guestMenu", currentLanguage)}
              </h2>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <button
                onClick={() => router.push("/my-bookings")}
                className="w-full py-4 px-5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {getUIText("myBookings", currentLanguage)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getUIText("myBookingsDesc", currentLanguage)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* 위시리스트 */}
              <button
                onClick={() => {}}
                className="w-full py-4 px-5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Heart className="w-5 h-5 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {getUIText("wishlist", currentLanguage)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getUIText("wishlistDesc", currentLanguage)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* 결제 수단 관리 */}
              <button
                onClick={() => {}}
                className="w-full py-4 px-5 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {getUIText("paymentMethodManagement", currentLanguage)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getUIText(
                        "paymentMethodManagementDesc",
                        currentLanguage,
                      )}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* 쿠폰 */}
              <button
                onClick={() => {}}
                className="w-full py-4 px-5 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Tag className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {getUIText("coupons", currentLanguage)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getUIText("couponsDesc", currentLanguage)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* 결제 수단 등록 필요 안내 */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  {getUIText("paymentMethodRequired", currentLanguage)}:{" "}
                  {getUIText("paymentMethodRequiredDesc", currentLanguage)}
                </p>
              </div>
            </div>
          </div>

          {/* 개인정보 수정 메뉴 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">
                {getUIText("profile", currentLanguage)}
              </h2>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <button
                onClick={() => router.push("/profile/edit")}
                className="w-full py-4 px-5 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {getUIText("editProfile", currentLanguage)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentLanguage === "ko"
                        ? "이메일, 전화번호, 언어 등 개인정보 수정"
                        : currentLanguage === "vi"
                          ? "Chỉnh sửa thông tin cá nhân như email, số điện thoại, ngôn ngữ"
                          : currentLanguage === "ja"
                            ? "メール、電話番号、言語などの個人情報を編集"
                            : currentLanguage === "zh"
                              ? "编辑邮箱、电话号码、语言等个人信息"
                              : "Edit personal information such as email, phone number, language"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* 언어 변경 섹션 */}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => setIsLanguageMenuOpen(true)}
                  className="w-full py-4 px-5 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Languages className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-6">
                        <p className="text-sm font-semibold text-gray-900">
                          {getUIText("languageChange", currentLanguage)}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-600">
                            {currentLanguage.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-700">
                            {currentLanguage === "ko"
                              ? "한국어"
                              : currentLanguage === "vi"
                                ? "Tiếng Việt"
                                : currentLanguage === "ja"
                                  ? "日本語"
                                  : currentLanguage === "zh"
                                    ? "中文"
                                    : "English"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            {/* 로그아웃 버튼 */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {getUIText("logout", currentLanguage)}
            </button>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {getUIText("confirmDeletion", currentLanguage)}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {getUIText("deleteAccountDesc", currentLanguage)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                {getUIText("cancel", currentLanguage)}
              </button>
              <button
                onClick={async () => {
                  if (!user) return;
                  setDeleting(true);
                  try {
                    await deleteAccount(user.uid);
                    setShowDeleteConfirm(false);
                    setShowDeleteSuccess(true);
                  } catch (error) {
                    console.error(error);
                    alert(getUIText("errorOccurred", currentLanguage));
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg font-medium"
              >
                {deleting
                  ? currentLanguage === "ko"
                    ? "처리 중..."
                    : currentLanguage === "vi"
                      ? "Đang xử lý..."
                      : currentLanguage === "ja"
                        ? "処理中..."
                        : currentLanguage === "zh"
                          ? "处理中..."
                          : "Processing..."
                  : currentLanguage === "ko"
                    ? "계정 삭제"
                    : currentLanguage === "vi"
                      ? "Xóa tài khoản"
                      : currentLanguage === "ja"
                        ? "アカウント削除"
                        : currentLanguage === "zh"
                          ? "删除账户"
                          : "Delete Account"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showDeleteSuccess && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center"
          >
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {getUIText("deleteAccountSuccess", currentLanguage)}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {getUIText("deleteAccountSuccessDesc", currentLanguage)}
            </p>
            <button
              onClick={() => {
                setShowDeleteSuccess(false);
                router.push("/");
              }}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold"
            >
              {getUIText("confirm", currentLanguage)}
            </button>
          </motion.div>
        </div>
      )}

      {showSuccessPopup && effectiveIsOwner && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center"
          >
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {getUIText("congratulations", currentLanguage)}
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {getUIText("nowOwnerDesc", currentLanguage)}
            </p>
            <button
              onClick={() => {
                setShowSuccessPopup(false);
                popupShownRef.current = false;
              }}
              className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-semibold"
            >
              {getUIText("confirm", currentLanguage)}
            </button>
          </motion.div>
        </div>
      )}

      {/* 언어 선택 모달 */}
      {isLanguageMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              {getUIText("selectLanguage", currentLanguage)}
            </h3>
            <p className="text-sm text-gray-600 mb-6 text-center">
              {getUIText("selectLanguageDesc", currentLanguage)}
            </p>
            <div className="space-y-2">
              {[
                {
                  code: "ko",
                  name: "한국어",
                  flag: "🇰🇷",
                  englishName: "Korean",
                },
                {
                  code: "vi",
                  name: "Tiếng Việt",
                  flag: "🇻🇳",
                  englishName: "Vietnamese",
                },
                {
                  code: "en",
                  name: "English",
                  flag: "🇺🇸",
                  englishName: "English",
                },
                {
                  code: "ja",
                  name: "日本語",
                  flag: "🇯🇵",
                  englishName: "Japanese",
                },
                {
                  code: "zh",
                  name: "中文",
                  flag: "🇨🇳",
                  englishName: "Chinese",
                },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() =>
                    handleLanguageChange(lang.code as SupportedLanguage)
                  }
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-lg ${
                    currentLanguage === lang.code
                      ? "bg-blue-50 text-blue-600 font-semibold border border-blue-200"
                      : "text-gray-700 border border-transparent"
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-xs text-gray-500">
                      {lang.englishName}
                    </span>
                  </div>
                  {currentLanguage === lang.code && (
                    <div className="ml-auto">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsLanguageMenuOpen(false)}
                className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200"
              >
                {getUIText("close", currentLanguage)}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {getUIText("confirmLogout", currentLanguage)}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {getUIText("logoutDesc", currentLanguage)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                {getUIText("cancel", currentLanguage)}
              </button>
              <button
                onClick={async () => {
                  if (!user) return;
                  setLoggingOut(true);
                  try {
                    await logout();
                    setShowLogoutConfirm(false);
                    router.push("/");
                  } catch (error) {
                    console.error("로그아웃 실패:", error);
                    alert(getUIText("errorOccurred", currentLanguage));
                    setLoggingOut(false);
                  }
                }}
                disabled={loggingOut}
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium"
              >
                {loggingOut
                  ? currentLanguage === "ko"
                    ? "처리 중..."
                    : currentLanguage === "vi"
                      ? "Đang xử lý..."
                      : currentLanguage === "ja"
                        ? "処理中..."
                        : currentLanguage === "zh"
                          ? "处理中..."
                          : "Processing..."
                  : getUIText("logout", currentLanguage)}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
