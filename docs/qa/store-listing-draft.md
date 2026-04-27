# 스토어 등록 문구 초안 (Play · App Store 공통 베이스)

**시장:** 베트남 숙박·여행 사용자 (한국·글로벌 게스트·호스트 병행).  
**앱/브랜드:** 500 STAY VN (웹 `manifest.json` 과 정합).  
**주의:** 프로덕션 호스트(`<PROD_HOST>`)만 배포 시 확정하면 되며, 아래 운영자·지원 연락처는 실값으로 반영됨.

### 운영자·지원 연락처 (실값, `frontend/src/constants/operator-contact.ts` 와 동일)

| 항목 | 내용 |
|------|------|
| 법적·운영 표기명 | KBrothers |
| 주소 | 2804, Topaz 2, Saigon Pearl, 92 Nguyen Huu Canh, Ward 22, Binh Thanh District, Ho Chi Minh City, 72300, Vietnam |
| 고객 지원·개인정보·계정 삭제 문의 | bek94900@gmail.com |

### 배포 URL 템플릿 (`twaHostname` / Amplify 커스텀 도메인과 동일 호스트)

| 용도 | URL 패턴 |
|------|-----------|
| 개인정보처리방침 | `https://<PROD_HOST>/privacy` |
| 계정 삭제 안내 | `https://<PROD_HOST>/delete-account` |
| 고객 지원 | **bek94900@gmail.com** — 스토어·앱 설명·`/delete-account`·`/privacy` 와 동일 유지(불일치 시 심사 리스크). |

`<PROD_HOST>` 는 `mobile/android-twa/gradle.properties` 의 `twaHostname` 과 **같은 호스트**를 쓰는 것이 Asset Links·TWA에 유리하다.

**Android 패키지 ID (TWA):** 스토어·`assetlinks.json` 기준 **`com.stay500vn.app`** (`com.500stayvn.app` 은 세그먼트가 숫자로 시작해 Play/Java 규칙상 불가 — `stay500vn` 으로 치환).

---

## 홍보·신뢰 카피 초안 (베트남 부동산 5년 현장 경험 톤)

스토어 **프로모 텍스트·긴 설명 상단·웹 히어로** 등에 쓸 수 있는 짧은 신뢰 문구. (법적 검토·현지 정서 컨펌은 운영 확정 후 반영.)

| 언어 | 한 줄 (신뢰) | 보조 한 줄 (투명성) |
|------|----------------|---------------------|
| **KO** | 호치민·하노이 등 **5년 현지 부동산·숙박 시장**을 아는 팀이 만든 주 단위 숙소 플랫폼입니다. | **임대 정보 제공**에 집중하며, 요금·일정은 예약 전에 화면에서 확인할 수 있습니다. |
| **VI** | Đội ngũ **5 năm kinh nghiệm** thị trường bất động sản và lưu trú tại Việt Nam (TP.HCM, Hà Nội…). | **Cung cấp thông tin cho thuê** minh bạch — xem giá và lịch trước khi đặt. |
| **EN** | Built by people with **five years on the ground** in Vietnam’s rental and stay market (HCMC, Hanoi, and beyond). | We focus on **clear rental-stay information** — see pricing and dates before you book. |

**스토어 짧은 설명에 넣기 좋은 변형 (80자 근처):**

- **KO:** 베트남 현지 5년 경험 팀의 주 단위 숙소 검색·예약. 요금 투명, 호스트와 채팅까지.
- **VI:** Nền tảng lưu trú theo tuần từ đội ngũ 5 năm kinh nghiệm tại VN. Giá rõ ràng, chat với chủ nhà.
- **EN:** Weekly stays in Vietnam from a team with 5 years’ local rental experience. Clear pricing, host chat.

---

## 앱 이름 (최대 길이: 스토어별 제한 준수, 보통 30자 내외)

| 언어 | 제안 |
|------|------|
| **한국어** | 500 STAY VN — 베트남 숙소 예약 |
| **English** | 500 STAY VN — Vietnam Stays |
| **Tiếng Việt** | 500 STAY VN — Đặt phòng Việt Nam |

*(스토어에 “짧은 이름”만 허용되면 **500 STAY VN** 으로 통일하고, 부제는 프로모 텍스트/설명에 넣는다.)*

---

## 짧은 설명 (Short description, ~80자)

