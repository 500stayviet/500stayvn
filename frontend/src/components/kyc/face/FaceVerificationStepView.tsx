'use client';

import { Camera, CheckCircle2, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { faceDirections } from '@/components/kyc/face/faceDirectionConfig';
import type { useFaceVerificationStepState } from './useFaceVerificationStepState';

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

  return (
    <div className="w-full">
      <AnimatePresence mode="sync">
        {/* Step 1: 준비 화면 */}
        {step === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* 테스트 모드 알림 */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-medium">
                    {currentLanguage === 'ko' 
                      ? '현재 테스트 모드입니다'
                      : currentLanguage === 'vi'
                      ? 'Đang ở chế độ thử nghiệm'
                      : currentLanguage === 'ja'
                      ? '現在テストモードです'
                      : currentLanguage === 'zh'
                      ? '当前为测试模式'
                      : 'Currently in test mode'}
                  </p>
                  <p className="text-xs mt-1">
                    {currentLanguage === 'ko' 
                      ? '촬영 없이도 인증 완료 가능'
                      : currentLanguage === 'vi'
                      ? 'Có thể hoàn thành xác thực mà không cần chụp ảnh'
                      : currentLanguage === 'ja'
                      ? '撮影なしで認証完了可能'
                      : currentLanguage === 'zh'
                      ? '无需拍摄即可完成认证'
                      : 'Can complete verification without capture'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko'
                  ? '얼굴 인증'
                  : currentLanguage === 'vi'
                    ? 'Xác thực khuôn mặt'
                    : currentLanguage === 'ja'
                      ? '顔認証'
                      : currentLanguage === 'zh'
                        ? '面部识别'
                        : 'Face Verification'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko'
                  ? '5방향 얼굴 촬영을 진행해주세요'
                  : currentLanguage === 'vi'
                    ? 'Vui lòng thực hiện chụp ảnh khuôn mặt 5 hướng'
                  : currentLanguage === 'ja'
                    ? '5方向の顔撮影を行ってください'
                  : currentLanguage === 'zh'
                    ? '请进行5个方向的面部拍摄'
                  : 'Please perform 5-direction face capture'}
              </p>
            </div>

            {/* 촬영 시작 버튼 */}
            <button
              onClick={handleStartCapture}
              className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>
                {currentLanguage === 'ko'
                  ? '촬영 시작'
                  : currentLanguage === 'vi'
                    ? 'Bắt đầu chụp ảnh'
                  : currentLanguage === 'ja'
                    ? '撮影開始'
                  : currentLanguage === 'zh'
                    ? '开始拍摄'
                  : 'Start Capture'}
              </span>
            </button>

            {/* 테스트용: 바로 인증 완료 버튼 */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleCompleteWithAnalysis}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                <span>
                  {currentLanguage === 'ko'
                    ? '다음 (테스트 모드)'
                    : currentLanguage === 'vi'
                      ? 'Tiếp theo (Chế độ thử nghiệm)'
                    : currentLanguage === 'ja'
                      ? '次へ（テストモード）'
                    : currentLanguage === 'zh'
                      ? '下一步（测试模式）'
                    : 'Next (Test Mode)'}
                </span>
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
                {currentLanguage === 'ko'
                  ? '얼굴 촬영'
                  : currentLanguage === 'vi'
                    ? 'Chụp ảnh khuôn mặt'
                  : currentLanguage === 'ja'
                    ? '顔撮影'
                  : currentLanguage === 'zh'
                    ? '面부拍摄'
                  : 'Face Capture'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko'
                  ? `${currentDirectionIndex + 1}/${faceDirections.length} 단계`
                  : currentLanguage === 'vi'
                    ? `Bước ${currentDirectionIndex + 1}/${faceDirections.length}`
                  : currentLanguage === 'ja'
                    ? `ステップ ${currentDirectionIndex + 1}/${faceDirections.length}`
                  : currentLanguage === 'zh'
                    ? `第 ${currentDirectionIndex + 1}/${faceDirections.length} 步`
                  : `Step ${currentDirectionIndex + 1}/${faceDirections.length}`}
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

              {/* 카운트다운 */}
              {countdown > 0 && (
                <motion.div
                  key={countdown}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-6xl font-bold text-white">
                    {countdown}
                  </div>
                </motion.div>
              )}

              {/* 안내 메시지 */}
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
                      <p className="text-base font-semibold text-gray-900">
                        {currentGuideText}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* 수동 촬영 버튼 */}
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

            {/* 촬영 중단 버튼 */}
            <button
              onClick={handleCancelCapture}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {currentLanguage === 'ko' ? '촬영 중단' : 'Dừng chụp ảnh'}
            </button>
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
                {currentLanguage === 'ko'
                  ? '촬영 완료'
                  : currentLanguage === 'vi'
                    ? 'Hoàn thành chụp ảnh'
                  : currentLanguage === 'ja'
                    ? '撮影完了'
                  : currentLanguage === 'zh'
                    ? '拍摄完成'
                  : 'Capture Complete'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko'
                  ? '촬영된 이미지를 확인해주세요'
                  : currentLanguage === 'vi'
                    ? 'Vui lòng xác nhận hình ảnh đã chụp'
                  : currentLanguage === 'ja'
                    ? '撮影された画像を確認してください'
                  : currentLanguage === 'zh'
                    ? '请确认拍摄的图片'
                  : 'Please review the captured images'}
              </p>
            </div>

            {/* 촬영된 이미지 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              {capturedImages.map((img, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">
                    {(() => {
                      const dir = faceDirections.find(
                        (d) => d.key === img.direction,
                      );
                      return dir?.text
                        ? (dir.text as any)[currentLanguage] ||
                            dir.text.ko ||
                            img.direction
                        : img.direction;
                    })()}
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

            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                {currentLanguage === 'ko'
                  ? '다시 촬영'
                  : currentLanguage === 'vi'
                    ? 'Chụp lại'
                  : currentLanguage === 'ja'
                    ? '撮り直し'
                  : currentLanguage === 'zh'
                    ? '重新拍摄'
                  : 'Retake'}
              </button>
              <button
                onClick={handleCompleteWithAnalysis}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {currentLanguage === 'ko'
                    ? '인증 완료'
                    : currentLanguage === 'vi'
                      ? 'Hoàn thành xác thực'
                    : currentLanguage === 'ja'
                      ? '認証完了'
                    : currentLanguage === 'zh'
                      ? '认证完成'
                      : 'Complete Verification'}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* AI 분석 중 화면 */}
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
                  {currentLanguage === 'ko'
                    ? 'AI 분석 중'
                    : currentLanguage === 'vi'
                      ? 'Đang phân tích AI'
                    : currentLanguage === 'ja'
                      ? 'AI分析中'
                    : currentLanguage === 'zh'
                      ? 'AI分析中'
                      : 'AI Analyzing'}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentLanguage === 'ko'
                    ? '얼굴 인증 데이터를 분석하고 있습니다...'
                    : currentLanguage === 'vi'
                      ? 'Đang phân tích dữ liệu xác thực khuôn mặt...'
                    : currentLanguage === 'ja'
                      ? '顔認証データを分析中...'
                    : currentLanguage === 'zh'
                      ? '正在分析面部认证数据...'
                      : 'Analyzing face verification data...'}
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
