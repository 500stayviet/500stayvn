import { Camera, X } from "lucide-react";

interface EditPropertyImageSectionProps {
  currentLanguage: string;
  imagePreviews: string[];
  showImageSourceMenu: boolean;
  colors: {
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    error: string;
  };
  photoLibraryInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoLibraryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCameraChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: (index: number) => void;
  openImageSourceMenu: () => void;
  closeImageSourceMenu: () => void;
  openPhotoLibrary: () => void;
  openCamera: () => void;
}

export default function EditPropertyImageSection({
  currentLanguage,
  imagePreviews,
  showImageSourceMenu,
  colors,
  photoLibraryInputRef,
  cameraInputRef,
  handlePhotoLibraryChange,
  handleCameraChange,
  handleRemoveImage,
  openImageSourceMenu,
  closeImageSourceMenu,
  openPhotoLibrary,
  openCamera,
}: EditPropertyImageSectionProps) {
  return (
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
              : "Upload Photos"}
          <span style={{ color: colors.error }} className="ml-1">
            *
          </span>
        </h2>
        <span className="text-xs" style={{ color: colors.textMuted }}>
          {imagePreviews.length}/5
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {imagePreviews.map((preview, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200"
          >
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="property-register-icon-btn property-register-icon-btn--photo absolute top-1 right-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {imagePreviews.length < 5 && (
          <>
            <button
              type="button"
              onClick={openImageSourceMenu}
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
              onChange={handlePhotoLibraryChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {showImageSourceMenu && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={closeImageSourceMenu}
        >
          <div
            className="w-full bg-white rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              {currentLanguage === "ko"
                ? "사진 추가 방법 선택"
                : currentLanguage === "vi"
                  ? "Chọn cách thêm ảnh"
                  : "Select Photo Source"}
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={openPhotoLibrary}
                className="w-full py-4 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
              >
                <Camera className="w-5 h-5" />
                <span>
                  {currentLanguage === "ko"
                    ? "사진첩에서 선택"
                    : currentLanguage === "vi"
                      ? "Chọn từ thư viện ảnh"
                      : "Select from Photo Library"}
                </span>
              </button>
              <button
                type="button"
                onClick={openCamera}
                className="w-full py-4 px-4 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
              >
                <Camera className="w-5 h-5" />
                <span>
                  {currentLanguage === "ko"
                    ? "카메라로 촬영"
                    : currentLanguage === "vi"
                      ? "Chụp ảnh"
                      : "Take Photo"}
                </span>
              </button>
              <button
                type="button"
                onClick={closeImageSourceMenu}
                className="w-full py-3 px-4 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                {currentLanguage === "ko"
                  ? "취소"
                  : currentLanguage === "vi"
                    ? "Hủy"
                    : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
