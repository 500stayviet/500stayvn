import { Minus, Plus } from "lucide-react";

interface MapZoomRulerProps {
  rulerHeight: number;
  thumbSize: number;
  thumbTop: number;
  onZoomIn: (e: React.MouseEvent) => void;
  onZoomOut: (e: React.MouseEvent) => void;
  onTrackClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function MapZoomRuler({
  rulerHeight,
  thumbSize,
  thumbTop,
  onZoomIn,
  onZoomOut,
  onTrackClick,
}: MapZoomRulerProps) {
  return (
    <div
      className="zoom-ruler-wrap absolute right-0 top-1/2 z-20 -translate-y-1/2 flex flex-col items-center pointer-events-none select-none gap-1"
      style={{ height: rulerHeight + 44 }}
    >
      <div
        className="pointer-events-auto flex flex-col items-center gap-1"
        role="group"
        aria-label="Map zoom"
      >
        <button
          type="button"
          onClick={onZoomIn}
          className="zoom-ruler-btn flex items-center justify-center w-8 h-8 rounded-lg bg-white text-[#E63946] shadow-md border-0 cursor-pointer touch-manipulation"
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4 pointer-events-none" strokeWidth={3} />
        </button>
        <div
          className="zoom-ruler-track w-1.5 rounded-full bg-gray-300/80 flex-shrink-0 relative cursor-pointer touch-manipulation"
          style={{ height: rulerHeight, backgroundColor: "#E5E7EB" }}
          onClick={onTrackClick}
          aria-label="Set zoom by position"
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#E63946] border-2 border-white shadow-md pointer-events-none"
            style={{
              top: thumbTop,
              width: thumbSize + 2,
              height: thumbSize + 2,
            }}
          />
        </div>
        <button
          type="button"
          onClick={onZoomOut}
          className="zoom-ruler-btn flex items-center justify-center w-8 h-8 rounded-lg bg-white text-[#E63946] shadow-md border-0 cursor-pointer touch-manipulation"
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4 pointer-events-none" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
