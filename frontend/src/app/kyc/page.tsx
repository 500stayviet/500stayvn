/**
 * KYC (Know Your Customer) 인증 페이지
 * * 임대인 인증을 위한 단계별 인증 프로세스
 * Step 1: 전화번호 인증
 * Step 2: 신분증 촬영
 * Step 3: 얼굴 인증
 */

"use client";
import { uploadToS3 } from "@/lib/s3-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PhoneVerificationData,
  IdDocumentData,
  FaceVerificationData,
} from "@/types/kyc.types";
import {
  savePhoneVerification,
  saveIdDocument,
  saveFaceVerification,
  completeKYCVerification,
} from "@/lib/api/kyc";
import { getCurrentUserData, updateUserData } from "@/lib/api/auth";
import PhoneVerificationStep from "@/components/kyc/PhoneVerificationStep";
import IdDocumentStep from "@/components/kyc/IdDocumentStep";
import FaceVerificationStep from "@/components/kyc/FaceVerificationStep";
import TopBar from "@/components/TopBar";

type KYCStep = 1 | 2 | 3;

export default function KYCPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState<KYCStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 인증 데이터 저장
  const [phoneData, setPhoneData] = useState<PhoneVerificationData | null>(
    null,
  );
  const [idDocumentData, setIdDocumentData] = useState<IdDocumentData | null>(
    null,
  );
  const [faceData, setFaceData] = useState<FaceVerificationData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // 완료된 단계 불러오기
  useEffect(() => {
    if (!user) return;

    const loadCompletedSteps = async () => {
      try {
        const userData = await getCurrentUserData(user.uid);
        const kycSteps = userData?.kyc_steps || {};

        if (kycSteps.step1) {
          setPhoneData({ phoneNumber: userData?.phoneNumber || "" });
        }
        if (kycSteps.step2) {
          setIdDocumentData({} as IdDocumentData);
        }
        if (kycSteps.step3) {
          setFaceData({} as FaceVerificationData);
        }

        if (!kycSteps.step1) {
          setCurrentStep(1);
        } else if (!kycSteps.step2) {
          setCurrentStep(2);
        } else if (!kycSteps.step3) {
          setCurrentStep(3);
        }
      } catch (error) {
        console.error("Error loading completed steps:", error);
      }
    };

    loadCompletedSteps();
  }, [user]);

  // Step 1 완료: 전화번호 인증
  const handlePhoneVerificationComplete = async (
    data: PhoneVerificationData,
  ) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      await savePhoneVerification(user.uid, data);
      setPhoneData(data);
      setCurrentStep(2);
    } catch (err: any) {
      console.error("Phone verification error:", err);
      setError(
        err.message ||
          (currentLanguage === "ko"
            ? "전화번호 인증 실패"
            : "Phone verification failed"),
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2 완료: 실제 신분증 업로드 및 저장
  const handleIdDocumentComplete = async (
    data: IdDocumentData,
    frontImageFile: File,
    backImageFile?: File,
  ) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      // 1. S3 업로드
      const frontImageUrl = await uploadToS3(frontImageFile, "kyc-id-cards");
      let backImageUrl = "";
      if (backImageFile) {
        backImageUrl = await uploadToS3(backImageFile, "kyc-id-cards");
      }

      // 2. URL 전달 (문자열 형식)
      await saveIdDocument(user.uid, data, frontImageUrl, backImageUrl);

      setIdDocumentData(data);
      setCurrentStep(3);
    } catch (err: any) {
      console.error("ID document upload error:", err);
      setError(
        currentLanguage === "ko"
          ? "신분증 업로드 실패"
          : "ID document upload failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2 테스트용: 더미 데이터 처리 (에러 수정됨)
  const handleIdDocumentNext = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const dummyIdData: IdDocumentData = {
        type: "id_card",
        idNumber: "TEST123456",
        fullName: "Test User",
        dateOfBirth: "1990-01-01",
      };

      // 더미 URL 전달 (파일 대신 문자열)
      const dummyFrontUrl =
        "https://via.placeholder.com/800x500.png?text=Test+ID+Front";
      const dummyBackUrl =
        "https://via.placeholder.com/800x500.png?text=Test+ID+Back";

      await saveIdDocument(user.uid, dummyIdData, dummyFrontUrl, dummyBackUrl);

      setIdDocumentData(dummyIdData);
      setCurrentStep(3);
    } catch (err: any) {
      console.error("ID document next error:", err);
      setError(
        currentLanguage === "ko"
          ? "다음 단계 이동 실패"
          : "Failed to move next",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3 완료: 얼굴 인증 (에러 수정됨)
  const handleFaceVerificationComplete = async (
    data: FaceVerificationData,
    images: { direction: string; file: File }[],
  ) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      // 1. 이미지들을 S3에 업로드하고 URL 리스트 생성
      const faceUrls = await Promise.all(
        images.map(async (img) => {
          const imageUrl = await uploadToS3(img.file, "kyc-face-images");
          return {
            direction: img.direction,
            imageUrl: imageUrl, // 문자열 URL
          };
        }),
      );

      // 2. URL 리스트 저장
      await saveFaceVerification(user.uid, faceUrls);
      setFaceData(data);

      await completeKYCVerification(user.uid);
      router.push("/profile");
    } catch (err: any) {
      console.error("Face verification error:", err);
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {currentLanguage === "ko" ? "로딩 중..." : "Đang tải..."}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const steps = [
    {
      number: 1,
      title: currentLanguage === "ko" ? "전화번호 인증" : "Phone Verification",
      completed: phoneData !== null,
    },
    {
      number: 2,
      title: currentLanguage === "ko" ? "신분증 촬영" : "ID Capture",
      completed: idDocumentData !== null,
    },
    {
      number: 3,
      title: currentLanguage === "ko" ? "얼굴 인증" : "Face Verification",
      completed: faceData !== null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        <div className="px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {currentLanguage === "ko" ? "임대인 인증" : "Host Verification"}
            </h1>
            <p className="text-sm text-gray-600">
              {currentLanguage === "ko"
                ? "3단계 인증을 완료해주세요"
                : "Please complete the 3-step verification"}
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="flex-1 flex flex-col items-center"
                >
                  <div className="relative">
                    {step.completed || currentStep > step.number ? (
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                    ) : currentStep === step.number ? (
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {step.number}
                        </span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Circle className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute top-5 left-5 w-full h-0.5 ${step.completed ? "bg-green-600" : "bg-gray-200"}`}
                        style={{ width: "calc(100% + 1rem)" }}
                      />
                    )}
                  </div>
                  <p
                    className={`mt-2 text-xs text-center ${currentStep === step.number ? "font-semibold text-blue-600" : step.completed ? "text-green-600" : "text-gray-400"}`}
                  >
                    {step.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <PhoneVerificationStep
                    currentLanguage={currentLanguage}
                    onComplete={handlePhoneVerificationComplete}
                    initialPhoneNumber={phoneData?.phoneNumber}
                  />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <IdDocumentStep
                    currentLanguage={currentLanguage}
                    onComplete={handleIdDocumentComplete}
                    onNext={handleIdDocumentNext}
                  />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <FaceVerificationStep
                    currentLanguage={currentLanguage}
                    onComplete={handleFaceVerificationComplete}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {loading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4">
                <div className="animate-spin h-8 w-8 text-blue-600 border-4 border-t-transparent rounded-full"></div>
                <p className="text-sm text-gray-700">
                  {currentLanguage === "ko" ? "처리 중..." : "Đang xử lý..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
