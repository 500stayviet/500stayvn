/**
 * 약관·개인정보 본문 — locale별 원문 (getUIText와 별도: 법무 문장 길이·구조 유지).
 * 플레이스홀더: {{operator}} = OPERATOR_LEGAL_NAME
 */
import type { SupportedLanguage } from "@/lib/api/translation";

export type LegalSection = { heading: string; paragraphs: string[] };

/** 7번째 섹션(문의): 개인정보 링크 전후 분리 */
export type TermsSection7 = {
  beforePrivacy: string;
  privacyLinkLabel: string;
  afterPrivacy: string;
};

export type TermsPageCopy = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  effectiveLine: string;
  sections1to6: LegalSection[];
  section7Heading: string;
  section7: TermsSection7;
  listOperatorLabel: string;
  listAddressLabel: string;
  listEmailLabel: string;
  homeLink: string;
};

export type PrivacySection5 = {
  beforeDelete: string;
  deleteLinkLabel: string;
  afterDelete: string;
};

export type PrivacyPageCopy = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  effectiveLine: string;
  sections1to4: LegalSection[];
  section5Heading: string;
  section5: PrivacySection5;
  section6Heading: string;
  section6Intro: string;
  listOperatorLabel: string;
  listAddressLabel: string;
  listEmailLabel: string;
  homeLink: string;
};

const TERMS_KO: TermsPageCopy = {
  metaTitle: "이용약관 | 500 STAY VN",
  metaDescription:
    "500 STAY VN 임대 정보 제공 플랫폼 이용약관. 게스트·호스트 연결을 위한 정보·도구 제공, 비당사자 지위.",
  title: "이용약관",
  effectiveLine: "시행일(초안): 2026-04-27 · 서비스: 500 STAY VN · 운영: {{operator}}",
  sections1to6: [
    {
      heading: "1. 목적 및 적용",
      paragraphs: [
        '본 약관은 임대 정보 제공 플랫폼 500 STAY VN(운영: {{operator}}, 이하 "서비스")의 이용 조건과 절차, 이용자와 운영자 간 권리·의무를 정합니다. 서비스를 이용함으로써 이용자는 본 약관에 동의한 것으로 봅니다.',
      ],
    },
    {
      heading: "2. 서비스의 성격 및 법적 지위",
      paragraphs: [
        "서비스는 게스트와 호스트(임대 제공자) 간 숙박·단기 임대 등과 관련된 정보·소통·예약 도구를 제공하는 임대 정보 제공 플랫폼입니다. 운영자({{operator}})는 이용자 상호 간 직접적인 임대차·임대·사용 계약의 당사자가 아니며, 그 체결·이행·해지·분쟁에 대하여 임대인·임차인 등 계약 당사자로서의 지위를 가지지 않습니다. 예약·결제가 서비스를 통해 이루어지는 경우에도 실질적인 계약 관계는 원칙적으로 이용자 상호 간에 성립합니다.",
      ],
    },
    {
      heading: "3. 계정 및 이용",
      paragraphs: [
        "이용자는 정확한 정보로 계정을 등록하고, 계정 보안을 유지할 책임이 있습니다. 일부 기능(호스트 기능, 결제 등)은 본인 확인(KYC) 또는 추가 설정이 필요할 수 있습니다.",
      ],
    },
    {
      heading: "4. 이용자 의무",
      paragraphs: [
        "이용자는 관련 법령·본 약관·운영 정책을 준수하고, 허위 정보·부정 이용·타인 권리 침해를 하지 않아야 합니다. 매물·예약·채팅 등에서 분쟁이 발생한 경우 우선 당사자 간 협의가 원칙입니다.",
      ],
    },
    {
      heading: "5. 면책 및 책임의 한계",
      paragraphs: [
        "운영자는 법령상 허용되는 범위에서, 서비스가 임대 정보 제공 플랫폼이며 이용자 간 계약·거래·분쟁의 직접적인 당사자가 아님을 전제로 그 결과에 대한 책임을 부담하지 않습니다. 다만 운영자의 고의 또는 중대한 과실이 있는 경우에는 관련 법령에 따릅니다.",
      ],
    },
    {
      heading: "6. 약관 변경",
      paragraphs: [
        "운영자는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 서비스 내 공지 등 합리적인 방법으로 안내합니다.",
      ],
    },
  ],
  section7Heading: "7. 문의 및 준거",
  section7: {
    beforePrivacy: "본 약관과 서비스 이용과 관련한 문의는 아래 연락처로 접수할 수 있습니다. 개인정보 처리에 관한 사항은 ",
    privacyLinkLabel: "개인정보처리방침",
    afterPrivacy: "을 참고하세요.",
  },
  listOperatorLabel: "운영 주체",
  listAddressLabel: "주소",
  listEmailLabel: "이메일",
  homeLink: "홈으로",
};

