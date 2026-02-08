"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin, ChevronLeft, ChevronRight, Heart, Zap } from "lucide-react";
import { formatPrice } from "@/lib/utils/propertyUtils";
import { getCityName } from "@/lib/utils/propertyUtils";

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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
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

  // 유동적 도트 네비게이터 계산
  const getVisibleDots = () => {
    const total = properties.length;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const visibleCount = 5;
    const half = Math.floor(visibleCount / 2);
    let start = selectedIndex - half;
    let end = selectedIndex + half;

    if (start < 0) {
      end += Math.abs(start);
      start = 0;
    }

    if (end >= total) {
      start -= end - total + 1;
      end = total - 1;
    }

    if (start < 0) start = 0;

    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    return result;
  };

  // 주소에서 'Vietnam' 제거하고 구 정보만 추출
  const getDistrictName = (address?: string): string => {
    if (!address) return "";

    // 'Vietnam' 제거
    let cleaned = address.replace(/Vietnam/gi, "").trim();

    // 마지막 쉼표나 점 제거
    cleaned = cleaned.replace(/[,.]\s*$/, "").trim();

    return cleaned;
  };

  if (!properties.length) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        {/* 매물 카드와 동일한 높이의 컨테이너 */}
        <div className="w-[85vw] sm:w-96 h-[360px] sm:h-80 flex items-center justify-center bg-transparent rounded-[2.5rem]">
          <p className="text-gray-400 text-xs">매물을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const currentProperty = properties[selectedIndex];
  const nextProperty = properties[(selectedIndex + 1) % properties.length];
  const prevProperty =
    properties[(selectedIndex - 1 + properties.length) % properties.length];

  const visibleDots = getVisibleDots();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-auto bg-transparent"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* 메인 슬라이더 컨테이너 - 배경 제거, 패딩 최소화 */}
      <div className="relative w-full h-auto flex items-start justify-center perspective px-2 pt-4">
        {/* 좌측 카드 (흐릿함) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`prev-${selectedIndex}`}
            className="absolute left-2 sm:left-4 w-24 sm:w-32 h-32 sm:h-40 top-4"
            initial={{ opacity: 0, x: -100, rotateY: -45, scale: 0.7 }}
            animate={{ opacity: 0.4, x: 0, rotateY: -35, scale: 0.75 }}
            exit={{ opacity: 0, x: -100, rotateY: -45, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              transformStyle: "preserve-3d",
              perspective: 1200,
            }}
          >
            <motion.div
              className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl border-2 border-[#FED7AA]/30 bg-white"
              whileHover={{ scale: 0.8 }}
            >
              <Image
                src={
                  prevProperty.images?.[0] ||
                  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"
                }
                alt={prevProperty.name}
                fill
                className="object-cover blur-sm"
              />
              <div className="absolute inset-0 bg-black/20" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* 중앙 메인 카드 (3D 깊이감 - 높이 최적화, 위쪽 정렬 더 강화) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`main-${selectedIndex}`}
            className="absolute w-[85vw] sm:w-96 h-[360px] sm:h-80 z-30 top-0"
            initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: -20 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 25,
            }}
            style={{
              transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
          >
            <motion.div
              className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-xl border-2 border-white/50 bg-white backdrop-blur-xl"
              style={{
                transformStyle: "preserve-3d",
              }}
              whileHover={{
                y: -6,
                boxShadow: "0 30px 45px rgba(230, 57, 70, 0.2)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {/* 전체 클릭 가능한 이미지 섹션 (크기 키우기) */}
              <div
                className="relative w-full h-[75%] overflow-hidden bg-gradient-to-b from-gray-200 to-gray-100 cursor-pointer"
                onClick={() => onCardClick?.(currentProperty, selectedIndex)}
              >
                <Image
                  src={
                    currentProperty.images?.[0] ||
                    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500"
                  }
                  alt={currentProperty.name}
                  fill
                  className="object-cover"
                  priority
                />

                {/* 반짝이는 광선 효과 (마우스 따라다님) - 사이즈 더 줄이기 */}
                {isHovered && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle 60px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.12), transparent 50%)`,
                    }}
                  />
                )}

                {/* 그라데이션 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* 즉시 입주 가능 배지 */}
                <motion.div
                  className="absolute top-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <Zap className="w-3.5 h-3.5 text-[#E63946]" />
                  <span className="text-xs font-bold text-[#E63946]">NEW</span>
                </motion.div>

                {/* 찜 버튼 */}
                <motion.button
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation(); // 상세 페이지 이동 방지
                    // 찜하기 기능 구현
                  }}
                >
                  <Heart className="w-5 h-5 text-[#E63946]" />
                </motion.button>

                {/* 가격 배지 */}
                <motion.div
                  className="absolute bottom-3 right-3 bg-gradient-to-br from-[#E63946] to-[#FF6B35] text-white px-4 py-2 rounded-2xl shadow-xl font-black text-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {formatPrice(currentProperty.price, "vnd")}
                </motion.div>

                {/* 매물 이미지 하단에 위치한 네비게이션 컨트롤러 (globals 44px 예외로 작은 크기 유지) */}
                <div className="card-slider-nav absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
                  {/* 좌측 버튼 */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevious();
                    }}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E63946] to-[#FF6B35] flex items-center justify-center shadow-lg transition-all hover:scale-110"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-white" />
                  </motion.button>

                  {/* 유동적 도트 네비게이터 */}
                  <div className="flex items-center gap-1 px-2">
                    {visibleDots.map((index) => {
                      const distance = Math.abs(index - selectedIndex);
                      const maxDistance = Math.max(
                        selectedIndex - visibleDots[0],
                        visibleDots[visibleDots.length - 1] - selectedIndex,
                      );
                      const scale = 1 - (distance / (maxDistance || 1)) * 0.4;
                      const opacity = 1 - (distance / (maxDistance || 1)) * 0.6;

                      return (
                        <motion.button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIndex(index);
                          }}
                          className="relative"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <motion.div
                            className={`h-1.5 rounded-full ${
                              index === selectedIndex
                                ? "bg-gradient-to-r from-[#E63946] to-[#FF6B35]"
                                : "bg-[#E63946]/40"
                            }`}
                            style={{
                              width: index === selectedIndex ? "16px" : "6px",
                              scale,
                              opacity,
                            }}
                            animate={{
                              width: index === selectedIndex ? "16px" : "6px",
                              scale,
                              opacity,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          />
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* 우측 버튼 */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E63946] to-[#FF6B35] flex items-center justify-center shadow-lg transition-all hover:scale-110"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* 정보 섹션 (최적화 - 주소 텍스트 아래 기준 라인 맞춤) */}
              <div className="w-full h-1/5 p-1 bg-white">
                {/* 제목과 위치 */}
                <div className="h-full flex flex-col justify-end pb-0.5">
                  <motion.h3
                    className="font-bold text-gray-900 text-xs line-clamp-1 mb-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {currentProperty.name}
                  </motion.h3>
                  <motion.div
                    className="flex items-center gap-1 text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <MapPin className="w-2 h-2 flex-shrink-0 text-[#E63946]" />
                    <span className="text-xs truncate">
                      {getCityName(currentProperty.address)}
                    </span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* 우측 카드 (흐릿함) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`next-${selectedIndex}`}
            className="absolute right-2 sm:right-4 w-24 sm:w-32 h-32 sm:h-40 top-4"
            initial={{ opacity: 0, x: 100, rotateY: 45, scale: 0.7 }}
            animate={{ opacity: 0.4, x: 0, rotateY: 35, scale: 0.75 }}
            exit={{ opacity: 0, x: 100, rotateY: 45, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              transformStyle: "preserve-3d",
              perspective: 1200,
            }}
          >
            <motion.div
              className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl border-2 border-[#FED7AA]/30 bg-white"
              whileHover={{ scale: 0.8 }}
            >
              <Image
                src={
                  nextProperty.images?.[0] ||
                  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"
                }
                alt={nextProperty.name}
                fill
                className="object-cover blur-sm"
              />
              <div className="absolute inset-0 bg-black/20" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
