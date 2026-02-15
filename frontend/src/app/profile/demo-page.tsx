"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Calendar,
  DollarSign,
  Building2,
  ChevronRight,
  User,
  Heart,
  CreditCard,
  Tag,
  LogOut,
  MapPin,
  Phone,
  CheckCircle2,
  FileCheck,
  Users,
  Lock,
  TrendingUp,
  Wallet,
  Star,
  Key,
} from "lucide-react";

const DEMO_USER = {
  name: "김민준",
  phone: "+84 (123) 456-789",
  address: "호치민시 1군",
  verified: true,
};

export default function ProfileDemoPage() {
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[430px] mx-auto bg-white min-h-screen shadow-2xl">
        {/* 상단 개인정보 바 */}
        <div className="border-b border-gray-100 px-4 py-3 sticky top-0 z-10 bg-white">
          <button
            onClick={() => (window.location.href = "/profile/edit")}
            className="w-full text-left hover:opacity-70 transition-opacity"
          >
            <p className="text-sm font-semibold text-gray-900">
              {DEMO_USER.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              이메일 주소
            </p>
          </button>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="px-4 py-6 space-y-6">

          {/* Host Dashboard 섹션 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 px-1">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">호스트 대시보드</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 space-y-3">
              {/* 우리집 내놓기 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200 hover:border-green-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <Home className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">우리집 내놓기</h4>
                      <p className="text-sm text-gray-600 mt-1">새로운 매물을 등록하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>

              {/* 내 매물 관리 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200 hover:border-purple-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">내 매물 관리</h4>
                      <p className="text-sm text-gray-600 mt-1">등록된 매물들을 관리하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>

              {/* 예약 관리 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border border-orange-200 hover:border-orange-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">예약 관리</h4>
                      <p className="text-sm text-gray-600 mt-1">고객 예약을 관리하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>

              {/* 정산 계좌 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 border border-amber-200 hover:border-amber-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <Wallet className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">정산 계좌</h4>
                      <p className="text-sm text-gray-600 mt-1">정산 계좌를 설정하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>

              {/* 평가 관리 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 border border-yellow-200 hover:border-yellow-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">평가 관리</h4>
                      <p className="text-sm text-gray-600 mt-1">고객 평가를 확인하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Guest Menu 섹션 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 px-1">
              <div className="p-3 bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl">
                <User className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">게스트 메뉴</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 space-y-3">
              {/* 내 예약 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-4 border border-teal-200 hover:border-teal-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <Calendar className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">내 예약</h4>
                      <p className="text-sm text-gray-600 mt-1">예약한 숙소들을 확인하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>

              {/* 위시리스트 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 border border-pink-200 hover:border-pink-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <Heart className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">위시리스트</h4>
                      <p className="text-sm text-gray-600 mt-1">저장한 숙소들을 확인하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>

              {/* 결제 수단 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200 hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">결제 수단 관리</h4>
                      <p className="text-sm text-gray-600 mt-1">결제 수단을 설정하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>

              {/* 쿠폰 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 border border-yellow-200 hover:border-yellow-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <Tag className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">쿠폰</h4>
                      <p className="text-sm text-gray-600 mt-1">사용 가능한 쿠폰을 확인하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* 설정 섹션 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 pb-10"
          >
            <div className="flex items-center gap-3 px-1">
              <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl">
                <Lock className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">설정</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 space-y-3">
              {/* 개인정보 변경 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 border border-indigo-200 hover:border-indigo-400 transition-all cursor-pointer hover:shadow-lg"
                onClick={() => (window.location.href = "/profile/edit")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">개인정보 변경</h4>
                      <p className="text-sm text-gray-600 mt-1">프로필 정보를 수정하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>

              {/* 로그아웃 */}
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 border border-red-200 hover:border-red-400 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-white rounded-xl">
                      <LogOut className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">로그아웃</h4>
                      <p className="text-sm text-gray-600 mt-1">계정에서 로그아웃합니다</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
