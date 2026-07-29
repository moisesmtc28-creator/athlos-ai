"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, Bot, Home, Menu, User } from "lucide-react";

const hiddenRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/onboarding"];

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/training", label: "Treinos", icon: Bike },
  { href: "/coach", label: "Coach", icon: Bot },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/settings", label: "Mais", icon: Menu },
];

export default function MobileNavigation() {
  const pathname = usePathname();

  if (hiddenRoutes.some((route) => pathname.startsWith(route))) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition ${
                active ? "bg-emerald-500/15 text-emerald-400" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
