# Firebase 설정 (전화 인증 전용)

앱 데이터는 **PostgreSQL**과 **브라우저 LocalStorage**를 우선 사용합니다.  
Firebase에서는 **Authentication(전화번호)** 만 사용합니다. **Firestore / Realtime Database는 사용하지 않습니다.**

## 1. Firebase Console

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 선택 또는 생성
2. **Authentication** → Sign-in method → **전화** 활성화
3. (선택) Firestore를 만들 필요 **없음**. 만들어도 이 프론트 코드는 읽지 않습니다.

## 2. 웹 앱 등록

1. 프로젝트 설정 → 일반 → 앱에서 **웹** 앱 추가
2. 표시되는 설정값을 `.env.local`에 넣습니다:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## 3. 클라이언트 동작

- `src/lib/firebase/firebase.ts`에서 `firebase/app` + `firebase/auth`만 초기화
- KYC Step 1 (`PhoneVerificationStep`)에서 `signInWithPhoneNumber` 사용

## 4. 서버 `send-otp` 라우트

- 위 환경 변수가 있으면: 클라이언트에서 Firebase로 인증하라는 응답
- 없으면: 개발용 fallback OTP(인메모리)
