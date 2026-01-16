/**
 * KYC Step 3: 실시간 얼굴 촬영 컴포넌트 (Liveness Check)
 * 
 * 전면 카메라를 사용한 동일인 판별
 * 정면 -> 왼쪽 -> 오른쪽 -> 위 순차 촬영
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceVerificationData } from '@/types/kyc.types';
import { SupportedLanguage } from '@/lib/api/translation';
import { useCamera } from '@/hooks/useCamera';
import { canvasToBlob, resizeImage } from '@/utils/imageUtils';

interface FaceVerificationStepProps {
  currentLanguage: SupportedLanguage;
  onComplete: (data: FaceVerificationData, images: { direction: string; file: File }[]) => void;
}

// 안내 메시지 및 방향
const faceDirections = [
  { key: 'front', text: { ko: '정면을 보세요', vi: 'Nhìn thẳng về phía trước' }, duration: 3000 },
  { key: 'left', text: { ko: '왼쪽을 보세요', vi: 'Nhìn sang trái' }, duration: 3000 },
  { key: 'right', text: { ko: '오른쪽을 보세요', vi: 'Nhìn sang phải' }, duration: 3000 },
  { key: 'up', text: { ko: '위를 보세요', vi: 'Nhìn lên trên' }, duration: 3000 },
];

export default function FaceVerificationStep({
  currentLanguage,
  onComplete,
}: FaceVerificationStepProps) {
  const [step, setStep] = useState<'ready' | 'capturing' | 'preview'>('ready');
  const [currentDirectionIndex, setCurrentDirectionIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<{ direction: string; imageUrl: string; file: File }[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [capturing, setCapturing] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoCaptureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { videoRef, stream, isLoading, error: cameraError, startCamera, stopCamera, switchCamera, captureFrame } = useCamera({
    facingMode: 'user',
    onError: () => {},
  });

  // 카메라 시작
  useEffect(() => {
    if (step === 'capturing' && !stream) {
      startCamera();
    }
    return () => {
      if (step !== 'capturing') {
        stopCamera();
      }
    };
  }, [step, stream, startCamera, stopCamera]);

  // 카운트다운 및 자동 캡처
  useEffect(() => {
    if (step === 'capturing' && countdown === 0 && autoCapture) {
      // 자동 캡처 타이머
      autoCaptureTimeoutRef.current = setTimeout(() => {
        handleAutoCapture();
      }, faceDirections[currentDirectionIndex]?.duration || 3000);

      return () => {
        if (autoCaptureTimeoutRef.current) {
          clearTimeout(autoCaptureTimeoutRef.current);
        }
      };
    }
  }, [step, countdown, currentDirectionIndex, autoCapture]);

  // 카운트다운 시작
  const handleStartCapture = () => {
    setStep('capturing');
    setCountdown(3);
    setCurrentDirectionIndex(0);
    setCapturedImages([]);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 자동 캡처
  const handleAutoCapture = async () => {
    if (capturing || !stream) return;
    await captureCurrentDirection();
  };

  // 수동 캡처
  const handleManualCapture = async () => {
    if (capturing || !stream) return;
    await captureCurrentDirection();
  };

  // 현재 방향 캡처
  const captureCurrentDirection = async () => {
    if (capturing || !stream) return;

    setCapturing(true);
    try {
      const canvas = captureFrame();
      if (!canvas) {
        throw new Error('캔버스를 생성할 수 없습니다');
      }

      // Canvas를 Blob으로 변환
      const blob = await canvasToBlob(canvas, 0.9);
      
      // 이미지 리사이징
      const resizedBlob = await resizeImage(
        new File([blob], 'face.jpg', { type: 'image/jpeg' }),
        1920,
        1080,
        0.85
      );

      const direction = faceDirections[currentDirectionIndex].key;
      const file = new File([resizedBlob], `face_${direction}_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const imageUrl = URL.createObjectURL(file);

      setCapturedImages((prev) => [
        ...prev,
        { direction, imageUrl, file },
      ]);

      // 다음 방향으로 이동
      if (currentDirectionIndex < faceDirections.length - 1) {
        setCurrentDirectionIndex((prev) => prev + 1);
        // 자동 캡처인 경우 다음 타이머 시작
        if (autoCapture) {
          autoCaptureTimeoutRef.current = setTimeout(() => {
            handleAutoCapture();
          }, faceDirections[currentDirectionIndex + 1]?.duration || 3000);
        }
      } else {
        // 모든 방향 촬영 완료
        setStep('preview');
        stopCamera();
      }
    } catch (err: any) {
      // Silent fail
    } finally {
      setCapturing(false);
    }
  };

  // 재촬영
  const handleRetake = () => {
    setCapturedImages([]);
    setCurrentDirectionIndex(0);
    setCountdown(3);
    setStep('ready');
    stopCamera();
  };

  // 확인 및 완료
  const handleConfirm = () => {
    if (capturedImages.length === 0) return;

    const faceData: FaceVerificationData = {
      imageUrl: capturedImages[0]?.imageUrl || undefined,
    };

    const images = capturedImages.map((img) => ({
      direction: img.direction,
      file: img.file,
    }));

    onComplete(faceData, images);
  };

  const currentDirection = faceDirections[currentDirectionIndex];
  const currentGuideText = currentDirection?.text?.[currentLanguage] || currentDirection?.text?.ko || '';

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {/* Step 1: 준비 화면 */}
        {/* 테스트용: ready 단계에서 바로 다음 버튼 */}
        {step === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko' ? '얼굴 인증' : 'Xác thực khuôn mặt'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko' 
                  ? '테스트용: 다음 버튼을 눌러 진행하세요'
                  : 'Để kiểm tra: Nhấn nút Tiếp theo để tiếp tục'}
              </p>
            </div>

            {/* 테스트용: 바로 다음 버튼 */}
            <button
              onClick={() => {
                // 테스트용: 더미 데이터로 완료 처리
                const dummyFaceData: FaceVerificationData = {
                  imageUrl: undefined,
                };
                // 더미 이미지 파일들 생성
                const dummyImages = faceDirections.map((dir) => {
                  const canvas = document.createElement('canvas');
                  canvas.width = 400;
                  canvas.height = 400;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.fillStyle = '#e0e0e0';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#666';
                    ctx.font = '20px Arial';
                    ctx.fillText(`Test Face ${dir.key}`, 50, 200);
                  }
                  const blob = new Blob([''], { type: 'image/jpeg' });
                  return {
                    direction: dir.key,
                    file: new File([blob], `test-face-${dir.key}.jpg`, { type: 'image/jpeg' }),
                  };
                });
                onComplete(dummyFaceData, dummyImages);
              }}
              className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <span>{currentLanguage === 'ko' ? '다음' : 'Tiếp theo'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* 기존 ready 단계는 주석 처리 (테스트용으로 위 버튼 사용) */}
        {false && step === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko' ? '얼굴 인증' : 'Xác thực khuôn mặt'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko' 
                  ? '안내에 따라 얼굴을 촬영해주세요'
                  : 'Vui lòng chụp ảnh khuôn mặt theo hướng dẫn'}
              </p>
            </div>

            {/* 안내 사항 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-blue-900">
                {currentLanguage === 'ko' ? '안내사항' : 'Lưu ý'}
              </p>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>{currentLanguage === 'ko' ? '얼굴이 원형 가이드에 맞도록 위치해주세요' : 'Đặt khuôn mặt vào vòng tròn hướng dẫn'}</li>
                <li>{currentLanguage === 'ko' ? '정면 -> 왼쪽 -> 오른쪽 -> 위 순서로 촬영됩니다' : 'Chụp theo thứ tự: thẳng -> trái -> phải -> lên'}</li>
                <li>{currentLanguage === 'ko' ? '조명이 충분한 곳에서 촬영해주세요' : 'Chụp ở nơi có đủ ánh sáng'}</li>
              </ul>
            </div>

            {/* 자동/수동 캡처 선택 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAutoCapture(true);
                  handleStartCapture();
                }}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
              >
                {currentLanguage === 'ko' ? '자동 촬영' : 'Tự động chụp'}
              </button>
              <button
                onClick={() => {
                  setAutoCapture(false);
                  handleStartCapture();
                }}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                {currentLanguage === 'ko' ? '수동 촬영' : 'Chụp thủ công'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: 촬영 중 화면 */}
        {step === 'capturing' && (
          <motion.div
            key="capturing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko' ? '얼굴 촬영' : 'Chụp ảnh khuôn mặt'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko' 
                  ? `${currentDirectionIndex + 1}/${faceDirections.length} 단계`
                  : `Bước ${currentDirectionIndex + 1}/${faceDirections.length}`}
              </p>
            </div>

            {/* 카메라 에러 메시지 */}
            {cameraError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <p className="font-medium mb-1">카메라 오류</p>
                <p>{cameraError.message}</p>
                {cameraError.message.includes('권한') && (
                  <button
                    onClick={startCamera}
                    className="mt-2 text-xs underline"
                  >
                    {currentLanguage === 'ko' ? '다시 시도' : 'Thử lại'}
                  </button>
                )}
              </div>
            )}

            {/* 카메라 프리뷰 */}
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-square">
              {/* 비디오 요소 */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* 원형 가이드 라인 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[70%] h-[70%] border-4 border-white rounded-full"></div>
              </div>

              {/* 카운트다운 (3초) */}
              {countdown > 0 && (
                <motion.div
                  key={countdown}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-6xl font-bold text-white">{countdown}</div>
                </motion.div>
              )}

              {/* 안내 메시지 (카운트다운 후) */}
              {countdown === 0 && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentDirectionIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute bottom-8 left-0 right-0 text-center"
                  >
                    <div className="inline-block bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full">
                      <p className="text-base font-semibold text-gray-900">
                        {currentGuideText}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* 수동 촬영 버튼 (카운트다운 후) */}
              {countdown === 0 && !autoCapture && (
                <button
                  onClick={handleManualCapture}
                  disabled={capturing}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                >
                  {capturing ? (
                    <svg className="animate-spin h-8 w-8 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Camera className="w-8 h-8 text-gray-900" />
                  )}
                </button>
              )}
            </div>

            {/* 진행 단계 표시 */}
            <div className="flex justify-center gap-2">
              {faceDirections.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index < currentDirectionIndex
                      ? 'bg-green-600 w-8'
                      : index === currentDirectionIndex
                      ? 'bg-blue-600 w-8'
                      : 'bg-gray-200 w-2'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: 이미지 미리보기 */}
        {step === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko' ? '촬영 완료' : 'Hoàn thành chụp ảnh'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko' 
                  ? '촬영된 이미지를 확인해주세요'
                  : 'Vui lòng xác nhận hình ảnh đã chụp'}
              </p>
            </div>

            {/* 촬영된 이미지 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              {capturedImages.map((img, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">
                    {faceDirections.find((d) => d.key === img.direction)?.text?.[currentLanguage] || img.direction}
                  </p>
                  <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-square">
                    <img
                      src={img.imageUrl}
                      alt={`Face ${img.direction}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                {currentLanguage === 'ko' ? '다시 촬영' : 'Chụp lại'}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{currentLanguage === 'ko' ? '완료' : 'Hoàn thành'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
