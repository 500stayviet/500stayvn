import { getCurrentUserData } from "@/lib/api/auth";
import { uploadToS3 } from "@/lib/s3-client";
import { isOwnerSupplyLengthDays } from "@/lib/constants/listingCalendar";

type PropertyType =
  | ""
  | "studio"
  | "one_room"
  | "two_room"
  | "three_plus"
  | "detached";

type Coordinates = { lat: number; lng: number } | null;

const t = (lang: string, text: Record<string, string>) =>
  text[lang] ?? text.en;

export interface AddPropertyValidationInput {
  address: string;
  coordinates: Coordinates;
  selectedCityId: string;
  selectedDistrictId: string;
  imagePreviewsLength: number;
  weeklyRent: string;
  propertyType: PropertyType;
  title: string;
  hasUser: boolean;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  todayOnly: Date;
  maxRentalDay: Date;
  currentLanguage: string;
}

export const validateAddPropertyInput = (
  input: AddPropertyValidationInput,
): string | null => {
  const {
    address,
    coordinates,
    selectedCityId,
    selectedDistrictId,
    imagePreviewsLength,
    weeklyRent,
    propertyType,
    title,
    hasUser,
    checkInDate,
    checkOutDate,
    todayOnly,
    maxRentalDay,
    currentLanguage,
  } = input;

  if (!address || address.trim() === "") {
    return t(currentLanguage, {
      ko: "주소를 입력해주세요.",
      vi: "Vui lòng nhập địa chỉ.",
      ja: "住所を入力してください。",
      zh: "请输入地址。",
      en: "Please enter an address.",
    });
  }

  if (!coordinates || !coordinates.lat || !coordinates.lng) {
    return t(currentLanguage, {
      ko: "주소를 선택하여 좌표를 설정해주세요. 주소 입력 버튼을 클릭하여 주소를 확인해주세요.",
      vi: "Vui lòng chọn địa chỉ để thiết lập tọa độ. Vui lòng nhấp vào nút nhập địa chỉ để xác nhận địa chỉ.",
      ja: "住所を選択して座標を設定してください。住所入力ボタンをクリックして住所を確認してください。",
      zh: "请选择地址以设置坐标。请点击地址输入按钮确认地址。",
      en: "Please select an address to set coordinates. Please click the address input button to verify the address.",
    });
  }

  if (!selectedCityId) {
    return t(currentLanguage, {
      ko: "도시를 선택해주세요.",
      vi: "Vui lòng chọn thành phố.",
      ja: "都市を選択してください。",
      zh: "请选择城市。",
      en: "Please select a city.",
    });
  }

  if (!selectedDistrictId) {
    return t(currentLanguage, {
      ko: "구를 선택해주세요.",
      vi: "Vui lòng chọn quận.",
      ja: "区を選択してください。",
      zh: "请选择区。",
      en: "Please select a district.",
    });
  }

  if (imagePreviewsLength === 0) {
    return t(currentLanguage, {
      ko: "최소 1장의 사진을 등록해주세요.",
      vi: "Vui lòng đăng ít nhất 1 ảnh.",
      ja: "最低1枚の写真を登録してください。",
      zh: "请至少上传1张照片。",
      en: "Please upload at least 1 image.",
    });
  }

  if (!weeklyRent || weeklyRent.trim() === "") {
    return t(currentLanguage, {
      ko: "1주일 임대료를 입력해주세요.",
      vi: "Vui lòng nhập giá thuê 1 tuần.",
      ja: "1週間の賃貸料を入力してください。",
      zh: "请输入1周租金。",
      en: "Please enter weekly rent.",
    });
  }

  const rentValue = parseInt(weeklyRent.replace(/\D/g, ""), 10);
  if (isNaN(rentValue) || rentValue <= 0) {
    return t(currentLanguage, {
      ko: "유효한 임대료를 입력해주세요.",
      vi: "Vui lòng nhập giá thuê hợp lệ.",
      ja: "有効な賃貸料を入力してください。",
      zh: "请输入有效的租金金额。",
      en: "Please enter a valid rent amount.",
    });
  }

  if (!propertyType) {
    return t(currentLanguage, {
      ko: "매물 종류를 선택해주세요.",
      vi: "Vui lòng chọn loại bất động sản.",
      ja: "物件の種類を選択してください。",
      zh: "请选择物业类型。",
      en: "Please select property type.",
    });
  }

  if (!title || title.trim() === "") {
    return t(currentLanguage, {
      ko: "매물명을 입력해주세요.",
      vi: "Vui lòng nhập tên bất động sản.",
      ja: "物件名を入力してください。",
      zh: "请输入物业名称。",
      en: "Please enter property name.",
    });
  }

  if (!hasUser) {
    return t(currentLanguage, {
      ko: "로그인이 필요합니다.",
      vi: "Cần đăng nhập.",
      ja: "ログインが必要です。",
      zh: "需要登录。",
      en: "Please login.",
    });
  }

  if (!checkInDate || !checkOutDate) {
    return t(currentLanguage, {
      ko: "임대 시작일과 종료일을 선택해주세요.",
      vi: "Vui lòng chọn ngày bắt đầu và kết thúc thuê.",
      ja: "賃貸開始日と終了日を選択してください。",
      zh: "请选择租赁开始和结束日期。",
      en: "Please select rental start and end dates.",
    });
  }

  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const inDayOnly = new Date(
    checkInDate.getFullYear(),
    checkInDate.getMonth(),
    checkInDate.getDate(),
  );
  const outDayOnly = new Date(
    checkOutDate.getFullYear(),
    checkOutDate.getMonth(),
    checkOutDate.getDate(),
  );

  const inOk =
    inDayOnly.getTime() >= todayOnly.getTime() &&
    inDayOnly.getTime() <= maxRentalDay.getTime();
  const outOk =
    outDayOnly.getTime() >= todayOnly.getTime() &&
    outDayOnly.getTime() <= maxRentalDay.getTime();

  if (!inOk || !outOk) {
    return t(currentLanguage, {
      ko: "임대 시작일과 종료일은 오늘 기준 최대 91일 이내에서 선택해주세요.",
      vi: "Vui lòng chọn ngày bắt đầu và kết thúc thuê trong vòng 91 ngày tính từ hôm nay.",
      ja: "賃貸開始日と終了日は、今日基準で最大91日以内で選択してください。",
      zh: "请在以今天为基准的91天以内选择入住和退房日期。",
      en: "Please select rental start/end dates within 91 days from today.",
    });
  }

  if (!isOwnerSupplyLengthDays(diffDays)) {
    return t(currentLanguage, {
      ko: "임대 기간은 7일 단위이며, 최대 약 3개월(91일)까지 선택할 수 있습니다.",
      vi: "Thời hạn thuê theo bội 7 ngày, tối đa ~3 tháng (91 ngày).",
      ja: "賃貸期間は7日単位で、最長約3か月（91日）までです。",
      zh: "租期为7天倍数，最长约3个月（91天）。",
      en: "Rental length must be in 7-day steps, up to ~3 months (91 days).",
    });
  }

  return null;
};

