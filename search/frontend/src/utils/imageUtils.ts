/**
 * 이미지 처리 유틸리티
 * 
 * 클라이언트에서 이미지 리사이징 및 최적화
 */

/**
 * 이미지 리사이징 및 압축
 * @param file - 원본 이미지 파일
 * @param maxWidth - 최대 너비 (기본값: 1920)
 * @param maxHeight - 최대 높이 (기본값: 1080)
 * @param quality - JPEG 품질 (0.0 ~ 1.0, 기본값: 0.8)
 * @returns 리사이징된 Blob
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 원본 비율 유지하며 리사이징
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Canvas로 리사이징
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('이미지 변환에 실패했습니다'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Canvas에서 Blob으로 변환
 * @param canvas - Canvas 요소
 * @param quality - JPEG 품질 (0.0 ~ 1.0, 기본값: 0.8)
 * @returns Blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas를 Blob으로 변환할 수 없습니다'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * File을 Blob으로 변환
 */
export function fileToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const blob = new Blob([reader.result as ArrayBuffer], { type: file.type });
      resolve(blob);
    };
    reader.onerror = () => reject(new Error('파일 변환 실패'));
    reader.readAsArrayBuffer(file);
  });
}
