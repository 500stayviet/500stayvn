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

  // 완료된 단계 불러오기 (초기 로드 시에만 실행)
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

        // 현재 단계가 아직 설정되지 않았을 때만 설정
        if (currentStep === 1) {
          if (!kycSteps.step1) {
            setCurrentStep(1);
          } else if (!kycSteps.step2) {
            setCurrentStep(2);
          } else if (!kycSteps.step3) {
            setCurrentStep(3);
          }
        }
      } catch (error) {
        console.error("Error loading completed steps:", error);
      }
    };

    loadCompletedSteps();
  }, [user]); // user만 의존성으로 사용

  // Step 1 완료: 전화번호 인증 (테스트 모드: API 실패해도 다음 단계로)
  const handlePhoneVerificationComplete = async (
    data: PhoneVerificationData,
  ) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      // 테스트 모드: API 호출 시도 (실패해도 계속 진행)
      try {
        await savePhoneVerification(user.uid, data);
      } catch (apiError) {
        console.log("Test mode: Phone verification API failed, continuing anyway:", apiError);
        // 테스트 모드에서는 API 실패를 무시하고 진행
      }
      
      setPhoneData(data);
      setCurrentStep(2);
      
      // 테스트 모드 메시지 표시
      console.log("Phone verification step completed (test mode)");
    } catch (err: any) {
      console.error("Phone verification error:", err);
      // 에러가 발생해도 테스트 모드에서는 다음 단계로 이동
      setPhoneData(data);
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 완료: 실제 신분증 업로드 및 저장 (테스트 데이터 저장 모드)
  const handleIdDocumentComplete = async (
    data: IdDocumentData,
    frontImageFile: File,
    backImageFile?: File,
  ) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      // TODO: Production 환경에서 실제 인증 API 호출
      // 현재는 테스트 모드로 파일 저장만 수행
      await saveIdDocument(user.uid, data, frontImageFile, backImageFile);

      setIdDocumentData(data);
      setCurrentStep(3);
      
      // 테스트 모드 메시지 표시
      alert(
        currentLanguage === "ko" 
          ? "인증 데이터가 안전하게 접수되었습니다. (테스트 모드: 자동 승인)"
          : currentLanguage === "vi"
          ? "Dữ liệu xác thực đã được tiếp nhận an toàn. (Chế độ thử nghiệm: Tự động phê duyệt)"
          : currentLanguage === "ja"
          ? "認証データが安全に受理されました。（テストモード：自動承認）"
          : currentLanguage === "zh"
          ? "认证数据已安全受理。（测试模式：自动批准）"
          : "Verification data has been safely received. (Test mode: Auto approval)"
      );
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

  // Step 2 테스트용: 더미 데이터 처리 (테스트 데이터 저장 모드)
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

      // 더미 파일 생성 (테스트용)
      const createDummyFile = (name: string, text: string): File => {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 500;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#f0f0f0";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#333";
          ctx.font = "24px Arial";
          ctx.fillText(text, 50, 250);
        }
        const blob = new Blob([""], { type: "image/jpeg" });
        return new File([blob], name, { type: "image/jpeg" });
      };

      const dummyFrontFile = createDummyFile("test-id-front.jpg", "Test ID Front");
      const dummyBackFile = createDummyFile("test-id-back.jpg", "Test ID Back");

      await saveIdDocument(user.uid, dummyIdData, dummyFrontFile, dummyBackFile);

      setIdDocumentData(dummyIdData);
      setCurrentStep(3);
      
      // 테스트 모드 메시지 표시
      alert(
        currentLanguage === "ko" 
          ? "인증 데이터가 안전하게 접수되었습니다. (테스트 모드: 자동 승인)"
          : currentLanguage === "vi"
          ? "Dữ liệu xác thực đã được tiếp nhận an toàn. (Chế độ thử nghiệm: Tự động phê duyệt)"
          : currentLanguage === "ja"
          ? "認証データが安全に受理されました。（テストモード：自動承認）"
          : currentLanguage === "zh"
          ? "认证数据已安全受理。（测试模式：自动批准）"
          : "Verification data has been safely received. (Test mode: Auto approval)"
      );
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

  // Step 3 완료: 얼굴 인증 (테스트 데이터 저장 모드)
  const handleFaceVerificationComplete = async (
    data: FaceVerificationData,
    images: { direction: string; file: File }[],
  ) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      // TODO: Production 환경에서 실제 인증 API 호출
      // 현재는 테스트 모드로 파일 저장만 수행
      await saveFaceVerification(user.uid, images);
      setFaceData(data);

      // 임대인 권한 부여 (User 테이블 role 업데이트)
      await completeKYCVerification(user.uid);
      
      // 프로필 페이지로 리다이렉트 (임대인 전용 메뉴 활성화)
      router.push("/profile");
    } catch (err: any) {
      console.error("Face verification error:", err);
      // 에러가 발생해도 프로필 페이지로 이동 (테스트 모드)
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
            <AnimatePresence mode="sync">
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
