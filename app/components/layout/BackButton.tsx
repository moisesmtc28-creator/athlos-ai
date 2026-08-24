"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallback?: string;
  label?: string;
  className?: string;
};

export default function BackButton({
  fallback = "/",
  label = "Voltar",
  className = "mb-5",
}: BackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-cyan-500/60 hover:bg-zinc-800 hover:text-cyan-300 ${className}`}
      aria-label={label}
    >
      <ArrowLeft size={17} />
      {label}
    </button>
  );
}