export const ensureAddPropertyKycReady = async (
  uid: string,
  currentLanguage: string,
): Promise<{ ok: true } | { ok: false; message: string }> => {
  const userData = await getCurrentUserData(uid);
  const kycSteps = userData?.kyc_steps || {};
  const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;

  if (allStepsCompleted) return { ok: true };

  return {
    ok: false,
    message: t(currentLanguage, {
      ko: "매물을 등록하려면 KYC 인증 1~3단계를 모두 완료해야 합니다.",
      vi: "Bạn phải hoàn thành tất cả các bước xác thực KYC (1-3) để đăng bất động sản.",
      ja: "物件を登録するには、KYC認証1〜3段階をすべて完了する必要があります。",
      zh: "要注册物业，必须完成KYC认证1-3阶段。",
      en: "You must complete all KYC verification steps (1-3) to register a property.",
    }),
  };
};

const formatRoomNumber = (room: string) => {
  const num = parseInt(room.replace(/\D/g, ""), 10);
  if (isNaN(num)) return room;
  return num.toString().padStart(4, "0");
};

export const buildUnitNumber = (buildingNumber: string, roomNumber: string) => {
  if (buildingNumber && roomNumber) {
    return `${buildingNumber}동 ${formatRoomNumber(roomNumber)}호`;
  }
  if (buildingNumber) return `${buildingNumber}동`;
  if (roomNumber) return `${formatRoomNumber(roomNumber)}호`;
  return undefined;
};

export const uploadPropertyImages = async (
  images: File[],
  currentLanguage: string,
): Promise<{ ok: true; imageUrls: string[] } | { ok: false; message: string }> => {
  try {
    const imageUrls = await Promise.all(
      images.map((image) => uploadToS3(image, "properties")),
    );
    return { ok: true, imageUrls };
  } catch (error) {
    console.error("S3 업로드 실패:", error);
    const errorMessage = error instanceof Error ? error.message : "S3 업로드 실패";
    return {
      ok: false,
      message: t(currentLanguage, {
        ko: `사진 업로드 실패: ${errorMessage}`,
        vi: `Tải ảnh lên thất bại: ${errorMessage}`,
        ja: `Photo upload failed: ${errorMessage}`,
        zh: `Photo upload failed: ${errorMessage}`,
        en: `Photo upload failed: ${errorMessage}`,
      }),
    };
  }
};

export const getAddPropertyErrorMessage = (
  currentLanguage: string,
  errorMessage?: string,
) => {
  if (errorMessage === "OverlapDetected" || errorMessage === "AlreadyBooked") {
    return t(currentLanguage, {
      ko: "이미 동일한 주소와 날짜에 등록된 매물이 있습니다.",
      vi: "Đã có bất động sản được đăng ký với cùng địa chỉ và ngày.",
      ja: "同じ住所と日付に既に登録された物件があります。",
      zh: "相同地址和日期已有注册的物业。",
      en: "A property has already been registered at the same address and date.",
    });
  }
  return t(currentLanguage, {
    ko: "매물 등록 중 오류가 발생했습니다.",
    vi: "Đã xảy ra lỗi khi đăng ký bất động sản.",
    ja: "物件登録中にエラーが発生しました。",
    zh: "物业注册过程中发生错误。",
    en: "An error occurred while registering the property.",
  });
};
