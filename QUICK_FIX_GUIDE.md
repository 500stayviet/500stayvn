# 🚨 구글 클라우드 결제 문제 빠른 해결 가이드

## 현재 상태
- ❌ Firebase Functions가 403 Forbidden 오류 발생
- ⚠️ 결제 계정이 폐쇄되었거나 연결이 끊어진 것으로 보입니다

## 즉시 확인해야 할 항목들

### 1️⃣ 결제 계정 상태 확인 (가장 중요!)

**직접 확인 링크:**
👉 https://console.cloud.google.com/billing?project=stayviet-26ae4

**확인 사항:**
- [ ] 결제 계정이 "활성" 상태인가?
- [ ] 결제 계정이 "일시 중지됨" 또는 "종료됨" 상태인가?
- [ ] 프로젝트에 결제 계정이 연결되어 있는가?

**문제 발견 시:**
1. 결제 계정이 폐쇄된 경우 → 새 결제 계정 생성 또는 복구
2. 결제 계정이 연결 안 된 경우 → 프로젝트에 결제 계정 연결

---

### 2️⃣ 프로젝트 결제 연결 확인

**직접 확인 링크:**
👉 https://console.cloud.google.com/cloud-resource-manager?project=stayviet-26ae4

**확인 사항:**
- [ ] 프로젝트가 삭제되지 않았는가?
- [ ] 프로젝트 상태가 "활성"인가?
- [ ] 프로젝트에 결제 계정이 연결되어 있는가?

**문제 발견 시:**
1. 프로젝트 선택 → 좌측 메뉴 "결제" 클릭
2. "결제 계정 연결" 버튼 클릭
3. 활성 결제 계정 선택

---

### 3️⃣ 필수 API 활성화 확인

**직접 확인 링크:**
👉 https://console.cloud.google.com/apis/dashboard?project=stayviet-26ae4

**확인해야 할 API들:**
- [ ] ✅ Cloud Functions API (`cloudfunctions.googleapis.com`)
- [ ] ✅ Cloud Build API (`cloudbuild.googleapis.com`)
- [ ] ✅ Artifact Registry API (`artifactregistry.googleapis.com`)

**API가 비활성화된 경우:**
1. [API 라이브러리](https://console.cloud.google.com/apis/library) 접속
2. 비활성화된 API 검색
3. "사용 설정" 클릭

---

### 4️⃣ Firebase Functions 상태 확인

**직접 확인 링크:**
👉 https://console.firebase.google.com/project/stayviet-26ae4/functions

**확인 사항:**
- [ ] 함수들이 배포되어 있는가?
- [ ] 함수 로그에 에러가 있는가?
- [ ] 함수 호출이 차단되고 있는가?

---

## 🔧 빠른 해결 방법

### 방법 1: 결제 계정 복구/재연결

1. **결제 계정 확인**
   ```
   https://console.cloud.google.com/billing
   ```

2. **폐쇄된 결제 계정이 있다면:**
   - 복구 가능한지 확인 (30일 이내)
   - 복구 불가 시 새 결제 계정 생성

3. **프로젝트에 결제 계정 연결**
   ```
   https://console.cloud.google.com/billing/linked?project=stayviet-26ae4
   ```

### 방법 2: 무료 할당량 내에서 사용

Firebase Functions는 **무료 할당량**이 있습니다:
- 월 2백만 회 호출 무료
- 월 400,000 GB-초 계산 시간 무료
- 월 5GB 네트워크 송신 무료

**무료 할당량만 사용하려면:**
1. 결제 계정 연결을 제거하지 말고 유지
2. 무료 할당량 내에서만 사용
3. 할당량 초과 시 자동으로 유료 전환 (이 경우 결제 필요)

### 방법 3: 새 프로젝트 생성 (최후의 수단)

기존 프로젝트 복구가 불가능한 경우:
1. 새 Firebase 프로젝트 생성
2. 새 프로젝트에 함수 재배포
3. 프론트엔드 URL 업데이트

---

## 📋 확인 체크리스트

다음 항목들을 순서대로 확인하세요:

- [ ] 1. 결제 계정 상태 확인
- [ ] 2. 프로젝트 결제 연결 확인
- [ ] 3. 필수 API 활성화 확인
- [ ] 4. Firebase Functions 로그 확인
- [ ] 5. 함수 재배포 시도

---

## 🆘 문제가 해결되지 않으면

1. **Firebase 지원팀에 문의**
   - https://firebase.google.com/support

2. **Google Cloud 지원팀에 문의**
   - https://cloud.google.com/support

3. **에러 로그 확인**
   ```bash
   cd backend/functions
   firebase functions:log
   ```

---

## 💡 예방 방법

앞으로 이런 문제를 방지하려면:

1. ✅ 결제 계정을 삭제하지 않기
2. ✅ 무료 할당량 모니터링
3. ✅ 예산 알림 설정
4. ✅ 정기적으로 프로젝트 상태 확인

---

## 📞 빠른 링크 모음

- **결제 계정**: https://console.cloud.google.com/billing
- **프로젝트 설정**: https://console.cloud.google.com/cloud-resource-manager
- **API 대시보드**: https://console.cloud.google.com/apis/dashboard
- **Firebase 콘솔**: https://console.firebase.google.com/project/stayviet-26ae4
- **함수 로그**: https://console.firebase.google.com/project/stayviet-26ae4/functions/logs
