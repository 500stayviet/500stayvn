import { getCurrentUserId } from "@/lib/api/authState";

/**
 * `/api/app/*` 호출에 `x-app-actor-id` 를 붙입니다 (로그인 시).
 * 서버는 리소스 쓰기·민감 읽기에서 이 헤더를 검증합니다.
 */
export function withAppActor(init: RequestInit = {}): RequestInit {
  if (typeof window === 'undefined') return init;
  const uid = getCurrentUserId();
  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (uid) headers.set('x-app-actor-id', uid);
  return { ...init, headers };
}
