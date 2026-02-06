# 🔥 Firebase Authentication 에러 빠른 해결 가이드

## 현재 에러
```
auth/configuration-not-found
```

## ⚡ 빠른 해결 방법 (5분)

### Step 1: Firebase Console 접속
1. 브라우저에서 **https://console.firebase.google.com/** 접속
2. Google 계정으로 로그인
3. 프로젝트 목록에서 **`stayviet-26ae4`** 클릭

### Step 2: Authentication 활성화
1. 왼쪽 메뉴에서 **"Authentication"** (인증) 클릭
2. 화면에 **"Get started"** 또는 **"시작하기"** 버튼이 보이면 클릭
   - 만약 버튼이 안 보이면 이미 활성화된 것일 수 있습니다
3. 상단 탭에서 **"Sign-in method"** (로그인 방법) 클릭

### Step 3: 이메일/비밀번호 활성화
1. 제공업체 목록에서 **"이메일/비밀번호"** 또는 **"Email/Password"** 찾기
2. 클릭하여 열기
3. **"사용 설정"** 또는 **"Enable"** 토글을 **켜기** (ON)
4. **"저장"** 또는 **"Save"** 버튼 클릭

### Step 4: 확인
- "이메일/비밀번호" 옆에 **"사용 설정됨"** 또는 **"Enabled"** 표시가 있어야 합니다
- 회원가입을 다시 시도해보세요!

## 📋 체크리스트

- [ ] Firebase Console에 로그인했나요?
- [ ] `stayviet-26ae4` 프로젝트를 선택했나요?
- [ ] Authentication 페이지에서 "Get started"를 클릭했나요?
- [ ] Sign-in method 탭에서 "이메일/비밀번호"를 활성화했나요?
- [ ] "저장" 버튼을 클릭했나요?
- [ ] 개발 서버를 재시작했나요? (`npm run dev`)

## 🆘 여전히 안 되나요?

1. **브라우저 개발자 도구 (F12) → Console 탭** 열기
2. 페이지를 새로고침 (F5)
3. "Firebase 초기화 완료" 메시지가 보이는지 확인
4. 다른 에러 메시지가 있는지 확인

## 📞 추가 도움

Firebase 문서: https://firebase.google.com/docs/auth/web/start
