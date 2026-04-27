import type { CapacitorConfig } from "@capacitor/cli";

/**
 * iOS/Android Capacitor 셸.
 * - 원장(BFF)은 Amplify 등에 배포된 Next — Zero Local Dependency 원칙 유지를 위해
 *   시뮬레이터·실기기는 기본적으로 `server.url`(HTTPS)로 그 원격을 로드한다.
 * - 로컬 개발: CAPACITOR_SERVER_URL=http://<LAN-IP>:3000 (cleartext 허용)
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.stay500vn.app",
  appName: "500stayviet",
  webDir: "www",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http:"),
        },
      }
    : {}),
};

export default config;
