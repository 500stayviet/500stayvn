'use client';

import { Camera, ArrowRight, CheckCircle2, FileText, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { useIdDocumentStepState } from './useIdDocumentStepState';

type Vm = ReturnType<typeof useIdDocumentStepState>;

export function IdDocumentStepView(p: Vm) {
  const {
    currentLanguage,
    step,
    idType,
    captureStep,
    frontImage,
    backImage,
    formData,
    setFormData,
    error,
    setError,
    capturing,
    videoRef,
    stream,
    isLoading,
    cameraError,
    startCamera,
    stopCamera,
    openIdCardCamera,
    openPassportCamera,
    handleCapture,
    handleRetake,
    handleConfirmImage,
    handleSubmit,
    handleBackToSelect,
    handleTestModeButton,
    handlePreviewSecondary,
  } = p;

  void stopCamera;

  return (
    <div className="w-full">
      <AnimatePresence mode="sync">
        {step === 'select' && (
          <motion.div
            key="select"
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
                      ? '촬영 없이도 다음 단계 이동 가능'
                      : currentLanguage === 'vi'
                        ? 'Có thể chuyển bước tiếp theo mà không cần chụp ảnh'
                        : currentLanguage === 'ja'
                          ? '撮影なしで次のステップに移動可能'
                          : currentLanguage === 'zh'
                            ? '无需拍摄即可进入下一步'
                            : 'Can proceed to next step without capture'}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko'
                  ? '신분증 촬영'
                  : currentLanguage === 'vi'
                    ? 'Chụp ảnh giấy tờ'
                    : currentLanguage === 'ja'
                      ? '身分証明書撮影'
                      : currentLanguage === 'zh'
                        ? '证件拍摄'
                        : 'ID Capture'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko'
                  ? '신분증 유형을 선택하고 카메라로 촬영해주세요'
                  : currentLanguage === 'vi'
                    ? 'Chọn loại giấy tờ và chụp ảnh bằng camera'
                    : currentLanguage === 'ja'
                      ? '身分証明書の種類を選択し、カメラで撮影してください'
                      : currentLanguage === 'zh'
                        ? '选择证件类型并使用相机拍摄'
                        : 'Select ID type and capture with camera'}
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={openIdCardCamera}
                className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>
                  {currentLanguage === 'ko'
                    ? '카메라 켜기 (신분증)'
                    : currentLanguage === 'vi'
                      ? 'Bật camera (CMND/CCCD)'
                      : currentLanguage === 'ja'
                        ? 'カメラをオン (身分証明書)'
                        : currentLanguage === 'zh'
                          ? '打开相机 (证件)'
                          : 'Turn on Camera (ID Card)'}
                </span>
              </button>

              <button
                type="button"
                onClick={openPassportCamera}
                className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>
                  {currentLanguage === 'ko'
                    ? '카메라 켜기 (여권)'
                    : currentLanguage === 'vi'
                      ? 'Bật camera (Hộ chiếu)'
                      : currentLanguage === 'ja'
                        ? 'カメラをオン (パスポート)'
                        : currentLanguage === 'zh'
                          ? '打开相机 (护照)'
                          : 'Turn on Camera (Passport)'}
                </span>
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleTestModeButton}
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

        {step === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko'
                  ? captureStep === 'front'
                    ? idType === 'id_card'
                      ? '신분증 앞면 촬영'
                      : '여권 정보면 촬영'
                    : '신분증 뒷면 촬영'
                  : captureStep === 'front'
                    ? idType === 'id_card'
                      ? 'Chụp mặt trước CMND/CCCD'
                      : 'Chụp trang thông tin hộ chiếu'
                    : 'Chụp mặt sau CMND/CCCD'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko'
                  ? '신분증을 가이드 라인에 맞춰 촬영해주세요'
                  : 'Vui lòng chụp ảnh giấy tờ theo đường viền hướng dẫn'}
              </p>
            </div>

            {cameraError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <p className="font-medium mb-1">카메라 오류</p>
                <p>{cameraError.message}</p>
                {cameraError.message.includes('권한') && (
                  <button type="button" onClick={startCamera} className="mt-2 text-xs underline">
                    {currentLanguage === 'ko' ? '다시 시도' : 'Thử lại'}
                  </button>
                )}
              </div>
            )}

            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-[16/10]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[85%] h-[60%] border-4 border-white border-dashed rounded-lg" />
              </div>
              <div className="absolute bottom-20 left-0 right-0 text-center text-white">
                <p className="text-sm font-medium mb-1">
                  {currentLanguage === 'ko'
                    ? '신분증을 가이드 라인에 맞춰주세요'
                    : 'Đặt giấy tờ vào đường viền hướng dẫn'}
                </p>
                <p className="text-xs text-gray-300">
                  {currentLanguage === 'ko' ? '전체가 보이도록 촬영해주세요' : 'Đảm bảo toàn bộ giấy tờ được hiển thị'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCapture}
                disabled={capturing || !stream || isLoading}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {capturing ? (
                  <svg
                    className="animate-spin h-8 w-8 text-gray-900"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <Camera className="w-8 h-8 text-gray-900" />
                )}
              </button>
            </div>

            <button type="button" onClick={handleBackToSelect} className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              {currentLanguage === 'ko' ? '뒤로가기' : 'Quay lại'}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko' ? '이미지 확인' : 'Xác nhận hình ảnh'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko' ? '촬영된 이미지를 확인해주세요' : 'Vui lòng xác nhận hình ảnh đã chụp'}
              </p>
            </div>

            {frontImage && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {currentLanguage === 'ko' ? '앞면' : 'Mặt trước'}
                </p>
                <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL */}
                  <img src={frontImage} alt="Front ID" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => handleRetake('front')}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>
            )}

            {backImage && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {currentLanguage === 'ko' ? '뒷면' : 'Mặt sau'}
                </p>
                <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL */}
                  <img src={backImage} alt="Back ID" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => handleRetake('back')}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePreviewSecondary}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                {idType === 'id_card' && !backImage
                  ? currentLanguage === 'ko'
                    ? '뒷면 촬영'
                    : 'Chụp mặt sau'
                  : currentLanguage === 'ko'
                    ? '다시 촬영'
                    : 'Chụp lại'}
              </button>
              <button
                type="button"
                onClick={handleConfirmImage}
                disabled={!frontImage || (idType === 'id_card' && !backImage)}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{currentLanguage === 'ko' ? '확인' : 'Xác nhận'}</span>
              </button>
            </div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko'
                  ? '신분증 정보 입력'
                  : currentLanguage === 'vi'
                    ? 'Nhập thông tin giấy tờ'
                    : currentLanguage === 'ja'
                      ? '身分証明書情報入力'
                      : currentLanguage === 'zh'
                        ? '填写证件信息'
                        : 'Enter ID Information'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'ko'
                  ? '신분증에 기재된 정보를 입력해주세요'
                  : currentLanguage === 'vi'
                    ? 'Vui lòng nhập thông tin trên giấy tờ'
                    : currentLanguage === 'ja'
                      ? '身分証明書に記載された情報を入力してください'
                      : currentLanguage === 'zh'
                        ? '请输入证件上的信息'
                        : 'Please enter the information as shown on your ID'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'ko'
                  ? '이름'
                  : currentLanguage === 'vi'
                    ? 'Họ tên'
                    : currentLanguage === 'ja'
                      ? '氏名'
                      : currentLanguage === 'zh'
                        ? '姓名'
                        : 'Full Name'}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }));
                  setError('');
                }}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'ko'
                  ? '신분증 번호'
                  : currentLanguage === 'vi'
                    ? 'Số giấy tờ'
                    : currentLanguage === 'ja'
                      ? '身분証番号'
                      : currentLanguage === 'zh'
                        ? '证件号码'
                        : 'ID Number'}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, idNumber: e.target.value }));
                  setError('');
                }}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'ko'
                  ? '생년월일'
                  : currentLanguage === 'vi'
                    ? 'Ngày sinh'
                    : currentLanguage === 'ja'
                      ? '生年月日'
                      : currentLanguage === 'zh'
                        ? '出生日期'
                        : 'Date of Birth'}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }));
                  setError('');
                }}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'ko'
                  ? '발급일'
                  : currentLanguage === 'vi'
                    ? 'Ngày cấp'
                    : currentLanguage === 'ja'
                      ? '発行日'
                      : currentLanguage === 'zh'
                        ? '签发日期'
                        : 'Issue Date'}{' '}
                (선택)
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'ko'
                  ? '만료일'
                  : currentLanguage === 'vi'
                    ? 'Ngày hết hạn'
                    : currentLanguage === 'ja'
                      ? '有効期限'
                      : currentLanguage === 'zh'
                        ? '有效期限'
                        : 'Expiry Date'}{' '}
                (선택)
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <span>
                {currentLanguage === 'ko'
                  ? '다음 단계'
                  : currentLanguage === 'vi'
                    ? 'Bước tiếp theo'
                    : currentLanguage === 'ja'
                      ? '次へ'
                      : currentLanguage === 'zh'
                        ? '下一步'
                        : 'Next Step'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
