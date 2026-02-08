import type { NextConfig } from "next";

// PWA 설정을 위한 임포트
const withPWA = (nextConfig: NextConfig) => {
  const pwaConfig = {
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
  };

  // next-pwa가 설치되어 있는지 확인
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const withPWA = require("next-pwa").default || require("next-pwa");
    return withPWA(pwaConfig)(nextConfig);
  } catch (error) {
    console.warn("next-pwa not found, skipping PWA configuration");
    return nextConfig;
  }
};

const nextConfig: NextConfig = {
  // AWS Amplify: output: 'standalone' 미사용 시 Amplify 자동 어댑터가 빌드합니다.
  reactStrictMode: true,

  images: {
    // Amplify 등 서버 이미지 최적화 미사용 환경에서는 unoptimized: true 권장
    unoptimized: true,
    // unoptimized 제거 시 사용할 원격 이미지 도메인 (v0/Unsplash/S3 등)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // S3 사용 시 실제 버킷 호스트명 추가 예: hostname: "your-bucket.s3.ap-northeast-2.amazonaws.com"
      // CloudFront 사용 시 해당 distribution 도메인 추가
    ],
  },

  // 빌드 시 환경 변수/경로 이슈 방지
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default withPWA(nextConfig);