import { useEffect, useMemo, useRef, useState } from "react";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { UITextKey } from "@/utils/i18n";
import { getUIText } from "@/utils/i18n";

export type RoomFilterValue =
  | "studio"
  | "one_room"
  | "two_room"
  | "three_plus"
  | "detached"
  | null;

const ROOM_FILTER_KEYS: Record<Exclude<RoomFilterValue, null>, UITextKey> = {
  studio: "searchRoomTypeStudio",
  one_room: "searchRoomTypeOneRoom",
  two_room: "searchRoomTypeTwoRoom",
  three_plus: "searchRoomTypeThreePlus",
  detached: "searchRoomTypeDetached",
};

export const ROOM_FILTER_VALUES = Object.keys(ROOM_FILTER_KEYS) as Exclude<
  RoomFilterValue,
  null
>[];

export type RoomFilterOption = { value: Exclude<RoomFilterValue, null> };

export function getSearchRoomFilterLabel(
  value: RoomFilterValue,
  lang: SupportedLanguage,
): string {
  if (!value) return getUIText("selectLabel", lang);
  return getUIText(ROOM_FILTER_KEYS[value], lang);
}

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

  const lang = currentLanguage as SupportedLanguage;

  const selectedRoomLabel = useMemo(
    () => getSearchRoomFilterLabel(roomFilter, lang),
    [roomFilter, lang],
  );

  const roomFilterLabel = useMemo(() => {
    if (!roomFilter) return getUIText("roomsLabel", lang);
    return getSearchRoomFilterLabel(roomFilter, lang);
  }, [roomFilter, lang]);

  const roomFilterOptions = useMemo(
    (): readonly RoomFilterOption[] =>
      ROOM_FILTER_VALUES.map((value) => ({ value })),
    [],
  );

  return {
    roomFilter,
    setRoomFilter,
    showRoomDropdown,
    setShowRoomDropdown,
    roomDropdownRef,
    roomFilterOptions,
    selectedRoomLabel,
    roomFilterLabel,
    toggleRoomDropdown: () => setShowRoomDropdown((prev) => !prev),
    closeRoomDropdown: () => setShowRoomDropdown(false),
    resetRoomFilter: () => setRoomFilter(null),
  };
};