const TERMS_EN: TermsPageCopy = {
  metaTitle: "Terms of Service | 500 STAY VN",
  metaDescription:
    "Terms for 500 STAY VN, a rental information platform providing tools for guests and hosts. We are not a party to rental agreements between users.",
  title: "Terms of Service",
  effectiveLine: "Effective (draft): 2026-04-27 · Service: 500 STAY VN · Operator: {{operator}}",
  sections1to6: [
    {
      heading: "1. Purpose and scope",
      paragraphs: [
        'These Terms govern use of 500 STAY VN (operated by {{operator}}, the "Service"), including conditions, procedures, and rights and obligations between users and the operator. By using the Service you agree to these Terms.',
      ],
    },
    {
      heading: "2. Nature of the Service and legal status",
      paragraphs: [
        "The Service is a rental information platform that provides information, communication, and booking tools related to lodging and short-term rental between guests and hosts. The operator ({{operator}}) is not a party to any lease, tenancy, or rental agreement between users and does not act as landlord or tenant. Even when bookings or payments go through the Service, substantive contractual relationships are principally between users.",
      ],
    },
    {
      heading: "3. Accounts and use",
      paragraphs: [
        "Users must register with accurate information and keep their accounts secure. Some features (host features, payments, etc.) may require identity verification (KYC) or additional setup.",
      ],
    },
    {
      heading: "4. User obligations",
      paragraphs: [
        "Users must comply with applicable laws, these Terms, and policies. They must not provide false information, misuse the Service, or infringe others' rights. Disputes over listings, bookings, or chat should first be resolved between the parties.",
      ],
    },
    {
      heading: "5. Disclaimer and limitation of liability",
      paragraphs: [
        "To the extent permitted by law, the operator is not liable for outcomes of contracts, transactions, or disputes between users, given that the Service is a rental information platform and not a direct party to user-to-user agreements. Exceptions apply where required by law for intent or gross negligence.",
      ],
    },
    {
      heading: "6. Changes to the Terms",
      paragraphs: [
        "The operator may amend these Terms without violating applicable law and will provide reasonable notice (e.g. in the Service).",
      ],
    },
  ],
  section7Heading: "7. Contact and governing matters",
  section7: {
    beforePrivacy: "For questions about these Terms or the Service, use the contacts below. For personal data, see our ",
    privacyLinkLabel: "Privacy Policy",
    afterPrivacy: ".",
  },
  listOperatorLabel: "Operator",
  listAddressLabel: "Address",
  listEmailLabel: "Email",
  homeLink: "Home",
};

