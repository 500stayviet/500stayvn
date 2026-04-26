import { createRequire } from "node:module";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const requirePwa = createRequire(import.meta.url);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** 프로덕션 빌드에서만 next-pwa 적용 — 개발 시 PWA 비활성 로그·래퍼 없음 */
const withPWA = (nextConfig: NextConfig) => {
  const pwaConfig = {
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: false,
  };

  try {
    type PwaWrapper = (cfg: typeof pwaConfig) => (nc: NextConfig) => NextConfig;
    const imported = requirePwa("next-pwa") as PwaWrapper | { default: PwaWrapper };
    const withPWAModule: PwaWrapper =
      typeof imported === "function" ? imported : imported.default;
    return withPWAModule(pwaConfig)(nextConfig);
  } catch {
    console.warn("next-pwa not found, skipping PWA configuration");
    return nextConfig;
  }
};

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /** Sentry·Prisma 트레이싱이 OpenTelemetry 동적 require를 쓰므로 webpack 무해 경고 무시 */
  webpack: (config) => {
    const existing = config.ignoreWarnings;
    const list = Array.isArray(existing) ? [...existing] : existing ? [existing] : [];
    // Critical dependency 경고: @opentelemetry / @prisma instrumentation 동적 로드
    list.push(
      { module: /node_modules[\\/]@opentelemetry[\\/]instrumentation/ },
      { module: /node_modules[\\/]@prisma[\\/]instrumentation/ },
    );
    config.ignoreWarnings = list;
    return config;
  },

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
const baseConfig = isDev ? nextConfig : withPWA(nextConfig);

export default withBundleAnalyzer(baseConfig);
