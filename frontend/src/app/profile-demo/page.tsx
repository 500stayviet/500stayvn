"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Building2,
  Calendar,
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
  MapPin,
} from "lucide-react";

const DEMO_USER = {
  name: "김민준",
  email: "demo@500stayviet.com",
  phone: "+84 (123) 456-789",
  address: "호치민시 1군",
  verified: true,
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
        href: "/profile/edit",
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col">
        {/* TopBar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-900">마이페이지</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 pb-20 space-y-6">
          {/* 환영 인사 & 개인정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => window.location.href = "/profile/edit"}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {DEMO_USER.name}님 환영합니다
                </h2>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>{DEMO_USER.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>{DEMO_USER.address}</span>
                  </div>
                </div>
              </div>
              {DEMO_USER.verified && (
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    인증됨
                  </div>
                </div>
              )}
            </div>
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
                      onClick={() => {
                        if (item.href) {
                          window.location.href = item.href;
                        }
                      }}
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
