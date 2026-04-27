'use client';

import { Camera, CheckCircle2, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { faceDirections } from '@/components/kyc/face/faceDirectionConfig';
import type { useFaceVerificationStepState } from './useFaceVerificationStepState';
import type { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';

function isLikelyCameraPermissionError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('permission') ||
    m.includes('권한') ||
    m.includes('quyền') ||
    m.includes('权限') ||
    m.includes('許可')
  );
}

function faceDirectionLabel(directionKey: string, language: SupportedLanguage): string {
  const dir = faceDirections.find((d) => d.key === directionKey);
  if (!dir?.text) return directionKey;
  const t = dir.text as Record<SupportedLanguage, string>;
  return t[language] ?? dir.text.en;
}

type Vm = ReturnType<typeof useFaceVerificationStepState>;

export function FaceVerificationStepView(p: Vm) {
  const {
    currentLanguage,
    step,
    currentDirectionIndex,
    capturedImages,
    countdown,
    capturing,
    autoCapture,
    showAIAnalysis,
    videoRef,
    cameraError,
    startCamera,
    handleStartCapture,
    handleManualCapture,
    handleRetake,
    handleCompleteWithAnalysis,
    handleCancelCapture,
    currentGuideText,
  } = p;

  const stepProgress = getUIText('kycMultistepProgress', currentLanguage)
    .replace('{current}', String(currentDirectionIndex + 1))
    .replace('{total}', String(faceDirections.length));

  return (
    <div className="w-full">
      <AnimatePresence mode="sync">
        {step === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-medium">
                    {getUIText('kycTestModeBannerTitle', currentLanguage)}
                  </p>
                  <p className="text-xs mt-1">
                    {getUIText('kycTestModeFaceSubtitle', currentLanguage)}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {getUIText('kycFaceVerificationStepTitle', currentLanguage)}
              </h2>
              <p className="text-sm text-gray-600">
                {getUIText('kycFaceFiveDirectionInstruction', currentLanguage)}
              </p>
            </div>

            <button
              onClick={handleStartCapture}
              className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>{getUIText('kycStartCapture', currentLanguage)}</span>
            </button>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleCompleteWithAnalysis}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                <span>{getUIText('kycTestModeProceed', currentLanguage)}</span>
              </button>
            </div>
          </motion.div>
        )}

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
                {getUIText('kycFaceCaptureSessionTitle', currentLanguage)}
              </h2>
              <p className="text-sm text-gray-600">{stepProgress}</p>
            </div>

            {cameraError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <p className="font-medium mb-1">
                  {getUIText('kycCameraErrorTitle', currentLanguage)}
                </p>
                <p>{cameraError.message}</p>
                {isLikelyCameraPermissionError(cameraError.message) && (
                  <button onClick={startCamera} className="mt-2 text-xs underline">
                    {getUIText('retry', currentLanguage)}
                  </button>
                )}
              </div>
            )}

            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-square">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[70%] h-[70%] border-4 border-white rounded-full"></div>
              </div>

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

              {countdown === 0 && (
                <AnimatePresence mode="sync">
                  <motion.div
                    key={currentDirectionIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute bottom-8 left-0 right-0 text-center"
                  >
                    <div className="inline-block bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full">
                      <p className="text-base font-semibold text-gray-900">{currentGuideText}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {countdown === 0 && !autoCapture && (
                <button
                  onClick={handleManualCapture}
                  disabled={capturing}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                >
                  {capturing ? (
                    <svg
                      className="animate-spin h-8 w-8 text-gray-900"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <Camera className="w-8 h-8 text-gray-900" />
                  )}
                </button>
              )}
            </div>

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

            <button
              onClick={handleCancelCapture}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {getUIText('kycStopCapture', currentLanguage)}
            </button>
          </motion.div>
        )}

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
                {getUIText('kycCaptureCompleteTitle', currentLanguage)}
              </h2>
              <p className="text-sm text-gray-600">
                {getUIText('kycReviewCapturedImagesFace', currentLanguage)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {capturedImages.map((img, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">
                    {faceDirectionLabel(img.direction, currentLanguage)}
                  </p>
                  <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL */}
                    <img
                      src={img.imageUrl}
                      alt={`Face ${img.direction}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                {getUIText('kycRetakePhotos', currentLanguage)}
              </button>
              <button
                onClick={handleCompleteWithAnalysis}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{getUIText('kycCompleteVerification', currentLanguage)}</span>
              </button>
            </div>
          </motion.div>
        )}

        {showAIAnalysis && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full">
                <Brain className="w-10 h-10 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {getUIText('kycAiAnalyzingTitle', currentLanguage)}
                </h3>
                <p className="text-sm text-gray-600">
                  {getUIText('kycAiAnalyzingDesc', currentLanguage)}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
