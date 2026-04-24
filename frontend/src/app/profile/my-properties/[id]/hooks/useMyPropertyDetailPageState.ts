import { useEffect, useState } from "react";
import { getProperty } from "@/lib/api/properties";
import type { PropertyData } from "@/types/property";

interface UseMyPropertyDetailPageStateParams {
  propertyId: string;
  user: { uid: string } | null;
  authLoading: boolean;
  onRedirectToList: () => void;
}

export function useMyPropertyDetailPageState({
  propertyId,
  user,
  authLoading,
  onRedirectToList,
}: UseMyPropertyDetailPageStateParams) {
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [propertyLoaded, setPropertyLoaded] = useState(false);

  useEffect(() => {
    if (propertyLoaded) return;
    if (authLoading) return;
    if (!user) {
      onRedirectToList();
      return;
    }

    const fetchProperty = async () => {
      try {
        const data = await getProperty(propertyId);
        if (!data || data.ownerId !== user.uid) {
          onRedirectToList();
          return;
        }
        setProperty(data);
        setPropertyLoaded(true);
      } catch {
        onRedirectToList();
      } finally {
        setLoading(false);
      }
    };

    void fetchProperty();
  }, [propertyId, user, authLoading, propertyLoaded, onRedirectToList]);

  return {
    property,
    loading,
  };
}
