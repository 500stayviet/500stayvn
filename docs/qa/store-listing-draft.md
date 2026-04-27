# 스토어 등록 문구 초안 (Play · App Store 공통 베이스)

**시장:** 베트남 숙박·여행 사용자 (한국·글로벌 게스트·호스트 병행).  
**앱/브랜드:** 500 STAY VN (웹 `manifest.json` 과 정합).  
**주의:** 법인명·지원 URL·개인정보처리방침 링크는 출시 전 실제 값으로 치환한다.

### 배포 URL 템플릿 (`twaHostname` / Amplify 커스텀 도메인과 동일 호스트)

| 용도 | URL 패턴 |
|------|-----------|
| 개인정보처리방침 | `https://<PROD_HOST>/privacy` |
| 계정 삭제 안내 | `https://<PROD_HOST>/delete-account` |
| 고객 지원 | 스토어·앱 설명에 기재하는 이메일/티켓은 **`/delete-account` 페이지 안내와 동일**하게 유지(불일치 시 심사 리스크). |

`<PROD_HOST>` 는 `mobile/android-twa/gradle.properties` 의 `twaHostname` 과 **같은 호스트**를 쓰는 것이 Asset Links·TWA에 유리하다.

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

500 STAY VN은 베트남 숙박을 **주(7일) 단위**로 계획하는 여행자와 호스트를 연결하는 플랫폼입니다.

**게스트**
- 지도와 검색으로 원하는 지역의 숙소를 빠르게 찾아보세요.
- 체크인·체크아웃·인원·반려동물 요금 등 요금 내역을 투명하게 확인한 뒤 예약할 수 있습니다.
- 예약 확정 후 호스트와 채팅으로 일정을 조율하세요.

**호스트**
- 내 숙소를 등록하고 예약·메시지를 관리할 수 있습니다(계정 유형에 따라 제공 기능이 다를 수 있음).

**안내**
- 일부 기능은 로그인, 본인 확인(KYC), 결제 수단 연동이 필요할 수 있습니다.
- 계정 삭제 및 고객 지원은 앱 내 안내·웹 정책 페이지를 참고해 주세요.

---

### English (EN)

500 STAY VN connects travelers and hosts for **weekly-stay** accommodation across Vietnam.

**For guests**
- Discover places with search and map, see transparent pricing (nights, fees, pets), and book your stay.
- After booking, chat with your host to align on check-in and details.

**For hosts**
- List your property and manage bookings and messages (features may vary by account type).

**Note**
- Sign-in, identity verification (KYC), or payment setup may be required for some actions.
- Account deletion and support: follow in-app links and our policy pages on the web.

---

### Tiếng Việt (VI)

500 STAY VN là nền tảng kết nối khách du lịch và chủ nhà cho **lưu trú theo tuần** tại Việt Nam.

**Dành cho khách**
- Tìm chỗ ở bằng bản đồ và tìm kiếm, xem giá rõ ràng (đêm, phí, thú cưng), rồi đặt phòng.
- Sau khi đặt, trò chuyện với chủ nhà để thống nhất nhận phòng và chi tiết.

**Dành cho chủ nhà**
- Đăng tin và quản lý đặt phòng, tin nhắn (tính năng có thể khác tùy loại tài khoản).

**Lưu ý**
- Một số thao tác cần đăng nhập, xác minh danh tính (KYC) hoặc thiết lập thanh toán.
- Xóa tài khoản và hỗ trợ: xem liên kết trong ứng dụng và trang chính sách trên web.

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
| 고객 지원 | 이메일 또는 티켓 URL — **앱 내 삭제 안내와 동일 연락처 권장** |
| 계정 삭제 | `/delete-account` 와 동일 절차를 스토어 전체 설명·데이터 안전 섹션에 명시 |

---

## 관련 문서

- `docs/qa/phase3-mobile-app-readiness.md`
- `frontend/public/manifest.json`
