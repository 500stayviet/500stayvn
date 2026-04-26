import type { BookingData, readBookingsArray, writeBookingsArray } from "./bookings";
import type { PropertyData } from "@/types/property";
import type { ReservationData } from "./reservations";

type HandleCancellationDeps = {
  getProperty: (id: string) => Promise<PropertyData | null>;
  readPropertiesArray: () => PropertyData[];
  writePropertiesArray: (all: PropertyData[]) => void;
  getReservationsByOwner: (
    ownerId: string,
    status?: "all" | "active" | "completed",
  ) => Promise<ReservationData[]>;
  toISODateString: (date: Date | string) => string;
  isParentPropertyRecord: (property: PropertyData) => boolean;
  isDateOverlap: (
    range1: { start: Date | string; end: Date | string },
    range2: { start: Date | string; end: Date | string },
  ) => boolean;
  isDateRangeBooked: (
    propertyId: string,
    checkIn: Date | string,
    checkOut: Date | string,
  ) => Promise<boolean>;
  updateProperty: (id: string, updates: Partial<PropertyData>) => Promise<void>;
};

type RecalculateDeps = {
  getProperty: (id: string) => Promise<PropertyData | null>;
  getBooking: (id: string) => Promise<BookingData | null>;
  getAllBookings: () => Promise<BookingData[]>;
  readPropertiesArray: () => PropertyData[];
  writePropertiesArray: (all: PropertyData[]) => void;
  readBookingsArray: typeof readBookingsArray;
  writeBookingsArray: typeof writeBookingsArray;
  updateProperty: (id: string, updates: Partial<PropertyData>) => Promise<void>;
  toISODateString: (date: Date | string) => string;
};

