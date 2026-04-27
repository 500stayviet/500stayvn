"use client";

import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUsers } from "@/lib/api/auth";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { PropertyData } from "@/types/property";
import { getDateLocaleForLanguage, getUIText } from "@/utils/i18n";
import type { AdminPropertyDetailPageViewModel } from "../hooks/useAdminPropertyDetailPage";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">{children}</h2>
  );
}

function formatWhen(v: unknown, locale: string): string {
  if (v == null) return "—";
  try {
    const d = new Date(v as string | number | Date);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString(locale);
  } catch {
    return String(v);
  }
}

function statusBadge(
  p: PropertyData,
  lang: SupportedLanguage,
): { text: string; className: string } {
  if (p.hidden) {
    return { text: getUIText("adminListingHidden", lang), className: "bg-amber-100 text-amber-800" };
  }
  if (p.status === "INACTIVE_SHORT_TERM") {
    return { text: getUIText("adminListingAdPaused", lang), className: "bg-orange-100 text-orange-900" };
  }
  if (p.status === "active") {
    return { text: getUIText("adminListingLive", lang), className: "bg-emerald-100 text-emerald-800" };
  }
  return { text: p.status || "—", className: "bg-slate-100 text-slate-700" };
}

type Props = { vm: AdminPropertyDetailPageViewModel };

