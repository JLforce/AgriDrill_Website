"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiUser,
} from "react-icons/fi";

import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  type MachineCommandLog,
  useCommandHistory,
} from "@/hooks/useCommandHistory";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { exportCommandHistoryCsv } from "@/utils/exportCommandHistoryCsv";

// 16px text on phones: smaller text makes iPhones zoom the page when a
// field is tapped.
const SELECT_CLASSES =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 sm:text-sm";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({
  status,
}: {
  readonly status: MachineCommandLog["status"];
}) {
  if (status === "sent") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        <FiCheckCircle
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
        Sent
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
      <FiAlertCircle
        className="h-3.5 w-3.5"
        aria-hidden="true"
      />
      Failed
    </span>
  );
}

function CommandBadge({
  command,
}: {
  readonly command: MachineCommandLog["command"];
}) {
  const isStop = command === "S";
  const isStart = command === "D";

  return (
    <span
      className={`inline-flex min-w-10 shrink-0 items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-black ${
        isStop
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : isStart
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {command}
    </span>
  );
}

function OperatorCell({
  name,
  email,
}: {
  readonly name: string | null;
  readonly email: string | null;
}) {
  const displayName =
    name?.trim() ||
    email?.trim() ||
    "Unknown operator";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <FiUser
          className="h-4 w-4"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">
          {displayName}
        </p>

        {email && name ? (
          <p className="truncate text-xs text-slate-400">
            {email}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Link to the operation a command belongs to. It shows the user's own
 * operation number (1, 2, 3...), the same number Operation History shows.
 * The real database id is only used for the page address.
 */
function SessionLink({
  sessionId,
  sessionNumber,
}: {
  readonly sessionId: number | null;
  readonly sessionNumber: number | undefined;
}) {
  if (sessionId === null) {
    return <span className="text-slate-400">—</span>;
  }

  const label = sessionNumber ?? "…";

  return (
    <Link
      href={`/operation-history/${sessionId}`}
      className="whitespace-nowrap font-bold text-emerald-600 underline-offset-4 transition hover:text-emerald-700 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      title={`View Operation Session ${label}`}
    >
      Session {label}
    </Link>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr
          key={index}
          className="animate-pulse"
        >
          <td className="px-4 py-4">
            <div className="h-4 w-32 rounded bg-slate-200" />
          </td>

          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-200" />

              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-3 w-32 rounded bg-slate-200" />
              </div>
            </div>
          </td>

          <td className="px-4 py-4">
            <div className="h-8 w-12 rounded-xl bg-slate-200" />
          </td>

          <td className="px-4 py-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
          </td>

          <td className="px-4 py-4">
            <div className="h-7 w-20 rounded-full bg-slate-200" />
          </td>

          <td className="px-4 py-4">
            <div className="h-4 w-20 rounded bg-slate-200" />
          </td>
        </tr>
      ))}
    </>
  );
}

function LoadingCards() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-12 rounded-xl bg-slate-200" />

              <div className="space-y-2">
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="h-3 w-28 rounded bg-slate-200" />
              </div>
            </div>

            <div className="h-7 w-16 rounded-full bg-slate-200" />
          </div>

          <div className="mt-3 h-9 rounded-xl bg-slate-100" />
        </div>
      ))}
    </>
  );
}

/** Phone and tablet layout: one card per command. */
function CommandCard({
  log,
  sessionNumber,
}: {
  readonly log: MachineCommandLog;
  readonly sessionNumber: number | undefined;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CommandBadge command={log.command} />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {log.command_label}
            </p>

            <p className="text-xs text-slate-400">
              {formatDateTime(log.created_at)}
            </p>
          </div>
        </div>

        <StatusBadge status={log.status} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="min-w-0 flex-1">
          <OperatorCell
            name={log.operator_name}
            email={log.operator_email}
          />
        </div>

        <div className="shrink-0 text-sm font-semibold">
          <SessionLink
            sessionId={log.operation_session_id}
            sessionNumber={sessionNumber}
          />
        </div>
      </div>
    </article>
  );
}

function EmptyState({
  hasActiveFilters,
  onClearFilters,
}: {
  readonly hasActiveFilters: boolean;
  readonly onClearFilters: () => void;
}) {
  return (
    <div className="px-4 py-14 text-center sm:px-6 sm:py-16">
      <div className="mx-auto max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <FiActivity
            className="h-6 w-6"
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900">
          {hasActiveFilters
            ? "No matching command records"
            : "No command activity yet"}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {hasActiveFilters
            ? "Try changing the filters to view other command activity."
            : "Commands sent from the Robot Control panel will appear here."}
        </p>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            Clear Filters
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function CommandHistoryPage() {
  const {
    logs,
    isLoading,
    error,
  } = useCommandHistory();

  const supabase = useMemo(
    () => getSupabaseBrowserClient(),
    []
  );

  const [commandFilter, setCommandFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [sessionFilter, setSessionFilter] =
    useState("all");

  // Real session id -> the user's own operation number (1, 2, 3...)
  const [sessionNumbers, setSessionNumbers] =
    useState<Record<number, number>>({});

  // Session ids whose number was already requested.
  const requestedSessionIdsRef = useRef<Set<number>>(
    new Set()
  );

  // Look up the operation number of every session that appears in the
  // commands. Only sessions not seen before are requested.
  useEffect(() => {
    const missingIds = Array.from(
      new Set(
        logs
          .map((log) => log.operation_session_id)
          .filter(
            (sessionId): sessionId is number =>
              sessionId !== null
          )
      )
    ).filter(
      (sessionId) =>
        !requestedSessionIdsRef.current.has(sessionId)
    );

    if (missingIds.length === 0) {
      return;
    }

    missingIds.forEach((sessionId) =>
      requestedSessionIdsRef.current.add(sessionId)
    );

    const loadSessionNumbers = async () => {
      const found: Record<number, number> = {};
      let failed = false;

      // Ask in small groups so the request address never gets too long.
      for (let start = 0; start < missingIds.length; start += 100) {
        const chunk = missingIds.slice(start, start + 100);

        const { data, error: fetchError } = await supabase
          .from("operation_sessions")
          .select("id, user_sequence")
          .in("id", chunk);

        if (fetchError) {
          console.error(
            "Failed to load operation numbers:",
            fetchError
          );

          failed = true;

          // Allow another try later.
          chunk.forEach((sessionId) =>
            requestedSessionIdsRef.current.delete(sessionId)
          );

          continue;
        }

        for (const row of data ?? []) {
          found[row.id] = row.user_sequence ?? row.id;
        }

        // A session that could not be read keeps its real id as the number.
        for (const sessionId of chunk) {
          if (found[sessionId] === undefined) {
            found[sessionId] = sessionId;
          }
        }
      }

      if (Object.keys(found).length > 0) {
        setSessionNumbers((current) => ({
          ...current,
          ...found,
        }));
      }

      if (failed) {
        console.warn(
          "Some operation numbers could not be loaded."
        );
      }
    };

    void loadSessionNumbers();
  }, [logs, supabase]);

  const sessionOptions = useMemo(() => {
    return Array.from(
      new Set(
        logs
          .map(
            (log) =>
              log.operation_session_id
          )
          .filter(
            (
              sessionId
            ): sessionId is number =>
              sessionId !== null
          )
      )
    ).sort(
      (a, b) =>
        (sessionNumbers[a] ?? a) -
        (sessionNumbers[b] ?? b)
    );
  }, [logs, sessionNumbers]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCommand =
        commandFilter === "all" ||
        log.command === commandFilter;

      const matchesStatus =
        statusFilter === "all" ||
        log.status === statusFilter;

      const matchesSession =
        sessionFilter === "all" ||
        String(
          log.operation_session_id
        ) === sessionFilter;

      return (
        matchesCommand &&
        matchesStatus &&
        matchesSession
      );
    });
  }, [
    logs,
    commandFilter,
    statusFilter,
    sessionFilter,
  ]);

  const clearFilters = () => {
    setCommandFilter("all");
    setStatusFilter("all");
    setSessionFilter("all");
  };

  const hasActiveFilters =
    commandFilter !== "all" ||
    statusFilter !== "all" ||
    sessionFilter !== "all";

  const handleExport = () => {
    if (
      isLoading ||
      filteredLogs.length === 0
    ) {
      return;
    }

    // The exported file shows the user's own operation number, the same
    // number as on screen, instead of the internal database id.
    const exportLogs = filteredLogs.map((log) =>
      log.operation_session_id !== null
        ? {
            ...log,
            operation_session_id:
              sessionNumbers[
                log.operation_session_id
              ] ?? log.operation_session_id,
          }
        : log
    );

    exportCommandHistoryCsv(exportLogs);
  };

  return (
    <DashboardShell>
      <div className="space-y-6 sm:space-y-8">
        {/* PAGE HEADER */}
        <header className="flex items-start gap-4">
          <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-3 text-emerald-600 shadow-sm">
            <FiActivity
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Command History
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Operator commands sent to the AgriDrill machine.
            </p>
          </div>
        </header>

        {/* ERROR MESSAGE */}
        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            <FiAlertCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />

            <div>
              <p className="font-bold">
                Unable to load command history
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        {/* FILTERS */}
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">
              Filters
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Narrow the command activity records.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* COMMAND FILTER */}
            <label className="block min-w-0 space-y-2">
              <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Command
              </span>

              <select
                value={commandFilter}
                onChange={(event) =>
                  setCommandFilter(
                    event.target.value
                  )
                }
                className={SELECT_CLASSES}
              >
                <option value="all">
                  All commands
                </option>

                <option value="D">
                  Start
                </option>

                <option value="F">
                  Forward
                </option>

                <option value="B">
                  Backward
                </option>

                <option value="L">
                  Left
                </option>

                <option value="R">
                  Right
                </option>

                <option value="S">
                  Stop
                </option>
              </select>
            </label>

            {/* STATUS FILTER */}
            <label className="block min-w-0 space-y-2">
              <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Status
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className={SELECT_CLASSES}
              >
                <option value="all">
                  All statuses
                </option>

                <option value="sent">
                  Sent
                </option>

                <option value="failed">
                  Failed
                </option>
              </select>
            </label>

            {/* SESSION FILTER */}
            <label className="block min-w-0 space-y-2">
              <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Operation session
              </span>

              <select
                value={sessionFilter}
                onChange={(event) =>
                  setSessionFilter(
                    event.target.value
                  )
                }
                className={SELECT_CLASSES}
              >
                <option value="all">
                  All sessions
                </option>

                {sessionOptions.map(
                  (sessionId) => (
                    <option
                      key={sessionId}
                      value={String(sessionId)}
                    >
                      Session{" "}
                      {sessionNumbers[sessionId] ??
                        "…"}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-400">
              {hasActiveFilters
                ? `${filteredLogs.length} matching record${
                    filteredLogs.length === 1
                      ? ""
                      : "s"
                  }`
                : `${logs.length} total record${
                    logs.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear Filters
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={
                  isLoading ||
                  filteredLogs.length === 0
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FiDownload
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Export CSV
              </button>
            </div>
          </div>
        </section>

        {/* COMMAND ACTIVITY */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Operator Activity
                </h2>

                <p className="text-sm text-slate-500">
                  Latest machine control commands.
                </p>
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {filteredLogs.length} record
                {filteredLogs.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>
          </div>

          {!isLoading && filteredLogs.length === 0 ? (
            <EmptyState
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          ) : (
            /*
              Below 768px of available width: one card per command.
              From 768px of available width: the table.
            */
            <div className="@container">
              {/* Cards */}
              <div className="space-y-3 p-4 @3xl:hidden">
                {isLoading ? (
                  <LoadingCards />
                ) : (
                  filteredLogs.map((log) => (
                    <CommandCard
                      key={log.id}
                      log={log}
                      sessionNumber={
                        log.operation_session_id !==
                        null
                          ? sessionNumbers[
                              log.operation_session_id
                            ]
                          : undefined
                      }
                    />
                  ))
                )}
              </div>

              {/* Table */}
              <div className="hidden overflow-x-auto @3xl:block">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 lg:px-6">
                        Date &amp; Time
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Operator
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Command
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Action
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Status
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 lg:px-6">
                        Session
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <LoadingRows />
                    ) : (
                      filteredLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="transition-colors hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 lg:px-6">
                            {formatDateTime(
                              log.created_at
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <OperatorCell
                              name={
                                log.operator_name
                              }
                              email={
                                log.operator_email
                              }
                            />
                          </td>

                          <td className="px-4 py-4">
                            <CommandBadge
                              command={
                                log.command
                              }
                            />
                          </td>

                          <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                            {log.command_label}
                          </td>

                          <td className="px-4 py-4">
                            <StatusBadge
                              status={log.status}
                            />
                          </td>

                          <td className="px-4 py-4 text-sm font-semibold lg:px-6">
                            <SessionLink
                              sessionId={
                                log.operation_session_id
                              }
                              sessionNumber={
                                log.operation_session_id !==
                                null
                                  ? sessionNumbers[
                                      log.operation_session_id
                                    ]
                                  : undefined
                              }
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
