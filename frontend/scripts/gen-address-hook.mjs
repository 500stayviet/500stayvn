import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const s = fs.readFileSync(
  path.join(root, "src/components/AddressVerificationModal.tsx"),
  "utf8",
);

const start = s.indexOf("// LanguageContext");
const end = s.indexOf("  if (!isOpen) return null;");
if (start < 0 || end < 0) throw new Error("markers not found");

const body = s.slice(start, end);

const hook = `'use client';

import { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getPlaceById, searchPlaceIndexForPosition, searchPlaceIndexForSuggestions } from '@/lib/api/aws-location';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatAddress } from '@/components/address-verification/addressTextFormatters';
import type { AddressVerificationModalProps } from './types';

export function useAddressVerificationModalState({
  isOpen,
  onClose,
  onConfirm,
  currentLanguage: propCurrentLanguage,
  initialAddress = '',
}: AddressVerificationModalProps) {
${body}
  return {
    isOpen,
    onClose,
    onConfirm,
    currentLanguage,
    searchText,
    setSearchText,
    suggestions,
    setSuggestions,
    showSuggestions,
    setShowSuggestions,
    selectedAddress,
    setSelectedAddress,
    detailedAddress,
    setDetailedAddress,
    mapCenter,
    setMapCenter,
    coordinates,
    setCoordinates,
    isLoading,
    setIsLoading,
    isValidating,
    setIsValidating,
    isMapVisible,
    setIsMapVisible,
    mapContainerRef,
    mapRef,
    searchInputRef,
    debounceTimerRef,
    reverseGeocodeTimerRef,
    formatAddress,
    handleSelectSuggestion,
    handleConfirm,
    handleClose,
  };
}
`;

const out = path.join(root, "src/components/address-verification/useAddressVerificationModalState.ts");
fs.writeFileSync(out, hook);
console.log("Wrote", out, hook.length);
