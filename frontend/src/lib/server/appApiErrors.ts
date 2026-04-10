import { NextResponse } from 'next/server';

const DEFAULT_MESSAGES: Record<string, string> = {
  actor_required: 'Missing or invalid x-app-actor-id header.',
  forbidden_actor: 'This actor is not allowed for the requested resource.',
  sync_secret_required: 'Valid x-app-sync-secret header is required.',
  invalid_body: 'Request body could not be parsed.',
  missing_scope: 'Provide userId and/or bookingId to scope this request.',
  missing_booking_id: 'bookingId is required.',
  invalid_user_id: 'Invalid userId.',
  invalid_booking_id: 'Invalid booking id.',
  invalid_room_id: 'Invalid room id.',
  database_unavailable: 'Database is temporarily unavailable.',
  invalid_fields: 'One or more required fields are missing or invalid.',
  forbidden_sender: 'Sender is not a participant in this booking.',
  room_not_found: 'Chat room was not found.',
  booking_not_found: 'Booking was not found.',
  not_found: 'Resource was not found.',
  delete_failed: 'Could not complete delete due to a conflict or constraint.',
  invalid_payment_actor: 'Payment userId must be the booking guest or owner.',
  invalid_id: 'Invalid resource id.',
  admin_patch_empty: 'No permitted fields for an admin user update.',
};

/**
 * Unified JSON error shape for `/api/app/*`.
 *
 * ```json
 * { "ok": false, "error": { "code": "...", "message": "..." } }
 * ```
 */
export function appApiError(
  code: string,
  status: number,
  message?: string
): NextResponse {
  const msg = message ?? DEFAULT_MESSAGES[code] ?? code;
  return NextResponse.json(
    { ok: false, error: { code, message: msg } },
    { status }
  );
}
