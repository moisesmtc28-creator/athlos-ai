import { Play } from "lucide-react";

export default function TrainingCard() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">🚴 Treino de Hoje</p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Endurance Z2
          </h2>

          <p className="mt-1 text-zinc-400">
            1h30 • FC 118–145 bpm
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-500">
          <Play size={18} />
          Iniciar
        </button>
      </div>
    </div>
  );
}