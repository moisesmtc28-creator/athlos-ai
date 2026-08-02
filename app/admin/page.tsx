"use client";

import {
  Check,
  Clock3,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";

type AccessStatus =
  | "pending"
  | "approved"
  | "rejected";

type AthleteProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  status: string | null;
  role: string | null;
  created_at: string | null;
  goal: string | null;
  current_weight: number | null;
  target_weight: number | null;
};

type FilterStatus =
  | "all"
  | AccessStatus;

export default function AdminPage() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<
    AthleteProfile[]
  >([]);

  const [filter, setFilter] =
    useState<FilterStatus>("pending");

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [updatingUserId, setUpdatingUserId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("athlete_profiles")
        .select(
          `
            id,
            user_id,
            full_name,
            status,
            role,
            created_at,
            goal,
            current_weight,
            target_weight
          `,
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setProfiles(
        (data ?? []) as AthleteProfile[],
      );
    } catch (error) {
      console.error(
        "Erro ao carregar cadastros:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os cadastros.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAccess() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("athlete_profiles")
          .select("role, status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (profileError) {
          throw profileError;
        }

        const isAdmin =
          profile?.role === "admin" &&
          profile?.status === "approved";

        if (!isAdmin) {
          router.replace("/");
          return;
        }

        setCheckingAccess(false);
        await loadProfiles();
      } catch (error) {
        console.error(
          "Erro ao verificar administrador:",
          error,
        );

        if (isMounted) {
          router.replace("/");
        }
      }
    }

    void checkAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [loadProfiles, router]);

  async function updateStatus(
    profile: AthleteProfile,
    status: AccessStatus,
  ) {
    setUpdatingUserId(profile.user_id);
    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("athlete_profiles")
        .update({
          status,
          role:
            profile.role === "admin"
              ? "admin"
              : "athlete",
          updated_at:
            new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);

      if (error) {
        throw error;
      }

      setProfiles((currentProfiles) =>
        currentProfiles.map(
          (currentProfile) =>
            currentProfile.user_id ===
            profile.user_id
              ? {
                  ...currentProfile,
                  status,
                }
              : currentProfile,
        ),
      );

      setMessage(
        status === "approved"
          ? `${profile.full_name ?? "Usuário"} foi aprovado.`
          : status === "rejected"
            ? `${profile.full_name ?? "Usuário"} foi recusado.`
            : `${profile.full_name ?? "Usuário"} voltou para pendente.`,
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar cadastro:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o cadastro.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleLogout() {
    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível sair da conta.",
      );
    }
  }

  const filteredProfiles = useMemo(() => {
    if (filter === "all") {
      return profiles;
    }

    return profiles.filter(
      (profile) =>
        normalizeStatus(profile.status) ===
        filter,
    );
  }, [filter, profiles]);

  const counts = useMemo(() => {
    return {
      all: profiles.length,
      pending: profiles.filter(
        (profile) =>
          normalizeStatus(profile.status) ===
          "pending",
      ).length,
      approved: profiles.filter(
        (profile) =>
          normalizeStatus(profile.status) ===
          "approved",
      ).length,
      rejected: profiles.filter(
        (profile) =>
          normalizeStatus(profile.status) ===
          "rejected",
      ).length,
    };
  }, [profiles]);

  if (checkingAccess) {
    return (
      <LoadingScreen text="Verificando acesso administrativo..." />
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-zinc-900 to-zinc-950 p-5 shadow-2xl sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <ShieldCheck size={16} />
                Área exclusiva
              </div>

              <h1 className="mt-4 text-3xl font-black sm:text-4xl">
                Administração
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Aprove, recuse e acompanhe os
                cadastros do Athlos AI.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void loadProfiles()}
                disabled={loading}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 font-semibold text-zinc-200 transition hover:border-emerald-500/40 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
                Atualizar
              </button>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 font-semibold text-red-300 transition hover:bg-red-500/20"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Todos"
            value={counts.all}
            icon={<ShieldCheck size={20} />}
          />

          <SummaryCard
            label="Pendentes"
            value={counts.pending}
            icon={<Clock3 size={20} />}
          />

          <SummaryCard
            label="Aprovados"
            value={counts.approved}
            icon={<UserCheck size={20} />}
          />

          <SummaryCard
            label="Recusados"
            value={counts.rejected}
            icon={<UserX size={20} />}
          />
        </section>

        <section className="mt-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <FilterButton
              label="Pendentes"
              active={filter === "pending"}
              count={counts.pending}
              onClick={() =>
                setFilter("pending")
              }
            />

            <FilterButton
              label="Aprovados"
              active={filter === "approved"}
              count={counts.approved}
              onClick={() =>
                setFilter("approved")
              }
            />

            <FilterButton
              label="Recusados"
              active={filter === "rejected"}
              count={counts.rejected}
              onClick={() =>
                setFilter("rejected")
              }
            />

            <FilterButton
              label="Todos"
              active={filter === "all"}
              count={counts.all}
              onClick={() =>
                setFilter("all")
              }
            />
          </div>
        </section>

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <section className="mt-6">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900">
              <div className="text-center">
                <Loader2 className="mx-auto h-9 w-9 animate-spin text-emerald-400" />

                <p className="mt-3 text-sm text-zinc-400">
                  Carregando cadastros...
                </p>
              </div>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-14 text-center">
              <ShieldCheck
                className="mx-auto text-zinc-600"
                size={42}
              />

              <h2 className="mt-4 text-xl font-bold">
                Nenhum cadastro encontrado
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Não há usuários nesta categoria.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredProfiles.map(
                (profile) => (
                  <UserCard
                    key={profile.id}
                    profile={profile}
                    updating={
                      updatingUserId ===
                      profile.user_id
                    }
                    onApprove={() =>
                      void updateStatus(
                        profile,
                        "approved",
                      )
                    }
                    onReject={() =>
                      void updateStatus(
                        profile,
                        "rejected",
                      )
                    }
                    onPending={() =>
                      void updateStatus(
                        profile,
                        "pending",
                      )
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

type UserCardProps = {
  profile: AthleteProfile;
  updating: boolean;
  onApprove: () => void;
  onReject: () => void;
  onPending: () => void;
};

function UserCard({
  profile,
  updating,
  onApprove,
  onReject,
  onPending,
}: UserCardProps) {
  const status =
    normalizeStatus(profile.status);

  const initial =
    profile.full_name
      ?.trim()
      .charAt(0)
      .toUpperCase() || "A";

  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-lg font-black text-emerald-400">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="truncate text-lg font-bold">
                {profile.full_name ||
                  "Atleta sem nome"}
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Cadastro em{" "}
                {formatDate(
                  profile.created_at,
                )}
              </p>
            </div>

            <StatusBadge status={status} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <DataBox
              label="Peso atual"
              value={
                profile.current_weight
                  ? `${profile.current_weight} kg`
                  : "Não informado"
              }
            />

            <DataBox
              label="Meta"
              value={
                profile.target_weight
                  ? `${profile.target_weight} kg`
                  : "Não informada"
              }
            />
          </div>

          <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Objetivo
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {profile.goal ||
                "Objetivo ainda não informado."}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {status !== "approved" && (
              <button
                type="button"
                onClick={onApprove}
                disabled={updating}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <Loader2
                    className="animate-spin"
                    size={17}
                  />
                ) : (
                  <Check size={17} />
                )}
                Aprovar
              </button>
            )}

            {status !== "rejected" && (
              <button
                type="button"
                onClick={onReject}
                disabled={updating}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={17} />
                Recusar
              </button>
            )}

            {status !== "pending" &&
              profile.role !== "admin" && (
                <button
                  type="button"
                  onClick={onPending}
                  disabled={updating}
                  className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Clock3 size={17} />
                  Pendente
                </button>
              )}
          </div>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
        {icon}
      </div>

      <p className="mt-3 text-2xl font-black">
        {value}
      </p>

      <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-emerald-500 bg-emerald-500 text-zinc-950"
          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: AccessStatus;
}) {
  const styles = {
    pending:
      "border-amber-500/30 bg-amber-500/10 text-amber-300",
    approved:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    rejected:
      "border-red-500/30 bg-red-500/10 text-red-300",
  };

  const labels = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Recusado",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function DataBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-xs text-zinc-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function LoadingScreen({
  text,
}: {
  text: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-400" />

        <p className="mt-4 text-sm text-zinc-400">
          {text}
        </p>
      </div>
    </main>
  );
}

function normalizeStatus(
  status: string | null,
): AccessStatus {
  const normalized =
    status?.trim().toLowerCase();

  if (normalized === "approved") {
    return "approved";
  }

  if (normalized === "rejected") {
    return "rejected";
  }

  return "pending";
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "data não informada";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(value));
}