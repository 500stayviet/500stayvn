"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Building2,
  Calendar,
  DollarSign,
  ChevronRight,
  CheckCircle2,
  Wallet,
  Star,
  Heart,
  CreditCard,
  Tag,
  LogOut,
  User,
  Mail,
  Phone,
  Lock,
  FileCheck,
  TrendingUp,
  Users,
  Edit2,
  X,
  MapPin,
} from "lucide-react";

const DEMO_USER = {
  name: "김민준",
  email: "demo@500stayviet.com",
  phone: "+84 (123) 456-789",
  address: "호치민시 1군",
  verified: true,
  // 임대인 기준 통계
  properties: 8,
  bookings: 24, // 임대인의 예약 수
  revenue: "$2,450", // 임대인의 수익
};

const MENU_ITEMS = [
  {
    section: "Host Dashboard",
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    items: [
      {
        title: "우리집 내놓기",
        desc: "새로운 매물을 등록하세요",
        icon: Home,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        title: "내 매물 관리",
        desc: "등록된 매물들을 관리하세요",
        icon: Building2,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        title: "예약 관리",
        desc: "고객 예약을 관리하세요",
        icon: Calendar,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
      {
        title: "정산 계좌",
        desc: "정산 계좌를 설정하세요",
        icon: Wallet,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        title: "평가 관리",
        desc: "고객 평가를 확인하세요",
        icon: Star,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      },
    ],
  },
  {
    section: "Guest Menu",
    icon: User,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    items: [
      {
        title: "내 예약",
        desc: "예약한 숙소들을 확인하세요",
        icon: Calendar,
        color: "text-teal-600",
        bgColor: "bg-teal-50",
      },
      {
        title: "위시리스트",
        desc: "저장한 숙소들을 확인하세요",
        icon: Heart,
        color: "text-pink-600",
        bgColor: "bg-pink-50",
      },
      {
        title: "결제 수단 관리",
        desc: "결제 수단을 설정하세요",
        icon: CreditCard,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "쿠폰",
        desc: "사용 가능한 쿠폰을 확인하세요",
        icon: Tag,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
      },
    ],
  },
  {
    section: "설정",
    icon: Lock,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    items: [
      {
        title: "개인정보 변경",
        desc: "프로필 정보를 수정하세요",
        icon: Mail,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "로그아웃",
        desc: "계정에서 로그아웃합니다",
        icon: LogOut,
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
    ],
  },
];

export default function ProfileDemoPage() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState(DEMO_USER);

  const handleEditSave = () => {
    setIsEditingProfile(false);
  };

  const handleEditCancel = () => {
    setEditedUser(DEMO_USER);
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col">
        {/* TopBar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-900">마이페이지</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
              인증됨
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 pb-20 space-y-6">
          {/* 개인정보 섹션 - 간단하게 개선 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {!isEditingProfile ? (
              <>
                {/* 프로필 정보 카드 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {editedUser.name}
                      </h2>
                      <div className="mt-2 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>{editedUser.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>{editedUser.address}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Edit2 className="w-4 h-4" />
                      수정
                    </button>
                  </div>
                </div>

                {/* 임대인 통계 (임대인 기준) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                    <div className="text-xs text-emerald-600 font-medium mb-1">
                      임대 매물
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {editedUser.properties}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-xs text-blue-600 font-medium mb-1">
                      예약 수
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {editedUser.bookings}
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <div className="text-xs text-purple-600 font-medium mb-1">
                      수익
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {editedUser.revenue}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded text-center">
                  ℹ️ 통계는 임대인 기준입니다
                </div>
              </>
            ) : (
              // 편집 모드
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">개인정보 변경</h3>
                  <button
                    onClick={handleEditCancel}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름
                    </label>
                    <input
                      type="text"
                      value={editedUser.name}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={editedUser.phone}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      주소
                    </label>
                    <input
                      type="text"
                      value={editedUser.address}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser, address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleEditCancel}
                    className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-300"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleEditSave}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
                  >
                    저장
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* 메뉴 섹션들 */}
          {MENU_ITEMS.map((section, sectionIdx) => (
            <motion.div
              key={section.section}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 * (sectionIdx + 1) }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${section.bgColor}`}>
                  <section.icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  {section.section}
                </h2>
              </div>

              <div className="space-y-2">
                {section.items.map((item, itemIdx) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.button
                      key={itemIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * itemIdx }}
                      className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 text-left">
                          <div
                            className={`p-2 rounded-lg ${item.bgColor} flex-shrink-0 mt-1`}
                          >
                            <IconComponent
                              className={`w-4 h-4 ${item.color}`}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-600">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
