/**
 * Sign Up Page (회원가입 페이지 - 이메일/비밀번호만 필수)
 * 
 * - 이메일/비밀번호만 필수 입력
 * - 이름, 전화번호, 성별, 언어는 선택 사항
 * - 비밀번호 확인 필드 제거 (비밀번호 필드의 show/hide 기능으로 확인)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { SupportedLanguage } from '@/lib/api/translation';
import { useLanguage } from '@/contexts/LanguageContext';
import TopBar from '@/components/TopBar';
import { getUIText } from '@/utils/i18n';
import { signUpWithEmail, SignUpData } from '@/lib/api/auth';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [otpSent, setOtpSent] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    gender: 'male',
    preferredLanguage: (currentLanguage === 'ja' ? 'en' : currentLanguage) as 'ko' | 'vi' | 'en', // Context의 현재 언어로 초기화
  });
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // 언어 변경 핸들러
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await setCurrentLanguage(lang);
    setIsLanguageMenuOpen(false);
  };
  
  // currentLanguage가 변경되면 formData도 업데이트
  useEffect(() => {
    // 지원하지 않는 언어는 영어로 설정
    const lang = (currentLanguage === 'ko' || currentLanguage === 'vi') ? currentLanguage : 'en';
    setFormData(prev => ({ ...prev, preferredLanguage: lang }));
  }, [currentLanguage]);

  // 외부 클릭 시 언어 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    if (isLanguageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageMenuOpen]);

  // 폼 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  // 성별 선택 핸들러
  const handleGenderSelect = (gender: 'male' | 'female') => {
    setFormData((prev) => ({ ...prev, gender }));
  };

  // 전화번호 포맷팅 (베트남 형식)
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.startsWith('84')) {
      return `+${numbers}`;
    } else if (numbers.startsWith('0')) {
      return `+84${numbers.substring(1)}`;
    } else if (numbers) {
      return `+84${numbers}`;
    }
    return '';
  };

  // 전화번호 입력 핸들러
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({ ...prev, phoneNumber: formatted }));
    setError('');
  };

  // OTP 발송 버튼 (UI만 구현)
  const handleSendOTP = () => {
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      setError(currentLanguage === 'ko' 
        ? '올바른 전화번호를 입력해주세요' 
        : 'Vui lòng nhập số điện thoại hợp lệ');
      return;
    }
    setOtpSent(true);
    setTimeout(() => setOtpSent(false), 5000);
  };

  // 회원가입 제출 핸들러
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError(currentLanguage === 'ko' 
        ? '비밀번호는 최소 6자 이상이어야 합니다' 
        : 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const signUpData: SignUpData = {
        email: formData.email,
        password: formData.password,
        // 선택 사항들 (값이 있을 때만 포함)
        ...(formData.fullName && { fullName: formData.fullName }),
        ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }),
        ...(formData.gender && { gender: formData.gender }),
        // 지원하지 않는 언어는 영어로 설정
        preferredLanguage: (currentLanguage === 'ko' || currentLanguage === 'vi') ? currentLanguage : 'en',
      };

      await signUpWithEmail(signUpData);
      // 성공 모달 표시
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(
        error.code === 'auth/email-already-in-use'
          ? (currentLanguage === 'ko' ? '이미 사용 중인 이메일입니다' : 'Email đã được sử dụng')
          : error.code === 'auth/weak-password'
          ? (currentLanguage === 'ko' ? '비밀번호가 너무 약합니다' : 'Mật khẩu quá yếu')
          : error.message || (currentLanguage === 'ko' ? '회원가입에 실패했습니다' : 'Đăng ký thất bại')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="w-full max-w-[430px] mx-auto bg-white min-h-screen shadow-lg">
        {/* 상단 바 */}
        <TopBar 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={true}
        />

        {/* 회원가입 콘텐츠 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-6 py-6"
        >
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{currentLanguage === 'ko' ? '로그인으로' : 'Về đăng nhập'}</span>
          </button>

          {/* 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {currentLanguage === 'ko' ? '회원가입' : 
                 currentLanguage === 'vi' ? 'Đăng ký' : 
                 'Sign Up'}
              </h1>
              <p className="text-gray-500 text-sm">
                {currentLanguage === 'ko' 
                  ? '새 계정을 만들어 시작하세요'
                  : currentLanguage === 'vi'
                  ? 'Tạo tài khoản mới để bắt đầu'
                  : 'Create a new account to get started'}
              </p>
            </div>
            
            {/* 언어 선택 */}
            <div className="relative" ref={languageMenuRef}>
              <button
                type="button"
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all duration-200"
              >
                <Globe className="w-4 h-4" />
                <span className="text-base">
                  {currentLanguage === 'ko' ? '🇰🇷' : 
                   currentLanguage === 'vi' ? '🇻🇳' : 
                   '🇺🇸'}
                </span>
              </button>

              {/* 언어 드롭다운 */}
              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  {[
                    { code: 'en' as SupportedLanguage, name: 'English', flag: '🇺🇸' },
                    { code: 'vi' as SupportedLanguage, name: 'Tiếng Việt', flag: '🇻🇳' },
                    { code: 'ko' as SupportedLanguage, name: '한국어', flag: '🇰🇷' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                        currentLanguage === lang.code ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 입력 (선택 사항) */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                {currentLanguage === 'ko' ? '이름' : 'Họ tên'}
                <span className="text-gray-400 text-xs ml-1">({currentLanguage === 'ko' ? '선택' : 'Tùy chọn'})</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder={currentLanguage === 'ko' ? '이름을 입력하세요 (선택)' : 'Nhập họ tên (tùy chọn)'}
                />
              </div>
            </div>

            {/* 전화번호 입력 (선택 사항) */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                {currentLanguage === 'ko' ? '전화번호' : 'Số điện thoại'}
                <span className="text-gray-400 text-xs ml-1">({currentLanguage === 'ko' ? '선택' : 'Tùy chọn'})</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    placeholder="+84... (선택)"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={otpSent || !formData.phoneNumber}
                  className="px-3 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs whitespace-nowrap"
                >
                  {otpSent ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    currentLanguage === 'ko' ? 'OTP' : 'OTP'
                  )}
                </button>
              </div>
            </div>

            {/* 성별 선택 (선택 사항) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {currentLanguage === 'ko' ? '성별' : 'Giới tính'}
                <span className="text-gray-400 text-xs ml-1">({currentLanguage === 'ko' ? '선택' : 'Tùy chọn'})</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleGenderSelect('male')}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                    formData.gender === 'male'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {currentLanguage === 'ko' ? '남성' : 'Nam'}
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderSelect('female')}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                    formData.gender === 'female'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {currentLanguage === 'ko' ? '여성' : 'Nữ'}
                </button>
              </div>
            </div>

            {/* 주 사용 언어 (선택 사항) */}
            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-1.5">
                {currentLanguage === 'ko' ? '주 사용 언어' : 'Ngôn ngữ ưa thích'}
                <span className="text-gray-400 text-xs ml-1">({currentLanguage === 'ko' ? '선택' : 'Tùy chọn'})</span>
              </label>
              <select
                id="preferredLanguage"
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="ko">한국어</option>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* 이메일 입력 (필수) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {getUIText('email', currentLanguage)}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={getUIText('emailPlaceholder', currentLanguage)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* 비밀번호 입력 (필수) - show/hide 기능 포함 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {getUIText('password', currentLanguage)}
                <span className="text-red-500 text-xs ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={getUIText('passwordPlaceholder', currentLanguage)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  title={showPassword ? (currentLanguage === 'ko' ? '비밀번호 숨기기' : 'Ẩn mật khẩu') : (currentLanguage === 'ko' ? '비밀번호 보기' : 'Hiện mật khẩu')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-6 rounded-full font-semibold text-sm hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {currentLanguage === 'ko' ? '가입 중...' : 'Đang đăng ký...'}
                </span>
              ) : (
                <>
                  <span>{currentLanguage === 'ko' ? '회원가입' : 'Đăng ký'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* 회원가입 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {currentLanguage === 'ko' ? '회원가입 완료!' : 
                 currentLanguage === 'vi' ? 'Đăng ký thành công!' : 
                 'Sign Up Successful!'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {currentLanguage === 'ko' 
                  ? '환영합니다! 이제 서비스를 이용하실 수 있습니다.'
                  : currentLanguage === 'vi'
                  ? 'Chào mừng bạn! Bây giờ bạn có thể sử dụng dịch vụ.'
                  : 'Welcome! You can now use our service.'}
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  // returnUrl이 있으면 해당 페이지로, 없으면 홈으로 이동
                  router.push(returnUrl);
                }}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
              >
                {currentLanguage === 'ko' ? '시작하기' : 
                 currentLanguage === 'vi' ? 'Bắt đầu' : 
                 'Get Started'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