export async function handleCancellationRelistLifecycle(
  propertyId: string,
  ownerId: string,
  deps: HandleCancellationDeps,
): Promise<{
  type: "merged" | "relisted" | "limit_exceeded" | "short_term";
  targetId?: string;
}> {
  if (typeof window === "undefined") {
    return { type: "relisted" };
  }
  const property = await deps.getProperty(propertyId);
  if (!property) throw new Error("PropertyNotFound");

  const allProperties = deps.readPropertiesArray();

  if (propertyId.includes("_child_")) {
    const normalize = (s: string | undefined) =>
      (s || "").trim().replace(/\s+/g, " ").toLowerCase();
    const targetAddress = normalize(property.address);
    const targetTitle = normalize(property.title);
    const targetUnit = normalize(property.unitNumber);

    const reservations = await deps.getReservationsByOwner(ownerId, "all");
    reservations
      .filter((r) => {
        if (r.status !== "pending" && r.status !== "confirmed") return false;
        const reservedProp = allProperties.find((p) => p.id === r.propertyId);
        if (!reservedProp) return false;
        const bookedAddress = normalize(reservedProp.address);
        const bookedTitle = normalize(reservedProp.title);
        const bookedUnit = normalize(reservedProp.unitNumber);
        return (
          ((targetAddress !== "" &&
            bookedAddress !== "" &&
            targetAddress === bookedAddress) ||
            (targetTitle !== "" &&
              bookedTitle !== "" &&
              targetTitle === bookedTitle)) &&
          targetUnit === bookedUnit
        );
      })
      .map((r) => ({
        checkIn: new Date(deps.toISODateString(r.checkInDate)),
        checkOut: new Date(deps.toISODateString(r.checkOutDate)),
      }));

    const childStart = deps.toISODateString(property.checkInDate!);
    const childEnd = deps.toISODateString(property.checkOutDate!);

    const parentCandidates = allProperties.filter(
      (p) =>
        !p.deleted &&
        deps.isParentPropertyRecord(p) &&
        p.ownerId === ownerId &&
        normalize(p.address) === targetAddress &&
        normalize(p.unitNumber) === targetUnit,
    );

    const pickMostRecentParent = (arr: PropertyData[]) => {
      return [...arr].sort((a, b) => {
        const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bt - at;
      })[0];
    };

    const nowISO = new Date().toISOString();

    if (parentCandidates.length > 0) {
      const parent = pickMostRecentParent(parentCandidates);
      const parentIndex = allProperties.findIndex((p) => p.id === parent.id);
      if (parentIndex === -1) return { type: "merged" };

      const parentStart = deps.toISODateString(parent.checkInDate!);
      const parentEnd = deps.toISODateString(parent.checkOutDate!);
      const mergedStart = parentStart < childStart ? parentStart : childStart;
      const mergedEnd = parentEnd > childEnd ? parentEnd : childEnd;

      allProperties[parentIndex] = {
        ...allProperties[parentIndex],
        checkInDate: mergedStart,
        checkOutDate: mergedEnd,
        status: "pending",
        updatedAt: nowISO,
        history: [
          ...(allProperties[parentIndex].history || []),
          {
            action: "RESERVATION_CANCEL_PENDING",
            timestamp: nowISO,
            details: `Attached cancelled child (${propertyId}) to existing parent (${parent.id})`,
          },
        ],
      };

      deps.writePropertiesArray(allProperties.filter((p) => p.id !== propertyId));
      return { type: "short_term", targetId: parent.id };
    }

    const newParentId = `prop_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const newParent: PropertyData = {
      ...property,
      id: newParentId,
      checkInDate: childStart,
      checkOutDate: childEnd,
      status: "pending",
      deleted: false,
      deletedAt: undefined,
      hidden: false,
      createdAt: property.createdAt || nowISO,
      updatedAt: nowISO,
      history: [
        ...(property.history || []),
        {
          action: "RESERVATION_CANCEL_PENDING",
          timestamp: nowISO,
          details: `Promoted cancelled child (${propertyId}) to a parent listing`,
        },
      ],
    };

    deps.writePropertiesArray(
      allProperties.filter((p) => p.id !== propertyId).concat(newParent),
    );
    return { type: "short_term", targetId: newParentId };
  }

  const mergeTargetIndex = allProperties.findIndex(
    (p) =>
      !p.deleted &&
      p.id !== propertyId &&
      p.ownerId === ownerId &&
      (p.status === "active" || p.status === "pending") &&
      (p.address === property.address || p.title === property.title) &&
      p.unitNumber === property.unitNumber,
  );

  if (mergeTargetIndex !== -1) {
    const target = allProperties[mergeTargetIndex];
    const range1 = {
      start: deps.toISODateString(property.checkInDate!),
      end: deps.toISODateString(property.checkOutDate!),
    };
    const range2 = {
      start: deps.toISODateString(target.checkInDate!),
      end: deps.toISODateString(target.checkOutDate!),
    };

    if (!deps.isDateOverlap(range1, range2)) {
      const isBooked = await deps.isDateRangeBooked(
        propertyId,
        range1.start,
        range1.end,
      );
      if (!isBooked) {
        const propUpdateDate = new Date(
          property.updatedAt || property.createdAt,
        ).getTime();
        const targetUpdateDate = new Date(
          target.updatedAt || target.createdAt,
        ).getTime();

        if (propUpdateDate > targetUpdateDate) {
          target.price = property.price;
          target.amenities = property.amenities;
          target.images = property.images;
          target.title = property.title;
          target.updatedAt = property.updatedAt;
        }

        const newStart = range1.start < range2.start ? range1.start : range2.start;
        const newEnd = range1.end > range2.end ? range1.end : range2.end;
        target.checkInDate = newStart;
        target.checkOutDate = newEnd;
        target.status = "pending";
        target.history = [
          ...(target.history || []),
          {
            action: "MERGE_FROM_CANCELLED",
            timestamp: new Date().toISOString(),
            details: `Merged with cancelled property. New range: ${newStart}~${newEnd}`,
          },
        ];

        deps.writePropertiesArray(allProperties.filter((p) => p.id !== propertyId));
        return { type: "short_term", targetId: target.id };
      }
    }
  }

  await deps.getReservationsByOwner(ownerId, "all");
  await deps.updateProperty(propertyId, {
    status: "pending",
    history: [
      ...(property.history || []),
      {
        action: "RESERVATION_CANCEL_PENDING",
        timestamp: new Date().toISOString(),
        details: "Reservation cancelled — pending relist required",
      },
    ],
  });
  return { type: "short_term" };
}

export async function recalculateAndSplitPropertyLifecycle(
  propertyId: string,
  bookingId: string | undefined,
  deps: RecalculateDeps,
): Promise<void> {
  if (typeof window === "undefined") return;
  const property = await deps.getProperty(propertyId);
  if (!property || property.deleted) return;
  if (propertyId.includes("_child_")) return;

  let booking: BookingData | undefined | null;
  if (bookingId) {
    booking = await deps.getBooking(bookingId);
  }

  if (!booking) {
    const allBookings = await deps.getAllBookings();
    booking = allBookings
      .filter(
        (b) =>
          b.propertyId === propertyId &&
          (b.paymentStatus === "paid" || b.status === "confirmed"),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )[0];
  }

  if (!booking) {
    console.error(
      "[recalculateAndSplitProperty] No valid booking found for property:",
      propertyId,
    );
    return;
  }

  const validBooking = booking as any;
  const bookedStart = deps.toISODateString(validBooking.checkInDate);
  const bookedEnd = deps.toISODateString(validBooking.checkOutDate);
  const childId = `prop_child_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 5)}`;
  const {
    id: _,
    history: __,
    status: ___,
    checkInDate: ____,
    checkOutDate: _____,
    ...baseData
  } = property;

  const childProp: PropertyData = {
    ...baseData,
    id: childId,
    checkInDate: bookedStart,
    checkOutDate: bookedEnd,
    status: "rented",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        action: "CHILD_CREATED_RENTED",
        timestamp: new Date().toISOString(),
        details: `Created from parent ${propertyId} for period ${bookedStart}~${bookedEnd}`,
      },
    ],
  };

  const allProps = deps.readPropertiesArray();
  allProps.push(childProp);
  deps.writePropertiesArray(allProps);

  const bookings = deps.readBookingsArray();
  const bIndex = bookings.findIndex((b) => b.id === booking.id);
  if (bIndex !== -1) {
    bookings[bIndex] = { ...bookings[bIndex], propertyId: childId };
    deps.writeBookingsArray(bookings);
  }

  await deps.updateProperty(propertyId, {
    history: [
      ...(property.history || []),
      {
        action: "PARENT_PARTIAL_RENTED",
        timestamp: new Date().toISOString(),
        details: `Partially rented (${bookedStart}~${bookedEnd}). Child: ${childId}`,
      },
    ],
  });
}
