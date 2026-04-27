'use client';

import { Camera, ArrowRight, CheckCircle2, FileText, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { useIdDocumentStepState } from './useIdDocumentStepState';
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

  const optionalSuffix = ` (${getUIText('optional', currentLanguage)})`;

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
                    {getUIText('kycTestModeBannerTitle', currentLanguage)}
                  </p>
                  <p className="text-xs mt-1">
                    {getUIText('kycTestModeIdSubtitle', currentLanguage)}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {getUIText('kycIdDocumentStepTitle', currentLanguage)}
              </h2>
              <p className="text-sm text-gray-600">
                {getUIText('kycIdSelectTypeAndCapture', currentLanguage)}
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={openIdCardCamera}
                className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>{getUIText('kycCameraOpenIdCard', currentLanguage)}</span>
              </button>

              <button
                type="button"
                onClick={openPassportCamera}
                className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>{getUIText('kycCameraOpenPassport', currentLanguage)}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleTestModeButton}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                <span>{getUIText('kycTestModeProceed', currentLanguage)}</span>
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
                {captureStep === 'front'
                  ? idType === 'id_card'
                    ? getUIText('kycIdCaptureTitleFrontIdCard', currentLanguage)
                    : getUIText('kycIdCaptureTitleFrontPassport', currentLanguage)
                  : getUIText('kycIdCaptureTitleBack', currentLanguage)}
              </h2>
              <p className="text-sm text-gray-600">
                {getUIText('kycIdAlignInGuide', currentLanguage)}
              </p>
            </div>

            {cameraError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <p className="font-medium mb-1">
                  {getUIText('kycCameraErrorTitle', currentLanguage)}
                </p>
                <p>{cameraError.message}</p>
                {isLikelyCameraPermissionError(cameraError.message) && (
                  <button type="button" onClick={startCamera} className="mt-2 text-xs underline">
                    {getUIText('retry', currentLanguage)}
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
                  {getUIText('kycIdPlaceInFrame', currentLanguage)}
                </p>
                <p className="text-xs text-gray-300">
                  {getUIText('kycIdFullDocumentVisible', currentLanguage)}
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

            <button
              type="button"
              onClick={handleBackToSelect}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {getUIText('back', currentLanguage)}
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
                {getUIText('kycImageConfirmTitle', currentLanguage)}
              </h2>
              <p className="text-sm text-gray-600">
                {getUIText('kycImageConfirmDesc', currentLanguage)}
              </p>
            </div>

            {frontImage && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {getUIText('kycIdSideFront', currentLanguage)}
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
                  {getUIText('kycIdSideBack', currentLanguage)}
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
                  ? getUIText('kycShootBackSide', currentLanguage)
                  : getUIText('kycRetakeCapture', currentLanguage)}
              </button>
              <button
                type="button"
                onClick={handleConfirmImage}
                disabled={!frontImage || (idType === 'id_card' && !backImage)}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{getUIText('confirm', currentLanguage)}</span>
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
                {getUIText('kycFormTitleEnterIdInfo', currentLanguage)}
              </h2>
              <p className="text-sm text-gray-600">
                {getUIText('kycFormDescEnterIdInfo', currentLanguage)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getUIText('fullName', currentLanguage)}
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
                {getUIText('kycFormIdNumberLabel', currentLanguage)}
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
                {getUIText('kycFormDateOfBirthLabel', currentLanguage)}
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
                {getUIText('kycFormIssueDateLabel', currentLanguage)}
                {optionalSuffix}
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
                {getUIText('kycFormExpiryDateLabel', currentLanguage)}
                {optionalSuffix}
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
              <span>{getUIText('kycFormNextStep', currentLanguage)}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
