import { useEffect, useState } from "react";
import { ensureUsersLoadedForApp, getCurrentUserData, getCurrentUserId } from "@/lib/api/auth";

interface AccessUser {
  uid: string;
}

interface UseAddPropertyAccessParams {
  user: AccessUser | null | undefined;
  authLoading: boolean;
  onRedirect: (path: string) => void;
}

export const useAddPropertyAccess = ({
  user,
  authLoading,
  onRedirect,
}: UseAddPropertyAccessParams) => {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;

      const actorUid = user?.uid ?? getCurrentUserId();
      if (!actorUid) {
        onRedirect("/login");
        return;
      }

      try {
        let userData = await getCurrentUserData(actorUid);
        if (!userData) {
          await ensureUsersLoadedForApp();
          userData = await getCurrentUserData(actorUid);
        }

        const kycSteps = userData?.kyc_steps || {};
        const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;

        if (allStepsCompleted || userData?.is_owner === true) {
          setHasAccess(true);
        } else {
          onRedirect("/kyc");
        }
      } catch {
        onRedirect("/kyc");
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [authLoading, user, onRedirect]);

  return { checkingAccess, hasAccess };
};
