"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserFacingSyncError } from "@/lib/runtime/networkResilience";

const MAX_ITEMS = 4;

type BannerItem = UserFacingSyncError & { id: string };

export default function ApiSyncErrorBanner() {
  const [items, setItems] = useState<BannerItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    const onSyncError = (event: Event) => {
      const custom = event as CustomEvent<UserFacingSyncError>;
      const detail = custom.detail;
      if (!detail?.message) return;
      setItems((prev) =>
        [
          {
            ...detail,
            id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          },
          ...prev,
        ].slice(0, MAX_ITEMS),
      );
    };
    window.addEventListener("stayviet-api-sync-error", onSyncError as EventListener);
    return () =>
      window.removeEventListener("stayviet-api-sync-error", onSyncError as EventListener);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[9999] flex flex-col gap-1 p-2 sm:p-3"
      role="alert"
      aria-live="polite"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto mx-auto flex w-full max-w-lg items-start gap-3 rounded-lg border border-red-200 bg-white/95 px-3 py-2.5 text-sm shadow-lg backdrop-blur-sm dark:border-red-900/60 dark:bg-zinc-900/95"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-red-600 dark:text-red-400">오류</p>
            <p className="mt-0.5 text-zinc-800 dark:text-zinc-200">{item.message}</p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            닫기
          </button>
        </div>
      ))}
    </div>
  );
}
