"use client";

import { useRouter } from "next/navigation";
import AdminRouteGuard from "@/components/admin/AdminRouteGuard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminMe } from "@/contexts/AdminMeContext";
import { logoutAdmin } from "@/lib/api/adminAuth";
import { getUIText } from "@/utils/i18n";

export default function AdminNoAccessPage() {
  const { me } = useAdminMe();
  const router = useRouter();
  const { currentLanguage } = useLanguage();

  const onLogout = async () => {
    await logoutAdmin();
    router.replace("/admin/login");
  };

  return (
    <AdminRouteGuard>
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-lg font-bold text-slate-900">{getUIText("adminNoAccessTitle", currentLanguage)}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {me?.username ? (
            <>
              {getUIText("adminNoAccessBodyWithUser", currentLanguage).replace(
                "{{username}}",
                me.username,
              )}
            </>
          ) : (
            getUIText("adminNoAccessBodyGeneric", currentLanguage)
          )}
        </p>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-6 text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
        >
          {getUIText("adminNoAccessLogout", currentLanguage)}
        </button>
      </div>
    </AdminRouteGuard>
  );
}
