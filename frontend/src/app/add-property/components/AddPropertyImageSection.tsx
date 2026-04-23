"use client";

import Image from "next/image";
import { ArrowLeft, Camera, Check, Maximize2, X } from "lucide-react";
import { motion } from "framer-motion";
import type { AddPropertyColors } from "../constants/addPropertyColors";

interface AddPropertyImageSectionProps {
  currentLanguage: string;
  colors: AddPropertyColors;
  images: File[];
  imagePreviews: string[];
  showImageSourceMenu: boolean;
  showPhotoLibrary: boolean;
  photoLibraryPreviews: string[];
  selectedLibraryIndices: Set<number>;
  fullScreenImageIndex: number | null;
  showGuidelinePopup: boolean;
  photoLibraryInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  onRemoveImage: (index: number) => void;
  onAddImageClick: () => void;
  onPhotoLibrarySelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCameraCapture: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCloseImageSourceMenu: () => void;
  onSelectFromLibrary: () => void;
  onTakePhoto: () => void;
  onClosePhotoLibrary: () => void;
  onTogglePhotoSelection: (index: number) => void;
  onViewFullScreen: (index: number) => void;
  onConfirmPhotoSelection: () => void;
  onBackToLibrary: () => void;
  onGuidelinePopupClick: () => void;
}

