import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 500 STAY VN",
  description:
    "500 STAY VN 임대 정보 제공 플랫폼의 개인정보 처리방침 (다국어 요약)",
};

/**
 * 스토어·cursorrules 정합: 개인정보 페이지 상시 URL.
 * 법무 최종 검토 전까지는 운영 초안이며, 수집 항목은 실제 서비스에 맞게 갱신한다.
 * 표현: '중개' 금지 — '임대 정보 제공 플랫폼' 관점 유지.
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] text-zinc-800">
      <div className="mx-auto max-w-2xl px-4 py-10 pb-16">
        <h1 className="text-2xl font-bold text-zinc-900">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-zinc-500">
          시행일(초안): 2026-04-27 · 서비스: 500 STAY VN
        </p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-base font-semibold text-zinc-900">1. 목적</h2>
          <p>
            본 방침은 <strong>임대 정보 제공 플랫폼</strong> 500 STAY VN(이하 &quot;서비스&quot;)이
            이용자 개인정보를 어떻게 취급하는지 설명합니다. 서비스는
            숙소 임대 당사자 간 <strong>정보 제공</strong>을 지원하며, 법령상 허용된 범위에서만
            개인정보를 처리합니다.
          </p>

          <h2 className="text-base font-semibold text-zinc-900">2. 수집·이용 (예시)</h2>
          <p>
            회원가입, 예약, 본인 확인(KYC), 고객 지원, 결제·정산 연동 과정에서 이름, 연락처,
            이메일, 계정 식별자, 거래·예약 관련 정보 등이 처리될 수 있습니다. 실제 항목은
            회원가입 화면 및 관련 동의 절차에 고지된 내용을 따릅니다.
          </p>

          <h2 className="text-base font-semibold text-zinc-900">3. 보관·파기</h2>
          <p>
            관련 법령 및 내부 정책에 따라 보관 기간을 정하고, 목적 달성 후 지체 없이 파기합니다.
          </p>

          <h2 className="text-base font-semibold text-zinc-900">4. 제3자·처리위탁</h2>
          <p>
            호스팅, 인증, 지도, 결제(PG), 분석·오류 수집(Sentry 등) 등 운영에 필요한 범위에서
            국내외 수탁사를 둘 수 있으며, 계약·관리 절차를 준수합니다.
          </p>

          <h2 className="text-base font-semibold text-zinc-900">5. 이용자 권리</h2>
          <p>
            개인정보 열람·정정·삭제·처리정지 요청은 고객 지원 채널을 통해 접수할 수 있습니다.
            계정 삭제 절차는{" "}
            <Link href="/delete-account" className="text-red-600 underline underline-offset-2">
              계정 삭제 안내
            </Link>
            를 참고하세요.
          </p>

          <h2 className="text-base font-semibold text-zinc-900">6. 문의</h2>
          <p>
            개인정보 보호 관련 문의: 운영팀 이메일(가입·삭제 안내와 동일 채널을 사용할 수
            있습니다).
          </p>
        </section>

        <hr className="my-10 border-zinc-200" />

        <section className="space-y-6 text-sm leading-relaxed text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900">English (summary)</h2>
          <p>
            500 STAY VN is an <strong>accommodation listing platform</strong> (not a brokerage).
            This policy describes how we process personal data for account, booking, KYC, payments,
            and support. Contact us for access, correction, deletion, or restrictions. Account
            deletion: see the{" "}
            <Link href="/delete-account" className="text-red-600 underline underline-offset-2">
              delete account
            </Link>{" "}
            page.
          </p>

          <h2 className="text-base font-semibold text-zinc-900">Tiếng Việt (tóm tắt)</h2>
          <p>
            500 STAY VN là <strong>nền tảng cung cấp thông tin cho thuê lưu trú</strong>. Chúng tôi
            xử lý dữ liệu cá nhân trong phạm vi tài khoản, đặt phòng, KYC, thanh toán và hỗ trợ.
            Quý khách có thể liên hệ để thực hiện quyền theo luật. Xóa tài khoản: xem trang{" "}
            <Link href="/delete-account" className="text-red-600 underline underline-offset-2">
              hướng dẫn xóa tài khoản
            </Link>
            .
          </p>

          <h2 className="text-base font-semibold text-zinc-900">日本語（概要）</h2>
          <p>
            500 STAY VN は<strong>宿泊の賃貸情報提供プラットフォーム</strong>
            です。アカウント、予約、本人確認、決済、サポートの範囲で個人データを処理します。開示・訂正・削除等はサポートへご連絡ください。アカウント削除は
            <Link href="/delete-account" className="text-red-600 underline underline-offset-2">
              削除手順
            </Link>
            をご覧ください。
          </p>

          <h2 className="text-base font-semibold text-zinc-900">中文（摘要）</h2>
          <p>
            500 STAY VN 是<strong>住宿租赁信息平台</strong>
            。我们会在账户、预订、身份验证、支付与客户支持所需范围内处理个人信息。如需行使权利请联系支持。删除账户请参见
            <Link href="/delete-account" className="text-red-600 underline underline-offset-2">
              账户删除说明
            </Link>
            。
          </p>
        </section>

        <p className="mt-10 text-center text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-600">
            홈으로
          </Link>
        </p>
      </div>
    </div>
  );
}
