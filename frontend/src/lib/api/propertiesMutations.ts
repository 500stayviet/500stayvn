import type { PropertyData } from "@/types/property";
import { unwrapAppApiData } from "@/lib/api/appApiEnvelope";

type MutationDeps = {
  hydratePropertiesMemoryIfLoggedIn: () => Promise<void>;
  readPropertiesArray: () => PropertyData[];
  writePropertiesArray: (all: PropertyData[]) => void;
  syncPropertiesNow: (snapshot: PropertyData[]) => Promise<void>;
  serializeDate: (date: unknown) => string | undefined;
  toISODateString: (date: Date | string) => string;
  isDateOverlap: (
    range1: { start: Date | string; end: Date | string },
    range2: { start: Date | string; end: Date | string },
  ) => boolean;
  isDateRangeBooked: (
    propertyId: string,
    checkIn: Date | string,
    checkOut: Date | string,
  ) => Promise<boolean>;
  getProperty: (id: string) => Promise<PropertyData | null>;
  updateProperty: (id: string, updates: Partial<PropertyData>) => Promise<void>;
  fetchWithRetry: typeof import("@/lib/runtime/networkResilience").fetchWithRetry;
  withAppActor: typeof import("./withAppActor").withAppActor;
  postAppPropertyActionLog: typeof import("./adminPropertyActionLogs").postAppPropertyActionLog;
};

export async function addPropertyMutation(
  property: Omit<PropertyData, "id" | "createdAt" | "updatedAt">,
  deps: MutationDeps,
): Promise<string> {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return "";
  }

  const payload = { ...property };
  if (!payload.ownerId) throw new Error("ownerId is required");
  if (!property.coordinates || !property.coordinates.lat || !property.coordinates.lng) {
    throw new Error("coordinates are required");
  }

  await deps.hydratePropertiesMemoryIfLoggedIn();
  const properties = deps.readPropertiesArray();
  const normalize = (s?: string) => (s || "").trim().replace(/\s+/g, " ").toLowerCase();
  const existingIndex = properties.findIndex(
    (p) =>
      !p.deleted &&
      p.ownerId === payload.ownerId &&
      normalize(p.address) === normalize(payload.address) &&
      normalize(p.unitNumber) === normalize(payload.unitNumber),
  );

  const now = new Date();
  const nowISO = now.toISOString();

  if (existingIndex !== -1) {
    const existingProp = properties[existingIndex];
    const newRange = {
      start: deps.toISODateString(payload.checkInDate!),
      end: deps.toISODateString(payload.checkOutDate!),
    };
    const existingRange = {
      start: deps.toISODateString(existingProp.checkInDate!),
      end: deps.toISODateString(existingProp.checkOutDate!),
    };
    if (deps.isDateOverlap(newRange, existingRange)) {
      throw new Error("OverlapDetected");
    }

    const isBooked = await deps.isDateRangeBooked(
      existingProp.id!,
      newRange.start,
      newRange.end,
    );
    if (isBooked) throw new Error("AlreadyBooked");

    const mergedStart =
      newRange.start < existingRange.start ? newRange.start : existingRange.start;
    const mergedEnd =
      newRange.end > existingRange.end ? newRange.end : existingRange.end;

    const updatedProp: PropertyData = {
      ...existingProp,
      ...payload,
      id: existingProp.id,
      checkInDate: mergedStart,
      checkOutDate: mergedEnd,
      updatedAt: nowISO,
      status: "active",
      deleted: false,
      history: [
        ...(existingProp.history || []),
        {
          action: "MERGE_UPDATE",
          timestamp: nowISO,
          details: `Property range expanded: ${mergedStart} ~ ${mergedEnd} (Added: ${newRange.start} ~ ${newRange.end})`,
        },
      ],
    };

    properties[existingIndex] = updatedProp;
    deps.writePropertiesArray(properties);
    await deps.syncPropertiesNow(properties);
    return existingProp.id!;
  }

  const id = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newProperty: PropertyData = {
    ...payload,
    id,
    checkInDate: deps.serializeDate(payload.checkInDate),
    checkOutDate: deps.serializeDate(payload.checkOutDate),
    createdAt: deps.serializeDate(now),
    updatedAt: deps.serializeDate(now),
    status: payload.status || "active",
    deleted: false,
    history: [
      {
        action: "CREATE",
        timestamp: nowISO,
        details: "Initial property registration",
      },
    ],
  };

  properties.push(newProperty);
  deps.writePropertiesArray(properties);
  await deps.syncPropertiesNow(properties);
  return id;
}

