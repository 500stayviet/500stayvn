import { NextResponse } from "next/server";

/**
 * iOS Universal Links · 향후 Capacitor/WebView 래퍼와 정합.
 * Apple Developer의 Team ID로 REPLACE_APPLE_TEAM_ID 를 치환한 뒤 배포 검증.
 * (정적 public 파일보다 application/json 헤더를 명시하기 위해 Route Handler 사용)
 */
export async function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: "REPLACE_APPLE_TEAM_ID.com.stay500vn.app",
          paths: ["*"],
        },
      ],
    },
  };

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