export function AdminPropertyDetailPageView({ vm }: Props) {
  const { currentLanguage } = useLanguage();
  const locale = getDateLocaleForLanguage(currentLanguage);
  const {
    phase,
    id: _propertyId,
    property,
    memos,
    memoInput,
    setMemoInput,
    formatMemoDate,
    saveMemo,
    deleteMemo,
    unhideProperty,
    hideProperty,
  } = vm;

  void _propertyId;

  if (phase === "no-id") {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-slate-600">{getUIText("adminUiBadPath", currentLanguage)}</p>
      </AdminRouteGuard>
    );
  }

  if (phase === "loading") {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-slate-600">{getUIText("adminUiLoadingEllipsis", currentLanguage)}</p>
      </AdminRouteGuard>
    );
  }

  if (phase === "not-found") {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-red-600">{getUIText("adminNotFoundProperty", currentLanguage)}</p>
        <Link href="/admin/properties" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          {getUIText("adminBackToPropertiesList", currentLanguage)}
        </Link>
      </AdminRouteGuard>
    );
  }

  if (!property) {
    return null;
  }

  const st = statusBadge(property, currentLanguage);
  const owner = property.ownerId
    ? getUsers().find((u) => u.uid === property.ownerId && !u.deleted)
    : undefined;

  const bedBath = getUIText("adminLabelBedroomsBathrooms", currentLanguage)
    .replace("{{bed}}", String(property.bedrooms ?? "—"))
    .replace("{{bath}}", String(property.bathrooms ?? "—"));

  const maxGuestsLine = getUIText("adminLabelAdultsChildren", currentLanguage)
    .replace("{{adults}}", String(property.maxAdults ?? "—"))
    .replace("{{children}}", String(property.maxChildren ?? "—"));

  return (
    <AdminRouteGuard>
      <div id="div-1">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <Link
              href="/admin/properties"
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {getUIText("adminPropertyDetailBackList", currentLanguage)}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                {property.title || getUIText("adminPropertyNoTitle", currentLanguage)}
              </h1>
              <span
                className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}
              >
                {st.text}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-500">{property.id}</p>
          </div>

          <div className="w-full rounded-lg border border-slate-200 bg-white p-3 lg:mx-4 lg:w-[440px] lg:flex-none">
            <p className="text-xs font-semibold text-slate-700">
              {getUIText("adminPropertyAdminMemo", currentLanguage)}
            </p>
            <div className="mt-2 max-h-36 overflow-y-auto rounded-md border border-slate-200 bg-slate-50">
              {memos.length === 0 ? (
                <p className="px-2 py-2 text-xs text-slate-500">{getUIText("adminMemoEmpty", currentLanguage)}</p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {memos.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 px-2 py-1.5">
                      <span className="shrink-0 font-mono text-[10px] text-slate-500">
                        {formatMemoDate(m.createdAt)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-800" title={m.text}>
                        {m.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteMemo(m.id)}
                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50"
                      >
                        {getUIText("delete", currentLanguage)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <textarea
              id="property-memo"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              rows={2}
              placeholder={getUIText("adminPropertyMemoPlaceholder", currentLanguage)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={saveMemo}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Save className="h-3.5 w-3.5" />
                {getUIText("save", currentLanguage)}
              </button>
              <span className="text-xs text-slate-500">{getUIText("adminMemoNewestFirst", currentLanguage)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:ml-4 lg:flex-row lg:items-center lg:justify-end">
            {property.ownerId ? (
              <Link
                href={`/admin/users/${encodeURIComponent(property.ownerId)}`}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                {getUIText("adminPropertyViewHost", currentLanguage)}
              </Link>
            ) : null}
            {property.hidden ? (
              <button
                type="button"
                onClick={() => unhideProperty(property)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {getUIText("adminPropertyUnhide", currentLanguage)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => hideProperty(property)}
                className="rounded-md bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                {getUIText("adminPropertyHide", currentLanguage)}
              </button>
            )}
          </div>
        </div>

        <div id="div-2" className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <SectionTitle>{getUIText("adminSectionHostId", currentLanguage)}</SectionTitle>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelOwnerId", currentLanguage)}</dt>
                <dd className="min-w-0 break-all font-mono text-xs text-slate-900">
                  {property.ownerId || "—"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelDisplayName", currentLanguage)}</dt>
                <dd className="text-slate-900">{owner?.displayName || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">{getUIText("email", currentLanguage)}</dt>
                <dd className="min-w-0 break-all text-slate-900">{owner?.email || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <SectionTitle>{getUIText("adminSectionPriceAreaGuests", currentLanguage)}</SectionTitle>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelWeeklyRent", currentLanguage)}</dt>
                <dd className="text-slate-900">
                  {property.price != null ? property.price.toLocaleString() : "—"}{" "}
                  {property.priceUnit === "usd" ? "USD" : "₫"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelAreaSqm", currentLanguage)}</dt>
                <dd className="text-slate-900">{property.area != null ? `${property.area} m²` : "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelBedBath", currentLanguage)}</dt>
                <dd className="text-slate-900">{bedBath}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelMaxGuests", currentLanguage)}</dt>
                <dd className="text-slate-900">{maxGuestsLine}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div id="div-3" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle>{getUIText("adminSectionLocation", currentLanguage)}</SectionTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelAddress", currentLanguage)}</dt>
              <dd className="text-slate-900">{property.address || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelUnitNumber", currentLanguage)}</dt>
              <dd className="text-slate-900">{property.unitNumber || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelCityDistrictIds", currentLanguage)}</dt>
              <dd className="font-mono text-xs text-slate-900">
                {property.cityId || "—"} / {property.districtId || "—"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelCoordinates", currentLanguage)}</dt>
              <dd className="font-mono text-xs text-slate-900">
                {property.coordinates
                  ? `${property.coordinates.lat}, ${property.coordinates.lng}`
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div id="div-4" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle>{getUIText("adminSectionDescription", currentLanguage)}</SectionTitle>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {getUIText("adminPropertyDescOriginalVi", currentLanguage)}
          </p>
          <p className="mb-6 whitespace-pre-wrap text-sm text-slate-800">
            {property.original_description || "—"}
          </p>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {getUIText("adminPropertyDescTranslatedKo", currentLanguage)}
          </p>
          <p className="whitespace-pre-wrap text-sm text-slate-800">
            {property.translated_description || "—"}
          </p>
        </div>

        <div id="div-5" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle>{getUIText("adminSectionPhotos", currentLanguage)}</SectionTitle>
          {property.images && property.images.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {property.images.map((src, i) => (
                <a key={`${src}-${i}`} href={src} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-40 w-full rounded-md border border-slate-200 object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{getUIText("adminPropertyNoImages", currentLanguage)}</p>
          )}
        </div>

        <div id="div-6" className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <SectionTitle>{getUIText("adminSectionAmenitiesType", currentLanguage)}</SectionTitle>
            <p className="mb-2 text-sm text-slate-600">
              {getUIText("adminLabelPropertyType", currentLanguage)}:{" "}
              <span className="font-medium text-slate-900">{property.propertyType || "—"}</span>
            </p>
            {property.amenities && property.amenities.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {property.amenities.map((a) => (
                  <li key={a} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-800">
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
            <p className="mt-3 text-sm text-slate-600">
              {getUIText("adminLabelCleaningPerWeek", currentLanguage)}:{" "}
              <span className="font-medium text-slate-900">{property.cleaningPerWeek ?? "—"}</span>
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <SectionTitle>{getUIText("adminSectionPets", currentLanguage)}</SectionTitle>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-slate-500">{getUIText("adminLabelPetAllowed", currentLanguage)}</dt>
                <dd className="text-slate-900">
                  {property.petAllowed
                    ? getUIText("adminLabelYes", currentLanguage)
                    : getUIText("adminLabelNo", currentLanguage)}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-slate-500">{getUIText("adminLabelPetFeePerPet", currentLanguage)}</dt>
                <dd className="text-slate-900">{property.petFee ?? "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-slate-500">{getUIText("adminLabelMaxPets", currentLanguage)}</dt>
                <dd className="text-slate-900">{property.maxPets ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div id="div-7" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle>{getUIText("adminSectionSchedule", currentLanguage)}</SectionTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-slate-500">{getUIText("adminLabelRentStart", currentLanguage)}</dt>
              <dd className="text-slate-900">{formatWhen(property.checkInDate, locale)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-slate-500">{getUIText("adminLabelRentEnd", currentLanguage)}</dt>
              <dd className="text-slate-900">{formatWhen(property.checkOutDate, locale)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-slate-500">{getUIText("adminLabelCheckInTime", currentLanguage)}</dt>
              <dd className="text-slate-900">{property.checkInTime || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-slate-500">{getUIText("adminLabelCheckOutTime", currentLanguage)}</dt>
              <dd className="text-slate-900">{property.checkOutTime || "—"}</dd>
            </div>
          </dl>
        </div>

        <div id="div-8" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle>{getUIText("adminSectionIcal", currentLanguage)}</SectionTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelIcalPlatform", currentLanguage)}</dt>
              <dd className="text-slate-900">{property.icalPlatform || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">
                {getUIText("adminLabelIcalCalendarName", currentLanguage)}
              </dt>
              <dd className="text-slate-900">{property.icalCalendarName || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">{getUIText("adminLabelUrl", currentLanguage)}</dt>
              <dd className="min-w-0 break-all font-mono text-xs text-slate-900">{property.icalUrl || "—"}</dd>
            </div>
          </dl>
        </div>

        {property.history && property.history.length > 0 ? (
          <div id="div-9" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
            <SectionTitle>{getUIText("adminSectionChangeHistory", currentLanguage)}</SectionTitle>
            <ul className="space-y-2 text-sm">
              {property.history.map((h, i) => (
                <li key={`${h.timestamp}-${i}`} className="border-b border-slate-100 pb-2 last:border-0">
                  <span className="font-medium text-slate-900">{h.action}</span>
                  <span className="ml-2 text-xs text-slate-500">{h.timestamp}</span>
                  <p className="mt-0.5 text-slate-700">{h.details}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div id="div-10" className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-xs text-slate-600">
          <p>
            {getUIText("adminPropertyMetaCreated", currentLanguage)}: {formatWhen(property.createdAt, locale)}
          </p>
          <p>
            {getUIText("adminPropertyMetaUpdated", currentLanguage)}: {formatWhen(property.updatedAt, locale)}
          </p>
          {property.deleted ? (
            <p className="mt-1 font-semibold text-amber-800">
              {getUIText("adminPropertyDeletedFlag", currentLanguage)}
            </p>
          ) : null}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