export async function updatePropertyMutation(
  id: string,
  updates: Partial<PropertyData>,
  deps: Pick<
    MutationDeps,
    "hydratePropertiesMemoryIfLoggedIn" | "readPropertiesArray" | "writePropertiesArray" | "serializeDate"
  > & { putAppPropertyById: (p: PropertyData) => Promise<void> },
): Promise<void> {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  await deps.hydratePropertiesMemoryIfLoggedIn();
  const properties = deps.readPropertiesArray();
  const index = properties.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(`Property with id ${id} not found`);

  const now = new Date();
  let checkInDateValue = properties[index].checkInDate;
  if ("checkInDate" in updates) {
    checkInDateValue =
      updates.checkInDate === undefined || updates.checkInDate === null
        ? undefined
        : deps.serializeDate(updates.checkInDate);
  }

  let checkOutDateValue = properties[index].checkOutDate;
  if ("checkOutDate" in updates) {
    checkOutDateValue =
      updates.checkOutDate === undefined || updates.checkOutDate === null
        ? undefined
        : deps.serializeDate(updates.checkOutDate);
  }

  const { checkInDate: stripIn, checkOutDate: stripOut, ...otherUpdates } = updates;
  void stripIn;
  void stripOut;
  const updatedProperty: PropertyData = {
    ...properties[index],
    ...otherUpdates,
    id,
    checkInDate: checkInDateValue,
    checkOutDate: checkOutDateValue,
    updatedAt: deps.serializeDate(now),
  };

  properties[index] = updatedProperty;
  deps.writePropertiesArray(properties);
  await deps.putAppPropertyById(updatedProperty);
}

export async function deletePropertyMutation(
  id: string,
  deps: Pick<
    MutationDeps,
    "hydratePropertiesMemoryIfLoggedIn" | "readPropertiesArray" | "writePropertiesArray" | "serializeDate"
  >,
): Promise<void> {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  await deps.hydratePropertiesMemoryIfLoggedIn();
  const properties = deps.readPropertiesArray();
  const index = properties.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(`Property with id ${id} not found`);

  const now = new Date();
  properties[index] = {
    ...properties[index],
    deleted: true,
    deletedAt: deps.serializeDate(now),
    status: "inactive",
  };
  deps.writePropertiesArray(properties);
}

export async function hostEndAdvertisingPropertyMutation(
  propertyId: string,
  reason: string | undefined,
  deps: Pick<MutationDeps, "getProperty" | "updateProperty" | "fetchWithRetry" | "withAppActor">,
): Promise<void> {
  const property = await deps.getProperty(propertyId);
  if (!property) throw new Error("PropertyNotFound");
  if (property.deleted) return;

  const nowISO = new Date().toISOString();
  const history = property.history || [];
  await deps.updateProperty(propertyId, {
    status: "INACTIVE_SHORT_TERM",
    hidden: false,
    history: [
      ...history,
      {
        action: "HOST_MANUAL_END_AD",
        timestamp: nowISO,
        details: reason ? `Host ended: ${reason}` : "Host ended advertisement",
      },
    ],
  });

  try {
    const auditRes = await deps.fetchWithRetry(
      "/api/app/moderation-audit",
      deps.withAppActor({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "property_ad_ended_by_host",
          targetType: "property",
          targetId: propertyId,
          reason: reason ?? undefined,
        }),
      }),
      { retries: 1, baseDelayMs: 400 },
    );
    if (auditRes.ok) {
      unwrapAppApiData(await auditRes.json());
    }
  } catch {
    // Keep core flow successful even if audit write fails.
  }
}

export async function hostDeletePropertySoftMutation(
  propertyId: string,
  deps: Pick<MutationDeps, "getProperty"> & { deleteProperty: (id: string) => Promise<void> },
): Promise<void> {
  const property = await deps.getProperty(propertyId);
  if (!property) throw new Error("PropertyNotFound");
  if (property.deleted) return;

  await deps.deleteProperty(propertyId);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("propertiesUpdated"));
  }
}

export async function restorePropertyMutation(
  id: string,
  deps: Pick<
    MutationDeps,
    "hydratePropertiesMemoryIfLoggedIn" | "readPropertiesArray" | "writePropertiesArray"
  >,
): Promise<void> {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  await deps.hydratePropertiesMemoryIfLoggedIn();
  const properties = deps.readPropertiesArray();
  const index = properties.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(`Property with id ${id} not found`);

  properties[index] = {
    ...properties[index],
    deleted: false,
    deletedAt: undefined,
    status: "active",
  };
  deps.writePropertiesArray(properties);
}

export async function permanentlyDeletePropertyMutation(
  id: string,
  deletedBy: string | undefined,
  deps: Pick<
    MutationDeps,
    | "hydratePropertiesMemoryIfLoggedIn"
    | "readPropertiesArray"
    | "writePropertiesArray"
    | "postAppPropertyActionLog"
    | "withAppActor"
  >,
): Promise<void> {
  if (typeof window === "undefined") return;
  await deps.hydratePropertiesMemoryIfLoggedIn();
  const properties = deps.readPropertiesArray();
  const propertyIndex = properties.findIndex((p) => p.id === id);
  if (propertyIndex === -1) throw new Error(`Property with id ${id} not found`);

  const deletedProperty = properties[propertyIndex];
  const logged = await deps.postAppPropertyActionLog({
    propertyId: id,
    actionType: "DELETED",
    snapshot: deletedProperty,
    ownerId: deletedProperty.ownerId,
    reason: deletedBy ? `deletedBy:${deletedBy}` : undefined,
  });
  if (!logged) {
    console.warn(
      "[permanentlyDeleteProperty] server action log failed; continuing delete",
    );
  }

  deps.writePropertiesArray(properties.filter((p) => p.id !== id));
  void fetch(
    `/api/app/properties/${encodeURIComponent(id)}`,
    deps.withAppActor({ method: "DELETE" }),
  ).catch(() => {});
}
