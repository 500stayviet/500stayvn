import type { NextConfig } from "next";

/** 프로덕션 빌드에서만 next-pwa 적용 — 개발 시 PWA 비활성 로그·래퍼 없음 */
const withPWA = (nextConfig: NextConfig) => {
  const pwaConfig = {
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: false,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const withPWAModule = require("next-pwa").default || require("next-pwa");
    return withPWAModule(pwaConfig)(nextConfig);
  } catch {
    console.warn("next-pwa not found, skipping PWA configuration");
    return nextConfig;
  }
};

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint는 설치됨(`npm run lint`). 저장소 전반 규칙 위반이 많아 빌드는 막지 않음 — 정리 후 false로 전환 권장.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

const isDev = process.env.NODE_ENV === "development";

export default isDev ? nextConfig : withPWA(nextConfig);
