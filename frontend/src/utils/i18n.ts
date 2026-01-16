/**
 * i18n (Internationalization) 유틸리티
 * 
 * 언어별 UI 텍스트를 관리하는 유틸리티 함수
 * - 로그인, 검색, 버튼 등의 텍스트를 언어에 따라 반환
 */

import { SupportedLanguage } from '@/lib/api/translation';

/**
 * UI 텍스트 타입 정의
 */
export type UITextKey = 
  | 'login'
  | 'logout'
  | 'search'
  | 'searchPlaceholder'
  | 'propertyList'
  | 'noProperties'
  | 'loading'
  | 'error'
  | 'retry'
  | 'addProperty'
  | 'bedroom'
  | 'bathroom'
  | 'area'
  | 'price'
  | 'address'
  | 'description'
  | 'translationLoading'
  | 'selectLanguage'
  | 'home'
  | 'save'
  | 'cancel'
  | 'delete'
  | 'edit'
  | 'viewDetails'
  | 'email'
  | 'password'
  | 'signup'
  | 'signUp'
  | 'forgotPassword'
  | 'emailPlaceholder'
  | 'passwordPlaceholder';

/**
 * 언어별 UI 텍스트 사전
 */
const uiTexts: Record<SupportedLanguage, Record<UITextKey, string>> = {
  ko: {
    login: '로그인',
    logout: '로그아웃',
    search: '검색',
    searchPlaceholder: '지역, 주소, 매물명으로 검색...',
    propertyList: '매물 목록',
    noProperties: '등록된 매물이 없습니다.',
    loading: '로딩 중...',
    error: '오류가 발생했습니다.',
    retry: '다시 시도',
    addProperty: '새 매물 등록',
    bedroom: '베드',
    bathroom: '욕실',
    area: '㎡',
    price: '가격',
    address: '주소',
    description: '설명',
    translationLoading: '번역 중...',
    selectLanguage: '언어 선택',
    home: '홈',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '수정',
    viewDetails: '상세보기',
    email: '이메일',
    password: '비밀번호',
    signup: '회원가입',
    signUp: '회원가입',
    forgotPassword: '비밀번호를 잊으셨나요?',
    emailPlaceholder: '이메일을 입력하세요',
    passwordPlaceholder: '비밀번호를 입력하세요',
  },
  vi: {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    search: 'Tìm kiếm',
    searchPlaceholder: 'Tìm kiếm theo khu vực, địa chỉ, tên bất động sản...',
    propertyList: 'Danh sách bất động sản',
    noProperties: 'Không có bất động sản nào được đăng ký.',
    loading: 'Đang tải...',
    error: 'Đã xảy ra lỗi.',
    retry: 'Thử lại',
    addProperty: 'Đăng ký bất động sản mới',
    bedroom: 'Phòng ngủ',
    bathroom: 'Phòng tắm',
    area: 'm²',
    price: 'Giá',
    address: 'Địa chỉ',
    description: 'Mô tả',
    translationLoading: 'Đang dịch...',
    selectLanguage: 'Chọn ngôn ngữ',
    home: 'Trang chủ',
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    viewDetails: 'Xem chi tiết',
    email: 'Email',
    password: 'Mật khẩu',
    signup: 'Đăng ký',
    signUp: 'Đăng ký',
    forgotPassword: 'Quên mật khẩu?',
    emailPlaceholder: 'Nhập email của bạn',
    passwordPlaceholder: 'Nhập mật khẩu của bạn',
  },
  en: {
    login: 'Login',
    logout: 'Logout',
    search: 'Search',
    searchPlaceholder: 'Search by area, address, property name...',
    propertyList: 'Property List',
    noProperties: 'No properties registered.',
    loading: 'Loading...',
    error: 'An error occurred.',
    retry: 'Retry',
    addProperty: 'Add New Property',
    bedroom: 'Bed',
    bathroom: 'Bath',
    area: 'm²',
    price: 'Price',
    address: 'Address',
    description: 'Description',
    translationLoading: 'Translating...',
    selectLanguage: 'Select Language',
    home: 'Home',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    viewDetails: 'View Details',
    email: 'Email',
    password: 'Password',
    signup: 'Sign Up',
    signUp: 'Sign Up',
    forgotPassword: 'Forgot Password?',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
  },
  ja: {
    login: 'ログイン',
    logout: 'ログアウト',
    search: '検索',
    searchPlaceholder: 'エリア、住所、物件名で検索...',
    propertyList: '物件一覧',
    noProperties: '登録された物件がありません。',
    loading: '読み込み中...',
    error: 'エラーが発生しました。',
    retry: '再試行',
    addProperty: '新規物件登録',
    bedroom: 'ベッド',
    bathroom: 'バス',
    area: '㎡',
    price: '価格',
    address: '住所',
    description: '説明',
    translationLoading: '翻訳中...',
    selectLanguage: '言語選択',
    home: 'ホーム',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    edit: '編集',
    viewDetails: '詳細を見る',
    email: 'メール',
    password: 'パスワード',
    signup: '新規登録',
    signUp: '新規登録',
    forgotPassword: 'パスワードを忘れた方はこちら',
    emailPlaceholder: 'メールアドレスを入力',
    passwordPlaceholder: 'パスワードを入力',
  },
  zh: {
    login: '登录',
    logout: '登出',
    search: '搜索',
    searchPlaceholder: '按地区、地址、房产名称搜索...',
    propertyList: '房产列表',
    noProperties: '没有已注册的房产。',
    loading: '加载中...',
    error: '发生错误。',
    retry: '重试',
    addProperty: '添加新房产',
    bedroom: '卧室',
    bathroom: '浴室',
    area: '㎡',
    price: '价格',
    address: '地址',
    description: '描述',
    translationLoading: '翻译中...',
    selectLanguage: '选择语言',
    home: '首页',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    viewDetails: '查看详情',
    email: '邮箱',
    password: '密码',
    signup: '注册',
    signUp: '注册',
    forgotPassword: '忘记密码?',
    emailPlaceholder: '请输入邮箱',
    passwordPlaceholder: '请输入密码',
  },
};

/**
 * 언어별 UI 텍스트 가져오기
 * 
 * @param key - 텍스트 키
 * @param language - 현재 언어
 * @returns 언어에 맞는 텍스트
 */
export function getUIText(key: UITextKey, language: SupportedLanguage): string {
  return uiTexts[language]?.[key] || uiTexts.ko[key] || key;
}

/**
 * 여러 텍스트를 한 번에 가져오기
 * 
 * @param keys - 텍스트 키 배열
 * @param language - 현재 언어
 * @returns 텍스트 객체
 */
export function getUITexts(
  keys: UITextKey[],
  language: SupportedLanguage
): Record<UITextKey, string> {
  const result: Partial<Record<UITextKey, string>> = {};
  keys.forEach((key) => {
    result[key] = getUIText(key, language);
  });
  return result as Record<UITextKey, string>;
}
