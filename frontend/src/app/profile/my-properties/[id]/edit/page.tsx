"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  Loader2,
} from "lucide-react";
const EditPropertyContent = dynamic(() => import("./EditPropertyContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" />
    </div>
  ),
});

// 2. 최종 페이지 컴포넌트 (Suspense 적용)
export default function EditPropertyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" />
        </div>
      }
    >
      <EditPropertyContent />
    </Suspense>
  );
}
