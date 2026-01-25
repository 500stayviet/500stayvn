import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone'을 삭제하여 Amplify 자동 어댑터가 작동하게 합니다.
  images: {
    unoptimized: true, // 이미지 에러 방지를 위해 이것만 남겨둡니다.
  },
};

export default nextConfig;