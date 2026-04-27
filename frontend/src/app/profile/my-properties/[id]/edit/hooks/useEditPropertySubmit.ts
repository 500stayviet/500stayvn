import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

type PropertyStatus = import("@/types/property").PropertyData["status"] | undefined;

interface UseEditPropertySubmitParams {
  propertyId: string;
  user: { uid: string } | null;
  currentLanguage: string;
  router: { push: (path: string) => void };
  needsRentalCalendarAck: boolean;
  rentalCalendarAcknowledged: boolean;
  isDeleted: boolean;
  propertyStatus: PropertyStatus;
  dismissSiblingId: string | null;
  setLoading: (value: boolean) => void;
  formState: {
    coordinates: { lat: number; lng: number } | null;
    imagePreviews: string[];
    images: File[];
    buildingNumber: string;
    roomNumber: string;
    address: string;
    propertyName: string;
    propertyDescription: string;
    weeklyRent: string;
    bedrooms: number;
    bathrooms: number;
    selectedAmenities: string[];
    propertyType: "" | "studio" | "one_room" | "two_room" | "three_plus" | "detached";
    cleaningPerWeek: number;
    maxPets: number;
    petFeeAmount: string;
    maxAdults: number;
    maxChildren: number;
    checkInDate: Date | null;
    checkOutDate: Date | null;
    checkInTime: string;
    checkOutTime: string;
    icalPlatform: string;
    icalCalendarName: string;
    icalUrl: string;
  };
}

export function useEditPropertySubmit({
  propertyId,
  user,
  currentLanguage,
  router,
  needsRentalCalendarAck,
  rentalCalendarAcknowledged,
  isDeleted,
  propertyStatus,
  dismissSiblingId,
  setLoading,
  formState,
}: UseEditPropertySubmitParams) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lang = currentLanguage as SupportedLanguage;
    if (!formState.coordinates || !user) {
      alert(getUIText("valEditPickAddress", lang));
      return;
    }
    setLoading(true);

    try {
      const [
        { getProperty, restoreProperty, updateProperty },
        { areSamePropertyValues },
        { buildEditPropertyUpdates, buildUnitNumber, resolveEditPropertyImageUrls },
      ] = await Promise.all([
        import("@/lib/api/properties"),
        import("@/lib/utils/propertyDedup"),
        import("../utils/editPropertySubmit"),
      ]);

      if (needsRentalCalendarAck && !rentalCalendarAcknowledged) {
        alert(getUIText("valOpenCalendarCheckDates", lang));
        return;
      }

      const imageUrls = await resolveEditPropertyImageUrls(formState.imagePreviews, formState.images);
      const unitNumber = buildUnitNumber(formState.buildingNumber, formState.roomNumber, lang);
      const publicAddress = formState.address;

      const updates = buildEditPropertyUpdates({
        propertyName: formState.propertyName,
        propertyDescription: formState.propertyDescription,
        address: publicAddress,
        weeklyRent: formState.weeklyRent,
        bedrooms: formState.bedrooms,
        bathrooms: formState.bathrooms,
        coordinates: formState.coordinates,
        unitNumber,
        imageUrls,
        selectedAmenities: formState.selectedAmenities,
        propertyType: formState.propertyType,
        cleaningPerWeek: formState.cleaningPerWeek,
        maxPets: formState.maxPets,
        petFeeAmount: formState.petFeeAmount,
        maxAdults: formState.maxAdults,
        maxChildren: formState.maxChildren,
        checkInDate: formState.checkInDate,
        checkOutDate: formState.checkOutDate,
        checkInTime: formState.checkInTime,
        checkOutTime: formState.checkOutTime,
        icalPlatform: formState.icalPlatform,
        icalCalendarName: formState.icalCalendarName,
        icalUrl: formState.icalUrl,
        propertyStatus,
      });

      if (isDeleted) await restoreProperty(propertyId);
      await updateProperty(propertyId, updates);

      if (dismissSiblingId && user.uid) {
        const shadow = await getProperty(dismissSiblingId);
        if (shadow?.ownerId === user.uid) {
          const isSame = areSamePropertyValues(
            { address: shadow.address, unitNumber: shadow.unitNumber },
            { address: publicAddress, unitNumber: unitNumber || undefined },
          );
          if (!isSame) {
            if (process.env.NODE_ENV !== "production") {
              console.warn("[dismissSiblingId] skip delete: property mismatch", { dismissSiblingId, propertyId });
            }
          } else {
            const nowISO = new Date().toISOString();
            await updateProperty(dismissSiblingId, {
              deleted: true,
              deletedAt: nowISO,
              status: "inactive",
              history: [
                ...(shadow.history || []),
                {
                  action: "SUPERSEDED_BY_LIVE_EDIT",
                  timestamp: nowISO,
                  details: getUIText("editPropertyLedgerAdEndedDetail", lang).replace(
                    /\{\{id\}\}/g,
                    propertyId,
                  ),
                },
              ],
            });
          }
        }
      }

      alert(getUIText("alertEditSaved", lang));
      router.push("/profile/my-properties?tab=live");
    } catch (err) {
      console.error("Update failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`${getUIText("alertErrPrefix", lang)}${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit };
}
