/**
 * KYC (Know Your Customer) 인증 페이지
 * 
 * 임대인 인증을 위한 단계별 인증 프로세스
 * Step 1: 전화번호 인증
 * Step 2: 신분증 촬영
 * Step 3: 얼굴 인증
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { PhoneVerificationData, IdDocumentData, FaceVerificationData } from '@/types/kyc.types';
import { 
  savePhoneVerification, 
  saveIdDocument, 
  saveFaceVerification, 
  completeKYCVerification 
} from '@/lib/api/kyc';
import { getCurrentUserData, updateUserData } from '@/lib/api/auth';
import PhoneVerificationStep from '@/components/kyc/PhoneVerificationStep';
import IdDocumentStep from '@/components/kyc/IdDocumentStep';
import FaceVerificationStep from '@/components/kyc/FaceVerificationStep';
import TopBar from '@/components/TopBar';

type KYCStep = 1 | 2 | 3;

export default function KYCPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState<KYCStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 인증 데이터 저장
  const [phoneData, setPhoneData] = useState<PhoneVerificationData | null>(null);
  const [idDocumentData, setIdDocumentData] = useState<IdDocumentData | null>(null);
  const [faceData, setFaceData] = useState<FaceVerificationData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Firestore에서 완료된 단계 불러오기
  useEffect(() => {
    if (!user) return;

    const loadCompletedSteps = async () => {
      try {
        const userData = await getCurrentUserData(user.uid);
        const kycSteps = userData?.kyc_steps || {};
        
        // 완료된 단계에 따라 상태 업데이트
        if (kycSteps.step1) {
          setPhoneData({ phoneNumber: userData?.phoneNumber || '' });
        }
        if (kycSteps.step2) {
          setIdDocumentData({} as IdDocumentData); // 실제 데이터는 verification_info에서 가져올 수 있음
        }
        if (kycSteps.step3) {
          setFaceData({} as FaceVerificationData); // 실제 데이터는 verification_info에서 가져올 수 있음
        }
        
        // 완료되지 않은 첫 번째 단계로 이동
        if (!kycSteps.step1) {
          setCurrentStep(1);
        } else if (!kycSteps.step2) {
          setCurrentStep(2);
        } else if (!kycSteps.step3) {
          setCurrentStep(3);
        }
      } catch (error) {
        console.error('Error loading completed steps:', error);
      }
    };

    loadCompletedSteps();
  }, [user]);

  // Step 1 완료: 전화번호 인증
  const handlePhoneVerificationComplete = async (data: PhoneVerificationData) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      await savePhoneVerification(user.uid, data);
      setPhoneData(data);
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Phone verification error:', err);
      setError(err.message || (currentLanguage === 'ko' ? '전화번호 인증에 실패했습니다' : 'Xác thực số điện thoại thất bại'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 완료: 신분증 촬영 (테스트용: 검증 없이 토큰만 발급)
  const handleIdDocumentComplete = async (data: IdDocumentData, frontImageFile: File, backImageFile?: File) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // 테스트용: 실제 저장 없이 Step 2 토큰만 발급
      // 나중에는 실제 신분증 촬영 및 검증이 필요하지만, 지금은 토큰만 발급
      const userData = await getCurrentUserData(user.uid);
      await updateUserData(user.uid, {
        kyc_steps: {
          ...(userData?.kyc_steps || {}),
          step2: true, // Step 2 완료 토큰 발급
        },
      });
      
      setIdDocumentData(data);
      setCurrentStep(3);
    } catch (err: any) {
      console.error('ID document error:', err);
      setError(err.message || (currentLanguage === 'ko' ? '신분증 저장에 실패했습니다' : 'Lưu giấy tờ thất bại'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 테스트용: 다음 버튼 클릭 시 토큰 발급하고 다음 단계로
  const handleIdDocumentNext = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // 테스트용: 더미 데이터로 Step 2 완료 토큰 발급
      // saveIdDocument 함수를 사용하여 토큰이 확실히 발급되도록 함
      const dummyIdData: IdDocumentData = {
        type: 'id_card',
        idNumber: 'TEST123456',
        fullName: 'Test User',
        dateOfBirth: '1990-01-01',
      };
      
      // 더미 이미지 파일 생성
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.fillText('Test ID Document', 50, 250);
      }
      
      const dummyFile = await new Promise<File>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], 'test-id-front.jpg', { type: 'image/jpeg' }));
          } else {
            // 빈 파일이라도 생성
            resolve(new File([], 'test-id-front.jpg', { type: 'image/jpeg' }));
          }
        }, 'image/jpeg');
      });
      
      // saveIdDocument를 호출하여 토큰 발급 (이미지 저장도 함께)
      await saveIdDocument(user.uid, dummyIdData, dummyFile);
      
      setIdDocumentData(dummyIdData);
      setCurrentStep(3);
    } catch (err: any) {
      console.error('ID document next error:', err);
      setError(err.message || (currentLanguage === 'ko' ? '다음 단계로 이동에 실패했습니다' : 'Chuyển bước tiếp theo thất bại'));
    } finally {
      setLoading(false);
    }
  };

  // Step 3 완료: 얼굴 인증 (테스트용: 검증 없이 토큰만 발급)
  const handleFaceVerificationComplete = async (data: FaceVerificationData, images: { direction: string; file: File }[]) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // 테스트용: 더미 이미지로 Step 3 완료 토큰 발급
      // saveFaceVerification 함수를 사용하여 토큰이 확실히 발급되도록 함
      let imagesToSave = images;
      
      // 이미지가 없으면 더미 이미지 생성
      if (!imagesToSave || imagesToSave.length === 0) {
        const dummyImages = ['front', 'left', 'right', 'up'].map((direction) => {
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '20px Arial';
            ctx.fillText(`Test Face ${direction}`, 50, 200);
          }
          const blob = new Blob([''], { type: 'image/jpeg' });
          return {
            direction,
            file: new File([blob], `test-face-${direction}.jpg`, { type: 'image/jpeg' }),
          };
        });
        imagesToSave = dummyImages;
      }
      
      // saveFaceVerification를 호출하여 토큰 발급 (이미지 저장도 함께)
      await saveFaceVerification(user.uid, imagesToSave);
      setFaceData(data);
      
      // 모든 단계 완료 후 최종 인증 상태 업데이트
      await completeKYCVerification(user.uid);
      
      // 개인정보 페이지로 이동
      router.push('/profile');
    } catch (err: any) {
      console.error('Face verification error:', err);
      // 에러가 발생해도 개인정보 페이지로 이동
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{currentLanguage === 'ko' ? '로딩 중...' : 'Đang tải...'}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const steps = [
    {
      number: 1,
      title: currentLanguage === 'ko' ? '전화번호 인증' : 'Xác thực số điện thoại',
      completed: phoneData !== null,
    },
    {
      number: 2,
      title: currentLanguage === 'ko' ? '신분증 촬영' : 'Chụp ảnh giấy tờ',
      completed: idDocumentData !== null,
    },
    {
      number: 3,
      title: currentLanguage === 'ko' ? '얼굴 인증' : 'Xác thực khuôn mặt',
      completed: faceData !== null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        {/* 상단 바 */}
        <TopBar 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        {/* 콘텐츠 */}
        <div className="px-6 py-6">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {currentLanguage === 'ko' ? '임대인 인증' : 'Xác thực chủ nhà'}
            </h1>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'ko' 
                ? '3단계 인증을 완료해주세요'
                : 'Vui lòng hoàn thành 3 bước xác thực'}
            </p>
          </div>

          {/* 진행 단계 표시 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex-1 flex flex-col items-center">
                  <div className="relative">
                    {step.completed || currentStep > step.number ? (
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                    ) : currentStep === step.number ? (
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">{step.number}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Circle className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute top-5 left-5 w-full h-0.5 ${
                          step.completed ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                        style={{ width: 'calc(100% + 1rem)' }}
                      />
                    )}
                  </div>
                  <p
                    className={`mt-2 text-xs text-center ${
                      currentStep === step.number
                        ? 'font-semibold text-blue-600'
                        : step.completed
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 단계별 컴포넌트 */}
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
                    onNext={handleIdDocumentNext} // 테스트용: 토큰 발급하고 3단계로 이동
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

          {/* 로딩 오버레이 */}
          {loading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-gray-700">
                  {currentLanguage === 'ko' ? '처리 중...' : 'Đang xử lý...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
