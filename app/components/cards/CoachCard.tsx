import { Sparkles } from "lucide-react";

export default function CoachCard() {
  return (
    <div className="mt-6 rounded-2xl border border-green-500/20 bg-gradient-to-r from-green-900/30 to-zinc-900 p-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-green-600 p-3">
          <Sparkles className="text-white" size={22} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">
            Coach IA
          </h2>

          <p className="text-sm text-green-400">
            Seu treinador inteligente
          </p>
        </div>
      </div>

      <p className="mt-6 text-zinc-300 leading-7">
        Bom dia, Moisés!
      </p>

      <p className="mt-3 text-zinc-400 leading-7">
        Sua recuperação está excelente hoje. Recomendo realizar
        o treino Endurance Z2 antes da academia. Mantenha uma boa
        hidratação e consuma carboidratos cerca de 60 minutos
        antes do treino.
      </p>
    </div>
  );
}