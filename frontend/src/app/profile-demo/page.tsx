"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

const DEMO_USER = {
  name: "Demo Host",
  email: "demo@500stayviet.com",
  phone: "+84 (123) 456-789",
  verified: true,
  properties: 8,
  bookings: 24,
  revenue: "$2,450",
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
        title: "결제 수단",
        desc: "결제 수단을 관리하세요",
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
    section: "Settings",
    icon: Lock,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    items: [
      {
        title: "프로필 편집",
        desc: "이메일, 휴대폰, 언어 설정",
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center p-4">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col">
        {/* Demo Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center"
        >
          <p className="text-xs text-amber-700 font-semibold">
            데모 모드 - 디자인 미리보기
          </p>
        </motion.div>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">마이페이지</h1>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-4">{DEMO_USER.name}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{DEMO_USER.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{DEMO_USER.phone}</span>
            </div>
          </div>
          {DEMO_USER.verified && (
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full w-fit">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Verified Host</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              {
                label: "Properties",
                value: DEMO_USER.properties,
                icon: Home,
                color: "text-emerald-600",
                bgColor: "bg-emerald-50",
              },
              {
                label: "Bookings",
                value: DEMO_USER.bookings,
                icon: Calendar,
                color: "text-blue-600",
                bgColor: "bg-blue-50",
              },
              {
                label: "Revenue",
                value: DEMO_USER.revenue,
                icon: DollarSign,
                color: "text-purple-600",
                bgColor: "bg-purple-50",
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`${stat.bgColor} rounded-lg p-3 text-center`}
              >
                <stat.icon className={`${stat.color} w-6 h-6 mx-auto mb-2`} />
                <div className="text-lg font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Menu Sections */}
          <div className="space-y-6 pb-20">
            {MENU_ITEMS.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + sectionIndex * 0.1 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className={`${section.bgColor} p-2 rounded-lg`}>
                    <section.icon
                      className={`${section.color} w-5 h-5`}
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {section.section}
                  </h3>
                </div>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <motion.div
                      key={itemIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.4 + sectionIndex * 0.1 + itemIndex * 0.05,
                      }}
                      className={`${item.bgColor} rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <item.icon className={`${item.color} w-5 h-5`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-600">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
