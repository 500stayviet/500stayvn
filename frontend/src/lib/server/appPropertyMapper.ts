import { Prisma, type Property as PrismaProperty } from '@prisma/client';
import type { PropertyData } from '@/types/property';

type ExtraJson = {
  history?: PropertyData['history'];
  icalPlatform?: string;
  icalCalendarName?: string;
  icalUrl?: string;
  propertyType?: string;
  cleaningPerWeek?: number;
  petAllowed?: boolean;
  petFee?: number;
  maxPets?: number;
  cityId?: string;
  districtId?: string;
};

function parseDateInput(v: string | Date | undefined | null): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function toIso(v: Date | null | undefined): string | undefined {
  if (!v) return undefined;
  return v.toISOString();
}

export function prismaPropertyToPropertyData(p: PrismaProperty): PropertyData {
  const ex = (p.extraJson || {}) as ExtraJson;
  const lat = p.lat ?? 0;
  const lng = p.lng ?? 0;

  return {
    id: p.id,
    title: p.title,
    original_description: p.original_description ?? '',
    translated_description: p.translated_description ?? '',
    price: p.price,
    priceUnit: (p.priceUnit as PropertyData['priceUnit']) || 'vnd',
    area: p.area,
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    coordinates: { lat, lng },
    address: p.address,
    unitNumber: p.unitNumber ?? undefined,
    images: p.images ?? [],
    amenities: p.amenities ?? [],
    maxAdults: p.maxAdults ?? undefined,
    maxChildren: p.maxChildren ?? undefined,
    ownerId: p.ownerId,
    checkInDate: toIso(p.checkInDate) ?? undefined,
    checkOutDate: toIso(p.checkOutDate) ?? undefined,
    checkInTime: p.checkInTime ?? undefined,
    checkOutTime: p.checkOutTime ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    status: (p.status as PropertyData['status']) ?? 'active',
    hidden: p.hidden,
    deleted: p.deleted,
    deletedAt: toIso(p.deletedAt),
    history: ex.history,
    icalPlatform: ex.icalPlatform,
    icalCalendarName: ex.icalCalendarName,
    icalUrl: ex.icalUrl,
    propertyType: ex.propertyType,
    cleaningPerWeek: ex.cleaningPerWeek,
    petAllowed: ex.petAllowed,
    petFee: ex.petFee,
    maxPets: ex.maxPets,
    cityId: ex.cityId,
    districtId: ex.districtId,
  };
}

function buildExtraJson(p: PropertyData): ExtraJson {
  const ex: ExtraJson = {};
  if (p.history?.length) ex.history = p.history;
  if (p.icalPlatform) ex.icalPlatform = p.icalPlatform;
  if (p.icalCalendarName) ex.icalCalendarName = p.icalCalendarName;
  if (p.icalUrl) ex.icalUrl = p.icalUrl;
  if (p.propertyType) ex.propertyType = p.propertyType;
  if (p.cleaningPerWeek != null) ex.cleaningPerWeek = p.cleaningPerWeek;
  if (p.petAllowed != null) ex.petAllowed = p.petAllowed;
  if (p.petFee != null) ex.petFee = p.petFee;
  if (p.maxPets != null) ex.maxPets = p.maxPets;
  if (p.cityId) ex.cityId = p.cityId;
  if (p.districtId) ex.districtId = p.districtId;
  return ex;
}

function baseScalars(p: PropertyData) {
  const extra = buildExtraJson(p);
  return {
    title: p.title,
    original_description: p.original_description ?? null,
    translated_description: p.translated_description ?? null,
    price: p.price,
    priceUnit: p.priceUnit || 'vnd',
    area: p.area,
    bedrooms: p.bedrooms ?? 0,
    bathrooms: p.bathrooms ?? 0,
    lat: p.coordinates?.lat ?? null,
    lng: p.coordinates?.lng ?? null,
    address: (p.address || '').trim() || '—',
    unitNumber: p.unitNumber ?? null,
    images: p.images ?? [],
    amenities: p.amenities ?? [],
    maxAdults: p.maxAdults ?? 2,
    maxChildren: p.maxChildren ?? 0,
    status: String(p.status || 'active'),
    ownerId: p.ownerId || '',
    checkInDate: parseDateInput(p.checkInDate),
    checkOutDate: parseDateInput(p.checkOutDate),
    checkInTime: p.checkInTime ?? null,
    checkOutTime: p.checkOutTime ?? null,
    hidden: p.hidden ?? false,
    deleted: p.deleted ?? false,
    deletedAt: parseDateInput(p.deletedAt ?? null),
    extraJson: (Object.keys(extra).length > 0 ? extra : {}) as Prisma.InputJsonValue,
  };
}

export function propertyDataToUncheckedCreate(
  p: PropertyData
): Prisma.PropertyUncheckedCreateInput {
  if (!p.id) throw new Error('property id required');
  const cAt = parseDateInput(p.createdAt as string);
  const uAt = parseDateInput(p.updatedAt as string);
  return {
    id: p.id,
    ...baseScalars(p),
    createdAt: cAt ?? undefined,
    updatedAt: uAt ?? undefined,
  };
}

export function propertyDataToUncheckedUpdate(
  p: PropertyData
): Prisma.PropertyUncheckedUpdateInput {
  return {
    ...baseScalars(p),
    updatedAt: new Date(),
  };
}
