import Papa from "papaparse";
import { format } from "date-fns";

interface OperationSession {
  readonly id: number;
  readonly started_at: string;
  readonly ended_at: string | null;
  readonly start_seed_count: number;
  readonly end_seed_count: number | null;
  readonly start_hole_count: number;
  readonly end_hole_count: number | null;
  readonly obstacle_count: number;
  readonly status: string;
}

interface OperationCsvRow {
  readonly operation_id: number;
  readonly date: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly duration: string;
  readonly holes: number | string;
  readonly seeds: number | string;
  readonly command_count: number;
  readonly obstacles: number;
  readonly status: string;
}

function getSeedCount(
  session: OperationSession
): number | string {
  if (session.end_seed_count === null) {
    return "";
  }

  return Math.max(
    0,
    session.end_seed_count -
      session.start_seed_count
  );
}

function getHoleCount(
  session: OperationSession
): number | string {
  if (session.end_hole_count === null) {
    return "";
  }

  return Math.max(
    0,
    session.end_hole_count -
      session.start_hole_count
  );
}

function formatDuration(
  startedAt: string,
  endedAt: string | null
): string {
  if (!endedAt) {
    return "Running";
  }

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();

  const totalSeconds = Math.max(
    0,
    Math.floor((end - start) / 1000)
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

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

function toCsvRow(
  session: OperationSession,
  commandCount: number
): OperationCsvRow {
  return {
    operation_id: session.id,
    date: format(
      new Date(session.started_at),
      "yyyy-MM-dd"
    ),
    start_time: format(
      new Date(session.started_at),
      "HH:mm:ss"
    ),
    end_time: session.ended_at
      ? format(
          new Date(session.ended_at),
          "HH:mm:ss"
        )
      : "",
    duration: formatDuration(
      session.started_at,
      session.ended_at
    ),
    holes: getHoleCount(session),
    seeds: getSeedCount(session),
    command_count: commandCount,
    obstacles: session.obstacle_count,
    status: session.status,
  };
}

export function exportOperationHistoryCsv(
  sessions: readonly OperationSession[],
  commandCounts: Readonly<Record<number, number>>
): void {
  const rows = sessions.map((session) =>
    toCsvRow(
      session,
      commandCounts[session.id] ?? 0
    )
  );

  const csv = Papa.unparse(rows);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `agridrill-operation-history-${format(
    new Date(),
    "yyyyMMdd-HHmmss"
  )}.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}