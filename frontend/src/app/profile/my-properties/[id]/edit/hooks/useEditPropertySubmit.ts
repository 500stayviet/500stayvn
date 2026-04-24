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
    if (!formState.coordinates || !user) {
      alert(
        currentLanguage === "ko"
          ? "주소를 선택해주세요."
          : currentLanguage === "zh"
            ? "请选择地址。"
            : currentLanguage === "vi"
              ? "Vui lòng chọn địa chỉ."
              : currentLanguage === "ja"
                ? "住所を選択してください。"
                : "Please select address.",
      );
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
        alert(
          currentLanguage === "ko"
            ? "임대날짜를 다시 확인하세요."
            : currentLanguage === "vi"
              ? "Vui lòng mở lịch và kiểm tra/chỉnh ngày thuê."
              : currentLanguage === "ja"
                ? "賃貸日程をカレンダーで確認・修正してください。"
                : currentLanguage === "zh"
                  ? "请打开日历检查或修改租赁日期。"
                  : "Open the calendar and confirm rental dates.",
        );
        return;
      }

      const imageUrls = await resolveEditPropertyImageUrls(formState.imagePreviews, formState.images);
      const unitNumber = buildUnitNumber(formState.buildingNumber, formState.roomNumber);
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
                  details: `광고중 매물(${propertyId}) 수정으로 이 카드는 종료 처리됨`,
                },
              ],
            });
          }
        }
      }

      alert(
        currentLanguage === "ko"
          ? "수정 완료!"
          : currentLanguage === "zh"
            ? "修改完成！"
            : currentLanguage === "vi"
              ? "Chỉnh sửa hoàn tất!"
              : currentLanguage === "ja"
                ? "編集完了！"
                : "Updated!",
      );
      router.push("/profile/my-properties?tab=live");
    } catch (err) {
      console.error("Update failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(
        currentLanguage === "ko"
          ? `오류가 발생했습니다: ${errorMessage}`
          : currentLanguage === "zh"
            ? `发生错误: ${errorMessage}`
            : currentLanguage === "vi"
              ? `Đã xảy ra lỗi: ${errorMessage}`
              : currentLanguage === "ja"
                ? `エラーが発生しました: ${errorMessage}`
                : `Error occurred: ${errorMessage}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit };
}
