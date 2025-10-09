'use client'

import { useState, useEffect } from 'react'
import { Download, FileSpreadsheet, FileImage, FileText, Loader2, Check, AlertCircle, Zap, History, Settings } from 'lucide-react'
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
  chartData?: { [chartKey: string]: { title: string; data: any; type: string; viewMode?: string } }
  onExport: (format: 'csv' | 'pdf' | 'excel', selectedCharts?: string[]) => Promise<void>
  disabled?: boolean
  className?: string
}

interface ExportState {
  csv: 'idle' | 'loading' | 'success' | 'error'
  pdf: 'idle' | 'loading' | 'success' | 'error'
  excel: 'idle' | 'loading' | 'success' | 'error'
}

interface ExportHistory {
  id: string
  format: 'csv' | 'pdf' | 'excel'
  timestamp: Date
  fileName: string
  status: 'success' | 'error'
  fileSize?: string
}

export function ExportButton({
  currentTab,
  filters,
  chartData = {},
  onExport,
  disabled = false,
  className
}: ExportButtonProps) {
  const [exportState, setExportState] = useState<ExportState>({
    csv: 'idle',
    pdf: 'idle',
    excel: 'idle'
  })

  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const handleExport = async (exportFormat: 'csv' | 'pdf' | 'excel', selectedCharts?: string[]) => {
    // Set loading state
    setExportState(prev => ({ ...prev, [exportFormat]: 'loading' }))

    // Generate filename for history
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
    const tabName = currentTab.charAt(0).toUpperCase() + currentTab.slice(1)
    const fileName = `analytics_${tabName}_${timestamp}.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`

    try {
      await onExport(exportFormat, selectedCharts)

      // Set success state
      setExportState(prev => ({ ...prev, [exportFormat]: 'success' }))

      // Add to export history
      const historyItem: ExportHistory = {
        id: `${exportFormat}_${Date.now()}`,
        format: exportFormat,
        timestamp: new Date(),
        fileName,
        status: 'success',
        fileSize: '~2.5 MB' // This would be calculated from actual file size
      }
      setExportHistory(prev => [historyItem, ...prev.slice(0, 9)]) // Keep last 10 items

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setExportState(prev => ({ ...prev, [exportFormat]: 'idle' }))
      }, 2000)
    } catch (error) {
      console.error(`Export ${exportFormat} failed:`, error)

      // Enhanced error handling with specific error types
      let errorMessage = 'Export gagal'
      let userFriendlyMessage = 'Terjadi kesalahan saat mengekspor data'

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network Error'
          userFriendlyMessage = 'Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.'
        } else if (error.message.includes('permission') || error.message.includes('denied')) {
          errorMessage = 'Permission Error'
          userFriendlyMessage = 'Tidak memiliki izin untuk mengekspor file. Hubungi administrator.'
        } else if (error.message.includes('quota') || error.message.includes('storage')) {
          errorMessage = 'Storage Error'
          userFriendlyMessage = 'Penyimpanan tidak mencukupi. Kosongkan ruang penyimpanan dan coba lagi.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Timeout Error'
          userFriendlyMessage = 'Proses ekspor terlalu lama. Coba dengan filter yang lebih spesifik.'
        } else if (error.message.includes('data') || error.message.includes('empty')) {
          errorMessage = 'Data Error'
          userFriendlyMessage = 'Tidak ada data yang sesuai dengan filter yang dipilih.'
        } else {
          errorMessage = 'Export Error'
          userFriendlyMessage = `Terjadi kesalahan: ${error.message}`
        }
      }

      // Set error state
      setExportState(prev => ({ ...prev, [exportFormat]: 'error' }))

      // Add detailed error to history
      const historyItem: ExportHistory = {
        id: `${exportFormat}_error_${Date.now()}`,
        format: exportFormat,
        timestamp: new Date(),
        fileName,
        status: 'error'
      }
      setExportHistory(prev => [historyItem, ...prev.slice(0, 9)])

      // Show user-friendly error message (you could integrate with a toast system here)
      console.warn(`Export failed: ${userFriendlyMessage}`)

      // Reset to idle after 4 seconds for errors (longer than success)
      setTimeout(() => {
        setExportState(prev => ({ ...prev, [exportFormat]: 'idle' }))
      }, 4000)
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
        return `${format.toUpperCase()} Error`
      default:
        return format.toUpperCase()
    }
  }

  const getErrorTooltip = (format: keyof ExportState) => {
    if (exportState[format] !== 'error') return undefined

    // Find the latest error for this format in history
    const latestError = exportHistory
      .filter(h => h.format === format && h.status === 'error')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]

    if (!latestError) return 'Export gagal'

    const minutesAgo = Math.floor((Date.now() - latestError.timestamp.getTime()) / (1000 * 60))
    return `Export gagal ${minutesAgo} menit yang lalu. Klik untuk coba lagi.`
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


      {/* Enhanced Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 shadow-sm transition-all duration-200",
              "bg-gradient-to-r from-primary to-primary-700 hover:from-primary-700 hover:to-primary-800",
              "text-white border-0 font-medium",
              hasActiveFilters && "ring-2 ring-primary-300 dark:ring-primary-600"
            )}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Data</span>
            <span className="sm:hidden">Export</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 bg-white/20 text-white text-xs">
                Filtered
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* Quick Export Options */}
          <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            Quick Export
          </div>

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

          <DropdownMenuSeparator />

          {/* Advanced Options */}
          <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            Advanced
          </div>


          {/* Export History */}
          {exportHistory.length > 0 && (
            <DropdownMenuItem className="p-0">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="w-4 h-4 mr-2" />
                <span>Export History ({exportHistory.length})</span>
              </Button>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Export Summary */}
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Total Exports:</span>
              <span>{exportHistory.length}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Success Rate:</span>
              <span>
                {exportHistory.length > 0
                  ? Math.round((exportHistory.filter(h => h.status === 'success').length / exportHistory.length) * 100)
                  : 0
                }%
              </span>
            </div>
          </div>
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