import {
  Wifi,
  Snowflake,
  Sun,
  Bed,
  Building,
  Refrigerator,
  Flame,
  Microwave,
  UtensilsCrossed,
  LayoutGrid,
  Shirt,
  Dumbbell,
  Waves,
  Car,
  ShieldCheck,
  Dog,
  Sparkles,
  Sofa,
  Archive,
  Tv,
} from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";

export interface FacilityOption {
  id: string;
  label: Record<SupportedLanguage, string>;
  icon: any;
  category: "basic" | "furniture" | "electronics" | "kitchen" | "amenities" | "policy";
}

/** 카테고리 메타 (제목 번역) */
export const FACILITY_CATEGORIES: {
  id: "basic" | "furniture" | "electronics" | "kitchen" | "amenities" | "policy";
  label: Record<SupportedLanguage, string>;
}[] = [
  {
    id: "basic",
    label: {
      ko: "기본 시설 (Essentials)",
      vi: "Tiện ích cơ bản (Essentials)",
      en: "Essentials",
      ja: "基本施設 (Essentials)",
      zh: "基本设施 (Essentials)",
    },
  },
  {
    id: "furniture",
    label: {
      ko: "가구 (Furniture)",
      vi: "Nội thất (Furniture)",
      en: "Furniture",
      ja: "家具 (Furniture)",
      zh: "家具 (Furniture)",
    },
  },
  {
    id: "electronics",
    label: {
      ko: "가전 (Electronics)",
      vi: "Điện tử (Electronics)",
      en: "Electronics",
      ja: "家電 (Electronics)",
      zh: "家电 (Electronics)",
    },
  },
  {
    id: "kitchen",
    label: {
      ko: "주방 (Kitchen)",
      vi: "Bếp (Kitchen)",
      en: "Kitchen",
      ja: "キッチン (Kitchen)",
      zh: "厨房 (Kitchen)",
    },
  },
  {
    id: "amenities",
    label: {
      ko: "건물 부대시설",
      vi: "Tiện ích tòa nhà",
      en: "Building Amenities",
      ja: "建物付帯施設",
      zh: "楼宇设施",
    },
  },
  {
    id: "policy",
    label: {
      ko: "추가 정책 (Policy)",
      vi: "Chính sách thêm (Policy)",
      en: "Policy",
      ja: "追加ポリシー (Policy)",
      zh: "附加政策 (Policy)",
    },
  },
];

