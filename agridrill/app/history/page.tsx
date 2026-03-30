"use client";
import React, { useMemo, useState } from "react";

import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	flexRender,
	ColumnDef,
	Row,
} from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import { format, isWithinInterval, parseISO } from "date-fns";
import Papa from "papaparse";

// Dummy data for demonstration
type Session = {
	id: string;
	date: string;
	bedId: string;
	holesDrilled: number;
	duration: string;
	avgDepthAccuracy: number;
	avgSpacingAccuracy: number;
	faults: number;
	status: string;
};

const dummyData: Session[] = [
	{
		id: "S001",
		date: "2026-03-28T10:00:00Z",
		bedId: "B12",
		holesDrilled: 120,
		duration: "00:45:00",
		avgDepthAccuracy: 98.5,
		avgSpacingAccuracy: 97.2,
		faults: 2,
		status: "Completed",
	},
	{
		id: "S002",
		date: "2026-03-29T14:30:00Z",
		bedId: "B15",
		holesDrilled: 110,
		duration: "00:40:00",
		avgDepthAccuracy: 96.1,
		avgSpacingAccuracy: 95.8,
		faults: 1,
		status: "Completed",
	},
	// ...more rows
];


const columns: ColumnDef<Session>[] = [
	{
		accessorKey: "id",
		header: "Session ID",
		cell: info => info.getValue<string>(),
	},
	{
		accessorKey: "date",
		header: "Date",
		cell: info => format(parseISO(info.getValue<string>()), "yyyy-MM-dd HH:mm"),
		filterFn: (row, columnId, filterValue: [string, string]) => {
			if (!filterValue[0] && !filterValue[1]) return true;
			const date = parseISO(row.getValue(columnId));
			const [start, end] = filterValue;
			if (start && end) {
				return isWithinInterval(date, {
					start: parseISO(start),
					end: parseISO(end),
				});
			}
			if (start) return date >= parseISO(start);
			if (end) return date <= parseISO(end);
			return true;
		},
	},
	{
		accessorKey: "bedId",
		header: "Bed ID",
		cell: info => info.getValue<string>(),
	},
	{
		accessorKey: "holesDrilled",
		header: "Holes Drilled",
		cell: info => info.getValue<number>(),
	},
	{
		accessorKey: "duration",
		header: "Duration",
		cell: info => info.getValue<string>(),
	},
	{
		accessorKey: "avgDepthAccuracy",
		header: "Avg Depth Accuracy",
		cell: info => info.getValue<number>() + "%",
	},
	{
		accessorKey: "avgSpacingAccuracy",
		header: "Avg Spacing Accuracy",
		cell: info => info.getValue<number>() + "%",
	},
	{
		accessorKey: "faults",
		header: "Faults",
		cell: info => info.getValue<number>(),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: info => info.getValue<string>(),
	},
];


function fuzzyFilter<TData>(row: Row<TData>, columnId: string, value: string) {
	const itemRank = rankItem(row.getValue(columnId), value);
	return itemRank.passed;
}

