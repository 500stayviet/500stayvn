import * as Sentry from '@sentry/nextjs';

const SLOW_MS = Number(process.env.API_SLOW_MS || 1200);

export function reportApiSuccess(route: string, status: number, startedAtMs: number): void {
  const durationMs = Date.now() - startedAtMs;
  if (durationMs < SLOW_MS) return;
  Sentry.captureMessage('api_slow', {
    level: 'warning',
    tags: { route, status: String(status) },
    extra: { durationMs, slowThresholdMs: SLOW_MS },
  });
}

export function reportApiException(
  route: string,
  error: unknown,
  startedAtMs?: number
): void {
  const durationMs =
    typeof startedAtMs === 'number' ? Math.max(0, Date.now() - startedAtMs) : undefined;
  Sentry.captureException(error, {
    tags: { route },
    extra: durationMs != null ? { durationMs } : undefined,
  });
}

