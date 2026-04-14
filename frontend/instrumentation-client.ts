/**
 * 브라우저 번들에서 Sentry 클라이언트 초기화.
 * `next.config`에 `withSentryConfig`가 없어도 Next가 이 파일을 로드합니다.
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import "./sentry.client.config";

import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
