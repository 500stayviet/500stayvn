import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const uploadToS3 = async (
  file: File,
  folder: string = "properties",
): Promise<string> => {
  // 1. 변수명을 직접 참조하여 Next.js가 빌드 타임에 값을 주입하게 함
  const region = process.env.NEXT_PUBLIC_MY_S3_REGION || "ap-southeast-1";
  const accessKeyId = process.env.NEXT_PUBLIC_MY_S3_ACCESS_KEY;
  const secretAccessKey = process.env.NEXT_PUBLIC_MY_S3_SECRET_KEY;
  const bucketName = process.env.NEXT_PUBLIC_MY_S3_BUCKET_NAME;

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "S3 설정값이 누락되었습니다. .env.local 파일을 확인하세요.",
    );
  }

  // 2. 함수 안에서 클라이언트 생성 (process 에러 방지 핵심)
  const s3Client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKeyId.trim(), // 혹시 모를 공백 제거
      secretAccessKey: secretAccessKey.trim(),
    },
  });

  const fileName = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

  try {
    // File 객체를 ArrayBuffer로 변환하여 Uint8Array로 전달
    // AWS SDK v3의 ReadableStream 변환 문제 해결
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: bucketName.trim(),
      Key: fileName,
      Body: uint8Array,
      ContentType: file.type,
    });

    await s3Client.send(command);
    return `https://${bucketName.trim()}.s3.${region}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("S3 업로드 에러:", error);
    throw error;
  }
};
