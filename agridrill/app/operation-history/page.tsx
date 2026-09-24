"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiDownload, FiFilter, FiRotateCcw } from "react-icons/fi";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { exportOperationHistoryCsv } from "@/utils/exportOperationHistoryCsv";

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

type StatusFilter = "all" | "running" | "completed";
type DateFilter = "all" | "today" | "7d" | "30d" | "custom";

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

function getDateFilterStart(dateFilter: DateFilter) {
  if (dateFilter === "all" || dateFilter === "custom") {
    return null;
  }

  const now = new Date();

  if (dateFilter === "today") {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    return startOfToday;
  }

  const start = new Date(now);

  if (dateFilter === "7d") {
    start.setDate(start.getDate() - 6);
  }

  if (dateFilter === "30d") {
    start.setDate(start.getDate() - 29);
  }

  start.setHours(0, 0, 0, 0);

  return start;
}

function getCustomRangeStart(dateString: string) {
  if (!dateString) {
    return null;
  }

  const start = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(start.getTime()) ? null : start;
}

function getCustomRangeEnd(dateString: string) {
  if (!dateString) {
    return null;
  }

  const end = new Date(`${dateString}T23:59:59.999`);
  return Number.isNaN(end.getTime()) ? null : end;
}

export default function OperationHistoryPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [sessions, setSessions] = useState<
    OperationSession[]
  >([]);

  const [commandCounts, setCommandCounts] =
    useState<Record<number, number>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [commandsLoading, setCommandsLoading] =
    useState(true);

  const [error, setError] = useState<string | null>(
    null
  );

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("all");

  const [customStartDate, setCustomStartDate] =
    useState("");

  const [customEndDate, setCustomEndDate] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCommandCounts = async (
      sessionRows: OperationSession[]
    ) => {
      if (!isMounted) {
        return;
      }

      setCommandsLoading(true);

      if (sessionRows.length === 0) {
        setCommandCounts({});
        setCommandsLoading(false);
        return;
      }

      const results = await Promise.all(
        sessionRows.map(async (session) => {
          const { count, error: countError } =
            await supabase
              .from("machine_command_logs")
              .select("id", {
                count: "exact",
                head: true,
              })
              .eq(
                "operation_session_id",
                session.id
              );

          if (countError) {
            console.error(
              `Failed to load command count for operation ${session.id}:`,
              countError
            );

            return {
              sessionId: session.id,
              count: 0,
            };
          }

          return {
            sessionId: session.id,
            count: count ?? 0,
          };
        })
      );

      if (!isMounted) {
        return;
      }

      const nextCounts: Record<number, number> = {};

      for (const result of results) {
        nextCounts[result.sessionId] = result.count;
      }

      setCommandCounts(nextCounts);
      setCommandsLoading(false);
    };

    const loadAllData = async () => {
      setIsLoading(true);
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
          .order("started_at", {
            ascending: false,
          });

      if (fetchError) {
        console.error(
          "Failed to load operation history:",
          fetchError
        );

        if (isMounted) {
          setError(
            "Failed to load operation history."
          );
          setIsLoading(false);
          setCommandsLoading(false);
        }

        return;
      }

      const sessionRows = data ?? [];

      if (isMounted) {
        setSessions(sessionRows);
        setIsLoading(false);
      }

      await loadCommandCounts(sessionRows);
    };

    void loadAllData();

    const operationChannel = supabase
      .channel("operation-history-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "operation_sessions",
        },
        () => {
          void loadAllData();
        }
      )
      .subscribe((status) => {
        console.log(
          "Operation history realtime:",
          status
        );
      });

    const commandChannel = supabase
      .channel(
        "operation-history-commands-realtime"
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "machine_command_logs",
        },
        (payload) => {
          const sessionId =
            payload.new.operation_session_id as
              | number
              | null;

          if (sessionId === null) {
            return;
          }

          setCommandCounts((current) => ({
            ...current,
            [sessionId]:
              (current[sessionId] ?? 0) + 1,
          }));
        }
      )
      .subscribe((status) => {
        console.log(
          "Operation history command realtime:",
          status
        );
      });

    return () => {
      isMounted = false;

      supabase.removeChannel(operationChannel);
      supabase.removeChannel(commandChannel);
    };
  }, [supabase]);

  const filteredSessions = useMemo(() => {
    const dateFilterStart =
      getDateFilterStart(dateFilter);

    const customStart =
      dateFilter === "custom"
        ? getCustomRangeStart(customStartDate)
        : null;

    const customEnd =
      dateFilter === "custom"
        ? getCustomRangeEnd(customEndDate)
        : null;

    return sessions.filter((session) => {
      const matchesStatus =
        statusFilter === "all" ||
        session.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      const sessionDate = new Date(
        session.started_at
      );

      if (dateFilter === "custom") {
        if (
          customStart &&
          sessionDate < customStart
        ) {
          return false;
        }

        if (
          customEnd &&
          sessionDate > customEnd
        ) {
          return false;
        }

        return true;
      }

      if (!dateFilterStart) {
        return true;
      }

      return sessionDate >= dateFilterStart;
    });
  }, [
    sessions,
    statusFilter,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  const summary = useMemo(() => {
    let totalHoles = 0;
    let totalSeeds = 0;
    let totalObstacles = 0;
    let totalCommands = 0;
    let runningOperations = 0;
    let completedOperations = 0;

    for (const session of filteredSessions) {
      const holes = getHoleCount(session);
      const seeds = getSeedCount(session);

      if (holes !== null) {
        totalHoles += holes;
      }

      if (seeds !== null) {
        totalSeeds += seeds;
      }

      totalObstacles += session.obstacle_count;
      totalCommands += commandCounts[session.id] ?? 0;

      if (session.status === "running") {
        runningOperations++;
      }

      if (session.status === "completed") {
        completedOperations++;
      }
    }

    return {
      totalOperations: filteredSessions.length,
      totalHoles,
      totalSeeds,
      totalObstacles,
      totalCommands,
      runningOperations,
      completedOperations,
    };
  }, [filteredSessions, commandCounts]);

  const filtersActive =
    statusFilter !== "all" ||
    dateFilter !== "all" ||
    customStartDate !== "" ||
    customEndDate !== "";

  const customRangeInvalid =
    dateFilter === "custom" &&
    customStartDate !== "" &&
    customEndDate !== "" &&
    customStartDate > customEndDate;

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const handleExport = () => {
    if (
      filteredSessions.length === 0 ||
      commandsLoading ||
      customRangeInvalid
    ) {
      return;
    }

    exportOperationHistoryCsv(
      filteredSessions,
      commandCounts
    );
  };

  return (
    <DashboardShell>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
        <div className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">

          {/* HERO HEADER */}
          <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-6 py-8 shadow-xl sm:px-8 sm:py-10">

            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 animate-pulse rounded-full bg-emerald-400/10 blur-3xl" />

            <div
              className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 animate-pulse rounded-full bg-cyan-400/10 blur-3xl"
              style={{
                animationDelay: "1s",
              }}
            />

            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Operation History
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Review previous AgriDrill planting
                  operations, production results,
                  obstacle events, and machine
                  activity.
                </p>
              </div>

              <div className="w-fit rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-md">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Showing
                </p>

                <p className="mt-1 text-2xl font-bold text-white">
                  {summary.totalOperations}
                </p>

                <p className="text-xs text-slate-400">
                  of {sessions.length} recorded
                </p>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <FiFilter />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Filter Operations
                  </h2>

                  <p className="text-xs text-slate-500">
                    Narrow the recorded sessions by
                    status or date.
                  </p>
                </div>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  <FiRotateCcw />
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* STATUS FILTER */}
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </span>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as StatusFilter
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="all">
                    All statuses
                  </option>

                  <option value="running">
                    Running
                  </option>

                  <option value="completed">
                    Completed
                  </option>
                </select>
              </label>

              {/* DATE FILTER */}
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date Range
                </span>

                <select
                  value={dateFilter}
                  onChange={(event) =>
                    setDateFilter(
                      event.target.value as DateFilter
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="all">
                    All dates
                  </option>

                  <option value="today">
                    Today
                  </option>

                  <option value="7d">
                    Last 7 days
                  </option>

                  <option value="30d">
                    Last 30 days
                  </option>

                  <option value="custom">
                    Custom range
                  </option>
                </select>
              </label>
            </div>

            {/* CUSTOM DATE RANGE */}
            {dateFilter === "custom" && (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Custom Date Range
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Select the start and end dates for
                    the operations you want to review.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      From
                    </span>

                    <input
                      type="date"
                      value={customStartDate}
                      max={customEndDate || undefined}
                      onChange={(event) =>
                        setCustomStartDate(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      To
                    </span>

                    <input
                      type="date"
                      value={customEndDate}
                      min={customStartDate || undefined}
                      onChange={(event) =>
                        setCustomEndDate(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                </div>

                {customRangeInvalid && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    The "To" date must be the same as
                    or later than the "From" date.
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredSessions.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {sessions.length}
                </span>{" "}
                operation
                {sessions.length === 1 ? "" : "s"}.
              </p>

              {commandsLoading && (
                <p className="text-xs font-medium text-slate-400">
                  Loading command counts...
                </p>
              )}
            </div>
          </section>

          {/* SUMMARY CARDS */}
          {!isLoading && !error && (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

              {/* Operations */}
              <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total Operations
                    </p>

                    <p className="mt-3 text-3xl font-bold text-slate-900">
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
                  {summary.runningOperations > 0 &&
                    ` • ${summary.runningOperations} running`}
                </p>
              </div>

              {/* Holes */}
              <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700/70">
                      Total Holes
                    </p>

                    <p className="mt-3 text-3xl font-bold text-slate-900">
                      {summary.totalHoles}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700">
                    HL
                  </div>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700 group-hover:w-full" />
                </div>

                <p className="mt-2 text-xs text-emerald-700/50">
                  Holes created across filtered
                  sessions
                </p>
              </div>

              {/* Seeds */}
              <div className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700/70">
                      Total Seeds
                    </p>

                    <p className="mt-3 text-3xl font-bold text-slate-900">
                      {summary.totalSeeds}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700">
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

              {/* Commands */}
              <div className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-violet-700/70">
                      Commands
                    </p>

                    <p className="mt-3 text-3xl font-bold text-slate-900">
                      {summary.totalCommands}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                    CM
                  </div>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-violet-100">
                  <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700 group-hover:w-full" />
                </div>

                <p className="mt-2 text-xs text-violet-700/50">
                  Machine commands recorded
                </p>
              </div>

              {/* Obstacles */}
              <div className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700/70">
                      Obstacle Events
                    </p>

                    <p className="mt-3 text-3xl font-bold text-slate-900">
                      {summary.totalObstacles}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xs font-bold text-amber-700">
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

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />

                    <h2 className="text-lg font-semibold text-slate-900">
                      Recorded Operations
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Detailed session records stored
                    in the AgriDrill database.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={
                    isLoading ||
                    commandsLoading ||
                    filteredSessions.length === 0 ||
                    customRangeInvalid
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiDownload />
                  Export CSV
                </button>
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

            {/* No operations at all */}
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
                    Operation sessions will appear
                    here once they are recorded in
                    the AgriDrill system.
                  </p>
                </div>
              )}

            {/* No matching operations */}
            {!isLoading &&
              !error &&
              sessions.length > 0 &&
              filteredSessions.length === 0 && (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500 shadow-sm">
                    0
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900">
                    No operations match these
                    filters
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Try changing the status or date
                    range, or clear the filters to see
                    all recorded operations.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <FiRotateCcw />
                    Clear Filters
                  </button>
                </div>
              )}

            {/* Table */}
            {!isLoading &&
              !error &&
              filteredSessions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
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
                          Commands
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
                      {filteredSessions.map(
                        (session, index) => {
                          const holes =
                            getHoleCount(session);

                          const seeds =
                            getSeedCount(session);

                          const sessionCommandCount =
                            commandCounts[
                              session.id
                            ] ?? 0;

                          return (
                            <tr
                              key={session.id}
                              className="group cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-50/40 hover:via-white hover:to-blue-50/30"
                              style={{
                                animationDelay: `${
                                  index * 75
                                }ms`,
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
                                  event.key ===
                                    "Enter" ||
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
                                  Operation #
                                  {session.id}
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
                                <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-sm font-semibold text-violet-700">
                                  {sessionCommandCount}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-6 py-5">
                                <span
                                  className={`rounded-lg px-2.5 py-1.5 text-sm font-semibold ${
                                    session.obstacle_count >
                                    0
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-slate-50 text-slate-500"
                                  }`}
                                >
                                  {
                                    session.obstacle_count
                                  }
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
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
          </section>

          {/* FOOTER STATUS */}
          <div className="mt-6 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Operation data is synchronized with the
              AgriDrill database.
            </p>

            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Realtime enabled
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}