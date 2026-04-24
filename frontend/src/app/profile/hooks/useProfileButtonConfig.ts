"use client";

import { useMemo } from "react";

export type ProfileListButtonConfig = {
  disabled: boolean;
  onClick: () => void;
};

export function useProfileButtonConfig(): ProfileListButtonConfig {
  return useMemo(() => {
    return {
      disabled: false,
      onClick: () => {
        window.location.href = "/add-property";
      },
    };
  }, []);
}
