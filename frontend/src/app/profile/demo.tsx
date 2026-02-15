"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Calendar,
  DollarSign,
  Building2,
  AlertCircle,
  Zap,
  User,
  Heart,
  CreditCard,
  Tag,
  LogOut,
  Languages,
} from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  disabled?: boolean;
}

function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} rounded-xl p-4 border border-opacity-20`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${bgColor}`}>{Icon}</div>
      </div>
    </motion.div>
  );
}

function MenuCard({
  icon: Icon,
  title,
  description,
  color,
  bgColor,
  disabled = false,
}: MenuCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      disabled={disabled}
      className="w-full"
    >
      <div
        className={`${bgColor} rounded-xl p-4 flex items-center justify-between border border-opacity-10 transition-all hover:shadow-md active:scale-95 ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>{Icon}</div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <Zap className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </motion.button>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        {/* Demo Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <p className="text-xs text-amber-700 font-medium">
            미리보기 모드 - 로그인하여 실제 프로필 확인
          </p>
        </motion.div>

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Languages className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-20 space-y-6">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                  <User className="w-8 h-8" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Demo Host</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Property Host • Verified Member
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 border border-amber-200 rounded-full">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-amber-700">
                    Preview Mode
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Host Stats Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            <StatCard
              icon={<Home className="w-5 h-5" />}
              label="Properties"
              value="8"
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Bookings"
              value="24"
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Revenue"
              value="$2.4k"
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
          </motion.div>

          {/* Host Dashboard Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Host Dashboard</h2>
              <span className="ml-auto text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                Verified
              </span>
            </div>
            <div className="space-y-2">
              <MenuCard
                icon={<Home className="w-5 h-5 text-blue-600" />}
                title="우리집 내놓기"
                description="새로운 숙소를 등록하세요"
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <MenuCard
                icon={<Building2 className="w-5 h-5 text-purple-600" />}
                title="숙소 관리"
                description="등록된 숙소를 관리하세요"
                color="text-purple-600"
                bgColor="bg-purple-50"
              />
              <MenuCard
                icon={<Calendar className="w-5 h-5 text-orange-600" />}
                title="예약 관리"
                description="예약 현황을 확인하세요"
                color="text-orange-600"
                bgColor="bg-orange-50"
              />
              <MenuCard
                icon={<DollarSign className="w-5 h-5 text-purple-600" />}
                title="정산 계좌"
                description="정산 계좌를 관리하세요"
                color="text-purple-600"
                bgColor="bg-purple-50"
              />
            </div>
          </motion.div>

          {/* Guest Menu Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-teal-100 rounded-lg">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Guest Menu</h2>
            </div>
            <div className="space-y-2">
              <MenuCard
                icon={<Calendar className="w-5 h-5 text-teal-600" />}
                title="내 예약"
                description="예약한 숙소를 확인하세요"
                color="text-teal-600"
                bgColor="bg-teal-50"
              />
              <MenuCard
                icon={<Heart className="w-5 h-5 text-pink-600" />}
                title="위시리스트"
                description="관심 숙소를 저장하세요"
                color="text-pink-600"
                bgColor="bg-pink-50"
              />
              <MenuCard
                icon={<CreditCard className="w-5 h-5 text-blue-600" />}
                title="결제 방법"
                description="결제 수단을 관리하세요"
                color="text-blue-600"
                bgColor="bg-blue-50"
                disabled={true}
              />
              <MenuCard
                icon={<Tag className="w-5 h-5 text-yellow-600" />}
                title="쿠폰"
                description="사용 가능한 쿠폰을 확인하세요"
                color="text-yellow-600"
                bgColor="bg-yellow-50"
                disabled={true}
              />
            </div>
          </motion.div>

          {/* Settings Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Settings</h2>
            </div>
            <div className="space-y-2">
              <MenuCard
                icon={<User className="w-5 h-5 text-blue-600" />}
                title="프로필 편집"
                description="이메일, 전화, 언어 설정"
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <MenuCard
                icon={<LogOut className="w-5 h-5 text-red-600" />}
                title="로그아웃"
                description="계정에서 로그아웃합니다"
                color="text-red-600"
                bgColor="bg-red-50"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
