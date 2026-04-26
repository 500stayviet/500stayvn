import type { PropertyData } from "@/types/property";
import { unwrapAppApiData } from "@/lib/api/appApiEnvelope";

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
  const data = unwrapAppApiData<{
    properties?: PropertyData[];
    page?: AppPropertiesListPage;
  }>(raw);
  return {
    properties: Array.isArray(data.properties) ? data.properties : [],
    page: data.page,
  };
}

/** `GET /api/app/properties/[id]` · `PUT` 성공 본문 — envelope + 레거시. */
export function parseAppPropertyDetailPayload(raw: unknown): PropertyData | null {
  const root = unwrapAppApiData<{ property?: PropertyData }>(raw);
  if (root && typeof root === "object" && "property" in root) {
    return root.property ?? null;
  }
  return null;
}
