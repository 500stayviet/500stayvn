'use client';

import { useState, useEffect, useRef } from 'react';
import { PhoneVerificationData } from '@/types/kyc.types';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUserData } from '@/lib/api/auth';
import {
  createRecaptchaVerifier,
  sendPhoneVerificationCode,
  verifyPhoneCode,
} from '@/lib/firebase/firebase';
import { phoneAuthDebugLog } from './phoneAuthDebug';
import type { PhoneVerificationStepProps } from './types';

const recaptchaContainerId = 'recaptcha-container';

export function usePhoneVerificationStepState({
  currentLanguage,
  onComplete,
  initialPhoneNumber = '',
}: PhoneVerificationStepProps) {
  const { user } = useAuth();
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [isPhoneComplete, setIsPhoneComplete] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [checkingUser, setCheckingUser] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<unknown>(null);
  const recaptchaVerifierRef = useRef<ReturnType<typeof createRecaptchaVerifier> | null>(null); // ApplicationVerifier

  useEffect(() => {
    const checkUserVerification = async () => {
      if (!user) {
        setCheckingUser(false);
        return;
      }

      try {
        const userData = await getCurrentUserData(user.uid);
        if (userData?.phoneNumber) {
          setUserPhoneNumber(userData.phoneNumber);
          setIsPhoneVerified(true);
          setPhoneNumber(userData.phoneNumber);
        }
      } catch (e) {
        console.error('Error checking user verification:', e);
      } finally {
        setCheckingUser(false);
      }
    };

    void checkUserVerification();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const container = document.getElementById(recaptchaContainerId);
      if (!container) {
        const div = document.createElement('div');
        div.id = recaptchaContainerId;
        div.style.display = 'none';
        document.body.appendChild(div);
      }

      try {
        if (recaptchaVerifierRef.current) {
          phoneAuthDebugLog('[phone-auth] existing recaptcha verifier reused in component', {
            containerId: recaptchaContainerId,
          });
        }
        recaptchaVerifierRef.current = createRecaptchaVerifier(recaptchaContainerId);
        phoneAuthDebugLog('[phone-auth] reCAPTCHA verifier ready in PhoneVerificationStep', {
          containerId: recaptchaContainerId,
          mode: 'invisible',
        });
      } catch (e) {
        console.error('Error initializing reCAPTCHA:', e);
      }
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        phoneAuthDebugLog('[phone-auth] recaptcha clear started', { containerId: recaptchaContainerId });
        recaptchaVerifierRef.current.clear();
        phoneAuthDebugLog('[phone-auth] recaptcha clear completed', { containerId: recaptchaContainerId });
      }
      if (typeof window !== 'undefined' && window.__phoneAuthRecaptchaVerifier) {
        delete window.__phoneAuthRecaptchaVerifier;
        phoneAuthDebugLog('[phone-auth] global recaptcha verifier handle removed');
      }
    };
  }, []);

  const handlePhoneChange = (normalizedPhone: string, isComplete: boolean) => {
    setPhoneNumber(normalizedPhone);
    setIsPhoneComplete(isComplete);
    if (normalizedPhone !== userPhoneNumber) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtpCode('');
      setConfirmationResult(null);
    }
  };

  const handleSendOTP = async (normalizedPhone: string): Promise<boolean> => {
    setLoading(true);
    setError('');
    setOtpError('');

    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA not initialized');
      }

      phoneAuthDebugLog('[phone-auth] OTP send requested', { phoneNumber: normalizedPhone });
      const result = await sendPhoneVerificationCode(normalizedPhone, recaptchaVerifierRef.current);

      setConfirmationResult(result);
      setOtpSent(true);
      setOtpError('');

      console.log('Verification code sent via Firebase');
      return true;
    } catch (err: any) {
      console.error('Firebase phone auth error:', {
        code: err?.code,
        message: err?.message,
        stack: err?.stack,
        error: err,
      });

      let errorMessage = 'Failed to send verification code';

      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later';
      } else if (err.message.includes('reCAPTCHA')) {
        errorMessage = 'reCAPTCHA verification failed. Please refresh the page';
      }

      setError(errorMessage);
      return false;
    } finally {
      phoneAuthDebugLog('[phone-auth] 인증 프로세스 종료', { phase: 'handleSendOTP' });
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6 || !confirmationResult) return;

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      const result = await verifyPhoneCode(confirmationResult as any, otpCode);
      phoneAuthDebugLog('[phone-auth] OTP verify success', {
        firebaseUid: result?.user?.uid,
      });

      setIsPhoneVerified(true);
      setOtpError('');

      const verifiedPhoneNumber = result.user?.phoneNumber || phoneNumber;

      const verificationData: PhoneVerificationData = {
        phoneNumber: verifiedPhoneNumber,
        verificationCode: otpCode,
        verificationId: result.user?.uid || 'firebase_verified',
      };

      onComplete(verificationData);

      console.log('Phone verification successful:', verifiedPhoneNumber);
    } catch (err: any) {
      console.error('Firebase verification error:', {
        code: err?.code,
        message: err?.message,
        stack: err?.stack,
        error: err,
      });

      let errorMessage = 'Invalid verification code';

      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid code. Please check and try again';
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'Code expired. Please request a new code';
      }

      setOtpError(errorMessage);
    } finally {
      phoneAuthDebugLog('[phone-auth] 인증 프로세스 종료', { phase: 'handleVerifyOTP' });
      setIsVerifyingOtp(false);
    }
  };

  const handleNext = () => {
    const testPhoneNumber = phoneNumber || '01012345678';
    console.log('Phone verification step completed (test mode)');

    onComplete({
      phoneNumber: testPhoneNumber,
      verificationCode: 'test_mode',
      verificationId: 'test_mode_id',
    });
  };

  return {
    currentLanguage,
    checkingUser,
    initialPhoneNumber,
    userPhoneNumber,
    isPhoneVerified,
    phoneNumber,
    isPhoneComplete,
    otpSent,
    otpCode,
    setOtpCode,
    isVerifyingOtp,
    otpError,
    loading,
    error,
    recaptchaContainerId,
    handlePhoneChange,
    handleSendOTP,
    handleVerifyOTP,
    handleNext,
  };
}
