"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Apple, BarChart3, Bike, Bot, CalendarDays, Dumbbell, Home, MoreHorizontal, Settings, User, X } from "lucide-react";

const hiddenRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/pending",
  "/rejected",
];

const primaryItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/training", label: "Treinos", icon: Bike },
  { href: "/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/coach", label: "Coach", icon: Bot },
];

const moreItems = [
  { href: "/gym", label: "Academia", description: "Fichas e cargas", icon: Dumbbell },
  { href: "/progress", label: "Evolução", description: "Histórico e progresso", icon: BarChart3 },
  { href: "/nutrition", label: "Nutrição", description: "Apoio alimentar", icon: Apple },
  { href: "/profile", label: "Perfil", description: "Disponibilidade e objetivos", icon: User },
  { href: "/settings", label: "Configurações", description: "Preferências do app", icon: Settings },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (hiddenRoutes.some((route) => pathname.startsWith(route))) return null;

  const moreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <section className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-zinc-800 bg-zinc-950 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl">
            <div className="mx-auto max-w-md">
              <div className="mb-4 flex items-center justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Athlos AI</p><h2 className="text-xl font-bold text-white">Mais recursos</h2></div>
                <button onClick={() => setOpen(false)} className="rounded-xl border border-zinc-800 p-2 text-zinc-300"><X size={20}/></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {moreItems.map(({ href, label, description, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link key={href} href={href} onClick={() => setOpen(false)} className={`rounded-2xl border p-4 ${active ? "border-emerald-500/40 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900"}`}>
                      <Icon size={22} className={active ? "text-emerald-400" : "text-zinc-400"}/>
                      <p className="mt-3 font-semibold text-white">{label}</p>
                      <p className="mt-1 text-xs leading-4 text-zinc-500">{description}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition ${active ? "bg-emerald-500/15 text-emerald-400" : "text-zinc-400"}`}>
                <Icon size={20}/><span className="max-w-full truncate">{label}</span>
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition ${moreActive || open ? "bg-emerald-500/15 text-emerald-400" : "text-zinc-400"}`}>
            <MoreHorizontal size={20}/><span>Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
