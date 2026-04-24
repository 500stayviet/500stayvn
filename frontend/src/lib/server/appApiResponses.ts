import { NextResponse } from 'next/server';

export type AppApiSuccess<T> = {
  ok: true;
  data: T;
};

export type AppApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export type AppApiResponse<T> = AppApiSuccess<T> | AppApiFailure;

export function appApiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { ok: true, data } satisfies AppApiSuccess<T>,
    { status },
  );
}

