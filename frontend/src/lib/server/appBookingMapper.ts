import { Prisma, type Booking as PrismaBooking } from '@prisma/client';
import type { BookingData } from '@/lib/api/bookings';

function parseDt(v: string | Date | undefined): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  const d = v ? new Date(String(v)) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

export function prismaBookingToBookingData(row: PrismaBooking): BookingData {
  const detail = (row.detailJson || {}) as Partial<BookingData>;
  return {
    ...detail,
    id: row.id,
    propertyId: row.propertyId,
    guestId: row.guestId,
    checkInDate: row.checkInDate.toISOString(),
    checkOutDate: row.checkOutDate.toISOString(),
    totalPrice: row.totalPrice,
    status: row.status as BookingData['status'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } as BookingData;
}

export function bookingDataToUncheckedCreate(b: BookingData): Prisma.BookingUncheckedCreateInput {
  const id = b.id;
  if (!id) throw new Error('booking id required');
  return {
    id,
    propertyId: b.propertyId,
    guestId: b.guestId,
    checkInDate: parseDt(b.checkInDate),
    checkOutDate: parseDt(b.checkOutDate),
    totalPrice: b.totalPrice,
    status: String(b.status || 'pending'),
    detailJson: JSON.parse(JSON.stringify(b)) as Prisma.InputJsonValue,
  };
}

export function bookingDataToUncheckedUpdate(b: BookingData): Prisma.BookingUncheckedUpdateInput {
  return {
    propertyId: b.propertyId,
    guestId: b.guestId,
    checkInDate: parseDt(b.checkInDate),
    checkOutDate: parseDt(b.checkOutDate),
    totalPrice: b.totalPrice,
    status: String(b.status || 'pending'),
    detailJson: JSON.parse(JSON.stringify(b)) as Prisma.InputJsonValue,
    updatedAt: new Date(),
  };
}
