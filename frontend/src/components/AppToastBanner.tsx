"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserFacingAppToast } from "@/lib/runtime/networkResilience";

const MAX_ITEMS = 4;
const DEDUPE_WINDOW_MS = 12_000;

type ToastItem = UserFacingAppToast & { id: string };

/**
 * `emitUserFacingAppToast` / `stayviet-app-toast` 구독 — 성공·정보(비오류) 알림
 */
export default function AppToastBanner() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    const onToast = (event: Event) => {
      const custom = event as CustomEvent<UserFacingAppToast>;
      const detail = custom.detail;
      if (!detail?.message) return;
      const now = Date.now();
      const signature = `${detail.tone ?? "info"}:${detail.area ?? ""}:${detail.message}`;
      setItems((prev) => {
        const hasRecentDuplicate = prev.some((item) => {
          const s = `${item.tone}:${item.area ?? ""}:${item.message}`;
          if (s !== signature) return false;
          const createdAt = Number(item.id.split("_")[1] || 0);
          return createdAt > 0 && now - createdAt < DEDUPE_WINDOW_MS;
        });
        if (hasRecentDuplicate) return prev;
        return [
          {
            ...detail,
            tone: detail.tone ?? "info",
            id: `toast_${now}_${Math.random().toString(36).slice(2, 9)}`,
          },
          ...prev,
        ].slice(0, MAX_ITEMS);
      });
    };
    window.addEventListener("stayviet-app-toast", onToast as EventListener);
    return () => window.removeEventListener("stayviet-app-toast", onToast as EventListener);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-14 z-[9998] flex flex-col gap-1 p-2 sm:top-16 sm:p-3"
      role="status"
      aria-live="polite"
    >
      {items.map((item) => {
        const isSuccess = item.tone === "success";
        return (
          <div
            key={item.id}
            className={
              isSuccess
                ? "pointer-events-auto mx-auto flex w-full max-w-lg items-start gap-3 rounded-lg border border-emerald-200 bg-white/95 px-3 py-2.5 text-sm shadow-lg backdrop-blur-sm dark:border-emerald-800/50 dark:bg-zinc-900/95"
                : "pointer-events-auto mx-auto flex w-full max-w-lg items-start gap-3 rounded-lg border border-sky-200 bg-white/95 px-3 py-2.5 text-sm shadow-lg backdrop-blur-sm dark:border-sky-800/50 dark:bg-zinc-900/95"
            }
          >
            <div className="min-w-0 flex-1">
              <p
                className={
                  isSuccess
                    ? "font-semibold text-emerald-700 dark:text-emerald-400"
                    : "font-semibold text-sky-700 dark:text-sky-400"
                }
              >
                {isSuccess ? "완료" : "안내"}
              </p>
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
        );
      })}
    </div>
  );
}
