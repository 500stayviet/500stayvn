"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Calendar,
  DollarSign,
  Building2,
  AlertCircle,
  ChevronRight,
  User,
  Heart,
  CreditCard,
  Tag,
  LogOut,
  Languages,
  MapPin,
  Phone,
  CheckCircle2,
} from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  index?: number;
}

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  disabled?: boolean;
  index?: number;
}

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`${bgColor} rounded-xl p-4 border border-opacity-20`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${bgColor}`}>{icon}</div>
      </div>
    </motion.div>
  );
}

function MenuCard({
  icon,
  title,
  description,
  color,
  bgColor,
  disabled = false,
  index = 0,
}: MenuCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      disabled={disabled}
      className="w-full"
    >
      <div
        className={`${bgColor} rounded-xl p-4 flex items-center justify-between border border-opacity-10 transition-all hover:shadow-md active:scale-95 ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>{icon}</div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </motion.button>
  );
}

export default function ProfileDemoPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Languages className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-20 space-y-6">
          {/* Profile Section - Click to Edit */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => (window.location.href = "/profile/edit")}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  김민준님 환영합니다
                </h2>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>+84 (123) 456-789</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>호치민시 1군</span>
                  </div>
                </div>
              </div>
            </div>
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
                index={0}
              />
              <MenuCard
                icon={<Building2 className="w-5 h-5 text-purple-600" />}
                title="숙소 관리"
                description="등록된 숙소를 관리하세요"
                color="text-purple-600"
                bgColor="bg-purple-50"
                index={1}
              />
              <MenuCard
                icon={<Calendar className="w-5 h-5 text-orange-600" />}
                title="예약 관리"
                description="예약 현황을 확인하세요"
                color="text-orange-600"
                bgColor="bg-orange-50"
                index={2}
              />
              <MenuCard
                icon={<DollarSign className="w-5 h-5 text-purple-600" />}
                title="정산 계좌"
                description="정산 계좌를 관리하세요"
                color="text-purple-600"
                bgColor="bg-purple-50"
                index={3}
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
                index={0}
              />
              <MenuCard
                icon={<Heart className="w-5 h-5 text-pink-600" />}
                title="위시리스트"
                description="관심 숙소를 저장하세요"
                color="text-pink-600"
                bgColor="bg-pink-50"
                index={1}
              />
              <MenuCard
                icon={<CreditCard className="w-5 h-5 text-blue-600" />}
                title="결제 방법"
                description="결제 수단을 관리하세요"
                color="text-blue-600"
                bgColor="bg-blue-50"
                disabled={true}
                index={2}
              />
              <MenuCard
                icon={<Tag className="w-5 h-5 text-yellow-600" />}
                title="쿠폰"
                description="사용 가능한 쿠폰을 확인하세요"
                color="text-yellow-600"
                bgColor="bg-yellow-50"
                disabled={true}
                index={3}
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
                index={0}
              />
              <MenuCard
                icon={<LogOut className="w-5 h-5 text-red-600" />}
                title="로그아웃"
                description="계정에서 로그아웃합니다"
                color="text-red-600"
                bgColor="bg-red-50"
                index={1}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
