/**
 * Sign Up Page (회원가입 페이지 - 개편 버전)
 * - 이메일, 비밀번호, 비밀번호 확인, 이름, 전화번호 필수
 * - 전화번호 인증(OTP) 조건부 프로세스 포함
 */

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { SupportedLanguage } from '@/lib/api/translation';
import { useLanguage } from '@/contexts/LanguageContext';
import TopBar from '@/components/TopBar';
import { getUIText } from '@/utils/i18n';
import { signUpWithEmail, SignUpData } from '@/lib/api/auth';
import InternationalPhoneInput from '@/components/auth/InternationalPhoneInput';
import { signIn } from "next-auth/react";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // OTP 관련 상태
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  // 조건부 인증 설정
  const requirePhoneVerification = process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === 'true';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    isPhoneComplete: false,
    gender: 'male' as 'male' | 'female',
    preferredLanguage: currentLanguage,
  });

  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lang = (['ko', 'vi', 'ja', 'zh'].includes(currentLanguage)) ? currentLanguage : 'en';
    setFormData(prev => ({ ...prev, preferredLanguage: lang }));
  }, [currentLanguage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePhoneChange = (normalizedPhone: string, isComplete: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      phoneNumber: normalizedPhone, 
      isPhoneComplete: isComplete 
    }));
    // 번호가 바뀌면 인증 상태 초기화
    if (normalizedPhone !== formData.phoneNumber) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpCode('');
    }
  };

  const handleSendOTP = async (normalizedPhone: string): Promise<boolean> => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: normalizedPhone }),
      });
      
      if (response.ok) {
        setOtpSent(true);
        setOtpError('');
        return true;
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send OTP');
        return false;
      }
    } catch (err) {
      setError('System error occurred while sending OTP');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: formData.phoneNumber, 
          code: otpCode 
        }),
      });
      
      if (response.ok) {
        setIsPhoneVerified(true);
        setOtpError('');
      } else {
        const data = await response.json();
        setOtpError(data.error || 'Invalid code');
      }
    } catch (err) {
      setOtpError('Verification error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // 유효성 검사 (전화번호는 선택 사항)
    if (!formData.email || !formData.password || !formData.fullName) {
      setError(currentLanguage === 'ko' ? '모든 필수 필드를 입력해주세요' : 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(currentLanguage === 'ko' ? '비밀번호가 일치하지 않습니다' : 'Mật khẩu không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError(currentLanguage === 'ko' ? '비밀번호는 최소 6자 이상이어야 합니다' : 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    // 조건부 인증 체크
    if (requirePhoneVerification && !isPhoneVerified) {
      setError(currentLanguage === 'ko' ? '전화번호 인증이 필요합니다' : 'Vui lòng xác thực số điện thoại');
      return;
    }

    setLoading(true);

    try {
      const signUpData: SignUpData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || '', // 전화번호는 선택 사항
        gender: formData.gender,
        preferredLanguage: formData.preferredLanguage as SupportedLanguage,
      };

      const result = await signUpWithEmail(signUpData);
      
      if (result.error) {
        setError(result.error.message || 'Signup failed');
        return;
      }

      router.push('/');
    } catch (error: any) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch (error) {
      setError('Social login failed');
      setLoading(false);
    }
  };

  // 가입 버튼 활성화 로직: 로딩 중이 아니고, 필수 필드(이메일, 비밀번호, 이름)가 입력되었으며, (전화번호를 입력한 경우에만 인증 완료 필요)
  const isSignupDisabled = loading || 
    !formData.email || 
    !formData.password || 
    !formData.fullName || 
    (formData.phoneNumber && !formData.isPhoneComplete) || 
    (formData.phoneNumber && requirePhoneVerification && !isPhoneVerified);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={true}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-6 pb-20"
        >
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{getUIText('loginToSignup', currentLanguage)}</span>
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {getUIText('signupWelcome', currentLanguage)}
            </h1>
            <p className="text-gray-500 text-sm">
              {getUIText('signupSub', currentLanguage)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이름 입력 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {getUIText('fullName', currentLanguage)} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={currentLanguage === 'ko' ? '실명을 입력하세요' : 'Nhập họ tên thật'}
                />
              </div>
            </div>

            {/* 전화번호 입력 (InternationalPhoneInput 사용) */}
            <div className="space-y-3">
              <InternationalPhoneInput 
                currentLanguage={currentLanguage}
                onPhoneChange={handlePhoneChange}
                onSendOtp={handleSendOTP}
                isLoading={loading}
                disabled={isPhoneVerified}
              />
              
              {/* OTP 입력창 (발송된 경우에만 표시) */}
              <AnimatePresence>
                {otpSent && !isPhoneVerified && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="6-digit code"
                          className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={otpCode.length !== 6 || isVerifyingOtp}
                        className="px-6 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        {isVerifyingOtp ? '...' : (currentLanguage === 'ko' ? '인증' : 'Xác minh')}
                      </button>
                    </div>
                    {otpError && <p className="text-xs text-red-500 pl-1">{otpError}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {isPhoneVerified && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-3 rounded-xl border border-green-100">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentLanguage === 'ko' ? '전화번호 인증 완료' : 'Đã xác minh số điện thoại'}</span>
                </div>
              )}
            </div>

            {/* 이메일 입력 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {getUIText('email', currentLanguage)} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={getUIText('emailPlaceholder', currentLanguage)}
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {getUIText('password', currentLanguage)} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={getUIText('passwordPlaceholder', currentLanguage)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 입력 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {currentLanguage === 'ko' ? '비밀번호 확인' : 'Xác nhận mật khẩu'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder={currentLanguage === 'ko' ? '비밀번호를 다시 입력하세요' : 'Nhập lại mật khẩu'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSignupDisabled}
              className={`w-full py-4 rounded-full font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 mt-4 ${
                !isSignupDisabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {loading ? '...' : getUIText('signup', currentLanguage)}
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="relative my-8 text-center text-xs text-gray-400 font-bold">
            <span className="bg-white px-4 relative z-10">OR</span>
            <div className="absolute top-1/2 w-full border-t border-gray-100"></div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              className="w-full border-2 border-gray-200 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              <span>{getUIText('googleContinue', currentLanguage)}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin("facebook")}
              className="w-full bg-[#1877F2] text-white py-3 rounded-full text-sm font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg" className="w-5 h-5" alt="Facebook" />
              <span>{getUIText('facebookContinue', currentLanguage)}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">{getUIText('loading', currentLanguage)}</div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