const TERMS_VI: TermsPageCopy = {
  metaTitle: "Điều khoản sử dụng | 500 STAY VN",
  metaDescription:
    "Điều khoản 500 STAY VN — nền tảng cung cấp thông tin cho thuê lưu trú. Chúng tôi không phải bên trong hợp đồng giữa người dùng.",
  title: "Điều khoản sử dụng",
  effectiveLine: "Hiệu lực (bản nháp): 2026-04-27 · Dịch vụ: 500 STAY VN · Đơn vị vận hành: {{operator}}",
  sections1to6: [
    {
      heading: "1. Mục đích và phạm vi",
      paragraphs: [
        'Điều khoản này quy định điều kiện sử dụng 500 STAY VN (do {{operator}} vận hành, gọi là "Dịch vụ"), quy trình và quyền/nghĩa vụ giữa người dùng và đơn vị vận hành. Khi sử dụng Dịch vụ, bạn đồng ý với điều khoản này.',
      ],
    },
    {
      heading: "2. Bản chất Dịch vụ và tư cách pháp lý",
      paragraphs: [
        "Dịch vụ là nền tảng cung cấp thông tin cho thuê lưu trú, cung cấp thông tin, công cụ giao tiếp và đặt chỗ giữa khách và chủ nhà. Đơn vị vận hành ({{operator}}) không phải bên trong hợp đồng thuê, cho thuê hoặc sử dụng giữa người dùng và không đóng vai trò cho thuê/chủ thuê. Ngay khi đặt phòng hoặc thanh toán qua Dịch vụ, quan hệ hợp đồng thực chất chủ yếu là giữa người dùng với nhau.",
      ],
    },
    {
      heading: "3. Tài khoản và sử dụng",
      paragraphs: [
        "Người dùng phải đăng ký thông tin chính xác và bảo mật tài khoản. Một số tính năng (chủ nhà, thanh toán…) có thể cần xác minh danh tính (KYC) hoặc thiết lập bổ sung.",
      ],
    },
    {
      heading: "4. Nghĩa vụ người dùng",
      paragraphs: [
        "Người dùng tuân thủ pháp luật, điều khoản và chính sách; không cung cấp thông tin sai, lạm dụng hoặc xâm phạm quyền người khác. Tranh chấp về tin đăng, đặt phòng hoặc chat nên được các bên tự thương lượng trước.",
      ],
    },
    {
      heading: "5. Miễn trừ và giới hạn trách nhiệm",
      paragraphs: [
        "Trong phạm vi pháp luật cho phép, đơn vị vận hành không chịu trách nhiệm đối với kết quả hợp đồng, giao dịch hoặc tranh chấp giữa người dùng, vì Dịch vụ chỉ là nền tảng thông tin cho thuê và không phải bên trực tiếp. Trường hợp cố ý hoặc lỗi nghiêm trọng tuân theo pháp luật.",
      ],
    },
    {
      heading: "6. Thay đổi điều khoản",
      paragraphs: [
        "Đơn vị vận hành có thể sửa đổi điều khoản trong phạm vi pháp luật và thông báo hợp lý (ví dụ trong Dịch vụ).",
      ],
    },
  ],
  section7Heading: "7. Liên hệ và áp dụng",
  section7: {
    beforePrivacy: "Mọi thắc mắc về điều khoản hoặc Dịch vụ, vui lòng liên hệ bên dưới. Về dữ liệu cá nhân, xem ",
    privacyLinkLabel: "Chính sách bảo mật",
    afterPrivacy: ".",
  },
  listOperatorLabel: "Đơn vị vận hành",
  listAddressLabel: "Địa chỉ",
  listEmailLabel: "Email",
  homeLink: "Trang chủ",
};

const TERMS_JA: TermsPageCopy = {
  metaTitle: "利用規約 | 500 STAY VN",
  metaDescription:
    "500 STAY VN の利用規約。宿泊に関する賃貸情報とツールを提供するプラットフォーム。利用者間の契約の当事者ではありません。",
  title: "利用規約",
  effectiveLine: "施行日（草案）: 2026-04-27 · サービス: 500 STAY VN · 運営: {{operator}}",
  sections1to6: [
    {
      heading: "1. 目的および適用",
      paragraphs: [
        "本規約は、500 STAY VN（運営: {{operator}}、以下「本サービス」）の利用条件・手続き、利用者と運営者の権利義務を定めます。本サービスを利用することにより、利用者は本規約に同意したものとみなします。",
      ],
    },
    {
      heading: "2. サービスの性質と法的地位",
      paragraphs: [
        "本サービスは、ゲストとホスト（賃貸提供者）の間で宿泊・短期賃貸等に関する情報・連絡・予約の手段を提供する賃貸情報提供プラットフォームです。運営者（{{operator}}）は、利用者相互間の賃貸借・賃貸・使用に関する契約の当事者ではなく、その締結・履行・解除・紛争について賃貸人・賃借人等の契約当事者としての地位を有しません。予約・決済が本サービスを通じて行われる場合でも、実質的な契約関係は原則として利用者相互間に成立します。",
      ],
    },
    {
      heading: "3. アカウントおよび利用",
      paragraphs: [
        "利用者は正確な情報で登録し、アカウントのセキュリティを維持する責任を負います。一部機能（ホスト機能、決済等）には本人確認（KYC）や追加設定が必要な場合があります。",
      ],
    },
    {
      heading: "4. 利用者の義務",
      paragraphs: [
        "利用者は関連法令、本規約および運営方針を遵守し、虚偽情報、不正利用、他人の権利侵害をしてはなりません。物件・予約・チャット等で紛争が生じた場合、当事者間の協議が原則です。",
      ],
    },
    {
      heading: "5. 免責および責任の限界",
      paragraphs: [
        "運営者は、法令が許す範囲で、本サービスが賃貸情報提供プラットフォームであり利用者間の契約・取引・紛争の直接当事者ではないことを前提として、その結果について責任を負いません。ただし運営者に故意または重過失がある場合は関連法令に従います。",
      ],
    },
    {
      heading: "6. 規約の変更",
      paragraphs: [
        "運営者は関連法令に反しない範囲で本規約を変更でき、変更時は本サービス内の告知など合理的な方法で周知します。",
      ],
    },
  ],
  section7Heading: "7. お問い合わせ・準拠",
  section7: {
    beforePrivacy: "本規約および本サービスに関するお問い合わせは下記まで。個人情報の取扱いは",
    privacyLinkLabel: "プライバシーポリシー",
    afterPrivacy: "をご覧ください。",
  },
  listOperatorLabel: "運営者",
  listAddressLabel: "所在地",
  listEmailLabel: "メール",
  homeLink: "ホームへ",
};

