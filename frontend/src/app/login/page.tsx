/**
 * Login Page (로그인 페이지 - 간결한 디자인)
 * 
 * - 간결하고 컴팩트한 로그인 폼
 * - 소셜 로그인 버튼 크기 최적화
 * - Firebase Auth 연동
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import TopBar from '@/components/TopBar';
import { getUIText } from '@/utils/i18n';
import { signInWithEmail, signInWithGoogle, signInWithFacebook, signInWithZalo } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 언어 변경 핸들러는 Context의 setCurrentLanguage를 직접 사용

  // 폼 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  // 로그인 제출 핸들러
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmail(formData.email, formData.password);
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || error.code || '';
      setError(
        errorMessage.includes('auth/account-deleted') || errorMessage === 'auth/account-deleted'
          ? (currentLanguage === 'ko' ? '탈퇴한 계정입니다. 재가입이 필요합니다.' : 'Tài khoản đã bị xóa. Vui lòng đăng ký lại.')
          : errorMessage.includes('auth/user-not-found') || errorMessage === 'auth/user-not-found'
          ? (currentLanguage === 'ko' ? '등록되지 않은 이메일입니다' : 'Email chưa được đăng ký')
          : errorMessage.includes('auth/wrong-password') || errorMessage === 'auth/wrong-password'
          ? (currentLanguage === 'ko' ? '비밀번호가 잘못되었습니다' : 'Mật khẩu không đúng')
          : errorMessage.includes('auth/invalid-email') || errorMessage === 'auth/invalid-email'
          ? (currentLanguage === 'ko' ? '올바른 이메일 형식이 아닙니다' : 'Email không hợp lệ')
          : (currentLanguage === 'ko' ? '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.' : 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.')
      );
      setLoading(false);
    }
  };

  // 회원가입 페이지로 이동
  const handleSignUp = () => {
    router.push('/signup');
  };

  // 비밀번호 찾기
  const handleForgotPassword = () => {
    // TODO: 비밀번호 찾기 페이지로 이동
  };

  // 소셜 로그인 핸들러
  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'zalo') => {
    setLoading(true);
    setError('');

    try {
      let userCredential;
      
      switch (provider) {
        case 'google':
          userCredential = await signInWithGoogle();
          break;
        case 'facebook':
          userCredential = await signInWithFacebook();
          break;
        case 'zalo':
          setError(currentLanguage === 'ko' 
            ? 'Zalo 로그인은 곧 제공될 예정입니다' 
            : 'Đăng nhập Zalo sẽ sớm có sẵn');
          setLoading(false);
          return;
        default:
          throw new Error('Unknown provider');
      }

      router.push('/');
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      setError(
        error.code === 'auth/popup-closed-by-user'
          ? (currentLanguage === 'ko' ? '로그인 창이 닫혔습니다' : 'Cửa sổ đăng nhập đã đóng')
          : error.message || (currentLanguage === 'ko' ? '로그인에 실패했습니다' : 'Đăng nhập thất bại')
      );
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
        />

        {/* 로그인 콘텐츠 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-6 py-6"
        >
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {getUIText('login', currentLanguage)}
            </h1>
            <p className="text-gray-500 text-sm">
              {currentLanguage === 'ko' 
                ? '환영합니다! 계정에 로그인하세요'
                : currentLanguage === 'vi'
                ? 'Chào mừng trở lại! Đăng nhập vào tài khoản của bạn'
                : 'Welcome back! Sign in to your account'}
            </p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {getUIText('email', currentLanguage)}
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

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {getUIText('password', currentLanguage)}
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
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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

            {/* 비밀번호 찾기 링크 */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {getUIText('forgotPassword', currentLanguage)}
              </button>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-6 rounded-full font-semibold text-sm hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {currentLanguage === 'ko' ? '로그인 중...' : 'Signing in...'}
                </span>
              ) : (
                <>
                  <span>{getUIText('login', currentLanguage)}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* 구분선 */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500">
                  {currentLanguage === 'ko' ? '또는' : currentLanguage === 'vi' ? 'Hoặc' : 'Or'}
                </span>
              </div>
            </div>

            {/* 소셜 로그인 버튼들 */}
            <div className="space-y-2">
              {/* Google 로그인 */}
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full bg-white text-gray-700 py-2.5 px-4 rounded-full font-medium text-sm border-2 border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{currentLanguage === 'ko' ? 'Google로 시작하기' : 'Tiếp tục với Google'}</span>
              </button>

              {/* Facebook 로그인 */}
              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
                className="w-full bg-[#1877F2] text-white py-2.5 px-4 rounded-full font-medium text-sm hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>{currentLanguage === 'ko' ? 'Facebook으로 시작하기' : 'Tiếp tục với Facebook'}</span>
              </button>

              {/* Zalo 로그인 */}
              <button
                type="button"
                onClick={() => handleSocialLogin('zalo')}
                disabled={loading}
                className="w-full bg-[#0068FF] text-white py-2.5 px-4 rounded-full font-medium text-sm hover:bg-[#0056CC] focus:outline-none focus:ring-2 focus:ring-[#0068FF] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 0-.339.07-.509.14l-1.128.49c-.14.07-.28.14-.35.21-.07.07-.14.14-.14.28 0 .14.07.28.14.35.14.14.28.21.42.28.14.07.28.14.35.21.07.07.14.14.14.28 0 .14-.07.28-.14.35-.07.07-.21.14-.35.14-.14 0-.28-.07-.35-.14-.07-.07-.14-.14-.28-.21-.14-.07-.28-.14-.42-.21-.14-.07-.28-.14-.35-.21-.07-.07-.14-.14-.14-.28 0-.14.07-.28.14-.35.07-.07.21-.14.35-.21l1.128-.49c.17-.07.34-.14.51-.14.14 0 .28.07.35.14.07.07.14.21.14.35 0 .14-.07.28-.14.35-.07.07-.21.14-.35.14zm-5.568 0c-.14 0-.28.07-.35.14-.07.07-.14.21-.14.35 0 .14.07.28.14.35.07.07.21.14.35.14.14 0 .28-.07.35-.14.07-.07.14-.21.14-.35 0-.14-.07-.28-.14-.35-.07-.07-.21-.14-.35-.14z"/>
                </svg>
                <span>{currentLanguage === 'ko' ? 'Zalo로 시작하기' : 'Tiếp tục với Zalo'}</span>
              </button>
            </div>

            {/* 회원가입 링크 */}
            <div className="text-center mt-4">
              <span className="text-gray-600 text-xs">
                {currentLanguage === 'ko' ? '계정이 없으신가요? ' : 'Chưa có tài khoản? '}
              </span>
              <button
                type="button"
                onClick={handleSignUp}
                className="text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors"
              >
                {getUIText('signup', currentLanguage)}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
