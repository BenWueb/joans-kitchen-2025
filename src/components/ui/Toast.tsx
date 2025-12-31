"use client";

import type { ToastState } from "@/hooks/useToast";

export default function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;

  const bg =
    toast.type === "success"
      ? "bg-emerald-600"
      : toast.type === "error"
      ? "bg-red-600"
      : "bg-gray-900";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-md">
      <div className={`${bg} text-white rounded-lg shadow-xl px-4 py-3 text-sm`}>
        {toast.message}
      </div>
    </div>
  );
}


