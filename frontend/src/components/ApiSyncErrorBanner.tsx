"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UserFacingSyncError } from "@/lib/runtime/networkResilience";
import { refreshUsersFromServer } from "@/lib/api/auth";
import { refreshPropertiesFromServer } from "@/lib/api/properties";
import { refreshBookingsFromServer } from "@/lib/api/bookings";

type BannerState = UserFacingSyncError & {
  id: string;
};

const MAX_VISIBLE = 4;

function makeId(): string {
  return `sync_err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ApiSyncErrorBanner() {
  const [queue, setQueue] = useState<BannerState[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    const onSyncError = (event: Event) => {
      const custom = event as CustomEvent<UserFacingSyncError>;
      if (!custom.detail?.message) return;
      const next: BannerState = { ...custom.detail, id: makeId() };
      setQueue((q) => [next, ...q].slice(0, MAX_VISIBLE));
    };

    window.addEventListener("stayviet-api-sync-error", onSyncError as EventListener);
    return () => {
      window.removeEventListener("stayviet-api-sync-error", onSyncError as EventListener);
    };
  }, []);

  const retryLabel = useCallback((item: BannerState) => {
    if (item.area === "users") return "Retry users";
    if (item.area === "properties") return "Retry properties";
    if (item.area === "bookings") return "Retry bookings";
    return "Retry";
  }, []);

  const handleRetry = useCallback(async (item: BannerState) => {
    setRetryingId(item.id);
    try {
      if (item.area === "users") {
        await refreshUsersFromServer();
      } else if (item.area === "properties") {
        await refreshPropertiesFromServer();
      } else if (item.area === "bookings") {
        await refreshBookingsFromServer();
      } else {
        window.location.reload();
        return;
      }
      setQueue((q) => q.filter((x) => x.id !== item.id));
    } finally {
      setRetryingId(null);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setQueue((q) => q.filter((x) => x.id !== id));
  }, []);

  const visibleCount = queue.length;
  const stackSummary = useMemo(
    () => (visibleCount > 1 ? `${visibleCount} sync issues` : null),
    [visibleCount]
  );

  if (queue.length === 0) return null;

  return (
    <div className="fixed left-1/2 top-3 z-[100] flex w-[min(92vw,560px)] -translate-x-1/2 flex-col gap-2">
      {stackSummary ? (
        <p className="text-center text-xs font-medium text-red-800 drop-shadow-sm">{stackSummary}</p>
      ) : null}
      {queue.map((current) => (
        <div
          key={current.id}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Sync issue detected</p>
              <p className="mt-1 text-sm text-red-700">{current.message}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => handleRetry(current)}
                disabled={retryingId === current.id}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {retryingId === current.id ? "Retrying..." : retryLabel(current)}
              </button>
              <button
                type="button"
                onClick={() => dismiss(current.id)}
                className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
