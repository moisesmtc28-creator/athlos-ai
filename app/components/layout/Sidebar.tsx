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
  { icon: Home, label: "Dashboard" },
  { icon: Bike, label: "Treinos" },
  { icon: Calendar, label: "Calendário" },
  { icon: BarChart3, label: "Evolução" },
  { icon: Bot, label: "Coach IA" },
  { icon: Apple, label: "Nutrição" },
  { icon: Dumbbell, label: "Academia" },
  { icon: User, label: "Perfil" },
  { icon: Settings, label: "Configurações" },
];

export default function Sidebar() {
  return (
    <aside className="w-72 h-screen bg-zinc-900 border-r border-zinc-800 p-6">
      <h1 className="text-3xl font-bold text-green-500 mb-10">
        🚴 Athlos AI
      </h1>

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}