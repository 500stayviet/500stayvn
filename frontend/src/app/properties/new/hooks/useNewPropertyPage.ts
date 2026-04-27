"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { geocodeAddress } from "@/lib/api/geocoding";
import { addProperty } from "@/lib/api/properties";
import { getUIText } from "@/utils/i18n";

/**
 * 레거시 `/properties/new` 단일 폼: 주소 지오코딩·좌표 보정·addProperty 제출.
 */
export function useNewPropertyPage() {
  const router = useRouter();
  const { currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    original_description: "",
    translated_description: "",
    price: "",
    priceUnit: "vnd" as "vnd" | "usd",
    area: "",
    bedrooms: "",
    bathrooms: "",
    address: "",
    checkInTime: "14:00",
    checkOutTime: "12:00",
  });

  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleAddressChange = async (address: string) => {
    setFormData((prev) => ({ ...prev, address }));

    if (address.trim().length > 5) {
      setGeocoding(true);
      try {
        const result = await geocodeAddress(address, "vi");
        if (
          result.lat &&
          result.lng &&
          !isNaN(result.lat) &&
          !isNaN(result.lng)
        ) {
          setCoordinates({ lat: result.lat, lng: result.lng });
        } else {
          setCoordinates({ lat: 10.776, lng: 106.701 });
        }
      } catch {
        setCoordinates({ lat: 10.776, lng: 106.701 });
      } finally {
        setGeocoding(false);
      }
    } else if (address.trim().length === 0) {
      setCoordinates(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let finalCoordinates = coordinates;

    if (!finalCoordinates && formData.address.trim().length > 0) {
      setGeocoding(true);
      try {
        const result = await geocodeAddress(formData.address, "vi");
        if (
          result.lat &&
          result.lng &&
          !isNaN(result.lat) &&
          !isNaN(result.lng)
        ) {
          finalCoordinates = { lat: result.lat, lng: result.lng };
          setCoordinates(finalCoordinates);
        } else {
          finalCoordinates = { lat: 10.776, lng: 106.701 };
          setCoordinates(finalCoordinates);
        }
      } catch {
        finalCoordinates = { lat: 10.776, lng: 106.701 };
        setCoordinates(finalCoordinates);
      } finally {
        setGeocoding(false);
      }
    }

    if (!finalCoordinates) {
      finalCoordinates = { lat: 10.776, lng: 106.701 };
    }

    setLoading(true);
    try {
      await addProperty({
        title: formData.title.trim(),
        original_description: formData.original_description,
        translated_description: formData.translated_description,
        price: parseInt(formData.price, 10),
        priceUnit: formData.priceUnit,
        area: parseInt(formData.area, 10),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms, 10) : undefined,
        bathrooms: formData.bathrooms
          ? parseInt(formData.bathrooms, 10)
          : undefined,
        coordinates: finalCoordinates,
        address: formData.address,
        status: "active",
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
      });

      alert(getUIText("legacyNewPropertySuccess", currentLanguage));
      router.push("/");
    } catch {
      alert(getUIText("legacyNewPropertyError", currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  return {
    router,
    loading,
    geocoding,
    formData,
    setFormData,
    coordinates,
    handleAddressChange,
    handleSubmit,
    currentLanguage,
  };
}

export type NewPropertyPageViewModel = ReturnType<typeof useNewPropertyPage>;
