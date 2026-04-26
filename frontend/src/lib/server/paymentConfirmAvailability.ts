/**
 * Prisma 인터랙티브 트랜잭션 콜백 + 확장 PrismaClient 모두 raw SQL 시그니처가 같으므로
 * TransactionClient 대신 최소 형태로 받아 타입 충돌을 피한다.
 */
export type PaymentRaceGuardTx = {
  $queryRawUnsafe: <T = unknown>(
    query: string,
    ...values: unknown[]
  ) => Promise<T>;
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<number>;
};

/** 트랜잭션 안에서 PaymentRecord 행이 없거나 스냅샷이 무효한 경우 */
export class PaymentRowMissingInTransactionError extends Error {
  override readonly name = 'PaymentRowMissingInTransactionError';
  constructor() {
    super('Payment row missing or invalid under lock');
  }
}

/** 트랜잭션 안에서 예약 행이 사라진 경우 */
export class BookingNotFoundInTransactionError extends Error {
  override readonly name = 'BookingNotFoundInTransactionError';
  constructor(readonly bookingId: string) {
    super('Booking row missing after lock');
  }
}

/**
 * 동일 매물·동일 기간에 이미 confirmed 예약이 있는 경우.
 * 결제 확정 레이스에서만 throw — 모니터링용 로그와 409 응답에 사용.
 */
export class AlreadyBookedConflictError extends Error {
  override readonly name = 'AlreadyBookedConflictError';
  constructor(
    readonly bookingId: string,
    readonly propertyId: string,
  ) {
    super('Overlapping confirmed booking exists for this listing.');
  }
}

export type LockedBookingRow = {
  id: string;
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: string;
};

/** 결제 PATCH 트랜잭션에서 예약 행을 잠그고 최신 상태·기간을 읽는다. */
export async function lockBookingRowForUpdate(
  tx: PaymentRaceGuardTx,
  bookingId: string,
): Promise<LockedBookingRow | null> {
  const rows = await tx.$queryRawUnsafe<LockedBookingRow[]>(
    `
    SELECT id, "propertyId", "checkInDate", "checkOutDate", status
    FROM "Booking"
    WHERE id = $1
    FOR UPDATE
    `,
    bookingId,
  );
  return rows[0] ?? null;
}

/**
 * Stay-over 규칙과 동일: [checkIn, checkOut) 반개구간 겹침.
 * 같은 propertyId에서 id가 다른 confirmed 행이 하나라도 겹치면 throw.
 *
 * 동일 매물에 대한 확정을 직렬화하기 위해 pg_advisory_xact_lock(propertyId)를 사용한다.
 */
export async function assertNoOverlapWithConfirmedBookings(
  tx: PaymentRaceGuardTx,
  args: {
    bookingId: string;
    propertyId: string;
    checkInDate: Date;
    checkOutDate: Date;
  },
): Promise<void> {
  await tx.$executeRawUnsafe(
    `SELECT pg_advisory_xact_lock(842001, abs(hashtext($1::text))::integer)`,
    args.propertyId,
  );

  const rows = await tx.$queryRawUnsafe<Array<{ c: bigint }>>(
    `
    SELECT COUNT(*)::bigint AS c
    FROM "Booking" b
    WHERE b."propertyId" = $1
      AND b."id" <> $2
      AND b."status" = 'confirmed'
      AND b."checkInDate" < $4
      AND b."checkOutDate" > $3
    `,
    args.propertyId,
    args.bookingId,
    args.checkInDate,
    args.checkOutDate,
  );

  const raw = rows[0]?.c;
  const count =
    typeof raw === 'bigint' ? Number(raw) : Number(raw == null ? 0 : raw);
  if (count > 0) {
    throw new AlreadyBookedConflictError(args.bookingId, args.propertyId);
  }
}
