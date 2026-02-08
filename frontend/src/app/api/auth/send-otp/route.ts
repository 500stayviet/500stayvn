import { NextResponse } from 'next/server';

// Firebase Client SDK 방식으로 변경
// AWS SNS 로직은 완전히 제거

// OTP를 임시로 저장할 인메모리 저장소 (Firebase 인증 대신 fallback으로 사용)
// 실제 운영에서는 Firebase 인증을 사용해야 함
const otpStore = new Map<string, { code: string; expires: number }>();

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Firebase 환경 변수 확인
    const hasFirebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                             process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
                             process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (hasFirebaseConfig) {
      // Firebase가 설정되어 있으면 클라이언트에서 Firebase SDK를 사용하도록 안내
      console.log(`Firebase phone authentication available for: ${phoneNumber}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Use Firebase Client SDK for phone authentication',
        firebaseEnabled: true,
        // 클라이언트에서 사용할 Firebase 설정 정보
        firebaseConfig: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          // 다른 필요한 설정들...
        },
        instructions: 'Call signInWithPhoneNumber() on client side with recaptchaVerifier'
      });
    } else {
      // Firebase가 설정되지 않았으면 fallback OTP 시스템 사용
      console.warn('Firebase not configured. Using fallback OTP system.');
      
      // 6자리 랜덤 코드 생성 (fallback)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 5분 후 만료
      const expires = Date.now() + 5 * 60 * 1000;
      otpStore.set(phoneNumber, { code: otpCode, expires });
      
      console.log(`Fallback OTP for ${phoneNumber}: ${otpCode}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully (fallback mode)',
        firebaseEnabled: false,
        // 개발 모드에서는 OTP 코드 제공
        ...(process.env.NODE_ENV === 'development' && { testOtp: otpCode })
      });
    }
  } catch (error: any) {
    console.error('Error in phone authentication:', error);
    return NextResponse.json({ error: 'Failed to process phone authentication', details: error.message }, { status: 500 });
  }
}

// OTP 검증 (fallback 시스템용)
export async function PUT(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();
    const storedData = otpStore.get(phoneNumber);

    if (!storedData) {
      return NextResponse.json({ error: 'No OTP found for this number' }, { status: 400 });
    }

    if (Date.now() > storedData.expires) {
      otpStore.delete(phoneNumber);
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    if (storedData.code === code) {
      otpStore.delete(phoneNumber); // 사용 완료 후 삭제
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}