export function AddPropertyImageSection({
  currentLanguage,
  colors,
  images,
  imagePreviews,
  showImageSourceMenu,
  showPhotoLibrary,
  photoLibraryPreviews,
  selectedLibraryIndices,
  fullScreenImageIndex,
  showGuidelinePopup,
  photoLibraryInputRef,
  cameraInputRef,
  onRemoveImage,
  onAddImageClick,
  onPhotoLibrarySelect,
  onCameraCapture,
  onCloseImageSourceMenu,
  onSelectFromLibrary,
  onTakePhoto,
  onClosePhotoLibrary,
  onTogglePhotoSelection,
  onViewFullScreen,
  onConfirmPhotoSelection,
  onBackToLibrary,
  onGuidelinePopupClick,
}: AddPropertyImageSectionProps) {
  return (
    <>
      <section
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: colors.surface,
          border: `1.5px dashed ${colors.border}`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold" style={{ color: colors.text }}>
            {currentLanguage === "ko"
              ? "사진 등록"
              : currentLanguage === "vi"
                ? "Đăng ảnh"
                : currentLanguage === "ja"
                  ? "写真登録"
                  : currentLanguage === "zh"
                    ? "照片上传"
                    : "Upload Photos"}
            <span style={{ color: colors.error }} className="ml-1">
              *
            </span>
          </h2>
          <span className="text-xs" style={{ color: colors.textMuted }}>
            {images.length}/5
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {imagePreviews.map((preview, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200"
            >
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 430px) 33vw, 140px"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="property-register-icon-btn property-register-icon-btn--photo absolute top-1 right-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <>
              <button
                type="button"
                onClick={onAddImageClick}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Camera className="w-8 h-8 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">
                  {currentLanguage === "ko"
                    ? "추가"
                    : currentLanguage === "vi"
                      ? "Thêm"
                      : "Add"}
                </span>
              </button>

              <input
                ref={photoLibraryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onPhotoLibrarySelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onCameraCapture}
                className="hidden"
              />
            </>
          )}
        </div>
      </section>

      {showImageSourceMenu && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={onCloseImageSourceMenu}
        >
          <div
            className="w-full bg-white rounded-t-2xl p-6 max-w-[430px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              {currentLanguage === "ko"
                ? "사진 추가 방법 선택"
                : currentLanguage === "vi"
                  ? "Chọn cách thêm ảnh"
                  : currentLanguage === "ja"
                    ? "写真追加方法の選択"
                    : currentLanguage === "zh"
                      ? "选择照片添加方式"
                      : "Select Photo Source"}
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={onSelectFromLibrary}
                className="w-full py-4 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
              >
                <Camera className="w-5 h-5" />
                <span>
                  {currentLanguage === "ko"
                    ? "사진첩에서 선택"
                    : currentLanguage === "vi"
                      ? "Chọn từ thư viện ảnh"
                      : currentLanguage === "ja"
                        ? "写真ライブラリから選択"
                        : currentLanguage === "zh"
                          ? "从照片库选择"
                          : "Select from Photo Library"}
                </span>
              </button>
              <button
                type="button"
                onClick={onTakePhoto}
                className="w-full py-4 px-4 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
              >
                <Camera className="w-5 h-5" />
                <span>
                  {currentLanguage === "ko"
                    ? "카메라로 촬영"
                    : currentLanguage === "vi"
                      ? "Chụp ảnh"
                      : currentLanguage === "ja"
                        ? "カメラで撮影"
                        : currentLanguage === "zh"
                          ? "用相机拍摄"
                          : "Take Photo"}
                </span>
              </button>
              <button
                type="button"
                onClick={onCloseImageSourceMenu}
                className="w-full py-3 px-4 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                {currentLanguage === "ko"
                  ? "취소"
                  : currentLanguage === "vi"
                    ? "Hủy"
                    : currentLanguage === "ja"
                      ? "キャンセル"
                      : currentLanguage === "zh"
                        ? "取消"
                        : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhotoLibrary && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              type="button"
              onClick={onClosePhotoLibrary}
              className="text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentLanguage === "ko"
                ? "사진 선택"
                : currentLanguage === "vi"
                  ? "Chọn ảnh"
                  : currentLanguage === "ja"
                    ? "写真選択"
                    : currentLanguage === "zh"
                      ? "选择照片"
                      : "Select Photos"}
            </h2>
            <div className="w-6" />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-4 gap-1">
              {photoLibraryPreviews.map((preview, index) => {
                const isSelected = selectedLibraryIndices.has(index);
                return (
                  <div
                    key={index}
                    className="relative aspect-square"
                    onClick={() => onTogglePhotoSelection(index)}
                  >
                    <Image
                      src={preview}
                      alt={`Photo ${index + 1}`}
                      fill
                      unoptimized
                      className={`object-cover rounded ${isSelected ? "opacity-50" : ""}`}
                      sizes="(max-width: 430px) 25vw, 110px"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500/30 rounded">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewFullScreen(index);
                      }}
                      className="property-register-icon-btn property-register-icon-btn--library absolute bottom-1 right-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onConfirmPhotoSelection}
              disabled={selectedLibraryIndices.size === 0}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentLanguage === "ko"
                ? `선택한 ${selectedLibraryIndices.size}장 추가`
                : currentLanguage === "vi"
                  ? `Thêm ${selectedLibraryIndices.size} ảnh đã chọn`
                  : currentLanguage === "ja"
                    ? `選択した ${selectedLibraryIndices.size}枚を追加`
                    : currentLanguage === "zh"
                      ? `添加选中的 ${selectedLibraryIndices.size}张`
                      : `Add ${selectedLibraryIndices.size} selected`}
            </button>
          </div>
        </div>
      )}

      {fullScreenImageIndex !== null && (
        <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
          <div className="relative w-full h-full">
            <Image
              src={photoLibraryPreviews[fullScreenImageIndex]}
              alt={`Full screen ${fullScreenImageIndex + 1}`}
              fill
              unoptimized
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <button
            type="button"
            onClick={onBackToLibrary}
            className="absolute bottom-6 right-6 bg-white/90 text-gray-900 rounded-full p-4 hover:bg-white transition-colors shadow-lg flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">
              {currentLanguage === "ko"
                ? "사진첩"
                : currentLanguage === "vi"
                  ? "Thư viện ảnh"
                  : currentLanguage === "ja"
                    ? "写真ライブラリ"
                    : currentLanguage === "zh"
                      ? "照片库"
                      : "Library"}
            </span>
          </button>
          <button
            type="button"
            onClick={onBackToLibrary}
            className="property-register-icon-btn property-register-icon-btn--fullscreen absolute top-6 left-6 bg-white/90 text-gray-900 rounded-full hover:bg-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {showGuidelinePopup && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onGuidelinePopupClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              {currentLanguage === "ko"
                ? "📸 추천 사진 가이드라인"
                : currentLanguage === "vi"
                  ? "📸 Hướng dẫn ảnh đề xuất"
                  : currentLanguage === "ja"
                    ? "📸 おすすめ写真ガイドライン"
                    : currentLanguage === "zh"
                      ? "📸 推荐照片指南"
                      : "📸 Recommended Photo Guidelines"}
            </h3>
            <div className="space-y-3 mb-4">
              {["🛏️ Bedroom", "🍳 Kitchen", "🛋️ Living Room", "🚿 Bathroom", "🪟 Window View"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-2xl">{item.split(" ")[0]}</span>
                  <span>{item.substring(item.indexOf(" ") + 1)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">
              {currentLanguage === "ko"
                ? "아무 곳이나 터치하여 카메라를 시작하세요"
                : currentLanguage === "vi"
                  ? "Chạm vào bất kỳ đâu để bắt đầu camera"
                  : currentLanguage === "ja"
                    ? "どこかをタップしてカメラを開始"
                    : currentLanguage === "zh"
                      ? "点击任意位置开始相机"
                      : "Tap anywhere to start camera"}
            </p>
            <button
              onClick={onGuidelinePopupClick}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              {currentLanguage === "ko"
                ? "동의"
                : currentLanguage === "vi"
                  ? "Đồng ý"
                  : currentLanguage === "ja"
                    ? "同意"
                    : currentLanguage === "zh"
                      ? "同意"
                      : "Agree"}
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
