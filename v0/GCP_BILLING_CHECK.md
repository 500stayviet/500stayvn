# 구글 클라우드 결제 및 프로젝트 상태 확인 가이드

## 1. Firebase 프로젝트 상태 확인

### 현재 프로젝트 확인
```bash
cd backend/functions
firebase use
firebase projects:list
```

### 배포된 함수 확인
```bash
firebase functions:list
```

## 2. 구글 클라우드 콘솔에서 확인할 항목들

### A. 결제 계정 상태 확인
1. [Google Cloud Console - 결제](https://console.cloud.google.com/billing) 접속
2. 결제 계정 목록 확인
3. 각 결제 계정의 상태 확인:
   - ✅ 활성 (Active)
   - ⚠️ 일시 중지됨 (Suspended)
   - ❌ 종료됨 (Closed)

### B. 프로젝트 결제 연결 확인
1. [프로젝트 목록](https://console.cloud.google.com/cloud-resource-manager) 접속
2. `stayviet-26ae4` 프로젝트 선택
3. 좌측 메뉴에서 **"결제"** 클릭
4. 결제 계정 연결 상태 확인:
   - 연결됨: 결제 계정 이름 표시
   - 연결 안 됨: "결제 계정 없음" 표시

### C. 활성화된 API 확인
1. [API 및 서비스 > 사용 설정된 API](https://console.cloud.google.com/apis/dashboard) 접속
2. `stayviet-26ae4` 프로젝트 선택
3. 활성화된 API 목록 확인:
   - ✅ Cloud Functions API
   - ✅ Cloud Build API
   - ✅ Artifact Registry API
   - ✅ Maps JavaScript API (프론트엔드용)
   - ✅ Geocoding API (프론트엔드용)
   - ✅ Places API (프론트엔드용)

### D. 할당량 및 제한 확인
1. [할당량](https://console.cloud.google.com/apis/api/cloudfunctions.googleapis.com/quotas) 접속
2. 각 API의 할당량 사용량 확인
3. 제한에 도달했는지 확인

## 3. 일반적으로 폐쇄되는 항목들

### 결제 계정 폐쇄 시 영향
- ❌ 모든 유료 서비스 중단
- ❌ 무료 할당량 초과 시 서비스 중단
- ⚠️ Firebase Functions는 무료 할당량 내에서만 작동

### 프로젝트 삭제 시 영향
- ❌ 모든 리소스 삭제
- ❌ Firebase Functions 삭제
- ❌ 데이터베이스 삭제

### API 비활성화 시 영향
- ❌ 해당 API 사용 불가
- ⚠️ Firebase Functions는 Cloud Functions API 필요

## 4. 빠른 확인 방법

### Firebase CLI로 확인
```bash
# 프로젝트 정보 확인
firebase projects:list

# 함수 상태 확인
firebase functions:list

# 배포 테스트
firebase deploy --only functions --dry-run
```

### 브라우저에서 직접 확인
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. `stayviet-26ae4` 프로젝트 선택
3. 좌측 메뉴에서 **"Functions"** 클릭
4. 배포된 함수 목록 확인

## 5. 문제 해결

### 결제 계정이 폐쇄된 경우
1. [결제 계정 관리](https://console.cloud.google.com/billing) 접속
2. 새 결제 계정 생성 또는 기존 계정 복구
3. 프로젝트에 결제 계정 연결

### API가 비활성화된 경우
1. [API 라이브러리](https://console.cloud.google.com/apis/library) 접속
2. 필요한 API 검색
3. "사용 설정" 클릭

### 프로젝트가 삭제된 경우
1. [프로젝트 복구](https://console.cloud.google.com/cloud-resource-manager) 접속
2. 삭제된 프로젝트 복구 시도 (30일 이내만 가능)
3. 복구 불가 시 새 프로젝트 생성

## 6. 현재 상태 확인 스크립트

아래 명령어들을 순서대로 실행하여 현재 상태를 확인하세요:

```bash
# 1. Firebase 프로젝트 확인
cd backend/functions
firebase projects:list

# 2. 현재 프로젝트 확인
firebase use

# 3. 배포된 함수 확인
firebase functions:list

# 4. 함수 로그 확인 (최근 에러 확인)
firebase functions:log --limit 10
```

## 7. 결제 계정 복구 방법

1. [Google Cloud Console - 결제](https://console.cloud.google.com/billing) 접속
2. 폐쇄된 결제 계정 확인
3. "복구" 버튼 클릭 (가능한 경우)
4. 또는 새 결제 계정 생성 후 프로젝트에 연결

## 8. 무료 할당량 확인

Firebase Functions 무료 할당량:
- **호출**: 월 2백만 회
- **계산 시간**: 월 400,000 GB-초
- **네트워크 송신**: 월 5GB

할당량 초과 시 유료 결제 필요!
