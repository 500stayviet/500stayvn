# Stayviet Android TWA (초안)

Bubblewrap 대신 **Android Browser Helper** 기반 최소 프로젝트입니다.

## 1) 호스트 한 곳에서 설정 (맥 없이 Windows에서 가능)

1. **`gradle.properties`** 의 `twaHostname=` 을 **프로덕션 도메인만** 입력 (예: `www.example.com`, 스킴 없음).
2. Android Studio → **Sync Project** — `app/build.gradle.kts` 가 `manifestPlaceholders` + `twa_default_url` 을 자동 맞춤.

## 2) Digital Asset Links (`assetlinks.json`)

1. Play Console → 앱 → **설정 → 앱 서명** → **앱 서명 키 인증서**의 **SHA-256** 지문 복사.
2. `frontend/public/.well-known/assetlinks.json` 의 `sha256_cert_fingerprints` 배열에 **콜론 없는 소문자 hex** 로 넣거나, Play가 안내하는 형식 그대로 반영.
3. 웹 배포 후 `https://<twaHostname와 동일 호스트>/.well-known/assetlinks.json` 이 공개되는지 브라우저로 확인.
4. [Google 링크 테스트 도구](https://developers.google.com/digital-asset-links/tools/generator) 로 검증.

## 3) 기타

- 스토어 제출 전 **512×512** 아이콘으로 `@drawable/ic_twa_launcher` 교체 권장.
- 패키지명 변경 시 `applicationId`·`assetlinks.json`·Play 콘솔을 **동시에** 맞출 것.

## 빌드

Android Studio에서 **Open** → `mobile/android-twa`. Gradle이 wrapper JAR를 내려받지 못하면 터미널에서:

`gradle wrapper --gradle-version 8.2` (Gradle 설치 시)

AAB: **Build → Generate Signed Bundle / APK** 또는 `./gradlew :app:bundleRelease`.

## 관련 문서

`docs/qa/phase3-mobile-app-readiness.md`