const TERMS_ZH: TermsPageCopy = {
  metaTitle: "服务条款 | 500 STAY VN",
  metaDescription:
    "500 STAY VN 服务条款。住宿租赁信息服务平台，为用户提供信息与预订工具。我们不是用户之间租赁合同的当事人。",
  title: "服务条款",
  effectiveLine: "生效日期（草案）: 2026-04-27 · 服务: 500 STAY VN · 运营主体: {{operator}}",
  sections1to6: [
    {
      heading: "1. 目的与适用范围",
      paragraphs: [
        '本条款适用于由 {{operator}} 运营的 500 STAY VN（以下简称"本服务"）的使用条件与程序，以及用户与运营者之间的权利义务。使用本服务即表示您同意本条款。',
      ],
    },
    {
      heading: "2. 服务性质与法律地位",
      paragraphs: [
        "本服务是提供住宿与短期租赁相关信息的平台，为房客与房东（出租方）提供信息、沟通与预订工具。运营者（{{operator}}）不是用户之间任何租赁、租用或使用合同的当事人，也不以出租人或承租人身份就该等合同的订立、履行、解除或争议承担责任。即使通过本服务进行预订或支付，实质合同关系原则上仍由用户相互之间成立。",
      ],
    },
    {
      heading: "3. 账户与使用",
      paragraphs: [
        "用户应使用真实信息注册并维护账户安全。部分功能（房东功能、支付等）可能需要身份验证（KYC）或额外设置。",
      ],
    },
    {
      heading: "4. 用户义务",
      paragraphs: [
        "用户应遵守法律法规、本条款及运营政策，不得提供虚假信息、滥用服务或侵害他人权益。房源、预订或聊天产生的争议，原则上由当事人先行协商解决。",
      ],
    },
    {
      heading: "5. 免责与责任限制",
      paragraphs: [
        "在法律允许范围内，鉴于本服务为租赁信息提供平台且非用户间合同、交易或争议的直接当事人，运营者不对用户间合同或争议的结果承担责任。但因运营者故意或重大过失导致的除外，依法处理。",
      ],
    },
    {
      heading: "6. 条款变更",
      paragraphs: ["运营者可在不违反法律的前提下修改本条款，并通过本服务内公告等合理方式通知。"],
    },
  ],
  section7Heading: "7. 联系与适用",
  section7: {
    beforePrivacy: "有关本条款或本服务的咨询，请使用下方联系方式。个人信息处理请见",
    privacyLinkLabel: "隐私政策",
    afterPrivacy: "。",
  },
  listOperatorLabel: "运营主体",
  listAddressLabel: "地址",
  listEmailLabel: "邮箱",
  homeLink: "返回首页",
};

