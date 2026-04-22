import { uploadToS3 } from "@/lib/s3-client";

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
