import Papa from "papaparse";
import { format } from "date-fns";

interface CommandHistoryRow {
  readonly id: number;
  readonly created_at: string;
  readonly operator_name: string | null;
  readonly operator_email: string | null;
  readonly command: string;
  readonly command_label: string;
  readonly status: "sent" | "failed";
  readonly operation_session_id: number | null;
}

interface CommandCsvRow {
  readonly command_id: number;
  readonly date: string;
  readonly time: string;
  readonly operator: string;
  readonly operator_email: string;
  readonly command: string;
  readonly action: string;
  readonly status: string;
  readonly operation_session: number | string;
}

function toCsvRow(
  row: CommandHistoryRow
): CommandCsvRow {
  return {
    command_id: row.id,
    date: format(
      new Date(row.created_at),
      "yyyy-MM-dd"
    ),
    time: format(
      new Date(row.created_at),
      "HH:mm:ss"
    ),
    operator:
      row.operator_name?.trim() ||
      row.operator_email?.trim() ||
      "Unknown operator",
    operator_email:
      row.operator_email ?? "",
    command: row.command,
    action: row.command_label,
    status: row.status,
    operation_session:
      row.operation_session_id ?? "",
  };
}

export function exportCommandHistoryCsv(
  rows: readonly CommandHistoryRow[]
): void {
  const csv = Papa.unparse(
    rows.map(toCsvRow)
  );

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `agridrill-command-history-${format(
    new Date(),
    "yyyyMMdd-HHmmss"
  )}.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}