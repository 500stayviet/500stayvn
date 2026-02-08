"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Bed, Bath, Users, Sofa, Tv, UtensilsCrossed } from "lucide-react";
import { formatPrice } from "@/lib/utils/propertyUtils";
import {
  FULL_FURNITURE_IDS,
  FULL_ELECTRONICS_IDS,
  FULL_OPTION_KITCHEN_IDS,
} from "@/lib/constants/facilities";

interface Property {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  images?: string[];
  address?: string;
  priceUnit?: string;
  checkInDate?: string | Date;
  bedrooms?: number;
  bathrooms?: number;
  maxAdults?: number;
  maxChildren?: number;
  amenities?: string[];
  area?: number;
}

interface Property3DCardSliderProps {
  properties: Property[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onCardClick?: (property: Property, index: number) => void;
}

export default function Property3DCardSlider({
  properties,
  selectedIndex,
  onSelectIndex,
  onCardClick,
}: Property3DCardSliderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handlePrevious = () => {
    onSelectIndex(
      selectedIndex === 0 ? properties.length - 1 : selectedIndex - 1,
    );
  };

  const handleNext = () => {
    onSelectIndex(
      selectedIndex === properties.length - 1 ? 0 : selectedIndex + 1,
    );
  };

  const getVisibleDots = () => {
    const total = properties.length;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const half = 2;
    let start = selectedIndex - half;
    let end = selectedIndex + half;
    if (start < 0) { end += Math.abs(start); start = 0; }
    if (end >= total) { start -= end - total + 1; end = total - 1; }
    if (start < 0) start = 0;
    const result = [];
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  };

  // Full option badge checks
  const hasFullFurniture = (amenities?: string[]) =>
    FULL_FURNITURE_IDS.every((id) => amenities?.includes(id));
  const hasFullElectronics = (amenities?: string[]) =>
    FULL_ELECTRONICS_IDS.every((id) => amenities?.includes(id));
  const hasFullKitchen = (amenities?: string[]) =>
    FULL_OPTION_KITCHEN_IDS.every((id) => amenities?.includes(id));

  if (!properties.length) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <div className="w-[85vw] sm:w-96 h-[280px] sm:h-[260px] flex items-center justify-center rounded-2xl">
          <p className="text-sm" style={{ color: "#999" }}>...</p>
        </div>
      </div>
    );
  }

  const currentProperty = properties[selectedIndex];
  const nextProperty = properties[(selectedIndex + 1) % properties.length];
  const prevProperty =
    properties[(selectedIndex - 1 + properties.length) % properties.length];
  const visibleDots = getVisibleDots();
  const totalPeople = (currentProperty.maxAdults || 0) + (currentProperty.maxChildren || 0);

  // Collect full-option badges for current property
  const badges: { icon: React.ElementType; label: string; bg: string; text: string }[] = [];
  if (hasFullFurniture(currentProperty.amenities)) {
    badges.push({ icon: Sofa, label: "Full Furniture", bg: "#F3E8FF", text: "#7C3AED" });
  }
  if (hasFullElectronics(currentProperty.amenities)) {
    badges.push({ icon: Tv, label: "Full Electronics", bg: "#FFF7ED", text: "#EA580C" });
  }
  if (hasFullKitchen(currentProperty.amenities)) {
    badges.push({ icon: UtensilsCrossed, label: "Full Kitchen", bg: "#FFF1F2", text: "#E11D48" });
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-auto"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-auto flex items-start justify-center perspective px-2 pt-3">
        {/* Left peek card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`prev-${selectedIndex}`}
            className="absolute left-1 sm:left-3 w-16 sm:w-24 h-24 sm:h-32 top-6"
            initial={{ opacity: 0, x: -60, scale: 0.7 }}
            animate={{ opacity: 0.35, x: 0, scale: 0.75 }}
            exit={{ opacity: 0, x: -60, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(230,57,70,0.12)" }}>
              <Image
                src={prevProperty.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"}
                alt={prevProperty.name}
                fill
                className="object-cover blur-[2px]"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(255,248,240,0.3), rgba(255,248,240,0.5))" }} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Main card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`main-${selectedIndex}`}
            className="relative w-[82vw] sm:w-[380px] z-30"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -16 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <motion.div
              className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
              style={{
                backgroundColor: "#FFFFFF",
                boxShadow: "0 8px 32px rgba(230,57,70,0.10), 0 2px 8px rgba(0,0,0,0.06)",
                border: "1px solid rgba(230,57,70,0.08)",
              }}
              whileHover={{
                y: -4,
                boxShadow: "0 16px 48px rgba(230,57,70,0.16), 0 4px 12px rgba(0,0,0,0.08)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              onClick={() => onCardClick?.(currentProperty, selectedIndex)}
            >
              {/* Image section */}
              <div className="relative w-full aspect-[16/10] overflow-hidden">
                <Image
                  src={currentProperty.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500"}
                  alt={currentProperty.name}
                  fill
                  className="object-cover"
                  priority
                />

                {/* Subtle shine effect on hover */}
                {isHovered && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle 80px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.15), transparent 60%)`,
                    }}
                  />
                )}

                {/* Bottom gradient for readability */}
                <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)" }} />

                {/* Price pill - bottom left */}
                <motion.div
                  className="absolute bottom-3 left-3 flex items-baseline gap-1 px-3 py-1.5 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, #E63946, #FF6B35)",
                    boxShadow: "0 4px 16px rgba(230,57,70,0.35)",
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="text-sm font-bold text-white tracking-tight">
                    {formatPrice(currentProperty.price, currentProperty.priceUnit || "vnd")}
                  </span>
                  <span className="text-[10px] text-white/70 font-medium">/week</span>
                </motion.div>

                {/* Navigation controls overlay */}
                <div className="card-slider-nav absolute bottom-3 right-3 z-50 flex items-center gap-1.5">
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md"
                    style={{ backgroundColor: "rgba(255,255,255,0.85)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" style={{ color: "#E63946" }} />
                  </motion.button>

                  {/* Dot indicators */}
                  <div className="flex items-center gap-1 px-1">
                    {visibleDots.map((index) => {
                      const isActive = index === selectedIndex;
                      return (
                        <motion.button
                          key={index}
                          onClick={(e) => { e.stopPropagation(); onSelectIndex(index); }}
                          className="relative"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <motion.div
                            className="h-1.5 rounded-full"
                            style={{
                              backgroundColor: isActive ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                              width: isActive ? 14 : 5,
                            }}
                            animate={{
                              width: isActive ? 14 : 5,
                              backgroundColor: isActive ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 22 }}
                          />
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md"
                    style={{ backgroundColor: "rgba(255,255,255,0.85)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: "#E63946" }} />
                  </motion.button>
                </div>
              </div>

              {/* Info section */}
              <div className="px-3.5 py-3 flex flex-col gap-2" style={{ backgroundColor: "#FFFFFF" }}>
                {/* Full-option badges row */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {badges.map((badge, i) => {
                      const Icon = badge.icon;
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Room info strip */}
                <div
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: "#FFF8F0" }}
                >
                  <div className="flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5" style={{ color: "#E63946" }} />
                    <span className="text-xs font-semibold" style={{ color: "#1F2937" }}>
                      {currentProperty.bedrooms || 0}
                    </span>
                  </div>
                  <div className="w-px h-3" style={{ backgroundColor: "#E5E7EB" }} />
                  <div className="flex items-center gap-1.5">
                    <Bath className="w-3.5 h-3.5" style={{ color: "#FF6B35" }} />
                    <span className="text-xs font-semibold" style={{ color: "#1F2937" }}>
                      {currentProperty.bathrooms || 0}
                    </span>
                  </div>
                  <div className="w-px h-3" style={{ backgroundColor: "#E5E7EB" }} />
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" style={{ color: "#FFB627" }} />
                    <span className="text-xs font-semibold" style={{ color: "#1F2937" }}>
                      {totalPeople || "-"}
                    </span>
                  </div>
                  {currentProperty.area ? (
                    <>
                      <div className="w-px h-3" style={{ backgroundColor: "#E5E7EB" }} />
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold" style={{ color: "#1F2937" }}>
                          {currentProperty.area}
                        </span>
                        <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
                          {"m\u00B2"}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Right peek card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`next-${selectedIndex}`}
            className="absolute right-1 sm:right-3 w-16 sm:w-24 h-24 sm:h-32 top-6"
            initial={{ opacity: 0, x: 60, scale: 0.7 }}
            animate={{ opacity: 0.35, x: 0, scale: 0.75 }}
            exit={{ opacity: 0, x: 60, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(230,57,70,0.12)" }}>
              <Image
                src={nextProperty.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"}
                alt={nextProperty.name}
                fill
                className="object-cover blur-[2px]"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(255,248,240,0.3), rgba(255,248,240,0.5))" }} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
