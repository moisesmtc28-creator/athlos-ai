"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Apple,
  BarChart3,
  Bike,
  Bot,
  CalendarDays,
  Dumbbell,
  Home,
  Settings,
  User,
} from "lucide-react";

const menu = [
  {
    icon: Home,
    label: "Dashboard",
    href: "/",
  },
  {
    icon: Bike,
    label: "Treinos",
    href: "/trainings",
  },
  {
    icon: CalendarDays,
    label: "Calendário",
    href: "/calendar",
  },
  {
    icon: BarChart3,
    label: "Evolução",
    href: "/progress",
  },
  {
    icon: Bot,
    label: "Coach IA",
    href: "/coach",
  },
  {
    icon: Apple,
    label: "Nutrição",
    href: "/nutrition",
  },
  {
    icon: Dumbbell,
    label: "Academia",
    href: "/gym",
  },
  {
    icon: User,
    label: "Perfil",
    href: "/profile",
  },
  {
    icon: Settings,
    label: "Configurações",
    href: "/settings",
  },
];

const mobileMenu = [
  menu[0],
  menu[1],
  menu[2],
  menu[4],
  menu[7],
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActiveRoute(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-zinc-800 bg-zinc-900/95 p-5 backdrop-blur lg:flex lg:flex-col">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl px-2 py-2"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-zinc-950 shadow-lg shadow-emerald-500/20">
            A
          </div>

          <div>
            <p className="text-lg font-black text-white">
              Athlos AI
            </p>

            <p className="text-xs text-zinc-500">
              Treinador inteligente
            </p>
          </div>
        </Link>

        <div className="mt-7 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Bike className="text-emerald-400" size={20} />
            </div>

            <div>
              <p className="text-sm font-bold text-white">
                Sua jornada
              </p>

              <p className="text-xs text-zinc-500">
                Treine com consistência
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/10"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon
                  size={20}
                  className={
                    isActive
                      ? "text-zinc-950"
                      : "text-zinc-500 transition group-hover:text-emerald-400"
                  }
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Athlos AI
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Ciclismo, academia e evolução em um só lugar.
          </p>
        </div>
      </aside>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-5 gap-1">
          {mobileMenu.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2.5 text-center transition ${
                  isActive
                    ? "bg-emerald-400 text-zinc-950"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon size={20} />

                <span className="mt-1 w-full truncate text-[10px] font-bold">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
