import { fetchWithRetry } from "@/lib/runtime/networkResilience";
import type { PropertyData } from "@/types/property";
import {
  parseAppPropertiesListPayload,
  parseAppPropertyDetailPayload,
} from "./appPropertyApiParse";
import { withAppActor } from "./withAppActor";

/** `GET /api/app/properties/mine` — 목록 페이징(호스트 내 매물). */
export async function fetchAppPropertiesMine(params: {
  limit?: number;
  offset?: number;
}): Promise<ReturnType<typeof parseAppPropertiesListPayload>> {
  const limit = params.limit ?? 100;
  const offset = params.offset ?? 0;
  const res = await fetchWithRetry(
    `/api/app/properties/mine?limit=${limit}&offset=${offset}`,
    withAppActor({ cache: "no-store" }),
    { retries: 2, baseDelayMs: 300 },
  );
  if (!res.ok) {
    throw new Error(String(res.status));
  }
  return parseAppPropertiesListPayload(await res.json());
}

/** `PUT /api/app/properties/[id]` — 서버가 `appApiOk({ property })` 를 반환한다고 가정. */
export async function putAppPropertyById(property: PropertyData): Promise<void> {
  if (typeof window === "undefined") return;
  const pid = property.id;
  if (!pid) throw new Error("property id required");
  const res = await fetchWithRetry(
    `/api/app/properties/${encodeURIComponent(pid)}`,
    withAppActor({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property }),
    }),
    { retries: 2, baseDelayMs: 300 },
  );
  if (!res.ok) {
    throw new Error(String(res.status));
  }
  const parsed = parseAppPropertyDetailPayload(await res.json());
  if (!parsed) {
    throw new Error("invalid_put_response");
  }
}
