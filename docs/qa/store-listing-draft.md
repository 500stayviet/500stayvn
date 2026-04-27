# 스토어 등록 문구 초안 (Play · App Store 공통 베이스)

**시장:** 베트남 숙박·여행 사용자 (한국·글로벌 게스트·호스트 병행).  
**앱/브랜드:** 500 STAY VN (웹 `manifest.json` 과 정합).  
**Phase 3 프로덕션 호스트 (AWS Amplify):** `main.dn98z8m9jfvd5.amplifyapp.com` — 커스텀 도메인 전까지 스토어·TWA·문서에서 이 호스트를 사용한다. 코드 단일 원본: `frontend/src/constants/production-host.ts`, `NEXT_PUBLIC_STAYVIET_PRODUCTION_HOST`.

### 운영자·지원 연락처 (실값, `frontend/src/constants/operator-contact.ts` 와 동일)

| 항목 | 내용 |
|------|------|
| 법적·운영 표기명 | KBrothers |
| 주소 | 2804, Topaz 2, Saigon Pearl, 92 Nguyen Huu Canh, Ward 22, Binh Thanh District, Ho Chi Minh City, 72300, Vietnam |
| 고객 지원·개인정보·계정 삭제 문의 | bek94900@gmail.com |

### 배포 URL (현재 Amplify 호스트와 동일)

| 용도 | URL |
|------|-----|
| 개인정보처리방침 | `https://main.dn98z8m9jfvd5.amplifyapp.com/privacy` |
| 이용약관 | `https://main.dn98z8m9jfvd5.amplifyapp.com/terms` |
| 계정 삭제 안내 | `https://main.dn98z8m9jfvd5.amplifyapp.com/delete-account` |
| 고객 지원 | **bek94900@gmail.com** — 스토어·앱 설명·`/delete-account`·`/privacy` 와 동일 유지(불일치 시 심사 리스크). |

`mobile/android-twa/gradle.properties` 의 `twaHostname` · Digital Asset Links 배포 호스트 · 위 URL은 **동일 호스트**를 유지한다. 호스트 메모: `frontend/public/.well-known/PENDING_DOMAIN.txt`.

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

스토어 **전체 설명**에 바로 붙여 넣을 수 있도록, 신뢰(베트남 부동산·숙박 시장 **5년 현장 실무**)와 투명한 요금·채팅까지 한 흐름으로 읽히게 구성했다. 법적 표현(임대 **정보 제공**, 중개 아님)은 유지한다.

### 한국어 (KO)

**한눈에 보는 신뢰**  
호치민·하노이를 비롯한 베트남 주요 도시에서 **부동산·임대·숙박 시장을 5년 넘게 현장에서 다뤄 온 팀**이 만든 500 STAY VN. 단기 여행만이 아니라 **주(7일) 단위**로 머무는 출장·원격 근무·가족 동반 체류까지, “현지 임대 시장이 어떻게 움직이는지”를 아는 사람들이 **검색·예약·소통**을 한곳에 모았습니다.

**왜 500 STAY VN인가요?**
- **현지 감각:** 지역별 시세·동선·체류 패턴을 이해한 기준으로 숙소 정보를 정리합니다. “지도상 예쁜 곳”이 아니라 **실제 거주·임대 맥락**을 염두에 둔 탐색을 지향합니다.
- **요금 투명성:** 체크인·체크아웃, 인원, 반려동물 등 **부가 요금을 예약 전에 화면에서 확인**할 수 있습니다. 깜짝 비용보다 **확인 가능한 조건**을 우선합니다.
- **호스트와 직접 소통:** 예약이 진행되면 **채팅으로 일정·세부 사항**을 맞출 수 있어, 장기 체류 준비에 유리합니다.

**게스트**
- 지도와 검색으로 원하는 지역의 숙소를 빠르게 찾아보세요.
- 조건에 맞는 매물을 고른 뒤, **투명한 요금 구조**를 확인하고 예약하세요.
- 확정 후에는 호스트와 메시지로 **입실·현지 안내**를 조율하세요.

**호스트**
- 보유한 숙소를 등록하고 예약·메시지를 관리할 수 있습니다(계정 유형에 따라 제공 기능이 다를 수 있음).
- **임대 정보 제공**에 맞는 범위에서 게스트와 소통할 수 있습니다.

**법적·운영 안내**  
500 STAY VN은 **임대 숙박 정보를 제공하는 플랫폼**이며, 부동산 중개 또는 중개행위를 목적으로 하지 않습니다. 일부 기능은 로그인, 본인 확인(KYC), 결제 수단 연동이 필요할 수 있습니다. 계정 삭제·개인정보·고객 지원은 앱 내 안내 및 웹 정책 페이지를 참고해 주세요.