const PRIVACY_KO: PrivacyPageCopy = {
  metaTitle: "개인정보처리방침 | 500 STAY VN",
  metaDescription:
    "500 STAY VN 임대 정보 제공 플랫폼의 개인정보 처리방침. 수집·이용·보관·위탁·권리 및 문의.",
  title: "개인정보처리방침",
  effectiveLine: "시행일(초안): 2026-04-27 · 서비스: 500 STAY VN · 운영: {{operator}}",
  sections1to4: [
    {
      heading: "1. 목적",
      paragraphs: [
        '본 방침은 임대 정보 제공 플랫폼 500 STAY VN(운영: {{operator}})(이하 "서비스")이 이용자 개인정보를 어떻게 취급하는지 설명합니다. 서비스는 숙소 임대 당사자 간 정보 제공을 지원하며, 법령상 허용된 범위에서만 개인정보를 처리합니다.',
      ],
    },
    {
      heading: "2. 수집·이용 (예시)",
      paragraphs: [
        "회원가입, 예약, 본인 확인(KYC), 고객 지원, 결제·정산 연동 과정에서 이름, 연락처, 이메일, 계정 식별자, 거래·예약 관련 정보 등이 처리될 수 있습니다. 실제 항목은 회원가입 화면 및 관련 동의 절차에 고지된 내용을 따릅니다.",
      ],
    },
    {
      heading: "3. 보관·파기",
      paragraphs: [
        "관련 법령 및 내부 정책에 따라 보관 기간을 정하고, 목적 달성 후 지체 없이 파기합니다.",
      ],
    },
    {
      heading: "4. 제3자·처리위탁",
      paragraphs: [
        "호스팅, 인증, 지도, 결제(PG), 분석·오류 수집(Sentry 등) 등 운영에 필요한 범위에서 국내외 수탁사를 둘 수 있으며, 계약·관리 절차를 준수합니다.",
      ],
    },
  ],
  section5Heading: "5. 이용자 권리",
  section5: {
    beforeDelete: "개인정보 열람·정정·삭제·처리정지 요청은 고객 지원 채널을 통해 접수할 수 있습니다. 계정 삭제 절차는 ",
    deleteLinkLabel: "계정 삭제 안내",
    afterDelete: " 를 참고하세요.",
  },
  section6Heading: "6. 문의",
  section6Intro:
    "개인정보 보호 관련 문의는 아래 운영자 연락처로 접수할 수 있습니다. 계정 삭제·가입 안내와 동일한 이메일 채널을 사용합니다.",
  listOperatorLabel: "운영 주체",
  listAddressLabel: "주소",
  listEmailLabel: "이메일",
  homeLink: "홈으로",
};

const PRIVACY_EN: PrivacyPageCopy = {
  metaTitle: "Privacy Policy | 500 STAY VN",
  metaDescription:
    "How 500 STAY VN processes personal data for a rental information platform: collection, use, retention, processors, and your rights.",
  title: "Privacy Policy",
  effectiveLine: "Effective (draft): 2026-04-27 · Service: 500 STAY VN · Operator: {{operator}}",
  sections1to4: [
    {
      heading: "1. Purpose",
      paragraphs: [
        "This Policy explains how 500 STAY VN (operated by {{operator}}) handles personal data. The Service supports information sharing between parties to lodging rentals and processes personal data only as permitted by law.",
      ],
    },
    {
      heading: "2. Collection and use (examples)",
      paragraphs: [
        "We may process name, contact details, email, account identifiers, and booking or transaction-related data during sign-up, bookings, KYC, support, and payment/settlement integrations. The actual items follow what is disclosed at sign-up and in consent flows.",
      ],
    },
    {
      heading: "3. Retention and deletion",
      paragraphs: [
        "We set retention periods under applicable law and internal policy and delete data without undue delay after the purpose is fulfilled.",
      ],
    },
    {
      heading: "4. Third parties and processors",
      paragraphs: [
        "We may use domestic or overseas processors for hosting, identity verification, maps, payment gateways, analytics, error reporting (e.g. Sentry), and other operational needs, under contracts and governance.",
      ],
    },
  ],
  section5Heading: "5. Your rights",
  section5: {
    beforeDelete:
      "You may request access, correction, deletion, or restriction via our support channels. For account deletion, see ",
    deleteLinkLabel: "delete account",
    afterDelete: ".",
  },
  section6Heading: "6. Contact",
  section6Intro:
    "For privacy inquiries, use the operator contacts below. The same email channel is used for account deletion and sign-up support.",
  listOperatorLabel: "Operator",
  listAddressLabel: "Address",
  listEmailLabel: "Email",
  homeLink: "Home",
};

