"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getReservationsByOwner } from "@/lib/api/reservations";
import { getProperty } from "@/lib/api/properties";
import { getCurrentUserData } from "@/lib/api/auth";
import type { ReservationData } from "@/lib/api/reservations";
import { getOwnerBookings } from "@/lib/api/bookings";
import { getServerTime, ServerTimeSyncError } from "@/lib/api/serverTime";
import { getCheckInMoment } from "@/lib/utils/rentalIncome";
import { toISODateString } from "@/lib/utils/dateUtils";
import { getDateLocaleForLanguage, getUIText } from "@/utils/i18n";
import type { ReservationWithProperty } from "../types";

/**
 * 임대인 예약 관리 — 목록·탭·서버시간·표시용 파생값 (데이터 레이어).
 * 매물 첨부는 `getProperty` → `parseAppPropertyDetailPayload`(`unwrapAppApiData`).
 */
export function useReservationsPageData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [reservations, setReservations] = useState<ReservationWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "completed">(() => {
    const tab = searchParams.get("tab");
    return tab === "completed" ? "completed" : "active";
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [ownerBookings, setOwnerBookings] = useState<Awaited<ReturnType<typeof getOwnerBookings>>>([]);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [serverTimeError, setServerTimeError] = useState(false);

  const loadReservationsWithProperties = useCallback(
    async (uid: string, tab: "active" | "completed") => {
      const reservationData = await getReservationsByOwner(
        uid,
        tab === "completed" ? "completed" : "active",
      );
      const reservationsWithProperties: ReservationWithProperty[] = await Promise.all(
        reservationData.map(async (reservation) => {
          try {
            const property = await getProperty(reservation.propertyId);
            return { ...reservation, property: property || undefined };
          } catch {
            return { ...reservation, property: undefined };
          }
        }),
      );
      setReservations(reservationsWithProperties);
    },
    [],
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "completed") setActiveTab("completed");
    else if (tab === null) setActiveTab("active");
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    void (async () => {
      try {
        setLoading(true);
        const userData = await getCurrentUserData(user.uid);
        const kycSteps = userData?.kyc_steps || {};
        const completed = (kycSteps.step1 && kycSteps.step2 && kycSteps.step3) || false;
        if (!completed) {
          router.push("/profile");
          return;
        }
        await loadReservationsWithProperties(user.uid, activeTab);
        const newUrl =
          activeTab === "completed"
            ? "/profile/reservations?tab=completed"
            : "/profile/reservations";
        window.history.replaceState({}, "", newUrl);
      } catch (error) {
        console.error("Error fetching reservations:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router, activeTab, loadReservationsWithProperties]);

  useEffect(() => {
    if (!user?.uid) {
      setOwnerBookings([]);
      setServerTime(null);
      setServerTimeError(false);
      return;
    }
    void Promise.all([getOwnerBookings(user.uid), getServerTime()])
      .then(([bookings, now]) => {
        setOwnerBookings(bookings);
        setServerTime(now);
        setServerTimeError(false);
      })
      .catch((err) => {
        if (err instanceof ServerTimeSyncError) {
          setServerTimeError(true);
          setServerTime(null);
          setOwnerBookings([]);
        }
      });
  }, [user?.uid]);

  const reloadReservations = async () => {
    if (!user) return;
    await loadReservationsWithProperties(user.uid, activeTab);
  };

  const formatDate = (dateInput: string | Date | undefined): string => {
    if (!dateInput) return "";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString(getDateLocaleForLanguage(currentLanguage), {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isReservationInStay = (reservation: ReservationWithProperty): boolean => {
    if (reservation.status !== "confirmed") return false;
    const checkInDateStr = toISODateString(reservation.checkInDate);
    if (!checkInDateStr) return false;
    const matching = ownerBookings.find(
      (b) =>
        b.propertyId === reservation.propertyId &&
        b.checkInDate === checkInDateStr &&
        b.guestId === reservation.tenantId,
    );
    if (!matching) return false;
    if (serverTime === null) return false;
    const checkInMoment = getCheckInMoment(matching.checkInDate, matching.checkInTime ?? "14:00");
    return serverTime.getTime() >= checkInMoment.getTime();
  };

  const getStatusText = (status: ReservationData["status"], reservation?: ReservationWithProperty) => {
    if (status === "pending") {
      return getUIText("bookingBadgePending", currentLanguage);
    }
    if (status === "confirmed") {
      if (reservation && isReservationInStay(reservation)) {
        return getUIText("rentingInProgress", currentLanguage);
      }
      return getUIText("bookingBadgeConfirmed", currentLanguage);
    }
    if (status === "completed") {
      return getUIText("hostReservationLabelCompleted", currentLanguage);
    }
    return getUIText("bookingBadgeCancelled", currentLanguage);
  };

  const getStatusColor = (status: ReservationData["status"], reservation?: ReservationWithProperty) => {
    if (status === "pending") return "bg-yellow-500";
    if (status === "confirmed" && reservation && isReservationInStay(reservation)) return "bg-purple-500";
    if (status === "confirmed") return "bg-blue-500";
    if (status === "completed") return "bg-green-500";
    return "bg-red-500";
  };

  const activeCount = reservations.filter((r) => r.status === "pending" || r.status === "confirmed").length;
  const completedCount = reservations.filter((r) => r.status === "completed" || r.status === "cancelled").length;

  return {
    router,
    user,
    authLoading,
    currentLanguage,
    setCurrentLanguage,
    reservations,
    setReservations,
    loading,
    activeTab,
    setActiveTab,
    updatingId,
    setUpdatingId,
    serverTimeError,
    reloadReservations,
    formatDate,
    getStatusText,
    getStatusColor,
    activeCount,
    completedCount,
  };
}

export type ReservationsPageData = ReturnType<typeof useReservationsPageData>;
