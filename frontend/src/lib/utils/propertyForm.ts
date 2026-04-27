import type { SupportedLanguage } from "@/lib/api/translation";
import { readStoredUiLanguage } from "@/lib/uiLanguageStorage";
import { getUIText } from "@/utils/i18n";
import { uploadToS3 } from "@/lib/s3-client";

const formatRoomNumber = (room: string) => {
  const num = parseInt(room.replace(/\D/g, ""), 10);
  if (isNaN(num)) return room;
  return num.toString().padStart(4, "0");
};

function formatTower(lang: SupportedLanguage, name: string) {
  return getUIText("addressPatternTower", lang).replace(/\{\{name\}\}/g, name);
}

function formatUnit(lang: SupportedLanguage, name: string) {
  return getUIText("addressPatternUnit", lang).replace(/\{\{name\}\}/g, name);
}

/** `buildingNumber`·`roomNumber`를 UI 언어에 맞춘 동/호 문자열로 합칩니다. */
export const buildUnitNumber = (
  buildingNumber: string,
  roomNumber: string,
  lang: SupportedLanguage = readStoredUiLanguage(),
) => {
  if (buildingNumber && roomNumber) {
    return `${formatTower(lang, buildingNumber)} ${formatUnit(lang, formatRoomNumber(roomNumber))}`;
  }
  if (buildingNumber) return formatTower(lang, buildingNumber);
  if (roomNumber) return formatUnit(lang, formatRoomNumber(roomNumber));
  return undefined;
};

export const uploadPropertyFiles = async (images: File[]) => {
  return Promise.all(images.map((image) => uploadToS3(image, "properties")));
};

export const mergeExistingAndUploadedImageUrls = async (
  imagePreviews: string[],
  images: File[],
) => {
  const existingUrls = imagePreviews.filter(
    (url) =>
      typeof url === "string" && (url.startsWith("http") || url.startsWith("/")),
  );
  const newUrls = images.length > 0 ? await uploadPropertyFiles(images) : [];
  return [...existingUrls, ...newUrls];
};
