'use client';

import { useState, useEffect, useRef } from 'react';
import { FaceVerificationData } from '@/types/kyc.types';
import { useCamera } from '@/hooks/useCamera';
import { canvasToBlob, resizeImage } from '@/utils/imageUtils';
import { faceDirections } from '@/components/kyc/face/faceDirectionConfig';
import type { FaceVerificationStepProps } from './types';
import type { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';

export function useFaceVerificationStepState({ currentLanguage, onComplete }: FaceVerificationStepProps) {
  const [step, setStep] = useState<'ready' | 'capturing' | 'preview' | 'analyzing'>('ready');
  const [currentDirectionIndex, setCurrentDirectionIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<
    { direction: string; imageUrl: string; file: File }[]
  >([]);
  const [countdown, setCountdown] = useState(3);
  const [capturing, setCapturing] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoCaptureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { videoRef, stream, isLoading, error: cameraError, startCamera, stopCamera, captureFrame } = useCamera({
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
      autoCaptureTimeoutRef.current = setTimeout(() => {
        void handleAutoCapture();
      }, faceDirections[currentDirectionIndex]?.duration || 3000);

      return () => {
        if (autoCaptureTimeoutRef.current) {
          clearTimeout(autoCaptureTimeoutRef.current);
        }
      };
    }
    // handleAutoCapture는 매 렌더마다 갱신되며, 타이머는 countdown/방향 전환에만 의존
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        throw new Error(getUIText('kycCaptureCanvasError', currentLanguage));
      }

      const blob = await canvasToBlob(canvas, 0.9);
      const resizedBlob = await resizeImage(
        new File([blob], 'face.jpg', { type: 'image/jpeg' }),
        1920,
        1080,
        0.85,
      );

      const direction = faceDirections[currentDirectionIndex].key;
      const file = new File(
        [resizedBlob],
        `face_${direction}_${Date.now()}.jpg`,
        { type: 'image/jpeg' },
      );
      const imageUrl = URL.createObjectURL(file);

      setCapturedImages((prev) => [...prev, { direction, imageUrl, file }]);

      if (currentDirectionIndex < faceDirections.length - 1) {
        setCurrentDirectionIndex((prev) => prev + 1);
        if (autoCapture) {
          autoCaptureTimeoutRef.current = setTimeout(
            () => {
              void handleAutoCapture();
            },
            faceDirections[currentDirectionIndex + 1]?.duration || 3000,
          );
        }
      } else {
        setStep('preview');
        stopCamera();
      }
    } catch {
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

  // AI 분석 애니메이션 후 완료
  const handleCompleteWithAnalysis = () => {
    setShowAIAnalysis(true);

    setTimeout(() => {
      setShowAIAnalysis(false);

      const faceData: FaceVerificationData = {
        imageUrl: capturedImages[0]?.imageUrl || undefined,
      };

      const images =
        capturedImages.length > 0
          ? capturedImages.map((img) => ({
              direction: img.direction,
              file: img.file,
            }))
          : faceDirections.map((dir) => {
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
                file: new File([blob], `test-face-${dir.key}.jpg`, {
                  type: 'image/jpeg',
                }),
              };
            });

      onComplete(faceData, images);
    }, 2000);
  };

  const handleCancelCapture = () => {
    stopCamera();
    setStep('ready');
  };

  const currentDirection = faceDirections[currentDirectionIndex];
  const currentGuideText = currentDirection?.text
    ? (currentDirection.text as Record<SupportedLanguage, string>)[currentLanguage] ??
      currentDirection.text.en
    : '';

  return {
    currentLanguage,
    step,
    currentDirectionIndex,
    capturedImages,
    countdown,
    capturing,
    autoCapture,
    setAutoCapture,
    showAIAnalysis,
    videoRef,
    stream,
    isLoading,
    cameraError,
    startCamera,
    stopCamera,
    handleStartCapture,
    handleManualCapture,
    handleRetake,
    handleCompleteWithAnalysis,
    handleCancelCapture,
    currentGuideText,
  };
}
