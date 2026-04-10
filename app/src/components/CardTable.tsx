import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import type { PortfolioRow } from '@/lib/types';
import { CONDITION_LABELS } from '@/lib/types';
import { formatCurrency } from '@/lib/price-utils';
import { PriceIndicator } from './PriceIndicator';
import { CurrencyBadge } from './CurrencyBadge';

interface CardTableProps {
  rows: PortfolioRow[];
}

const columnHelper = createColumnHelper<PortfolioRow>();

export function CardTable({ rows }: CardTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'currentPrice', desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'image',
        header: '',
        size: 56,
        cell: ({ row }) => (
          <img
            src={row.original.card.images.small}
            alt={row.original.card.name}
            className="card-thumb w-10 h-14 object-contain rounded"
            loading="lazy"
          />
        ),
      }),
      columnHelper.accessor((r) => r.card.name, {
        id: 'name',
        header: 'Card',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-sm">{row.original.card.name}</div>
            <div className="text-xs text-gray-500">
              {row.original.card.set.name} · #{row.original.card.number}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor((r) => r.card.rarity ?? '', {
        id: 'rarity',
        header: 'Rarity',
        cell: ({ getValue }) => (
          <span className="text-xs text-gray-600">{getValue()}</span>
        ),
      }),
      columnHelper.accessor((r) => r.userCard.condition, {
        id: 'condition',
        header: 'Condition',
        cell: ({ getValue }) => (
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
            {CONDITION_LABELS[getValue()]}
          </span>
        ),
      }),
      columnHelper.accessor((r) => r.userCard.quantity, {
        id: 'qty',
        header: 'Qty',
        size: 50,
      }),
      columnHelper.accessor('currentPrice', {
        header: () => <span title="Current Market Price">Price</span>,
        sortingFn: 'basic',
        cell: ({ row }) => (
          <CurrencyBadge
            value={row.original.currentPrice}
            currency={row.original.currency}
            href={row.original.sourceUrl}
          />
        ),
      }),
      columnHelper.accessor('changeDayPct', {
        header: '24h',
        sortingFn: 'basic',
        size: 90,
        cell: ({ row }) => (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-gray-500">
              {formatCurrency(row.original.priceDayAgo, row.original.currency)}
            </span>
            <PriceIndicator pctChange={row.original.changeDayPct} label="vs yesterday" />
          </div>
        ),
      }),
      columnHelper.accessor('changeWeekPct', {
        header: '7d',
        sortingFn: 'basic',
        size: 90,
        cell: ({ row }) => (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-gray-500">
              {formatCurrency(row.original.priceWeekAgo, row.original.currency)}
            </span>
            <PriceIndicator pctChange={row.original.changeWeekPct} label="vs 7 days ago" />
          </div>
        ),
      }),
      columnHelper.accessor('changeMonthPct', {
        header: '30d',
        sortingFn: 'basic',
        size: 90,
        cell: ({ row }) => (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-gray-500">
              {formatCurrency(row.original.priceMonthAgo, row.original.currency)}
            </span>
            <PriceIndicator pctChange={row.original.changeMonthPct} label="vs 30 days ago" />
          </div>
        ),
      }),
      columnHelper.accessor('changeYearPct', {
        header: '1y',
        sortingFn: 'basic',
        size: 90,
        cell: ({ row }) => (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-gray-500">
              {formatCurrency(row.original.priceYearAgo, row.original.currency)}
            </span>
            <PriceIndicator pctChange={row.original.changeYearPct} label="vs 1 year ago" />
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase();
      const r = row.original;
      return (
        r.card.name.toLowerCase().includes(search) ||
        r.card.set.name.toLowerCase().includes(search) ||
        (r.card.rarity?.toLowerCase().includes(search) ?? false)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 },
    },
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search cards..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <span className="text-sm text-gray-500">
          {table.getFilteredRowModel().rows.length} cards
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    data-sortable={header.column.getCanSort() || undefined}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && ' ↑'}
                      {header.column.getIsSorted() === 'desc' && ' ↓'}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
