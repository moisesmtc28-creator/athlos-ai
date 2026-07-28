"use client";

import {
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  useAthleteProfile,
  useSaveAthleteProfile,
} from "@/hooks/use-athlete-profile";

import {
  AthleteProfile,
  emptyAthleteProfile,
} from "@/types/athlete-profile";

const weekDays = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

function parseNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export default function ProfilePage() {
  const {
    data: savedProfile,
    isLoading,
    isError,
    error,
  } = useAthleteProfile();

  const saveMutation = useSaveAthleteProfile();

  const [profile, setProfile] = useState<AthleteProfile>(
    emptyAthleteProfile,
  );

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!savedProfile) {
      return;
    }

    // O perfil vem de uma consulta assíncrona. A sincronização é intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile({
      ...emptyAthleteProfile,
      ...savedProfile,
      available_days: savedProfile.available_days ?? [],
      available_minutes_by_day:
        savedProfile.available_minutes_by_day ?? {},
      gym_days: savedProfile.gym_days ?? [],
    });
  }, [savedProfile]);

  function updateField<K extends keyof AthleteProfile>(
    field: K,
    value: AthleteProfile[K],
  ) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  function toggleArrayValue(
    field: "available_days" | "gym_days",
    value: string,
  ) {
    setProfile((currentProfile) => {
      const currentValues = currentProfile[field];

      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      const nextProfile = {
        ...currentProfile,
        [field]: newValues,
      };

      if (
        field === "available_days" &&
        !newValues.includes(value)
      ) {
        const newMinutes = {
          ...currentProfile.available_minutes_by_day,
        };

        delete newMinutes[value];

        nextProfile.available_minutes_by_day = newMinutes;
      }

      return nextProfile;
    });
  }

  function updateAvailableMinutes(
    day: string,
    minutes: number,
  ) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      available_minutes_by_day: {
        ...currentProfile.available_minutes_by_day,
        [day]: minutes,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (!profile.full_name.trim()) {
      setMessage("Informe o nome do atleta.");
      return;
    }

    if (!profile.goal) {
      setMessage("Selecione o objetivo principal.");
      return;
    }

    if (profile.available_days.length === 0) {
      setMessage("Selecione pelo menos um dia disponível.");
      return;
    }

    try {
      await saveMutation.mutateAsync(profile);
      setMessage("Perfil salvo com sucesso!");
    } catch (saveError) {
      setMessage(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar o perfil.",
      );
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <p>Carregando perfil...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <h1 className="text-2xl font-bold">
          Perfil do atleta
        </h1>

        <p className="mt-4 text-red-400">
          {error instanceof Error
            ? error.message
            : "Erro ao carregar o perfil."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Athlos AI
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Perfil do atleta
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Essas informações serão usadas pela inteligência
            artificial para criar planos de treino personalizados.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Section
            title="Dados pessoais"
            description="Informações básicas do atleta."
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Nome completo">
                <TextInput
                  value={profile.full_name}
                  onChange={(event) =>
                    updateField("full_name", event.target.value)
                  }
                  placeholder="Nome do atleta"
                  required
                />
              </Field>

              <Field label="Data de nascimento">
                <TextInput
                  type="date"
                  value={profile.birth_date}
                  onChange={(event) =>
                    updateField("birth_date", event.target.value)
                  }
                />
              </Field>

              <Field label="Sexo">
                <SelectInput
                  value={profile.sex}
                  onChange={(event) =>
                    updateField(
                      "sex",
                      event.target.value as AthleteProfile["sex"],
                    )
                  }
                >
                  <option value="">Selecione</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </SelectInput>
              </Field>

              <NumberField
                label="Altura"
                suffix="cm"
                value={profile.height_cm}
                onChange={(value) =>
                  updateField("height_cm", value)
                }
              />

              <NumberField
                label="Peso atual"
                suffix="kg"
                step="0.1"
                value={profile.current_weight}
                onChange={(value) =>
                  updateField("current_weight", value)
                }
              />

              <NumberField
                label="Peso objetivo"
                suffix="kg"
                step="0.1"
                value={profile.target_weight}
                onChange={(value) =>
                  updateField("target_weight", value)
                }
              />
            </div>
          </Section>

          <Section
            title="Dados fisiológicos"
            description="Deixe em branco os valores que você ainda não conhece."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <NumberField
                label="Frequência cardíaca máxima"
                suffix="bpm"
                value={profile.max_heart_rate}
                onChange={(value) =>
                  updateField("max_heart_rate", value)
                }
              />

              <NumberField
                label="Frequência cardíaca de repouso"
                suffix="bpm"
                value={profile.resting_heart_rate}
                onChange={(value) =>
                  updateField("resting_heart_rate", value)
                }
              />

              <NumberField
                label="FTP"
                suffix="watts"
                value={profile.ftp}
                onChange={(value) => updateField("ftp", value)}
              />
            </div>
          </Section>

          <Section
            title="Perfil esportivo"
            description="Experiência, nível e características dos seus pedais."
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Nível atual">
                <SelectInput
                  value={profile.cycling_level}
                  onChange={(event) =>
                    updateField(
                      "cycling_level",
                      event.target
                        .value as AthleteProfile["cycling_level"],
                    )
                  }
                >
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">
                    Intermediário
                  </option>
                  <option value="advanced">Avançado</option>
                  <option value="elite">Elite</option>
                </SelectInput>
              </Field>

              <Field label="Modalidade principal">
                <SelectInput
                  value={profile.main_cycling_type}
                  onChange={(event) =>
                    updateField(
                      "main_cycling_type",
                      event.target
                        .value as AthleteProfile["main_cycling_type"],
                    )
                  }
                >
                  <option value="">Selecione</option>
                  <option value="mtb">MTB</option>
                  <option value="speed">Speed</option>
                  <option value="gravel">Gravel</option>
                  <option value="indoor">Indoor</option>
                  <option value="mixed">Misto</option>
                </SelectInput>
              </Field>

              <Field label="Bicicleta principal">
                <TextInput
                  value={profile.preferred_bike}
                  onChange={(event) =>
                    updateField(
                      "preferred_bike",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: MTB aro 29"
                />
              </Field>

              <Field label="Tipo de terreno">
                <SelectInput
                  value={profile.terrain}
                  onChange={(event) =>
                    updateField("terrain", event.target.value)
                  }
                >
                  <option value="">Selecione</option>
                  <option value="flat">Plano</option>
                  <option value="rolling">
                    Levemente ondulado
                  </option>
                  <option value="mountainous">
                    Montanhoso
                  </option>
                  <option value="mixed">Misto</option>
                </SelectInput>
              </Field>

              <NumberField
                label="Anos praticando ciclismo"
                suffix="anos"
                value={profile.cycling_years}
                onChange={(value) =>
                  updateField("cycling_years", value)
                }
              />

              <NumberField
                label="Treinos por semana"
                suffix="dias"
                min="0"
                max="14"
                value={profile.training_frequency}
                onChange={(value) =>
                  updateField("training_frequency", value)
                }
              />

              <NumberField
                label="Horas disponíveis por semana"
                suffix="horas"
                value={profile.weekly_hours}
                onChange={(value) =>
                  updateField("weekly_hours", value)
                }
              />

              <NumberField
                label="Maior pedal recente"
                suffix="km"
                step="0.1"
                value={profile.longest_recent_ride_km}
                onChange={(value) =>
                  updateField(
                    "longest_recent_ride_km",
                    value,
                  )
                }
              />

              <NumberField
                label="Velocidade média aproximada"
                suffix="km/h"
                step="0.1"
                value={profile.average_speed_kmh}
                onChange={(value) =>
                  updateField("average_speed_kmh", value)
                }
              />
            </div>
          </Section>

          <Section
            title="Objetivo"
            description="A IA usará este objetivo para definir volume e intensidade."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Objetivo principal">
                <SelectInput
                  value={profile.goal}
                  onChange={(event) =>
                    updateField("goal", event.target.value)
                  }
                  required
                >
                  <option value="">Selecione</option>
                  <option value="weight_loss">
                    Emagrecimento
                  </option>
                  <option value="performance">
                    Melhorar performance
                  </option>
                  <option value="endurance">
                    Aumentar resistência
                  </option>
                  <option value="speed">
                    Aumentar velocidade
                  </option>
                  <option value="climbing">
                    Melhorar em subidas
                  </option>
                  <option value="competition">
                    Preparação para prova
                  </option>
                  <option value="health">
                    Saúde e qualidade de vida
                  </option>
                </SelectInput>
              </Field>

              <Field label="Horário preferido">
                <SelectInput
                  value={profile.preferred_training_time}
                  onChange={(event) =>
                    updateField(
                      "preferred_training_time",
                      event.target
                        .value as AthleteProfile["preferred_training_time"],
                    )
                  }
                >
                  <option value="">Selecione</option>
                  <option value="morning">Manhã</option>
                  <option value="afternoon">Tarde</option>
                  <option value="evening">Noite</option>
                  <option value="variable">Variável</option>
                </SelectInput>
              </Field>

              <Field
                label="Detalhes do objetivo"
                className="md:col-span-2"
              >
                <TextArea
                  value={profile.goal_details}
                  onChange={(event) =>
                    updateField(
                      "goal_details",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: melhorar minha média, completar uma prova de 100 km e evoluir nas subidas."
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Equipamentos disponíveis"
            description="Marque os equipamentos usados durante os treinos."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Checkbox
                label="Cinta de frequência cardíaca"
                checked={profile.has_heart_rate_monitor}
                onChange={(checked) =>
                  updateField(
                    "has_heart_rate_monitor",
                    checked,
                  )
                }
              />

              <Checkbox
                label="Medidor de potência"
                checked={profile.has_power_meter}
                onChange={(checked) =>
                  updateField("has_power_meter", checked)
                }
              />

              <Checkbox
                label="Sensor de cadência"
                checked={profile.has_cadence_sensor}
                onChange={(checked) =>
                  updateField("has_cadence_sensor", checked)
                }
              />

              <Checkbox
                label="Sensor de velocidade"
                checked={profile.has_speed_sensor}
                onChange={(checked) =>
                  updateField("has_speed_sensor", checked)
                }
              />

              <Checkbox
                label="Rolo de treinamento"
                checked={profile.has_indoor_trainer}
                onChange={(checked) =>
                  updateField("has_indoor_trainer", checked)
                }
              />

              <Checkbox
                label="GPS ou ciclocomputador"
                checked={profile.has_gps_computer}
                onChange={(checked) =>
                  updateField("has_gps_computer", checked)
                }
              />
            </div>
          </Section>

          <Section
            title="Disponibilidade"
            description="Selecione os dias e o tempo disponível para pedalar."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {weekDays.map((day) => {
                const selected =
                  profile.available_days.includes(day.value);

                return (
                  <div
                    key={day.value}
                    className="rounded-xl border border-slate-700 bg-slate-900 p-4"
                  >
                    <Checkbox
                      label={day.label}
                      checked={selected}
                      onChange={() =>
                        toggleArrayValue(
                          "available_days",
                          day.value,
                        )
                      }
                    />

                    {selected && (
                      <div className="mt-3">
                        <label className="mb-1 block text-sm text-slate-400">
                          Minutos disponíveis
                        </label>

                        <TextInput
                          type="number"
                          min="15"
                          step="5"
                          value={
                            profile
                              .available_minutes_by_day[
                              day.value
                            ] ?? 60
                          }
                          onChange={(event) =>
                            updateAvailableMinutes(
                              day.value,
                              Number(event.target.value),
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section
            title="Musculação"
            description="Informe se o plano precisa considerar treinos de academia."
          >
            <Checkbox
              label="Faço musculação ou treinamento de força"
              checked={profile.does_strength_training}
              onChange={(checked) =>
                updateField(
                  "does_strength_training",
                  checked,
                )
              }
            />

            {profile.does_strength_training && (
              <div className="mt-5 space-y-5">
                <NumberField
                  label="Treinos de musculação por semana"
                  suffix="dias"
                  min="0"
                  max="7"
                  value={profile.strength_days_per_week}
                  onChange={(value) =>
                    updateField(
                      "strength_days_per_week",
                      value,
                    )
                  }
                />

                <div>
                  <p className="mb-3 text-sm font-medium text-slate-300">
                    Dias de academia
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {weekDays.map((day) => (
                      <Checkbox
                        key={day.value}
                        label={day.label}
                        checked={profile.gym_days.includes(
                          day.value,
                        )}
                        onChange={() =>
                          toggleArrayValue(
                            "gym_days",
                            day.value,
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Section>

          <Section
            title="Limitações e cuidados"
            description="Informe dores, lesões ou limitações que precisam ser consideradas."
          >
            <Field label="Limitações físicas">
              <TextArea
                value={profile.physical_limitations}
                onChange={(event) =>
                  updateField(
                    "physical_limitations",
                    event.target.value,
                  )
                }
                placeholder="Ex.: dor antiga na coluna, desconforto no joelho ou nenhuma limitação."
              />
            </Field>
          </Section>

          <Section
            title="Prova ou evento"
            description="Preencha somente se existir uma prova-alvo."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome da prova">
                <TextInput
                  value={profile.target_event_name}
                  onChange={(event) =>
                    updateField(
                      "target_event_name",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Desafio das Montanhas"
                />
              </Field>

              <Field label="Data da prova">
                <TextInput
                  type="date"
                  value={profile.target_event_date}
                  onChange={(event) =>
                    updateField(
                      "target_event_date",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </div>
          </Section>

          <div className="sticky bottom-4 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur">
            {message && (
              <p
                className={`mb-3 text-sm ${
                  message.includes("sucesso")
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {saveMutation.isPending
                ? "Salvando..."
                : "Salvar perfil"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function Section({
  title,
  description,
  children,
}: SectionProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-slate-400">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

function Field({
  label,
  children,
  className = "",
}: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      {children}
    </label>
  );
}

function TextInput(
  props: InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 ${props.className ?? ""}`}
    />
  );
}

function SelectInput(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500 ${props.className ?? ""}`}
    />
  );
}

function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      rows={4}
      className={`w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 ${props.className ?? ""}`}
    />
  );
}

interface NumberFieldProps {
  label: string;
  suffix?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: string;
  max?: string;
  step?: string;
}

function NumberField({
  label,
  suffix,
  value,
  onChange,
  min = "0",
  max,
  step = "1",
}: NumberFieldProps) {
  return (
    <Field label={label}>
      <div className="relative">
        <TextInput
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          onChange={(event) =>
            onChange(parseNumber(event.target.value))
          }
          className={suffix ? "pr-20" : ""}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Checkbox({
  label,
  checked,
  onChange,
}: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 transition hover:border-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-5 w-5 accent-emerald-500"
      />

      <span className="text-sm text-slate-200">
        {label}
      </span>
    </label>
  );
}