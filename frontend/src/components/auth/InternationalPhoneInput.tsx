'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Phone, CheckCircle2 } from 'lucide-react';
import { SupportedLanguage } from '@/lib/api/translation';

interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  prefix: string;
  maxLength: number;
  format: (value: string) => string;
}

interface InternationalPhoneInputProps {
  currentLanguage: SupportedLanguage;
  onPhoneChange: (normalizedPhone: string, isComplete: boolean) => void;
  onSendOtp?: (normalizedPhone: string) => Promise<boolean>; // Optional for booking
  isLoading?: boolean;
  disabled?: boolean;
  initialValue?: string; // To support initial value
}

const COUNTRIES: Record<string, CountryConfig> = {
  KR: {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    prefix: '+82',
    maxLength: 11,
    format: (val) => {
      const v = val.replace(/\D/g, '');
      if (v.length <= 3) return v;
      if (v.length <= 7) return `${v.slice(0, 3)}-${v.slice(3)}`;
      return `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7, 11)}`;
    }
  },
  VN: {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    prefix: '+84',
    maxLength: 10,
    format: (val) => {
      const v = val.replace(/\D/g, '');
      if (v.length <= 3) return v;
      if (v.length <= 6) return `${v.slice(0, 3)}-${v.slice(3)}`;
      return `${v.slice(0, 3)}-${v.slice(3, 6)}-${v.slice(6, 10)}`;
    }
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    prefix: '+81',
    maxLength: 11,
    format: (val) => {
      const v = val.replace(/\D/g, '');
      if (v.length <= 3) return v;
      if (v.length <= 7) return `${v.slice(0, 3)}-${v.slice(3)}`;
      return `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7, 11)}`;
    }
  },
  CN: {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    prefix: '+86',
    maxLength: 11,
    format: (val) => {
      const v = val.replace(/\D/g, '');
      if (v.length <= 3) return v;
      if (v.length <= 7) return `${v.slice(0, 3)}-${v.slice(3)}`;
      return `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7, 11)}`;
    }
  },
  TW: {
    code: 'TW',
    name: 'Taiwan',
    flag: '🇹🇼',
    prefix: '+886',
    maxLength: 10,
    format: (val) => {
      const v = val.replace(/\D/g, '');
      if (v.length <= 4) return v;
      if (v.length <= 7) return `${v.slice(0, 4)}-${v.slice(4)}`;
      return `${v.slice(0, 4)}-${v.slice(4, 7)}-${v.slice(7, 10)}`;
    }
  }
};

const TEXTS = {
  ko: {
    phoneLabel: '전화번호',
    sendOtp: '인증번호 발송',
    placeholder: '전화번호 입력',
    selectCountry: '국가 선택',
    otpSent: '발송됨',
  },
  vi: {
    phoneLabel: 'Số điện thoại',
    sendOtp: 'Gửi mã OTP',
    placeholder: 'Nhập số điện thoại',
    selectCountry: 'Chọn quốc gia',
    otpSent: 'Đã gửi',
  },
  en: {
    phoneLabel: 'Phone Number',
    sendOtp: 'Send OTP',
    placeholder: 'Enter phone number',
    selectCountry: 'Select Country',
    otpSent: 'Sent',
  }
};

export default function InternationalPhoneInput({ 
  currentLanguage, 
  onPhoneChange,
  onSendOtp,
  isLoading = false,
  disabled = false,
  initialValue = ''
}: InternationalPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(COUNTRIES.KR);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const lang = (['ko', 'vi', 'en'].includes(currentLanguage) ? currentLanguage : 'en') as keyof typeof TEXTS;
  const t = TEXTS[lang];

  // Initialize from initialValue if provided
  useEffect(() => {
    if (initialValue) {
      // Find country by prefix
      const country = Object.values(COUNTRIES).find(c => initialValue.startsWith(c.prefix));
      if (country) {
        setSelectedCountry(country);
        const raw = initialValue.slice(country.prefix.length);
        setPhoneNumber(country.format(raw));
      }
    }
  }, [initialValue]);

  // Cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const limitedValue = rawValue.slice(0, selectedCountry.maxLength);
    const formattedValue = selectedCountry.format(limitedValue);
    setPhoneNumber(formattedValue);
    
    const isComplete = limitedValue.length === selectedCountry.maxLength;
    const normalized = `${selectedCountry.prefix}${limitedValue.startsWith('0') ? limitedValue.slice(1) : limitedValue}`;
    onPhoneChange(normalized, isComplete);
  };

  const isComplete = phoneNumber.replace(/\D/g, '').length === selectedCountry.maxLength;

  const handleSendClick = async () => {
    if (!isComplete || otpCooldown > 0 || !onSendOtp) return;
    const rawDigits = phoneNumber.replace(/\D/g, '');
    const normalized = `${selectedCountry.prefix}${rawDigits.startsWith('0') ? rawDigits.slice(1) : rawDigits}`;
    const success = await onSendOtp(normalized);
    if (success) {
      setOtpCooldown(60); // 60 seconds cooldown
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {t.phoneLabel}
      </label>
      
      <div className="flex gap-2">
        {/* Country Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="h-[46px] flex items-center gap-2 px-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-all min-w-[100px] justify-between disabled:opacity-50 disabled:bg-gray-50"
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm font-semibold text-gray-700">{selectedCountry.prefix}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {Object.values(COUNTRIES).map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(country);
                    setPhoneNumber(''); // Reset on country change
                    setIsDropdownOpen(false);
                    onPhoneChange('', false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                    selectedCountry.code === country.code ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-xs text-gray-400">{country.prefix}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder={t.placeholder}
            className="w-full h-[46px] pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50"
          />
          {isComplete && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>

        {/* Send OTP Button (Optional) */}
        {onSendOtp && (
          <button
            type="button"
            onClick={handleSendClick}
            disabled={!isComplete || isLoading || otpCooldown > 0 || disabled}
            className={`h-[46px] px-4 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              isComplete && otpCooldown === 0 && !isLoading && !disabled
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.95] shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : otpCooldown > 0 ? (
              `${otpCooldown}s`
            ) : (
              t.sendOtp
            )}
          </button>
        )}
      </div>
    </div>
  );
}
