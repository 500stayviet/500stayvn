'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MapPin, ChevronLeft, ChevronRight, Heart, Zap } from 'lucide-react';
import { formatPrice } from '@/lib/utils/propertyUtils';
import { getCityName } from '@/lib/utils/propertyUtils';

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
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const handlePrevious = () => {
    onSelectIndex(selectedIndex === 0 ? properties.length - 1 : selectedIndex - 1);
  };

  const handleNext = () => {
    onSelectIndex(selectedIndex === properties.length - 1 ? 0 : selectedIndex + 1);
  };

  if (!properties.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#FFF8F0] to-white">
        <p className="text-gray-400">매물을 불러오는 중...</p>
      </div>
    );
  }

  const currentProperty = properties[selectedIndex];
  const nextProperty = properties[(selectedIndex + 1) % properties.length];
  const prevProperty =
    properties[(selectedIndex - 1 + properties.length) % properties.length];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-b from-[#FFF8F0] via-white to-[#FFF8F0] overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF6B35]/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#E63946]/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* 메인 슬라이더 컨테이너 */}
      <div className="relative w-full h-full flex items-center justify-center perspective px-4">
        {/* 좌측 카드 (흐릿함) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`prev-${selectedIndex}`}
            className="absolute left-2 sm:left-4 w-24 sm:w-32 h-32 sm:h-40"
            initial={{ opacity: 0, x: -100, rotateY: -45, scale: 0.7 }}
            animate={{ opacity: 0.4, x: 0, rotateY: -35, scale: 0.75 }}
            exit={{ opacity: 0, x: -100, rotateY: -45, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              transformStyle: 'preserve-3d',
              perspective: 1200,
            }}
          >
            <motion.div
              className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-2 border-[#FED7AA]/30 bg-white"
              whileHover={{ scale: 0.8 }}
            >
              <Image
                src={
                  prevProperty.images?.[0] ||
                  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'
                }
                alt={prevProperty.name}
                fill
                className="object-cover blur-sm"
              />
              <div className="absolute inset-0 bg-black/20" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* 중앙 메인 카드 (3D 깊이감) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`main-${selectedIndex}`}
            className="absolute w-[85vw] sm:w-96 h-[400px] sm:h-96 z-30"
            initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: -20 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 25,
            }}
            style={{
              transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleMouseMove}
          >
            <motion.div
              className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-white/50 bg-white backdrop-blur-xl"
              style={{
                transformStyle: 'preserve-3d',
              }}
              whileHover={{
                y: -8,
                boxShadow: '0 40px 60px rgba(230, 57, 70, 0.25)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {/* 이미지 섹션 */}
              <div className="relative w-full h-2/3 overflow-hidden bg-gradient-to-b from-gray-200 to-gray-100">
                <Image
                  src={
                    currentProperty.images?.[0] ||
                    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500'
                  }
                  alt={currentProperty.name}
                  fill
                  className="object-cover"
                  priority
                />

                {/* 반짝이는 광선 효과 (마우스 따라다님) */}
                {isHovered && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.3), transparent 80%)`,
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
                  {formatPrice(currentProperty.price, 'vnd')}
                </motion.div>
              </div>

              {/* 정보 섹션 */}
              <div className="w-full h-1/3 p-4 flex flex-col justify-between bg-white">
                {/* 제목과 위치 */}
                <div className="space-y-2 flex-1">
                  <motion.h3
                    className="font-bold text-gray-900 text-base line-clamp-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {currentProperty.name}
                  </motion.h3>
                  <motion.div
                    className="flex items-center gap-1.5 text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#E63946]" />
                    <span className="text-xs truncate">
                      {getCityName(currentProperty.address)}
                    </span>
                  </motion.div>
                </div>

                {/* 상세 보기 버튼 */}
                <motion.button
                  onClick={() => onCardClick?.(currentProperty, selectedIndex)}
                  className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-[#E63946] to-[#FF6B35] text-white font-bold text-sm transition-all hover:shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  상세 보기
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* 우측 카드 (흐릿함) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`next-${selectedIndex}`}
            className="absolute right-2 sm:right-4 w-24 sm:w-32 h-32 sm:h-40"
            initial={{ opacity: 0, x: 100, rotateY: 45, scale: 0.7 }}
            animate={{ opacity: 0.4, x: 0, rotateY: 35, scale: 0.75 }}
            exit={{ opacity: 0, x: 100, rotateY: 45, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              transformStyle: 'preserve-3d',
              perspective: 1200,
            }}
          >
            <motion.div
              className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-2 border-[#FED7AA]/30 bg-white"
              whileHover={{ scale: 0.8 }}
            >
              <Image
                src={
                  nextProperty.images?.[0] ||
                  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'
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

      {/* 네비게이션 버튼 */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/80 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-lg border border-[#FED7AA]/50">
        <motion.button
          onClick={handlePrevious}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E63946] to-[#FF6B35] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        {/* 도트 인디케이터 */}
        <div className="flex items-center gap-2 px-3">
          {properties.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => onSelectIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? 'bg-gradient-to-r from-[#E63946] to-[#FF6B35] w-6'
                  : 'bg-[#FED7AA] w-2 hover:bg-[#FF6B35]/50'
              }`}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </div>

        <motion.button
          onClick={handleNext}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E63946] to-[#FF6B35] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 매물 개수 표시 */}
      <motion.div
        className="absolute top-4 right-4 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg border border-[#FED7AA]/50 text-sm font-bold text-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {selectedIndex + 1} / {properties.length}
      </motion.div>
    </div>
  );
}