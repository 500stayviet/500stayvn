import {
  Wifi,
  Snowflake,
  Sun,
  Bed,
  Building,
  Refrigerator,
  Flame,
  Microwave,
  LayoutGrid,
  Shirt,
  Dumbbell,
  Waves,
  Car,
  ShieldCheck,
  Dog,
  Sparkles,
} from "lucide-react";
import type { SupportedLanguage } from "@/lib/api/translation";

export interface FacilityOption {
  id: string;
  label: Record<SupportedLanguage, string>;
  icon: any;
  category: "basic" | "kitchen" | "lifestyle" | "amenities" | "policy";
}

/** 카테고리 메타 (제목 번역) */
export const FACILITY_CATEGORIES: {
  id: "basic" | "kitchen" | "lifestyle" | "amenities" | "policy";
  label: Record<SupportedLanguage, string>;
}[] = [
  {
    id: "basic",
    label: {
      ko: "기본 시설 (Basic)",
      vi: "Tiện ích cơ bản (Basic)",
      en: "Basic",
      ja: "基本施設 (Basic)",
      zh: "基本设施 (Basic)",
    },
  },
  {
    id: "kitchen",
    label: {
      ko: "주방 및 취사 (Kitchen)",
      vi: "Bếp và nấu ăn (Kitchen)",
      en: "Kitchen",
      ja: "キッチン (Kitchen)",
      zh: "厨房 (Kitchen)",
    },
  },
  {
    id: "lifestyle",
    label: {
      ko: "워크 & 라이프 (Lifestyle)",
      vi: "Làm việc & Sống (Lifestyle)",
      en: "Lifestyle",
      ja: "ワーク＆ライフ (Lifestyle)",
      zh: "工作与生活 (Lifestyle)",
    },
  },
  {
    id: "amenities",
    label: {
      ko: "건물 부대시설 (Amenities)",
      vi: "Tiện ích tòa nhà (Amenities)",
      en: "Amenities",
      ja: "建物付帯施設 (Amenities)",
      zh: "楼宇设施 (Amenities)",
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
  // 1. 기본 시설
  {
    id: "wifi",
    label: { ko: "와이파이", vi: "Wifi", en: "WiFi", ja: "Wifi", zh: "无线网络" },
    icon: Wifi,
    category: "basic",
  },
  {
    id: "aircon",
    label: { ko: "에어컨", vi: "Điều hòa", en: "AC", ja: "エアコン", zh: "空调" },
    icon: Snowflake,
    category: "basic",
  },
  {
    id: "heating",
    label: { ko: "히팅", vi: "Sưởi ấm", en: "Heating", ja: "暖房", zh: "暖气" },
    icon: Sun,
    category: "basic",
  },
  {
    id: "bed",
    label: { ko: "침대", vi: "Giường", en: "Bed", ja: "ベッド", zh: "床" },
    icon: Bed,
    category: "basic",
  },
  {
    id: "elevator",
    label: { ko: "엘리베이터", vi: "Thang máy", en: "Elevator", ja: "エレベーター", zh: "电梯" },
    icon: Building,
    category: "basic",
  },
  // 2. 주방 및 취사
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
  // 3. 워크 & 라이프
  {
    id: "desk_chair",
    label: { ko: "책상과 의자", vi: "Bàn và ghế", en: "Desk & Chair", ja: "デスクと椅子", zh: "书桌和椅子" },
    icon: LayoutGrid,
    category: "lifestyle",
  },
  {
    id: "washing_machine",
    label: { ko: "세탁기", vi: "Máy giặt", en: "Washing Machine", ja: "洗濯機", zh: "洗衣机" },
    icon: Shirt,
    category: "lifestyle",
  },
  // 4. 건물 부대시설
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
  // 5. 추가 정책 (애완동물, 주당 청소)
  {
    id: "pet",
    label: {
      ko: "애완동물 가능 (마리당)",
      vi: "Cho phép thú cưng (mỗi con)",
      en: "Pet Friendly (per pet)",
      ja: "ペット可 (1頭あたり)",
      zh: "允许宠物 (每只)",
    },
    icon: Dog,
    category: "policy",
  },
  {
    id: "cleaning",
    label: {
      ko: "주당 청소",
      vi: "Dọn dẹp theo tuần",
      en: "Weekly Cleaning",
      ja: "週間清掃",
      zh: "每周清洁",
    },
    icon: Sparkles,
    category: "policy",
  },
];
