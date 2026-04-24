"use client";

import { useEffect, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  getCurrentUserData,
  type OwnerVerificationData,
  type UserData,
} from "@/lib/api/auth";
import { getVerificationStatus } from "@/lib/api/kyc";
import type { VerificationStatus } from "@/types/kyc.types";

interface UseProfileCoreStateParams {
  user: { uid: string; email?: string | null; displayName?: string | null } | null;
  authLoading: boolean;
  router: AppRouterInstance;
}

export function useProfileCoreState({
  user,
  authLoading,
  router,
}: UseProfileCoreStateParams) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("none");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [verificationData, setVerificationData] = useState<OwnerVerificationData>({
    fullName: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      const fetchUserData = async () => {
        try {
          const data = await getCurrentUserData(user.uid);
          setUserData(data);
          const kycSteps = data?.kyc_steps || {};
          const completed = Boolean(
            kycSteps.step1 && kycSteps.step2 && kycSteps.step3,
          );
          const status = await getVerificationStatus(user.uid);
          setVerificationStatus(status as VerificationStatus);

          const ownerNow = data?.role === "owner" || Boolean(data?.is_owner);
          const popupKey = `kyc_success_modal_${user.uid}`;
          if (
            completed &&
            ownerNow &&
            typeof window !== "undefined" &&
            !localStorage.getItem(popupKey)
          ) {
            localStorage.setItem(popupKey, "true");
            setShowSuccessPopup(true);
          }

          if (data) {
            setVerificationData({
              fullName: data.displayName || "",
              phoneNumber: data.phoneNumber || "",
            });
          }
        } catch {
          // Silent fail
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const handleFocus = async () => {
      try {
        const data = await getCurrentUserData(user.uid);
        setUserData(data);
        const status = await getVerificationStatus(user.uid);
        setVerificationStatus(status as VerificationStatus);
      } catch {
        // Silent fail
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user]);

  const getKycSteps = () => {
    const steps = userData?.kyc_steps || {};
    return {
      step1: steps.step1 || false,
      step2: steps.step2 || false,
      step3: steps.step3 || false,
    };
  };

  const isOwner = userData?.role === "owner" || false;
  const kycSteps = getKycSteps();
  const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;
  const effectiveIsOwner = allStepsCompleted || isOwner;

  return {
    userData,
    setUserData,
    loading,
    verificationStatus,
    setVerificationStatus,
    showSuccessPopup,
    setShowSuccessPopup,
    verificationData,
    setVerificationData,
    kycSteps,
    allStepsCompleted,
    effectiveIsOwner,
  };
}
