"use client";

import { useMemo, useState } from "react";
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
import { exportCommandHistoryCsv } from "@/utils/exportCommandHistoryCsv";

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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        <FiCheckCircle
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
        Sent
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
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
      className={`inline-flex min-w-10 items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-black ${
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

export default function CommandHistoryPage() {
  const {
    logs,
    isLoading,
    error,
  } = useCommandHistory();

  const [commandFilter, setCommandFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [sessionFilter, setSessionFilter] =
    useState("all");

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
    ).sort((a, b) => a - b);
  }, [logs]);

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

    exportCommandHistoryCsv(filteredLogs);
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* PAGE HEADER */}
        <header className="flex items-start gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-emerald-600 shadow-sm">
            <FiActivity
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
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
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
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
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Command
              </span>

              <select
                value={commandFilter}
                onChange={(event) =>
                  setCommandFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Status
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Operation session
              </span>

              <select
                value={sessionFilter}
                onChange={(event) =>
                  setSessionFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
                      Session {sessionId}
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
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
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

        {/* COMMAND TABLE */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 lg:px-6">
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

          <div className="overflow-x-auto">
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
                ) : filteredLogs.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center"
                    >
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
                            onClick={
                              clearFilters
                            }
                            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                          >
                            Clear Filters
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
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
                        {log.operation_session_id !==
                        null ? (
                          <Link
                            href={`/operation-history/${log.operation_session_id}`}
                            className="font-bold text-emerald-600 underline-offset-4 transition hover:text-emerald-700 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            title={`View Operation Session ${log.operation_session_id}`}
                          >
                            Session{" "}
                            {
                              log.operation_session_id
                            }
                          </Link>
                        ) : (
                          <span className="text-slate-400">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}