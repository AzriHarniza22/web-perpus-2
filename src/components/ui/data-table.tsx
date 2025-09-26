"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  onSortingChange?: (key: string, direction: 'asc' | 'desc' | null) => void
  totalItems?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  selectable?: boolean
  selectedRows?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  pageSize = 10,
  onPageSizeChange,
  onSortingChange,
  totalItems,
  currentPage = 1,
  onPageChange,
  sortKey,
  sortDirection,
}: DataTableProps<T>) {
  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value)
    onPageSizeChange?.(newSize)
  }

  const handlePageChange = (page: number) => {
    onPageChange?.(page)
  }

  const handleSort = (key: string) => {
    if (!onSortingChange) return

    if (sortKey === key) {
      if (sortDirection === 'asc') {
        onSortingChange(key, 'desc')
      } else if (sortDirection === 'desc') {
        onSortingChange(key, null)
      } else {
        onSortingChange(key, 'asc')
      }
    } else {
      onSortingChange(key, 'asc')
    }
  }

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />
    if (sortDirection === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />
    if (sortDirection === 'desc') return <ArrowDown className="ml-2 h-4 w-4" />
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {column.header}
                      {getSortIcon(column.key)}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}