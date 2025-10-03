'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileImage, FileText, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export interface ExportButtonProps {
  currentTab: 'general' | 'room' | 'tour' | 'user'
  filters: {
    dateRange?: { from: Date; to: Date }
    selectedRooms?: string[]
    quickSelect?: string
  }
  onExport: (format: 'csv' | 'pdf' | 'excel') => Promise<void>
  disabled?: boolean
  className?: string
}

interface ExportState {
  csv: 'idle' | 'loading' | 'success' | 'error'
  pdf: 'idle' | 'loading' | 'success' | 'error'
  excel: 'idle' | 'loading' | 'success' | 'error'
}

export function ExportButton({
  currentTab,
  filters,
  onExport,
  disabled = false,
  className
}: ExportButtonProps) {
  const [exportState, setExportState] = useState<ExportState>({
    csv: 'idle',
    pdf: 'idle',
    excel: 'idle'
  })

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    // Set loading state
    setExportState(prev => ({ ...prev, [format]: 'loading' }))

    try {
      await onExport(format)
      // Set success state
      setExportState(prev => ({ ...prev, [format]: 'success' }))

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setExportState(prev => ({ ...prev, [format]: 'idle' }))
      }, 2000)
    } catch (error) {
      console.error(`Export ${format} failed:`, error)
      // Set error state
      setExportState(prev => ({ ...prev, [format]: 'error' }))

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setExportState(prev => ({ ...prev, [format]: 'idle' }))
      }, 3000)
    }
  }

  const getButtonIcon = (format: keyof ExportState) => {
    switch (exportState[format]) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        switch (format) {
          case 'csv':
            return <FileText className="w-4 h-4" />
          case 'pdf':
            return <FileImage className="w-4 h-4" />
          case 'excel':
            return <FileSpreadsheet className="w-4 h-4" />
        }
    }
  }

  const getButtonVariant = (format: keyof ExportState) => {
    switch (exportState[format]) {
      case 'success':
        return 'default'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getButtonText = (format: keyof ExportState) => {
    switch (exportState[format]) {
      case 'loading':
        return `Mengekspor ${format.toUpperCase()}...`
      case 'success':
        return `${format.toUpperCase()} Berhasil`
      case 'error':
        return `${format.toUpperCase()} Gagal`
      default:
        return format.toUpperCase()
    }
  }

  const hasActiveFilters = filters.dateRange || (filters.selectedRooms && filters.selectedRooms.length > 0) || filters.quickSelect

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Filter State Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            Filter Aktif
          </Badge>
          {filters.dateRange && (
            <Badge variant="outline" className="text-xs">
              {format(filters.dateRange.from, 'dd/MM', { locale: id })}
              {filters.dateRange.to && ` - ${format(filters.dateRange.to, 'dd/MM', { locale: id })}`}
            </Badge>
          )}
          {filters.selectedRooms && filters.selectedRooms.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {filters.selectedRooms.length} Ruangan
            </Badge>
          )}
        </div>
      )}

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="p-0">
            <Button
              variant={getButtonVariant('csv')}
              size="sm"
              className="w-full justify-start"
              disabled={exportState.csv === 'loading'}
              onClick={() => handleExport('csv')}
            >
              {getButtonIcon('csv')}
              <span className="ml-2">{getButtonText('csv')}</span>
            </Button>
          </DropdownMenuItem>

          <DropdownMenuItem className="p-0">
            <Button
              variant={getButtonVariant('pdf')}
              size="sm"
              className="w-full justify-start"
              disabled={exportState.pdf === 'loading'}
              onClick={() => handleExport('pdf')}
            >
              {getButtonIcon('pdf')}
              <span className="ml-2">{getButtonText('pdf')}</span>
            </Button>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="p-0">
            <Button
              variant={getButtonVariant('excel')}
              size="sm"
              className="w-full justify-start"
              disabled={exportState.excel === 'loading'}
              onClick={() => handleExport('excel')}
            >
              {getButtonIcon('excel')}
              <span className="ml-2">{getButtonText('excel')}</span>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Individual Export Buttons (Alternative Layout) */}
      <div className="hidden md:flex gap-1">
        <Button
          variant={getButtonVariant('csv')}
          size="sm"
          disabled={exportState.csv === 'loading' || disabled}
          onClick={() => handleExport('csv')}
          className="px-2"
          title={`Export ${currentTab} data sebagai CSV`}
        >
          {getButtonIcon('csv')}
        </Button>

        <Button
          variant={getButtonVariant('pdf')}
          size="sm"
          disabled={exportState.pdf === 'loading' || disabled}
          onClick={() => handleExport('pdf')}
          className="px-2"
          title={`Export ${currentTab} data sebagai PDF`}
        >
          {getButtonIcon('pdf')}
        </Button>

        <Button
          variant={getButtonVariant('excel')}
          size="sm"
          disabled={exportState.excel === 'loading' || disabled}
          onClick={() => handleExport('excel')}
          className="px-2"
          title={`Export ${currentTab} data sebagai Excel`}
        >
          {getButtonIcon('excel')}
        </Button>
      </div>
    </div>
  )
}