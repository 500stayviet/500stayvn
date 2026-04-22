import { useEffect, useRef, useState } from "react";

const MAX_IMAGE_COUNT = 5;
const GUIDELINE_STORAGE_KEY = "property_guideline_last_shown";
const ONE_HOUR_MS = 60 * 60 * 1000;

type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

interface UsePropertyImageManagerParams {
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  imagePreviews: string[];
  setImagePreviews: React.Dispatch<React.SetStateAction<string[]>>;
}

export const usePropertyImageManager = ({
  images,
  setImages,
  imagePreviews,
  setImagePreviews,
}: UsePropertyImageManagerParams) => {
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [photoLibraryFiles, setPhotoLibraryFiles] = useState<File[]>([]);
  const [photoLibraryPreviews, setPhotoLibraryPreviews] = useState<string[]>([]);
  const [selectedLibraryIndices, setSelectedLibraryIndices] = useState<Set<number>>(
    new Set(),
  );
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<number | null>(
    null,
  );
  const [showImageSourceMenu, setShowImageSourceMenu] = useState(false);
  const [showGuidelinePopup, setShowGuidelinePopup] = useState(false);
  const photoLibraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const clearPhotoLibrarySession = () => {
    setShowPhotoLibrary(false);
    setPhotoLibraryFiles([]);
    photoLibraryPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPhotoLibraryPreviews([]);
    setSelectedLibraryIndices(new Set());
    setFullScreenImageIndex(null);
  };

  const closePhotoLibrary = () => {
    clearPhotoLibrarySession();
  };

  const handleOpenPhotoLibrary = () => {
    photoLibraryInputRef.current?.click();
  };

  const handlePhotoLibrarySelect = (e: InputChangeEvent) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPhotoLibraryFiles(files);
    setPhotoLibraryPreviews(files.map((file) => URL.createObjectURL(file)));
    setSelectedLibraryIndices(new Set());
    setShowPhotoLibrary(true);
    e.target.value = "";
  };

  const togglePhotoSelection = (index: number) => {
    const maxSelectable = MAX_IMAGE_COUNT - images.length;
    if (maxSelectable <= 0) return;

    setSelectedLibraryIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else if (next.size < maxSelectable) {
        next.add(index);
      }
      return next;
    });
  };

  const handleConfirmPhotoSelection = () => {
    const selectedFiles = Array.from(selectedLibraryIndices)
      .sort((a, b) => a - b)
      .map((index) => photoLibraryFiles[index]);

    if (selectedFiles.length === 0) return;

    setImages([...images, ...selectedFiles]);
    setImagePreviews([
      ...imagePreviews,
      ...selectedFiles.map((file) => URL.createObjectURL(file)),
    ]);
    clearPhotoLibrarySession();
  };

  const handleViewFullScreen = (index: number) => {
    setFullScreenImageIndex(index);
  };

  const handleBackToLibrary = () => {
    setFullScreenImageIndex(null);
  };

  const handleCameraCapture = (e: InputChangeEvent) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGE_COUNT - images.length;
    if (remainingSlots === 0) return;

    const file = files[0];
    setImages([...images, file]);
    setImagePreviews([...imagePreviews, URL.createObjectURL(file)]);
    e.target.value = "";
  };

  const handleAddImageClick = () => {
    if (images.length >= MAX_IMAGE_COUNT) return;

    const lastShownTime = localStorage.getItem(GUIDELINE_STORAGE_KEY);
    const now = Date.now();

    if (lastShownTime) {
      const timeSinceLastShown = now - parseInt(lastShownTime, 10);
      if (timeSinceLastShown < ONE_HOUR_MS) {
        setShowImageSourceMenu(true);
        return;
      }
    }

    setShowGuidelinePopup(true);
  };

  const handleSelectFromLibrary = () => {
    setShowImageSourceMenu(false);
    handleOpenPhotoLibrary();
  };

  const handleTakePhoto = () => {
    setShowImageSourceMenu(false);
    cameraInputRef.current?.click();
  };

  const closeImageSourceMenu = () => {
    setShowImageSourceMenu(false);
  };

  const handleGuidelinePopupClick = () => {
    setShowGuidelinePopup(false);
    localStorage.setItem(GUIDELINE_STORAGE_KEY, Date.now().toString());
    setShowImageSourceMenu(true);
  };

  const handleImageRemove = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      photoLibraryPreviews.forEach((url) => URL.revokeObjectURL(url));
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoLibraryPreviews, imagePreviews]);

  return {
    showPhotoLibrary,
    photoLibraryPreviews,
    selectedLibraryIndices,
    fullScreenImageIndex,
    showImageSourceMenu,
    showGuidelinePopup,
    photoLibraryInputRef,
    cameraInputRef,
    setShowPhotoLibrary,
    closePhotoLibrary,
    handlePhotoLibrarySelect,
    togglePhotoSelection,
    handleConfirmPhotoSelection,
    handleViewFullScreen,
    handleBackToLibrary,
    handleCameraCapture,
    handleAddImageClick,
    handleSelectFromLibrary,
    handleTakePhoto,
    closeImageSourceMenu,
    handleGuidelinePopupClick,
    handleImageRemove,
  };
};
