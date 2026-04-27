"use client";

import type { Dispatch, SetStateAction } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";

type Props = {
  open: boolean;
  propertyImages: string[];
  N: number;
  fullScreenImageIndex: number | null;
  setFullScreenImageIndex: Dispatch<SetStateAction<number | null>>;
};

/** 임대인 모드: 상단 슬라이더와 별도의 전체화면 갤러리(도트·좌우 이동) */
export function PropertyDetailOwnerImageOverlay({
  open,
  propertyImages,
  N,
  fullScreenImageIndex,
  setFullScreenImageIndex,
}: Props) {
  const { currentLanguage } = useLanguage();
  if (!open || fullScreenImageIndex === null) return null;
  const altText = getUIText('propertyImageAltWithIndex', currentLanguage).replace(
    /\{\{n\}\}/g,
    String(fullScreenImageIndex + 1),
  );

  return (
    <div
      className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center"
      style={{ perspective: 1400 }}
      onClick={() => setFullScreenImageIndex(null)}
    >
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <div
          className="relative w-full max-w-4xl h-[80vh] mx-4 flex items-center justify-center overflow-hidden rounded-xl"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 전체화면 blob/외부 URL */}
          <img
            key={fullScreenImageIndex}
            src={propertyImages[fullScreenImageIndex]}
            alt={altText}
            className="w-full h-full object-contain rounded-xl shadow-2xl transition-all duration-300"
            style={{
              transform: "translateZ(0) scale(1)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
            }}
          />
        </div>

        {N > 1 && (
          <div className="card-slider-nav absolute inset-0 pointer-events-none z-50">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullScreenImageIndex((i) => (i! <= 0 ? N - 1 : i! - 1));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors pointer-events-auto"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullScreenImageIndex((i) => (i! >= N - 1 ? 0 : i! + 1));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors pointer-events-auto"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-full text-sm pointer-events-auto">
              <span>
                {fullScreenImageIndex + 1} / {N}
              </span>
              <div className="flex gap-1.5">
                {propertyImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullScreenImageIndex(idx);
                    }}
                    className={`rounded-full transition-all ${
                      idx === fullScreenImageIndex ? "w-2.5 h-2.5 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setFullScreenImageIndex(null)}
          className="absolute top-6 left-6 bg-white/90 text-gray-900 rounded-full p-2.5 hover:bg-white transition-colors z-50"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