export const FACILITY_OPTIONS: FacilityOption[] = [
  // 1. 기본 시설 (Essentials)
  {
    id: "wifi",
    label: { ko: "와이파이", vi: "Wifi", en: "WiFi", ja: "Wifi", zh: "无线网络" },
    icon: Wifi,
    category: "basic",
  },
  // 2. 가구 (Furniture)
  {
    id: "bed",
    label: { ko: "침대", vi: "Giường", en: "Bed", ja: "ベッド", zh: "床" },
    icon: Bed,
    category: "furniture",
  },
  {
    id: "desk_chair",
    label: { ko: "책상과 의자", vi: "Bàn và ghế", en: "Desk & Chair", ja: "デスクと椅子", zh: "书桌和椅子" },
    icon: LayoutGrid,
    category: "furniture",
  },
  {
    id: "sofa",
    label: { ko: "소파", vi: "Sofa", en: "Sofa", ja: "ソファ", zh: "沙发" },
    icon: Sofa,
    category: "furniture",
  },
  {
    id: "wardrobe",
    label: { ko: "옷장", vi: "Tủ quần áo", en: "Wardrobe", ja: "クローゼット", zh: "衣柜" },
    icon: Archive,
    category: "furniture",
  },
  // 3. 가전 (Electronics)
  {
    id: "tv",
    label: { ko: "TV", vi: "TV", en: "TV", ja: "テレビ", zh: "电视" },
    icon: Tv,
    category: "electronics",
  },
  {
    id: "aircon",
    label: { ko: "에어컨", vi: "Điều hòa", en: "AC", ja: "エアコン", zh: "空调" },
    icon: Snowflake,
    category: "electronics",
  },
  {
    id: "heating",
    label: { ko: "히팅 (선택)", vi: "Sưởi ấm (tùy chọn)", en: "Heating (optional)", ja: "暖房 (任意)", zh: "暖气 (可选)" },
    icon: Sun,
    category: "electronics",
  },
  {
    id: "washing_machine",
    label: { ko: "세탁기", vi: "Máy giặt", en: "Washing Machine", ja: "洗濯機", zh: "洗衣机" },
    icon: Shirt,
    category: "electronics",
  },
  // 4. 주방 (Kitchen)
  {
    id: "refrigerator",
    label: { ko: "냉장고", vi: "Tủ lạnh", en: "Refrigerator", ja: "冷蔵庫", zh: "冰箱" },
    icon: Refrigerator,
    category: "kitchen",
  },
  {
    id: "stove",
    label: {
      ko: "가스레인지/인덕션",
      vi: "Bếp gas/Điện từ",
      en: "Stove/Induction",
      ja: "ガスコンロ/IH",
      zh: "燃气灶/电磁炉",
    },
    icon: Flame,
    category: "kitchen",
  },
  {
    id: "microwave",
    label: { ko: "전자레인지", vi: "Lò vi sóng", en: "Microwave", ja: "電子レンジ", zh: "微波炉" },
    icon: Microwave,
    category: "kitchen",
  },
  {
    id: "dishware",
    label: {
      ko: "식기세트",
      vi: "Bộ bát đĩa",
      en: "Dishware Set",
      ja: "食器セット",
      zh: "餐具套装",
    },
    icon: UtensilsCrossed,
    category: "kitchen",
  },
  // 5. 건물 부대시설
  {
    id: "elevator",
    label: { ko: "엘리베이터", vi: "Thang máy", en: "Elevator", ja: "エレベーター", zh: "电梯" },
    icon: Building,
    category: "amenities",
  },
  {
    id: "gym",
    label: { ko: "헬스장", vi: "Phòng gym", en: "Gym", ja: "ジム", zh: "健身房" },
    icon: Dumbbell,
    category: "amenities",
  },
  {
    id: "pool",
    label: { ko: "수영장", vi: "Hồ bơi", en: "Pool", ja: "プール", zh: "游泳池" },
    icon: Waves,
    category: "amenities",
  },
  {
    id: "parking",
    label: { ko: "주차", vi: "Bãi đậu xe", en: "Parking", ja: "駐車", zh: "停车" },
    icon: Car,
    category: "amenities",
  },
  {
    id: "security",
    label: { ko: "보안", vi: "Bảo mật", en: "Security", ja: "セキュリティ", zh: "安保" },
    icon: ShieldCheck,
    category: "amenities",
  },
  // 6. 추가 정책 (Policy)
  {
    id: "pet",
    label: {
      ko: "애완동물 가능",
      vi: "Cho phép thú cưng",
      en: "Pet Friendly",
      ja: "ペット可",
      zh: "允许宠物",
    },
    icon: Dog,
    category: "policy",
  },
  {
    id: "cleaning",
    label: {
      ko: "주당 청소 횟수",
      vi: "Số lần dọn dẹp mỗi tuần",
      en: "Cleaning per week",
      ja: "週間清掃回数",
      zh: "每周清洁次数",
    },
    icon: Sparkles,
    category: "policy",
  },
];

/** 풀 가구: 침대·책상과의자·소파·옷장 모두 선택 시 */
export const FULL_FURNITURE_IDS = [
  "bed",
  "desk_chair",
  "sofa",
  "wardrobe",
] as const;

/** 풀 가전: TV·에어컨·히팅·세탁기 모두 선택 시 */
export const FULL_ELECTRONICS_IDS = [
  "tv",
  "aircon",
  "heating",
  "washing_machine",
] as const;

/** 풀옵션 주방: 냉장고·가스레인지/인덕션·전자레인지·식기세트 모두 선택 시 */
export const FULL_OPTION_KITCHEN_IDS = [
  "refrigerator",
  "stove",
  "microwave",
  "dishware",
] as const;
