"use client";

import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";

import { useTraining } from "@/hooks/use-training";
import { useUpdateTraining } from "@/hooks/use-update-training";
import type {
  TrainingStatus,
  TrainingZone,
} from "@/types/training";

type FormState = {
  status: TrainingStatus;
  completedDurationMinutes: string;
  averageHeartRate: string;
  maxHeartRate: string;
  distanceKm: string;
  averageSpeed: string;
  cadence: string;
  calories: string;
  elevationGain: string;
  perceivedEffort: string;
  athleteFeedback: string;
};

type TrainingData = NonNullable<
  ReturnType<typeof useTraining>["data"]
>;

function createFormState(training: TrainingData): FormState {
  return {
    status: training.status,

    completedDurationMinutes:
      training.completedDurationMinutes?.toString() ?? "",

    averageHeartRate:
      training.averageHeartRate?.toString() ?? "",

    maxHeartRate:
      training.maxHeartRate?.toString() ?? "",

    distanceKm:
      training.distanceKm?.toString() ?? "",

    averageSpeed:
      training.averageSpeed?.toString() ?? "",

    cadence:
      training.cadence?.toString() ?? "",

    calories:
      training.calories?.toString() ?? "",

    elevationGain:
      training.elevationGain?.toString() ?? "",

    perceivedEffort:
      training.perceivedEffort?.toString() ?? "",

    athleteFeedback:
      training.athleteFeedback ?? "",
  };
}

function numberOrNull(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const normalizedValue = value.replace(",", ".");
  const parsedValue = Number(normalizedValue);

  return Number.isNaN(parsedValue)
    ? null
    : parsedValue;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getZoneLabel(zone: TrainingZone): string {
  const labels: Record<TrainingZone, string> = {
    Z1: "Z1 — Recuperação",
    Z2: "Z2 — Endurance",
    Z3: "Z3 — Ritmo",
    Z4: "Z4 — Limiar",
    Z5: "Z5 — VO₂ máximo",
    Z6: "Z6 — Potência máxima",
  };

  return labels[zone];
}

function getStatusLabel(status: TrainingStatus): string {
  const labels: Record<TrainingStatus, string> = {
    planned: "Planejado",
    in_progress: "Em andamento",
    completed: "Concluído",
    missed: "Não realizado",
    cancelled: "Cancelado",
  };

  return labels[status];
}

export default function TrainingDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params.id === "string"
      ? params.id
      : params.id?.[0];

  const {
    data: training,
    isLoading,
    isError,
    error,
  } = useTraining(id ?? "");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando treino...
      </div>
    );
  }

  if (isError || !training) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
        <p className="text-lg text-red-400">
          Não foi possível carregar o treino.
        </p>

        {error instanceof Error && (
          <p className="max-w-lg text-sm text-slate-400">
            {error.message}
          </p>
        )}

        <button
          type="button"
          onClick={() => router.push("/training")}
          className="rounded-lg bg-slate-800 px-4 py-2 text-white transition hover:bg-slate-700"
        >
          Voltar para treinos
        </button>
      </div>
    );
  }

  /*
   * A propriedade key recria apenas o formulário quando
   * outro treino é carregado. Assim não precisamos usar
   * setState dentro de useEffect.
   */
  return (
    <TrainingDetailsForm
      key={training.id}
      training={training}
    />
  );
}

