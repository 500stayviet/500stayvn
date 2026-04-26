import type { PropertyData } from "@/types/property";
import type { withAppActor } from "./withAppActor";
import type { fetchWithRetry, emitUserFacingSyncError } from "@/lib/runtime/networkResilience";
import type { postAppPropertyActionLog } from "./adminPropertyActionLogs";

export interface CancelledPropertyLog {
  id: string;
  propertyId: string;
  reservationId?: string;
  cancelledAt: string;
  ownerId: string;
}

const PROPS_BOOTSTRAP_KEY = "stayviet-properties-bootstrap-v1";
const PROPS_BOOTSTRAP_SESSION_KEY = "stayviet-properties-bootstrap-session-v1";

type SyncDeps = {
  fetchWithRetry: typeof fetchWithRetry;
  withAppActor: typeof withAppActor;
  emitUserFacingSyncError: typeof emitUserFacingSyncError;
  getPropertySyncErrorMessage: (status: number | null) => string;
};

export async function syncPropertiesNowRuntime(
  snapshot: PropertyData[],
  deps: SyncDeps,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await deps.fetchWithRetry(
      "/api/app/properties",
      deps.withAppActor({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties: snapshot }),
      }),
      { retries: 2, baseDelayMs: 300 },
    );
    if (!res.ok) throw new Error(String(res.status));
  } catch (e) {
    const code = e instanceof Error ? Number(e.message) : Number.NaN;
    const status = Number.isFinite(code) ? code : null;
    console.warn("[properties] immediate PUT sync failed", e);
    deps.emitUserFacingSyncError({
      area: "properties",
      action: "sync",
      message: deps.getPropertySyncErrorMessage(status),
    });
    throw e;
  }
}

export async function bootstrapPropertiesFromServerRuntime(deps: {
  ensurePropertiesLoadedForApp: () => Promise<boolean | void>;
  markLedgerBootstrapDone: (key: string, sessionKey: string) => void;
}): Promise<void> {
  if (typeof window === "undefined") return;
  await deps.ensurePropertiesLoadedForApp();
  deps.markLedgerBootstrapDone(PROPS_BOOTSTRAP_KEY, PROPS_BOOTSTRAP_SESSION_KEY);
}

export async function logCancelledPropertyRuntime(
  log: Omit<CancelledPropertyLog, "id" | "cancelledAt">,
  deps: { postAppPropertyActionLog: typeof postAppPropertyActionLog },
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await deps.postAppPropertyActionLog({
      propertyId: log.propertyId,
      actionType: "CANCELLED",
      reservationId: log.reservationId,
      ownerId: log.ownerId,
    });
  } catch (error) {
    console.error("Error logging cancelled property:", error);
  }
}

export async function reRegisterPropertyRuntime(
  id: string,
  deps: {
    getProperty: (propertyId: string) => Promise<PropertyData | null>;
    isDateRangeBooked: (
      propertyId: string,
      checkIn: Date | string,
      checkOut: Date | string,
    ) => Promise<boolean>;
    updateProperty: (propertyId: string, updates: Partial<PropertyData>) => Promise<void>;
  },
): Promise<void> {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  const property = await deps.getProperty(id);
  if (!property) throw new Error("Property not found");

  const isBooked = await deps.isDateRangeBooked(id, property.checkInDate!, property.checkOutDate!);
  if (isBooked) throw new Error("AlreadyBookedInPeriod");

  await deps.updateProperty(id, {
    status: "active",
    deleted: false,
    deletedAt: undefined,
  });
}
