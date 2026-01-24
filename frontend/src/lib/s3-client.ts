import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// 1. AWS S3 클라이언트 설정 (환경변수 사용)
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_MY_S3_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_MY_S3_ACCESS_KEY || "",
    secretAccessKey: process.env.NEXT_PUBLIC_MY_S3_SECRET_KEY || "",
  },
});

/**
 * 이미지 파일을 S3에 업로드하고 URL을 반환하는 함수
 */
export const uploadToS3 = async (
  file: File,
  folder: string = "properties",
): Promise<string> => {
  const fileName = `${folder}/${Date.now()}-${file.name}`;

  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_MY_S3_BUCKET_NAME,
    Key: fileName,
    Body: file,
    ContentType: file.type,
    ACL: "public-read", // 누구나 사진을 볼 수 있게 설정
  });

  try {
    await s3Client.send(command);
    // 업로드된 이미지의 공개 주소(URL) 반환
    return `https://${process.env.NEXT_PUBLIC_MY_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_MY_S3_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("S3 업로드 에러:", error);
    throw error;
  }
};
