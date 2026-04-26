import type { PropertyData } from "@/types/property";

export type AppPropertiesListPage = {
  hasMore?: boolean;
  nextOffset?: number;
  limit?: number;
  offset?: number;
  nextCursor?: string | null;
};

/** `GET /api/app/properties` · `GET /api/app/properties/mine` — envelope + 레거시(목/구 클라이언트). */
export function parseAppPropertiesListPayload(raw: unknown): {
  properties: PropertyData[];
  page?: AppPropertiesListPage;
} {
  if (raw && typeof raw === "object" && "ok" in raw) {
    const envelope = raw as { ok?: boolean; data?: unknown };
    if (envelope.ok === true && envelope.data && typeof envelope.data === "object") {
      const data = envelope.data as {
        properties?: PropertyData[];
        page?: AppPropertiesListPage;
      };
      return {
        properties: Array.isArray(data.properties) ? data.properties : [],
        page: data.page,
      };
    }
  }
  const legacy = raw as { properties?: PropertyData[]; page?: AppPropertiesListPage };
  return {
    properties: Array.isArray(legacy.properties) ? legacy.properties : [],
    page: legacy.page,
  };
}

/** `GET /api/app/properties/[id]` · `PUT` 성공 본문 — envelope + 레거시. */
export function parseAppPropertyDetailPayload(raw: unknown): PropertyData | null {
  if (raw && typeof raw === "object" && "ok" in raw) {
    const envelope = raw as { ok?: boolean; data?: unknown };
    if (envelope.ok === true && envelope.data && typeof envelope.data === "object") {
      const data = envelope.data as { property?: PropertyData };
      return data.property ?? null;
    }
  }
  const legacy = raw as { property?: PropertyData };
  return legacy.property ?? null;
}