function TrainingDetailsForm({
  training,
}: {
  training: TrainingData;
}) {
  const router = useRouter();
  const updateTrainingMutation = useUpdateTraining();

  const [form, setForm] = useState<FormState>(() =>
    createFormState(training),
  );

  const [successMessage, setSuccessMessage] =
    useState("");

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const perceivedEffort = numberOrNull(
      form.perceivedEffort,
    );

    if (
      perceivedEffort !== null &&
      (perceivedEffort < 1 || perceivedEffort > 10)
    ) {
      return;
    }

    setSuccessMessage("");

    try {
      await updateTrainingMutation.mutateAsync({
        id: training.id,
        status: form.status,

        completedDurationMinutes: numberOrNull(
          form.completedDurationMinutes,
        ),

        averageHeartRate: numberOrNull(
          form.averageHeartRate,
        ),

        maxHeartRate: numberOrNull(
          form.maxHeartRate,
        ),

        distanceKm: numberOrNull(
          form.distanceKm,
        ),

        averageSpeed: numberOrNull(
          form.averageSpeed,
        ),

        cadence: numberOrNull(
          form.cadence,
        ),

        calories: numberOrNull(
          form.calories,
        ),

        elevationGain: numberOrNull(
          form.elevationGain,
        ),

        perceivedEffort,

        athleteFeedback:
          form.athleteFeedback.trim(),
      });

      setSuccessMessage(
        "Treino atualizado com sucesso.",
      );
    } catch {
      // O erro já é exibido pelo estado da mutation.
    }
  }

  const rpeValue = numberOrNull(
    form.perceivedEffort,
  );

  const invalidRpe =
    rpeValue !== null &&
    (rpeValue < 1 || rpeValue > 10);

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-24 pt-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/training")}
          className="mb-6 text-sm text-slate-400 transition hover:text-white"
        >
          ← Voltar para treinos
        </button>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 border-b border-slate-800 pb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-wide text-cyan-400">
                Detalhes do treino
              </p>

              <h1 className="text-3xl font-bold">
                {training.title}
              </h1>

              <p className="mt-3 max-w-3xl whitespace-pre-line text-slate-400">
                {training.description ||
                  "Este treino não possui descrição."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-4">
              <p className="text-sm text-slate-400">
                Zona planejada
              </p>

              <p className="mt-1 text-lg font-semibold text-cyan-300">
                {getZoneLabel(training.zone)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-800 py-8 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Data"
              value={formatDate(training.date)}
            />

            <InfoCard
              label="Duração planejada"
              value={`${training.duration} min`}
            />

            <InfoCard
              label="Zona"
              value={training.zone}
            />

            <InfoCard
              label="Status atual"
              value={getStatusLabel(training.status)}
            />
          </div>

          <form
            onSubmit={handleSubmit}
            className="pt-8"
          >
            <div className="mb-8">
              <h2 className="text-xl font-semibold">
                Resultado do treino
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Preencha os dados realizados para que a IA
                consiga ajustar os próximos treinos.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <SelectField
                label="Status"
                value={form.status}
                onChange={(value) =>
                  updateField(
                    "status",
                    value as TrainingStatus,
                  )
                }
              >
                <option value="planned">
                  Planejado
                </option>

                <option value="in_progress">
                  Em andamento
                </option>

                <option value="completed">
                  Concluído
                </option>

                <option value="missed">
                  Não realizado
                </option>

                <option value="cancelled">
                  Cancelado
                </option>
              </SelectField>

              <NumberField
                label="Duração realizada"
                unit="min"
                value={
                  form.completedDurationMinutes
                }
                onChange={(value) =>
                  updateField(
                    "completedDurationMinutes",
                    value,
                  )
                }
                min={0}
                step="1"
              />

              <NumberField
                label="Frequência cardíaca média"
                unit="bpm"
                value={form.averageHeartRate}
                onChange={(value) =>
                  updateField(
                    "averageHeartRate",
                    value,
                  )
                }
                min={0}
                step="1"
              />

              <NumberField
                label="Frequência cardíaca máxima"
                unit="bpm"
                value={form.maxHeartRate}
                onChange={(value) =>
                  updateField(
                    "maxHeartRate",
                    value,
                  )
                }
                min={0}
                step="1"
              />

              <NumberField
                label="Distância"
                unit="km"
                value={form.distanceKm}
                onChange={(value) =>
                  updateField(
                    "distanceKm",
                    value,
                  )
                }
                min={0}
                step="0.01"
              />

              <NumberField
                label="Velocidade média"
                unit="km/h"
                value={form.averageSpeed}
                onChange={(value) =>
                  updateField(
                    "averageSpeed",
                    value,
                  )
                }
                min={0}
                step="0.1"
              />

              <NumberField
                label="Cadência média"
                unit="rpm"
                value={form.cadence}
                onChange={(value) =>
                  updateField(
                    "cadence",
                    value,
                  )
                }
                min={0}
                step="1"
              />

              <NumberField
                label="Calorias"
                unit="kcal"
                value={form.calories}
                onChange={(value) =>
                  updateField(
                    "calories",
                    value,
                  )
                }
                min={0}
                step="1"
              />

              <NumberField
                label="Ganho de elevação"
                unit="m"
                value={form.elevationGain}
                onChange={(value) =>
                  updateField(
                    "elevationGain",
                    value,
                  )
                }
                min={0}
                step="1"
              />

              <NumberField
                label="Esforço percebido"
                unit="RPE 1–10"
                value={form.perceivedEffort}
                onChange={(value) =>
                  updateField(
                    "perceivedEffort",
                    value,
                  )
                }
                min={1}
                max={10}
                step="1"
                error={
                  invalidRpe
                    ? "O RPE deve estar entre 1 e 10."
                    : undefined
                }
              />
            </div>

            <div className="mt-6">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Observações do atleta
                </span>

                <textarea
                  value={form.athleteFeedback}
                  onChange={(event) =>
                    updateField(
                      "athleteFeedback",
                      event.target.value,
                    )
                  }
                  rows={5}
                  placeholder="Exemplo: senti as pernas pesadas, dormi pouco, completei bem os intervalos..."
                  className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>
            </div>

            {updateTrainingMutation.isError && (
              <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {updateTrainingMutation.error
                  instanceof Error
                  ? updateTrainingMutation.error
                      .message
                  : "Não foi possível salvar o treino."}
              </div>
            )}

            {successMessage && (
              <div className="mt-6 rounded-xl border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
                {successMessage}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  router.push("/training")
                }
                className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  updateTrainingMutation.isPending ||
                  invalidRpe
                }
                className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateTrainingMutation.isPending
                  ? "Salvando..."
                  : "Salvar resultado"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}

function NumberField({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step,
  error,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          min={min}
          max={max}
          step={step}
          className={`w-full rounded-xl border bg-slate-950 px-4 py-3 pr-20 text-white outline-none transition placeholder:text-slate-600 focus:ring-2 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20"
          }`}
        />

        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-slate-500">
          {unit}
        </span>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
      >
        {children}
      </select>
    </label>
  );
}