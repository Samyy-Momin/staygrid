/* eslint-disable react-hooks/incompatible-library */
"use client";

import {
 ColumnDef,
 flexRender,
 getCoreRowModel,
 getPaginationRowModel,
 useReactTable,
} from"@tanstack/react-table";
import * as React from"react";
import { Button } from"@/components/ui/button";

interface DataTableProps<TData, TValue> {
 columns: ColumnDef<TData, TValue>[];
 data: TData[];
 meta?: any;
}

export function DataTable<TData, TValue>({
 columns,
 data,
 meta,
}: DataTableProps<TData, TValue>) {
 const table = useReactTable({
 data,
 columns,
 getCoreRowModel: getCoreRowModel(),
 getPaginationRowModel: getPaginationRowModel(),
 meta,
 initialState: {
 pagination: {
 pageSize: 10,
 },
 },
 });

 return (
 <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-card-rest">
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-surface border-b border-border">
 {table.getHeaderGroups().map((headerGroup) => (
 <tr key={headerGroup.id}>
 {headerGroup.headers.map((header) => {
 return (
 <th key={header.id} className="px-6 py-4 text-caption font-semibold uppercase tracking-wider text-muted">
 {header.isPlaceholder
 ? null
 : flexRender(
 header.column.columnDef.header,
 header.getContext()
 )}
 </th>
 );
 })}
 </tr>
 ))}
 </thead>
 <tbody className="divide-y divide-border">
 {table.getRowModel().rows?.length ? (
 table.getRowModel().rows.map((row) => (
 <tr
 key={row.id}
 className="hover:bg-accent-primary/5 transition-colors group"
 >
 {row.getVisibleCells().map((cell) => (
 <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-body-sm text-primary">
 {flexRender(cell.column.columnDef.cell, cell.getContext())}
 </td>
 ))}
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={columns.length} className="px-6 py-8 text-center text-muted">
 No results.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 
 {/* Pagination Controls */}
 <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface">
 <div className="text-body-sm text-muted">
 Showing <span className="font-medium">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to <span className="font-medium">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</span> of <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> results
 </div>
 <div className="flex items-center space-x-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => table.previousPage()}
 disabled={!table.getCanPreviousPage()}
 className="h-8 px-4 text-caption font-medium uppercase tracking-wider text-muted hover:text-primary shadow-card-rest hover:shadow-card-hover transition-all disabled:shadow-none"
 >
 Previous
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => table.nextPage()}
 disabled={!table.getCanNextPage()}
 className="h-8 px-4 text-caption font-medium uppercase tracking-wider text-muted hover:text-primary shadow-card-rest hover:shadow-card-hover transition-all disabled:shadow-none"
 >
 Next
 </Button>
 </div>
 </div>
 </div>
 );
}
