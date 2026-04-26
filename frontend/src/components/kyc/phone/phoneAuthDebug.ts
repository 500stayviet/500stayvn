const PHONE_AUTH_DEBUG = process.env.NEXT_PUBLIC_PHONE_AUTH_DEBUG === 'true';

export const phoneAuthDebugLog = (message: string, payload?: unknown) => {
  if (!PHONE_AUTH_DEBUG) return;
  if (payload !== undefined) {
    console.log(message, payload);
    return;
  }
  console.log(message);
};