**운영·문의:** KBrothers · bek94900@gmail.com · 상기 주소(개인정보처리방침 `https://main.dn98z8m9jfvd5.amplifyapp.com/privacy` 와 동일).

---

### English (EN)

**Trust at a glance**  
500 STAY VN is built by people with **over five years of hands-on experience** in Vietnam’s **real estate, rental, and stay market**—across HCMC, Hanoi, and beyond. We designed this app for travelers who plan **weekly stays** (7-day style blocks): business trips, remote work stretches, and family visits where clarity matters as much as comfort.

**Why choose 500 STAY VN?**
- **Local market sense:** We organize listings with an understanding of how neighborhoods, pricing, and stay patterns actually work—not just what looks good on a map.
- **Transparent pricing:** See check-in/out rules, guest counts, pet fees, and add-ons **before you commit**. We prioritize **knowable terms** over surprise charges.
- **Direct host chat:** After booking, message your host to align on arrival, access, and details—especially helpful for longer stays.

**For guests**
- Discover places with search and map, compare options, and book when the terms look right.
- Review transparent pricing (nights, fees, pets) **up front**.
- Chat with your host to coordinate check-in and on-the-ground details.

**For hosts**
- List your property and manage bookings and messages (features may vary by account type).
- Communicate with guests within the scope of a **rental information** platform.

**Legal & operations**  
500 STAY VN is a **platform that provides rental accommodation information**; it is **not** a real-estate brokerage or rental intermediary. Sign-in, identity verification (KYC), or payment setup may be required for some actions. For account deletion, privacy, and support, follow in-app links and our policy pages on the web.

**Operator & contact:** KBrothers · bek94900@gmail.com · address as on `https://main.dn98z8m9jfvd5.amplifyapp.com/privacy`.

---

### Tiếng Việt (VI)

**Uy tín trong tầm mắt**  
500 STAY VN được xây dựng bởi đội ngũ có **hơn 5 năm kinh nghiệm thực tế** tại thị trường **bất động sản, cho thuê và lưu trú** Việt Nam (TP.HCM, Hà Nội và các khu vực lân cận). Ứng dụng phục vụ khách cần **lưu trú theo tuần**—công tác, làm việc từ xa, hoặc đi cùng gia đình—nơi **sự rõ ràng** quan trọng như **chất lượng chỗ ở**.

**Vì sao chọn 500 STAY VN?**
- **Cảm nhận thị trường địa phương:** Thông tin được sắp xếp dựa trên hiểu biết thực tế về khu vực, giá và hành vi lưu trú—không chỉ “đẹp trên bản đồ”.
- **Giá minh bạch:** Quy định nhận/trả phòng, số khách, phí thú cưng và các khoản phụ **hiển thị trước khi đặt**, giúp hạn chế chi phí phát sinh ngoài ý muốn.
- **Trò chuyện trực tiếp với chủ nhà:** Sau khi đặt, nhắn tin để thống nhất giờ nhận phòng và chi tiết—đặc biệt hữu ích cho kỳ lưu trú dài hơn.

**Dành cho khách**
- Tìm chỗ ở bằng bản đồ và tìm kiếm, so sánh và đặt khi điều kiện phù hợp.
- Xem giá rõ ràng (đêm, phí, thú cưng) **trước khi xác nhận**.
- Nhắn tin với chủ nhà để phối hợp nhận phòng và chi tiết tại chỗ.

**Dành cho chủ nhà**
- Đăng tin và quản lý đặt phòng, tin nhắn (tính năng có thể khác tùy loại tài khoản).
- Giao tiếp với khách trong phạm vi **nền tảng cung cấp thông tin cho thuê lưu trú**.

**Pháp lý & vận hành**  
500 STAY VN là **nền tảng cung cấp thông tin cho thuê lưu trú**, **không** hoạt động như môi giới bất động sản hay trung gian cho thuê. Một số thao tác cần đăng nhập, xác minh danh tính (KYC) hoặc thiết lập thanh toán. Xóa tài khoản, quyền riêng tư và hỗ trợ: xem liên kết trong ứng dụng và trang chính sách trên web.

**Đơn vị vận hành & liên hệ:** KBrothers · bek94900@gmail.com · địa chỉ như trang `https://main.dn98z8m9jfvd5.amplifyapp.com/privacy`.

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