export default function HistoryPage() {
	const [globalFilter, setGlobalFilter] = useState("");
	const [dateRange, setDateRange] = useState<[string, string]>(["", ""]);
	const [rowSelection, setRowSelection] = useState({});

	const data = useMemo(() => dummyData, []);

	const table = useReactTable<Session>({
		data,
		columns,
		state: {
			globalFilter,
			rowSelection,
			columnFilters: [
				{ id: "date", value: dateRange },
			],
		},
		onGlobalFilterChange: setGlobalFilter,
		onRowSelectionChange: setRowSelection,
		globalFilterFn: fuzzyFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		debugTable: false,
	});

	// CSV Export
	const handleExport = () => {
		const rows = table.getFilteredRowModel().rows.map(row => row.original);
		const csv = Papa.unparse(rows);
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "session-history.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	// Row click navigation
	const handleRowClick = (id: string) => {
		window.location.href = `/history/${id}`;
	};

	// Date range filter UI
	const handleDateChange = (idx: 0 | 1, value: string) => {
		const newRange: [string, string] = [...dateRange];
		newRange[idx] = value;
		setDateRange(newRange);
	};

	// Status badge helper
	const statusBadge = (status: string) => {
		let color = "bg-gray-300 text-gray-800";
		if (status === "Completed") color = "bg-green-200 text-green-800";
		if (status === "Fault") color = "bg-red-200 text-red-800";
		if (status === "In Progress") color = "bg-yellow-200 text-yellow-800";
		return (
			<span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{status}</span>
		);
	};

	return (
		<div className="p-2 sm:p-6 max-w-7xl mx-auto">
			<h1 className="text-3xl font-bold mb-6 text-green-800">Session History</h1>
			<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
				<div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
					<input
						className="border border-gray-400 text-gray-900 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 w-full sm:w-64 placeholder-gray-400"
						placeholder="Global search..."
						value={globalFilter}
						onChange={e => setGlobalFilter(e.target.value)}
					/>
					<div className="flex items-center gap-2 flex-wrap">
						<label className="text-sm font-medium text-gray-700">Date from:</label>
						<input
							type="date"
							className="border border-gray-400 text-gray-900 bg-white rounded px-2 py-1"
							value={dateRange[0]}
							onChange={e => handleDateChange(0, e.target.value)}
						/>
						<label className="text-sm font-medium text-gray-700">to</label>
						<input
							type="date"
							className="border border-gray-400 text-gray-900 bg-white rounded px-2 py-1"
							value={dateRange[1]}
							onChange={e => handleDateChange(1, e.target.value)}
						/>
					</div>
					<div className="flex-1 flex justify-end">
						<button
							className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-green-700 transition"
							onClick={handleExport}
						>
							Export CSV
						</button>
					</div>
				</div>
				<div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
					<table className="min-w-full text-sm">
						<thead className="bg-green-100 sticky top-0 z-10">
							{table.getHeaderGroups().map(headerGroup => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map(header => (
										<th
											key={header.id}
											className="px-4 py-3 text-left font-bold text-green-900 border-b border-gray-300 cursor-pointer select-none whitespace-nowrap bg-green-100"
											onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
										>
											{flexRender(header.column.columnDef.header, header.getContext())}
											{header.column.getIsSorted() ? (
												header.column.getIsSorted() === "asc" ? " ▲" : " ▼"
											) : null}
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.length === 0 ? (
								<tr>
									<td colSpan={columns.length} className="text-center py-8 text-gray-400">No sessions found.</td>
								</tr>
							) : (
								table.getRowModel().rows.map(row => (
									<tr
										key={row.id}
										className="hover:bg-green-50 cursor-pointer transition"
										onClick={() => handleRowClick(row.original.id)}
									>
										{row.getVisibleCells().map(cell => {
											// Render status as badge
											if (cell.column.id === "status") {
												return (
													<td key={cell.id} className="px-4 py-2 border-t border-gray-200">
														{statusBadge(cell.getValue<string>())}
													</td>
												);
											}
											return (
												<td key={cell.id} className="px-4 py-2 border-t border-gray-200 text-gray-900">
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</td>
											);
										})}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				<div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-700">Rows per page:</span>
						<select
							className="border border-gray-400 text-gray-900 bg-white rounded px-2 py-1"
							value={table.getState().pagination.pageSize}
							onChange={e => table.setPageSize(Number(e.target.value))}
						>
							{[10, 25, 50].map(size => (
								<option key={size} value={size}>{size}</option>
							))}
						</select>
					</div>
					<div className="flex gap-2">
						<button
							className="px-3 py-1 border rounded-lg bg-gray-100 hover:bg-green-100 text-gray-900"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							{"<<"}
						</button>
						<button
							className="px-3 py-1 border rounded-lg bg-gray-100 hover:bg-green-100 text-gray-900"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							{"<"}
						</button>
						<span className="px-2 text-sm text-gray-900">
							Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
						</span>
						<button
							className="px-3 py-1 border rounded-lg bg-gray-100 hover:bg-green-100 text-gray-900"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							{">"}
						</button>
						<button
							className="px-3 py-1 border rounded-lg bg-gray-100 hover:bg-green-100 text-gray-900"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							{">>"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
