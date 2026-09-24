"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface OperationSession {
  id: number;
  started_at: string;
  ended_at: string | null;
  start_seed_count: number;
  end_seed_count: number | null;
  start_hole_count: number;
  end_hole_count: number | null;
  obstacle_count: number;
  status: string;
}

interface OperationCommand {
  id: number;
  created_at: string;
  operator_name: string | null;
  operator_email: string | null;
  command: string;
  command_label: string;
  status: "sent" | "failed";
}

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function formatDuration(
  startedAt: string,
  endedAt: string | null
) {
  if (!endedAt) {
    return "Currently running";
  }

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();

  const totalSeconds = Math.max(
    0,
    Math.floor((end - start) / 1000)
  );

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function getSeeds(session: OperationSession) {
  if (session.end_seed_count === null) {
    return null;
  }

  return Math.max(
    0,
    session.end_seed_count -
      session.start_seed_count
  );
}

function getHoles(session: OperationSession) {
  if (session.end_hole_count === null) {
    return null;
  }

  return Math.max(
    0,
    session.end_hole_count -
      session.start_hole_count
  );
}

function getCompletionRate(
  session: OperationSession
) {
  const holes = getHoles(session);
  const seeds = getSeeds(session);

  if (
    holes === null ||
    seeds === null ||
    holes === 0
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.max(0, (seeds / holes) * 100)
  );
}

function formatStatus(status: string) {
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

function formatCommandStatus(
  status: OperationCommand["status"]
) {
  return status === "sent" ? "Sent" : "Failed";
}

export default function OperationDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] =
    useState<OperationSession | null>(null);

  const [commands, setCommands] =
    useState<OperationCommand[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [commandsLoading, setCommandsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const id = Number(params.id);

    if (!Number.isInteger(id)) {
      setError("Invalid operation ID.");
      setIsLoading(false);
      setCommandsLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    let mounted = true;
    let commandChannel: ReturnType<
      typeof supabase.channel
    > | null = null;

    const loadSession = async () => {
      setIsLoading(true);
      setCommandsLoading(true);
      setError(null);

      const { data, error: fetchError } =
        await supabase
          .from("operation_sessions")
          .select(
            `
              id,
              started_at,
              ended_at,
              start_seed_count,
              end_seed_count,
              start_hole_count,
              end_hole_count,
              obstacle_count,
              status
            `
          )
          .eq("id", id)
          .single();

      if (fetchError) {
        console.error(
          "Failed to load operation details:",
          fetchError
        );

        if (mounted) {
          setError(
            "Operation record could not be found."
          );
          setIsLoading(false);
          setCommandsLoading(false);
        }

        return;
      }

      if (!mounted) {
        return;
      }

      setSession(data);
      setIsLoading(false);

      const {
        data: commandData,
        error: commandError,
      } = await supabase
        .from("machine_command_logs")
        .select(
          "id, created_at, operator_name, operator_email, command, command_label, status"
        )
        .eq("operation_session_id", id)
        .order("created_at", {
          ascending: false,
        });

      if (commandError) {
        console.error(
          "Failed to load operation commands:",
          commandError
        );

        if (mounted) {
          setCommands([]);
          setCommandsLoading(false);
        }

        return;
      }

      if (mounted) {
        setCommands(
          (commandData ??
            []) as OperationCommand[]
        );
        setCommandsLoading(false);
      }
    };

    const setupRealtime = async () => {
      const channelName =
        `operation-command-activity-${id}`;

      const existingChannel = supabase
        .getChannels()
        .find(
          (currentChannel) =>
            currentChannel.topic ===
            `realtime:${channelName}`
        );

      if (existingChannel) {
        await supabase.removeChannel(
          existingChannel
        );
      }

      if (!mounted) {
        return;
      }

      commandChannel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "machine_command_logs",
            filter: `operation_session_id=eq.${id}`,
          },
          (payload) => {
            if (!mounted) {
              return;
            }

            const command =
              payload.new as OperationCommand;

            setCommands((current) => {
              if (
                current.some(
                  (existingCommand) =>
                    existingCommand.id ===
                    command.id
                )
              ) {
                return current;
              }

              return [
                command,
                ...current,
              ].sort(
                (a, b) =>
                  new Date(
                    b.created_at
                  ).getTime() -
                  new Date(
                    a.created_at
                  ).getTime()
              );
            });
          }
        )
        .subscribe(
          (
            status,
            realtimeError
          ) => {
            console.log(
              "Operation Command Activity Realtime status:",
              status
            );

            if (realtimeError) {
              console.error(
                "Operation Command Activity Realtime error:",
                realtimeError
              );
            }
          }
        );
    };

    void loadSession();
    void setupRealtime();

    return () => {
      mounted = false;

      if (commandChannel) {
        void supabase.removeChannel(
          commandChannel
        );
        commandChannel = null;
      }
    };
  }, [params.id]);

  const statistics = useMemo(() => {
    if (!session) {
      return {
        holes: null,
        seeds: null,
        completionRate: null,
      };
    }

    return {
      holes: getHoles(session),
      seeds: getSeeds(session),
      completionRate:
        getCompletionRate(session),
    };
  }, [session]);

  const commandSummary = useMemo(() => {
    const movementCommands = commands.filter(
      (command) =>
        command.command === "F" ||
        command.command === "B" ||
        command.command === "L" ||
        command.command === "R"
    ).length;

    const startCommands = commands.filter(
      (command) => command.command === "D"
    ).length;

    const stopCommands = commands.filter(
      (command) => command.command === "S"
    ).length;

    const failedCommands = commands.filter(
      (command) => command.status === "failed"
    ).length;

    return {
      total: commands.length,
      movement: movementCommands,
      start: startCommands,
      stop: stopCommands,
      failed: failedCommands,
    };
  }, [commands]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
        <div className="mx-auto flex min-h-[60vh] max-w-[1200px] items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />

            <p className="text-sm font-medium text-slate-600">
              Loading operation details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
        <div className="mx-auto max-w-[1200px] px-6 py-10">
          <button
            type="button"
            onClick={() =>
              router.push("/operation-history")
            }
            className="mb-8 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:-translate-x-1 hover:border-slate-300 hover:text-slate-900"
          >
            ← Back to Operation History
          </button>

          <div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-lg font-bold text-red-500">
              !
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              Operation unavailable
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error ||
                "The requested operation could not be loaded."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-7 sm:px-8 sm:py-9">

        {/* Back button */}
        <button
          type="button"
          onClick={() =>
            router.push("/operation-history")
          }
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md"
        >
          ← Operation History
        </button>

        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-6 py-8 shadow-xl sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 animate-pulse rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  session.status === "running"
                    ? "animate-pulse bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                    : "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                }`}
              />

              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Operation #{session.id}
              </span>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Operation Details
                </h1>

                <p className="mt-3 text-sm text-slate-300 sm:text-base">
                  Detailed record of this AgriDrill
                  planting session.
                </p>
              </div>

              <span
                className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-semibold ${
                  session.status === "running"
                    ? "bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/20"
                    : session.status === "completed"
                      ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20"
                      : "bg-white/10 text-slate-300"
                }`}
              >
                <span
                  className={`mr-2 h-2 w-2 rounded-full ${
                    session.status === "running"
                      ? "animate-pulse bg-amber-400"
                      : session.status ===
                          "completed"
                        ? "bg-emerald-400"
                        : "bg-slate-400"
                  }`}
                />

                {formatStatus(session.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Main statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Duration */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-slate-500">
              Duration
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {formatDuration(
                session.started_at,
                session.ended_at
              )}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Operation runtime
            </p>
          </div>

          {/* Holes */}
          <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-emerald-700/70">
              Total Holes
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {statistics.holes ?? "—"}
            </p>

            <p className="mt-2 text-xs text-emerald-700/50">
              Holes created
            </p>
          </div>

          {/* Seeds */}
          <div className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-blue-700/70">
              Total Seeds
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {statistics.seeds ?? "—"}
            </p>

            <p className="mt-2 text-xs text-blue-700/50">
              Seedlings planted
            </p>
          </div>

          {/* Completion */}
          <div className="group rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-purple-700/70">
              Completion Rate
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {statistics.completionRate ===
              null
                ? "—"
                : `${statistics.completionRate.toFixed(1)}%`}
            </p>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-purple-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000"
                style={{
                  width: `${
                    statistics.completionRate ?? 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Timing information */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Operation Timing
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recorded start and end timestamps for
              this session.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px bg-slate-100 md:grid-cols-2">
            <div className="bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Start Time
              </p>

              <p className="mt-2 text-base font-semibold text-slate-900">
                {formatDateTime(
                  session.started_at
                )}
              </p>
            </div>

            <div className="bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                End Time
              </p>

              <p className="mt-2 text-base font-semibold text-slate-900">
                {session.ended_at
                  ? formatDateTime(
                      session.ended_at
                    )
                  : "Operation still running"}
              </p>
            </div>
          </div>
        </section>

        {/* Counter information */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Planting Counters
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Counter values recorded at the beginning
              and end of the operation.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Counter
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Start
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    End
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Result
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-6 py-5 text-sm font-medium text-slate-700">
                    Hole Count
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-600">
                    {session.start_hole_count}
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-600">
                    {session.end_hole_count ??
                      "—"}
                  </td>

                  <td className="px-6 py-5 text-sm font-bold text-emerald-700">
                    {statistics.holes ?? "—"}
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-5 text-sm font-medium text-slate-700">
                    Seed Count
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-600">
                    {session.start_seed_count}
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-600">
                    {session.end_seed_count ??
                      "—"}
                  </td>

                  <td className="px-6 py-5 text-sm font-bold text-blue-700">
                    {statistics.seeds ?? "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Command Activity Summary */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Command Activity Summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Summary of operator commands recorded during this operation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Total Commands
              </p>

              <p className="mt-3 text-3xl font-black text-slate-900">
                {commandSummary.total}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                All recorded commands
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700/70">
                Movement
              </p>

              <p className="mt-3 text-3xl font-black text-blue-900">
                {commandSummary.movement}
              </p>

              <p className="mt-1 text-xs text-blue-700/60">
                F, B, L, and R
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700/70">
                Start
              </p>

              <p className="mt-3 text-3xl font-black text-amber-900">
                {commandSummary.start}
              </p>

              <p className="mt-1 text-xs text-amber-700/60">
                D commands
              </p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700/70">
                Stop
              </p>

              <p className="mt-3 text-3xl font-black text-rose-900">
                {commandSummary.stop}
              </p>

              <p className="mt-1 text-xs text-rose-700/60">
                S commands
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-700/70">
                Failed
              </p>

              <p className="mt-3 text-3xl font-black text-red-900">
                {commandSummary.failed}
              </p>

              <p className="mt-1 text-xs text-red-700/60">
                Commands not sent successfully
              </p>
            </div>
          </div>
        </section>

        {/* Command Activity */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Command Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Operator commands recorded during this operation.
                </p>
              </div>

              {session.status === "running" ? (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Live
                </span>
              ) : null}
            </div>
          </div>

          {commandsLoading ? (
            <div className="flex items-center justify-center px-6 py-10">
              <div className="text-sm font-medium text-slate-500">
                Loading command activity...
              </div>
            </div>
          ) : commands.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No command activity recorded
              </p>

              <p className="mt-1 text-sm text-slate-500">
                No machine commands are associated with this
                operation session.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Time
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Operator
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Command
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {commands.map((command) => {
                    const operator =
                      command.operator_name?.trim() ||
                      command.operator_email?.trim() ||
                      "Unknown operator";

                    const isStop =
                      command.command === "S";

                    const isStart =
                      command.command === "D";

                    return (
                      <tr
                        key={command.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDateTime(
                            command.created_at
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {operator}
                            </p>

                            {command.operator_email &&
                            command.operator_name ? (
                              <p className="mt-0.5 text-xs text-slate-400">
                                {command.operator_email}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex min-w-10 items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-black ${
                              isStop
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : isStart
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-slate-200 bg-slate-100 text-slate-700"
                            }`}
                          >
                            {command.command}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                          {command.command_label}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              command.status ===
                              "sent"
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            {formatCommandStatus(
                              command.status
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Obstacles */}
        <section className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50/80 to-white px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Obstacle Events
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Obstacle detections recorded during this
              operation.
            </p>
          </div>

          <div className="flex items-center justify-between px-6 py-6">
            <div>
              <p className="text-3xl font-bold text-slate-900">
                {session.obstacle_count}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Recorded obstacle event
                {session.obstacle_count === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700">
              OB
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}