import { Bike, Clock, HeartPulse } from "lucide-react";

export default function WorkoutCard() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Treino de hoje</p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Endurance Z2
          </h2>
        </div>

        <div className="rounded-xl bg-green-500/10 p-3 text-green-500">
          <Bike size={28} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-5 text-sm text-zinc-300">
        <div className="flex items-center gap-2">
          <Clock size={18} />
          <span>1h30</span>
        </div>

        <div className="flex items-center gap-2">
          <HeartPulse size={18} />
          <span>FC 118–145 bpm</span>
        </div>
      </div>

      <p className="mt-6 text-zinc-400">
        Pedal contínuo em ritmo confortável, mantendo a frequência cardíaca
        dentro da zona 2.
      </p>

      <button className="mt-6 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700">
        Ver treino completo
      </button>
    </div>
  );
}