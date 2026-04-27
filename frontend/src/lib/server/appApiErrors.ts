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
  missing_email_or_password: 'Email and password are required.',
  'auth/email-already-in-use': 'Email already in use.',
  'auth/user-not-found': 'No account matches this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/social_login_required': 'This account uses social login.',
  'auth/user-blocked': 'This account has been suspended.',
  empty: 'The request list is empty.',
  too_many: 'Too many items in one request.',
  duplicate_booking_overlap:
    'This property already has a booking overlapping these dates.',
  invalid_input: 'One or more inputs are invalid.',
  forbidden_or_missing: 'You are not allowed to modify this resource or it was not found.',
  missing_fields: 'One or more required fields are missing.',
  unsupported_action: 'This action is not supported for this request.',
  bank_account_not_found: 'Bank account was not found for this owner.',
  already_booked:
    'This date range was just confirmed for another booking. Payment cannot complete.',
  idempotency_conflict:
    'This idempotency key was already used with a different payment outcome.',
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
