import { useRef, useState } from "react";

interface UseEditPropertyImageManagerParams {
  imagePreviews: string[];
  setImagePreviews: React.Dispatch<React.SetStateAction<string[]>>;
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  maxImageCount?: number;
}

export const useEditPropertyImageManager = ({
  imagePreviews,
  setImagePreviews,
  setImages,
  maxImageCount = 5,
}: UseEditPropertyImageManagerParams) => {
  const [showImageSourceMenu, setShowImageSourceMenu] = useState(false);
  const photoLibraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const appendFilesToPreview = (files: File[]) => {
    if (files.length === 0) return;
    const remainingSlots = Math.max(0, maxImageCount - imagePreviews.length);
    if (remainingSlots === 0) return;

    const selected = files.slice(0, remainingSlots);
    setImages((prev) => [...prev, ...selected]);
    setImagePreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))]);
  };

  const handlePhotoLibraryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    appendFilesToPreview(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    appendFilesToPreview([file]);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const removed = imagePreviews[index];
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (removed?.startsWith("blob:")) {
      const blobIndex = imagePreviews
        .slice(0, index)
        .filter((u) => u.startsWith("blob:")).length;
      setImages((prev) => prev.filter((_, i) => i !== blobIndex));
      URL.revokeObjectURL(removed);
    }
  };

  const openImageSourceMenu = () => setShowImageSourceMenu(true);
  const closeImageSourceMenu = () => setShowImageSourceMenu(false);

  const openPhotoLibrary = () => {
    setShowImageSourceMenu(false);
    photoLibraryInputRef.current?.click();
  };

  const openCamera = () => {
    setShowImageSourceMenu(false);
    cameraInputRef.current?.click();
  };

  return {
    showImageSourceMenu,
    setShowImageSourceMenu,
    photoLibraryInputRef,
    cameraInputRef,
    handlePhotoLibraryChange,
    handleCameraChange,
    handleRemoveImage,
    openImageSourceMenu,
    closeImageSourceMenu,
    openPhotoLibrary,
    openCamera,
  };
};
