"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bike,
  Calendar,
  BarChart3,
  Bot,
  Apple,
  Dumbbell,
  User,
  Settings,
} from "lucide-react";

const menu = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Bike, label: "Treinos", href: "/training" },
  { icon: Calendar, label: "Calendário", href: "/calendar" },
  { icon: BarChart3, label: "Evolução", href: "/progress" },
  { icon: Bot, label: "Coach IA", href: "/coach" },
  { icon: Apple, label: "Nutrição", href: "/nutrition" },
  { icon: Dumbbell, label: "Academia", href: "/gym" },
  { icon: User, label: "Perfil", href: "/profile" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-72 border-r border-zinc-800 bg-zinc-900 p-6">
      <h1 className="mb-10 text-3xl font-bold text-green-500">
        🚴 Athlos AI
      </h1>

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
                isActive
                  ? "bg-green-500 text-black"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}