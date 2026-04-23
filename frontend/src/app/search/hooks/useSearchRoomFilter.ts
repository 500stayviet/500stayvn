import { useEffect, useMemo, useRef, useState } from "react";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

export type RoomFilterValue =
  | "studio"
  | "one_room"
  | "two_room"
  | "three_plus"
  | "detached"
  | null;

const ROOM_FILTER_OPTIONS = [
  {
    value: "studio",
    ko: "스튜디오",
    vi: "Studio",
    en: "Studio",
    ja: "スタジオ",
    zh: "一室",
  },
  {
    value: "one_room",
    ko: "1룸(방·거실 분리)",
    vi: "1 phòng (phòng + phòng khách)",
    en: "1 Room (bed + living)",
    ja: "1ルーム",
    zh: "一室(卧室+客厅)",
  },
  {
    value: "two_room",
    ko: "2룸",
    vi: "2 phòng",
    en: "2 Rooms",
    ja: "2ルーム",
    zh: "两室",
  },
  {
    value: "three_plus",
    ko: "3룸+",
    vi: "3+ phòng",
    en: "3+ Rooms",
    ja: "3ルーム+",
    zh: "三室以上",
  },
  {
    value: "detached",
    ko: "독채",
    vi: "Nhà riêng",
    en: "Detached",
    ja: "戸建て",
    zh: "独栋",
  },
] as const;

type LanguageKey = "ko" | "vi" | "en" | "ja" | "zh";

const toLanguageKey = (currentLanguage: string): LanguageKey => {
  if (
    currentLanguage === "ko" ||
    currentLanguage === "vi" ||
    currentLanguage === "ja" ||
    currentLanguage === "zh"
  ) {
    return currentLanguage;
  }
  return "en";
};

export const useSearchRoomFilter = (currentLanguage: string) => {
  const [roomFilter, setRoomFilter] = useState<RoomFilterValue>(null);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const roomDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roomDropdownRef.current &&
        !roomDropdownRef.current.contains(event.target as Node)
      ) {
        setShowRoomDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languageKey = toLanguageKey(currentLanguage);

  const selectedRoomLabel = useMemo(() => {
    if (!roomFilter) return "Select";
    return (
      ROOM_FILTER_OPTIONS.find((o) => o.value === roomFilter)?.[languageKey] ??
      "Select"
    );
  }, [roomFilter, languageKey]);

  const roomFilterLabel = useMemo(() => {
    if (!roomFilter)
      return getUIText("roomsLabel", currentLanguage as SupportedLanguage);
    const opt = ROOM_FILTER_OPTIONS.find((o) => o.value === roomFilter);
    if (!opt) return "";
    return opt[languageKey] ?? opt.en;
  }, [roomFilter, currentLanguage, languageKey]);

  return {
    roomFilter,
    setRoomFilter,
    showRoomDropdown,
    setShowRoomDropdown,
    roomDropdownRef,
    roomFilterOptions: ROOM_FILTER_OPTIONS,
    selectedRoomLabel,
    roomFilterLabel,
    toggleRoomDropdown: () => setShowRoomDropdown((prev) => !prev),
    closeRoomDropdown: () => setShowRoomDropdown(false),
    resetRoomFilter: () => setRoomFilter(null),
  };
};
