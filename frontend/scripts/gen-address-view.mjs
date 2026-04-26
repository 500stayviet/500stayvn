import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const modal = fs.readFileSync(
  path.join(root, "src/components/AddressVerificationModal.tsx"),
  "utf8",
);
const marker = '\n  return (\n    <div className="fixed inset-0';
const a = modal.indexOf(marker);
if (a < 0) throw new Error("modal return not found");
const start = a + "\n  return (".length;
const b = modal.lastIndexOf("\n  );\n}");
if (b < 0) throw new Error("modal close not found");
const jsx = modal.slice(start, b).trim();

const header = `'use client';

import { X, MapPin, Loader2, Check } from 'lucide-react';
import type { useAddressVerificationModalState } from './useAddressVerificationModalState';

type Vm = ReturnType<typeof useAddressVerificationModalState>;

export function AddressVerificationModalView(p: Vm) {
  if (!p.isOpen) return null;
  const {
    currentLanguage,
    handleClose,
    searchInputRef,
    searchText,
    setSearchText,
    selectedAddress,
    isLoading,
    showSuggestions,
    setShowSuggestions,
    suggestions,
    formatAddress,
    handleSelectSuggestion,
    isMapVisible,
    detailedAddress,
    mapContainerRef,
    mapCenter,
    isValidating,
    handleConfirm,
    coordinates,
  } = p;
  return (
`;

const footer = `  );
}
`;

const out = path.join(root, "src/components/address-verification/AddressVerificationModalView.tsx");
fs.writeFileSync(out, header + jsx + "\n" + footer);
console.log("Wrote", out);