| 언어 | 초안 |
|------|------|
| **KO** | 베트남 숙소를 주 단위로 검색·예약하고, 호스트와 채팅까지 한 앱에서. |
| **EN** | Search weekly stays in Vietnam, book securely, and chat with hosts in one app. |
| **VI** | Tìm và đặt chỗ ở Việt Nam theo tuần, thanh toán và trò chuyện với chủ nhà. |

---

## 긴 설명 (Full description)

### 한국어 (KO)

500 STAY VN은 베트남 숙박을 **주(7일) 단위**로 계획하는 여행자와 호스트를 연결하는 **임대 정보 제공 플랫폼**입니다(중개·중개행위 아님).

**게스트**
- 지도와 검색으로 원하는 지역의 숙소를 빠르게 찾아보세요.
- 체크인·체크아웃·인원·반려동물 요금 등 요금 내역을 투명하게 확인한 뒤 예약할 수 있습니다.
- 예약 확정 후 호스트와 채팅으로 일정을 조율하세요.

**호스트**
- 내 숙소를 등록하고 예약·메시지를 관리할 수 있습니다(계정 유형에 따라 제공 기능이 다를 수 있음).

**안내**
- 일부 기능은 로그인, 본인 확인(KYC), 결제 수단 연동이 필요할 수 있습니다.
- 계정 삭제 및 고객 지원은 앱 내 안내·웹 정책 페이지를 참고해 주세요.
- **운영·문의:** KBrothers · bek94900@gmail.com · 상기 주소(개인정보처리방침 `/privacy` 동일).

---

### English (EN)

500 STAY VN connects travelers and hosts for **weekly-stay** accommodation across Vietnam — a **platform that provides rental accommodation information**, not a brokerage or rental intermediary.

**For guests**
- Discover places with search and map, see transparent pricing (nights, fees, pets), and book your stay.
- After booking, chat with your host to align on check-in and details.

**For hosts**
- List your property and manage bookings and messages (features may vary by account type).

**Note**
- Sign-in, identity verification (KYC), or payment setup may be required for some actions.
- Account deletion and support: follow in-app links and our policy pages on the web.
- **Operator & contact:** KBrothers · bek94900@gmail.com · address as on `/privacy`.

---

### Tiếng Việt (VI)

500 STAY VN là nền tảng kết nối khách du lịch và chủ nhà cho **lưu trú theo tuần** tại Việt Nam — **nền tảng cung cấp thông tin cho thuê lưu trú**, không phải môi giới.

**Dành cho khách**
- Tìm chỗ ở bằng bản đồ và tìm kiếm, xem giá rõ ràng (đêm, phí, thú cưng), rồi đặt phòng.
- Sau khi đặt, trò chuyện với chủ nhà để thống nhất nhận phòng và chi tiết.

**Dành cho chủ nhà**
- Đăng tin và quản lý đặt phòng, tin nhắn (tính năng có thể khác tùy loại tài khoản).

**Lưu ý**
- Một số thao tác cần đăng nhập, xác minh danh tính (KYC) hoặc thiết lập thanh toán.
- Xóa tài khoản và hỗ trợ: xem liên kết trong ứng dụng và trang chính sách trên web.
- **Đơn vị vận hành & liên hệ:** KBrothers · bek94900@gmail.com · địa chỉ như trang `/privacy`.

---

## 키워드·프로모 (선택)

- **KO:** 베트남 숙소, 주단위 숙박, 다낭, 호치민, 하노이, 단기 임대  
- **EN:** Vietnam stay, weekly rental, Da Nang, HCMC, Hanoi, vacation rental  
- **VI:** đặt phòng Việt Nam, lưu trú theo tuần, Đà Nẵng, TP.HCM, Hà Nội  

---

## 스토어 정책용 URL (출시 전 필수)

| 항목 | 비고 |
|------|------|
| 개인정보처리방침 | 위 **배포 URL 템플릿** 의 `/privacy` |
| 고객 지원 | **bek94900@gmail.com** — 앱 내 삭제 안내·`/privacy` 와 동일 |
| 계정 삭제 | `/delete-account` 와 동일 절차를 스토어 전체 설명·데이터 안전 섹션에 명시 |

---

## 관련 문서

- `docs/qa/phase3-mobile-app-readiness.md`
- `frontend/public/manifest.json`