const PRIVACY_VI: PrivacyPageCopy = {
  metaTitle: "Chính sách bảo mật | 500 STAY VN",
  metaDescription:
    "Cách 500 STAY VN xử lý dữ liệu cá nhân trên nền tảng thông tin cho thuê lưu trú.",
  title: "Chính sách bảo mật",
  effectiveLine: "Hiệu lực (bản nháp): 2026-04-27 · Dịch vụ: 500 STAY VN · Đơn vị vận hành: {{operator}}",
  sections1to4: [
    {
      heading: "1. Mục đích",
      paragraphs: [
        "Chính sách này mô tả cách 500 STAY VN (do {{operator}} vận hành) xử lý dữ liệu cá nhân. Dịch vụ hỗ trợ cung cấp thông tin giữa các bên liên quan đến cho thuê lưu trú và chỉ xử lý dữ liệu trong phạm vi pháp luật cho phép.",
      ],
    },
    {
      heading: "2. Thu thập và sử dụng (ví dụ)",
      paragraphs: [
        "Chúng tôi có thể xử lý họ tên, liên hệ, email, định danh tài khoản và dữ liệu liên quan đặt phòng/giao dịch khi đăng ký, đặt phòng, KYC, hỗ trợ và tích hợp thanh toán/quyết toán. Nội dung thực tế theo thông báo tại màn hình đăng ký và quy trình đồng ý.",
      ],
    },
    {
      heading: "3. Lưu trữ và xóa",
      paragraphs: [
        "Chúng tôi đặt thời hạn lưu trữ theo pháp luật và chính sách nội bộ và xóa dữ liệu sau khi đạt mục đích, không trì hoãn không cần thiết.",
      ],
    },
    {
      heading: "4. Bên thứ ba và bên xử lý",
      paragraphs: [
        "Chúng tôi có thể sử dụng bên xử lý trong và ngoài nước cho lưu trữ, xác minh danh tính, bản đồ, cổng thanh toán, phân tích, thu thập lỗi (ví dụ Sentry) và nhu cầu vận hành khác, theo hợp đồng và quản trị.",
      ],
    },
  ],
  section5Heading: "5. Quyền của người dùng",
  section5: {
    beforeDelete:
      "Bạn có thể yêu cầu truy cập, chỉnh sửa, xóa hoặc hạn chế qua kênh hỗ trợ. Xóa tài khoản: xem ",
    deleteLinkLabel: "hướng dẫn xóa tài khoản",
    afterDelete: ".",
  },
  section6Heading: "6. Liên hệ",
  section6Intro:
    "Thắc mắc về bảo mật, vui lòng liên hệ đơn vị vận hành bên dưới. Cùng kênh email cho xóa tài khoản và hỗ trợ đăng ký.",
  listOperatorLabel: "Đơn vị vận hành",
  listAddressLabel: "Địa chỉ",
  listEmailLabel: "Email",
  homeLink: "Trang chủ",
};

const PRIVACY_JA: PrivacyPageCopy = {
  metaTitle: "プライバシーポリシー | 500 STAY VN",
  metaDescription:
    "500 STAY VN における個人データの取扱い（賃貸情報提供プラットフォーム）。",
  title: "プライバシーポリシー",
  effectiveLine: "施行日（草案）: 2026-04-27 · サービス: 500 STAY VN · 運営: {{operator}}",
  sections1to4: [
    {
      heading: "1. 目的",
      paragraphs: [
        "本ポリシーは、500 STAY VN（運営: {{operator}}）が個人データをどのように取り扱うかを説明します。本サービスは宿泊賃貸の当事者間の情報提供を支援し、法令が許す範囲でのみ個人データを処理します。",
      ],
    },
    {
      heading: "2. 取得・利用（例）",
      paragraphs: [
        "会員登録、予約、本人確認（KYC）、サポート、決済・精算連携の過程で、氏名、連絡先、メール、アカウント識別子、取引・予約関連情報などが処理される場合があります。実際の項目は登録画面および同意手続の開示に従います。",
      ],
    },
    {
      heading: "3. 保管・削除",
      paragraphs: [
        "関連法令および内部方針に基づき保管期間を定め、目的達成後は遅滞なく削除します。",
      ],
    },
    {
      heading: "4. 第三者・委託",
      paragraphs: [
        "ホスティング、認証、地図、決済（PG）、分析・エラー収集（Sentry 等）など運営に必要な範囲で国内外の委託先を置く場合があり、契約・管理手続を遵守します。",
      ],
    },
  ],
  section5Heading: "5. 利用者の権利",
  section5: {
    beforeDelete:
      "開示・訂正・削除・処理停止のご請求はサポート窓口で受け付けます。アカウント削除は",
    deleteLinkLabel: "削除手順",
    afterDelete: "をご覧ください。",
  },
  section6Heading: "6. お問い合わせ",
  section6Intro:
    "個人情報に関するお問い合わせは下記運営者連絡先まで。アカウント削除・登録案内と同じメールチャネルを使用します。",
  listOperatorLabel: "運営者",
  listAddressLabel: "所在地",
  listEmailLabel: "メール",
  homeLink: "ホームへ",
};

