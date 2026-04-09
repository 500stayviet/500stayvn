"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UserFacingSyncError } from "@/lib/runtime/networkResilience";
import { refreshUsersFromServer } from "@/lib/api/auth";
import { refreshPropertiesFromServer } from "@/lib/api/properties";
import { refreshBookingsFromServer } from "@/lib/api/bookings";

type BannerState = UserFacingSyncError & {
  id: string;
};

function makeId(): string {
  return `sync_err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ApiSyncErrorBanner() {
  const [current, setCurrent] = useState<BannerState | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const onSyncError = (event: Event) => {
      const custom = event as CustomEvent<UserFacingSyncError>;
      if (!custom.detail?.message) return;
      setCurrent({
        ...custom.detail,
        id: makeId(),
      });
    };

    window.addEventListener("stayviet-api-sync-error", onSyncError as EventListener);
    return () => {
      window.removeEventListener("stayviet-api-sync-error", onSyncError as EventListener);
    };
  }, []);

  const retryLabel = useMemo(() => {
    if (!current) return "Retry";
    if (current.area === "users") return "Retry users";
    if (current.area === "properties") return "Retry properties";
    if (current.area === "bookings") return "Retry bookings";
    return "Retry";
  }, [current]);

  const handleRetry = useCallback(async () => {
    if (!current) return;
    setRetrying(true);
    try {
      if (current.area === "users") {
        await refreshUsersFromServer();
      } else if (current.area === "properties") {
        await refreshPropertiesFromServer();
      } else if (current.area === "bookings") {
        await refreshBookingsFromServer();
      } else {
        window.location.reload();
        return;
      }
      setCurrent(null);
    } finally {
      setRetrying(false);
    }
  }, [current]);

  if (!current) return null;

  return (
    <div className="fixed left-1/2 top-3 z-[100] w-[min(92vw,560px)] -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800">Sync issue detected</p>
          <p className="mt-1 text-sm text-red-700">{current.message}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {retrying ? "Retrying..." : retryLabel}
          </button>
          <button
            type="button"
            onClick={() => setCurrent(null)}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
