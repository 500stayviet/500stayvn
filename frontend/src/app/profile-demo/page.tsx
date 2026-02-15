"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  MapPin,
  AlertCircle,
  Coins,
} from "lucide-react";

const DEMO_USER = {
  name: "김민준",
  email: "demo@500stayviet.com",
  phone: "+84 (0)123 456 789",
  address: "호치민시 1군",
  verified: true,
  kycCompleted: true, // 코인 3개 완료 여부
};

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  bgColor: string;
  disabled?: boolean;
  onClick?: () => void;
  index?: number;
}

function MenuCard({
  icon: Icon,
  title,
  desc,
  color,
  bgColor,
  disabled = false,
  onClick,
  index = 0,
}: MenuCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      disabled={disabled}
      onClick={onClick}
      className="w-full"
    >
      <div
        className={`${bgColor} rounded-xl p-4 flex items-center justify-between border border-opacity-10 transition-all ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:shadow-lg active:scale-95 cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${bgColor}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </motion.button>
  );
}

export default function ProfileDemoPage() {
  const router = useRouter();
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
          <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-20 space-y-6">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push("/profile/edit")}
            className="cursor-pointer group"
          >
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 hover:shadow-md transition-all active:scale-98">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">
                    프로필
                  </p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {DEMO_USER.name}님 환영합니다
                  </h2>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Phone className="w-3.5 h-3.5" />
                      {DEMO_USER.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-xs text-gray-600">
                      {DEMO_USER.address}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* Host Dashboard */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                호스트 대시보드
              </h2>
              {DEMO_USER.kycCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="ml-auto flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  인증됨
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <MenuCard
                icon={Home}
                title="우리집 내놓기"
                desc="새로운 매물을 등록하세요"
                color="text-green-600"
                bgColor="bg-green-50"
                index={0}
              />
              <MenuCard
                icon={Building2}
                title="내 매물 관리"
                desc="등록된 매물들을 관리하세요"
                color="text-purple-600"
                bgColor="bg-purple-50"
                index={1}
              />
              <MenuCard
                icon={Calendar}
                title="예약 관리"
                desc="고객 예약을 관리하세요"
                color="text-orange-600"
                bgColor="bg-orange-50"
                index={2}
              />
              <MenuCard
                icon={Wallet}
                title="정산 계좌"
                desc="정산 계좌를 설정하세요"
                color="text-purple-600"
                bgColor="bg-purple-50"
                index={3}
              />
              <MenuCard
                icon={Star}
                title="평가 관리"
                desc="고객 평가를 확인하세요"
                color="text-yellow-600"
                bgColor="bg-yellow-50"
                index={4}
                disabled
              />
            </div>
          </motion.div>

          {/* Guest Menu */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2.5 bg-teal-100 rounded-lg">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">게스트 메뉴</h2>
            </div>

            <div className="space-y-2">
              <MenuCard
                icon={Calendar}
                title="내 예약"
                desc="예약한 숙소를 확인하세요"
                color="text-teal-600"
                bgColor="bg-teal-50"
                index={0}
              />
              <MenuCard
                icon={Heart}
                title="찜 목록"
                desc="관심있는 숙소를 저장하세요"
                color="text-pink-600"
                bgColor="bg-pink-50"
                index={1}
                disabled
              />
              <MenuCard
                icon={CreditCard}
                title="결제 수단 관리"
                desc="결제 수단을 설정하세요"
                color="text-blue-600"
                bgColor="bg-blue-50"
                index={2}
                disabled
              />
              <MenuCard
                icon={Tag}
                title="쿠폰"
                desc="사용 가능한 쿠폰을 확인하세요"
                color="text-yellow-600"
                bgColor="bg-yellow-50"
                index={3}
                disabled
              />
            </div>
          </motion.div>

          {/* Settings */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2.5 bg-indigo-100 rounded-lg">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">설정</h2>
            </div>

            <div className="space-y-2">
              <MenuCard
                icon={Mail}
                title="개인정보 수정"
                desc="이메일, 전화번호 등을 변경하세요"
                color="text-blue-600"
                bgColor="bg-blue-50"
                onClick={() => router.push("/profile/edit")}
                index={0}
              />
              <MenuCard
                icon={LogOut}
                title="로그아웃"
                desc="계정에서 로그아웃합니다"
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