const PRIVACY_ZH: PrivacyPageCopy = {
  metaTitle: "隐私政策 | 500 STAY VN",
  metaDescription: "500 STAY VN 住宿租赁信息平台的个人信息处理说明。",
  title: "隐私政策",
  effectiveLine: "生效日期（草案）: 2026-04-27 · 服务: 500 STAY VN · 运营主体: {{operator}}",
  sections1to4: [
    {
      heading: "1. 目的",
      paragraphs: [
        "本政策说明 500 STAY VN（运营: {{operator}}）如何处理个人信息。本服务协助住宿租赁相关方之间的信息提供，并仅在法律允许范围内处理个人信息。",
      ],
    },
    {
      heading: "2. 收集与使用（示例）",
      paragraphs: [
        "在注册、预订、身份验证（KYC）、客户支持以及支付与结算对接过程中，可能会处理姓名、联系方式、电子邮件、账户标识符及交易或预订相关信息。实际项目以注册界面及相关同意流程中披露为准。",
      ],
    },
    {
      heading: "3. 保存与删除",
      paragraphs: [
        "我们根据适用法律与内部政策设定保存期限，并在目的达成后及时删除。",
      ],
    },
    {
      heading: "4. 第三方与受托处理",
      paragraphs: [
        "在运营所需范围内，我们可能委托境内外服务商进行托管、身份验证、地图、支付网关、分析及错误收集（如 Sentry）等，并遵守合同与管理流程。",
      ],
    },
  ],
  section5Heading: "5. 用户权利",
  section5: {
    beforeDelete: "您可通过客户支持渠道申请查阅、更正、删除或限制处理。删除账户请参见",
    deleteLinkLabel: "账户删除说明",
    afterDelete: "。",
  },
  section6Heading: "6. 联系方式",
  section6Intro:
    "个人信息相关咨询请使用下方运营主体联系方式。账户删除与注册支持与同一电子邮件渠道。",
  listOperatorLabel: "运营主体",
  listAddressLabel: "地址",
  listEmailLabel: "邮箱",
  homeLink: "返回首页",
};

export const TERMS_BY_LANG: Record<SupportedLanguage, TermsPageCopy> = {
  ko: TERMS_KO,
  vi: TERMS_VI,
  en: TERMS_EN,
  ja: TERMS_JA,
  zh: TERMS_ZH,
};

export const PRIVACY_BY_LANG: Record<SupportedLanguage, PrivacyPageCopy> = {
  ko: PRIVACY_KO,
  vi: PRIVACY_VI,
  en: PRIVACY_EN,
  ja: PRIVACY_JA,
  zh: PRIVACY_ZH,
};

export function getTermsCopy(lang: SupportedLanguage): TermsPageCopy {
  return TERMS_BY_LANG[lang] ?? TERMS_BY_LANG.en;
}

export function getPrivacyCopy(lang: SupportedLanguage): PrivacyPageCopy {
  return PRIVACY_BY_LANG[lang] ?? PRIVACY_BY_LANG.en;
}

export function applyOperatorTemplate(text: string, operatorLegalName: string): string {
  return text.replace(/\{\{operator\}\}/g, operatorLegalName);
}
