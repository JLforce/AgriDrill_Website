"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatDuration(
  startedAt: string,
  endedAt: string | null
) {
  if (!endedAt) {
    return "Running";
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

function getSeedCount(session: OperationSession) {
  if (session.end_seed_count === null) {
    return null;
  }

  return Math.max(
    0,
    session.end_seed_count -
      session.start_seed_count
  );
}

function getHoleCount(session: OperationSession) {
  if (session.end_hole_count === null) {
    return null;
  }

  return Math.max(
    0,
    session.end_hole_count -
      session.start_hole_count
  );
}

function formatStatus(status: string) {
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

export default function OperationHistoryPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<
    OperationSession[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const loadSessions = async () => {
      setIsLoading(true);

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
          .order("started_at", {
            ascending: false,
          });

      if (fetchError) {
        console.error(
          "Failed to load operation history:",
          fetchError
        );

        setError(
          "Failed to load operation history."
        );
        setIsLoading(false);
        return;
      }

      setSessions(data ?? []);
      setIsLoading(false);
    };

    loadSessions();

    const channel = supabase
      .channel("operation-history-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "operation_sessions",
        },
        () => {
          loadSessions();
        }
      )
      .subscribe((status) => {
        console.log(
          "Operation history realtime:",
          status
        );
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const summary = useMemo(() => {
    let totalHoles = 0;
    let totalSeeds = 0;
    let totalObstacles = 0;
    let runningOperations = 0;
    let completedOperations = 0;

    for (const session of sessions) {
      const holes = getHoleCount(session);
      const seeds = getSeedCount(session);

      if (holes !== null) {
        totalHoles += holes;
      }

      if (seeds !== null) {
        totalSeeds += seeds;
      }

      totalObstacles += session.obstacle_count;

      if (session.status === "running") {
        runningOperations++;
      }

      if (session.status === "completed") {
        completedOperations++;
      }
    }

    return {
      totalOperations: sessions.length,
      totalHoles,
      totalSeeds,
      totalObstacles,
      runningOperations,
      completedOperations,
    };
  }, [sessions]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">

        {/* HERO HEADER */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-6 py-8 shadow-xl sm:px-8 sm:py-10">

          {/* Decorative animated background */}
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />
          <div
            className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />

          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Operation History
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Review previous AgriDrill planting
                operations, production results, obstacle
                events, and machine activity.
              </p>
            </div>

            <div className="w-fit rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-md">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Recorded sessions
              </p>

              <p className="mt-1 text-2xl font-bold text-white">
                {summary.totalOperations}
              </p>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        {!isLoading && !error && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Operations */}
            <div
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
              style={{ animationDelay: "100ms" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Operations
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-900 transition-transform duration-300 group-hover:scale-105">
                    {summary.totalOperations}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-lg">
                  OP
                </div>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-slate-700 to-slate-900 transition-all duration-700 group-hover:translate-x-1" />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {summary.completedOperations} completed
              </p>
            </div>

            {/* Holes */}
            <div
              className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
              style={{ animationDelay: "200ms" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700/70">
                    Total Holes
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-900 transition-transform duration-300 group-hover:scale-105">
                    {summary.totalHoles}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700 shadow-sm">
                  HL
                </div>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700 group-hover:w-full" />
              </div>

              <p className="mt-2 text-xs text-emerald-700/50">
                Holes created across sessions
              </p>
            </div>

            {/* Seeds */}
            <div
              className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              style={{ animationDelay: "300ms" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700/70">
                    Total Seeds
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-900 transition-transform duration-300 group-hover:scale-105">
                    {summary.totalSeeds}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700 shadow-sm">
                  SD
                </div>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-blue-100">
                <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700 group-hover:w-full" />
              </div>

              <p className="mt-2 text-xs text-blue-700/50">
                Recorded seedlings planted
              </p>
            </div>

            {/* Obstacles */}
            <div
              className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-xl"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700/70">
                    Obstacle Events
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-900 transition-transform duration-300 group-hover:scale-105">
                    {summary.totalObstacles}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xs font-bold text-amber-700 shadow-sm">
                  OB
                </div>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-amber-100">
                <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700 group-hover:w-3/5" />
              </div>

              <p className="mt-2 text-xs text-amber-700/50">
                Detected obstacle events
              </p>
            </div>
          </div>
        )}

        {/* MAIN TABLE CARD */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">

          {/* Header */}
          <div className="relative overflow-hidden border-b border-slate-200 px-6 py-6 sm:px-7">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 via-teal-500 to-blue-500" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />

                <h2 className="text-lg font-semibold text-slate-900">
                  Recorded Operations
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                Detailed session records stored in the
                AgriDrill database.
              </p>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />

              <p className="text-sm font-medium text-slate-600">
                Loading operation history...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Synchronizing with Supabase
              </p>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-lg font-bold text-red-500">
                !
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                Unable to load operations
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {error}
              </p>
            </div>
          )}

          {/* Empty */}
          {!isLoading &&
            !error &&
            sessions.length === 0 && (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 text-sm font-bold text-slate-500 shadow-sm">
                  OP
                </div>

                <h3 className="text-lg font-semibold text-slate-900">
                  No operations recorded yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Operation sessions will appear here once
                  they are recorded in the AgriDrill system.
                </p>
              </div>
            )}

          {/* Table */}
          {!isLoading &&
            !error &&
            sessions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Date
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Start Time
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Duration
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Holes
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Seeds
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Obstacles
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((session, index) => {
                      const holes = getHoleCount(session);
                      const seeds = getSeedCount(session);

                      return (
                        <tr
                          key={session.id}
                          className="group cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-50/40 hover:via-white hover:to-blue-50/30"
                          style={{
                            animationDelay: `${index * 75}ms`,
                          }}
                          role="link"
                          tabIndex={0}
                          aria-label={`View operation ${session.id}`}   
                          onClick={() =>
                            router.push(
                              `/operation-history/${session.id}`
    )
  }
  onKeyDown={(event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      router.push(
        `/operation-history/${session.id}`
      );
    }
  }}
>
                          <td className="whitespace-nowrap px-6 py-5">
                            <div className="font-semibold text-slate-900 transition-colors duration-200 group-hover:text-emerald-700">
                              {formatDate(
                                session.started_at
                              )}
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              Operation #{session.id}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                            {formatTime(
                              session.started_at
                            )}
                          </td>

                          <td className="whitespace-nowrap px-6 py-5">
                            <span
                              className={
                                session.ended_at
                                  ? "rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors group-hover:bg-white"
                                  : "rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm font-semibold text-amber-700"
                              }
                            >
                              {formatDuration(
                                session.started_at,
                                session.ended_at
                              )}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5">
                            <span className="text-sm font-bold text-emerald-700">
                              {holes ?? "—"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5">
                            <span className="text-sm font-bold text-blue-700">
                              {seeds ?? "—"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5">
                            <span
                              className={`rounded-lg px-2.5 py-1.5 text-sm font-semibold ${
                                session.obstacle_count > 0
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-50 text-slate-500"
                              }`}
                            >
                              {session.obstacle_count}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 group-hover:scale-105 ${
                                session.status ===
                                "running"
                                  ? "bg-amber-50 text-amber-700"
                                  : session.status ===
                                      "completed"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <span
                                className={`mr-2 h-2 w-2 rounded-full ${
                                  session.status ===
                                  "running"
                                    ? "animate-pulse bg-amber-500"
                                    : session.status ===
                                        "completed"
                                      ? "bg-emerald-500"
                                      : "bg-slate-400"
                                }`}
                              />

                              {formatStatus(
                                session.status
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

        {/* FOOTER STATUS */}
        <div className="mt-6 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Operation data is synchronized with the AgriDrill
            database.
          </p>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Realtime enabled
          </div>
        </div>
      </div>
    </div>
  );
}