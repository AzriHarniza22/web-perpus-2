'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2, Check, AlertCircle, Zap, History, Settings } from 'lucide-react'
import { FaFileCsv, FaFilePdf, FaFileExcel } from 'react-icons/fa'
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
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        switch (format) {
          case 'csv':
            return <FaFileCsv className="w-6 h-6 text-green-600" />
          case 'pdf':
            return <FaFilePdf className="w-6 h-6 text-red-600" />
          case 'excel':
            return <FaFileExcel className="w-6 h-6 text-green-600" />
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
        return 'ghost'
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
    <div className={cn("flex items-center gap-3", className)} role="region" aria-label="Export controls">
      {/* Filter State Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <Badge variant="secondary" className="text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            <Settings className="w-3 h-3 mr-1" />
            Filter Aktif
          </Badge>
          {filters.dateRange && (
            <Badge variant="outline" className="text-xs font-medium border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300">
              📅 {format(filters.dateRange.from, 'dd/MM', { locale: id })}
              {filters.dateRange.to && ` - ${format(filters.dateRange.to, 'dd/MM', { locale: id })}`}
            </Badge>
          )}
          {filters.selectedRooms && filters.selectedRooms.length > 0 && (
            <Badge variant="outline" className="text-xs font-medium border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300">
              🏢 {filters.selectedRooms.length} Ruangan
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
              "flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 ease-in-out",
              "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
              "text-white border-0 font-semibold text-sm tracking-wide",
              "hover:scale-[1.02] active:scale-[0.98]",
              hasActiveFilters && "ring-2 ring-blue-300 dark:ring-blue-500 ring-offset-1",
              disabled && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
            aria-label={hasActiveFilters ? "Export filtered data" : "Export data"}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Data</span>
            <span className="sm:hidden">Export</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 bg-white/20 text-white text-xs font-medium border-white/30">
                Filtered
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-2 shadow-xl border-0 bg-white dark:bg-gray-900 rounded-xl">
          {/* Quick Export Options Header */}
          <div className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 mb-2">
            Quick Export
          </div>

          <DropdownMenuItem className="p-1 focus:bg-gray-50 dark:focus:bg-gray-800 rounded-lg transition-colors duration-150">
            <Button
              variant={getButtonVariant('csv')}
              size="sm"
              className={cn(
                "w-full justify-start gap-3 h-10 font-medium transition-all duration-200",
                "hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm",
                exportState.csv === 'loading' && "cursor-not-allowed opacity-70"
              )}
              disabled={exportState.csv === 'loading'}
              onClick={() => handleExport('csv')}
              aria-label={`Export as CSV${exportState.csv === 'loading' ? ' (processing)' : ''}`}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30">
                {getButtonIcon('csv')}
              </div>
              <span className="flex-1 text-left">{getButtonText('csv')}</span>
              {exportState.csv === 'loading' && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </Button>
          </DropdownMenuItem>

          <DropdownMenuItem className="p-1 focus:bg-gray-50 dark:focus:bg-gray-800 rounded-lg transition-colors duration-150">
            <Button
              variant={getButtonVariant('pdf')}
              size="sm"
              className={cn(
                "w-full justify-start gap-3 h-10 font-medium transition-all duration-200",
                "hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm",
                exportState.pdf === 'loading' && "cursor-not-allowed opacity-70"
              )}
              disabled={exportState.pdf === 'loading'}
              onClick={() => handleExport('pdf')}
              aria-label={`Export as PDF${exportState.pdf === 'loading' ? ' (processing)' : ''}`}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-red-100 dark:bg-red-900/30">
                {getButtonIcon('pdf')}
              </div>
              <span className="flex-1 text-left">{getButtonText('pdf')}</span>
              {exportState.pdf === 'loading' && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </Button>
          </DropdownMenuItem>

          <DropdownMenuItem className="p-1 focus:bg-gray-50 dark:focus:bg-gray-800 rounded-lg transition-colors duration-150">
            <Button
              variant={getButtonVariant('excel')}
              size="sm"
              className={cn(
                "w-full justify-start gap-3 h-10 font-medium transition-all duration-200",
                "hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm",
                exportState.excel === 'loading' && "cursor-not-allowed opacity-70"
              )}
              disabled={exportState.excel === 'loading'}
              onClick={() => handleExport('excel')}
              aria-label={`Export as Excel${exportState.excel === 'loading' ? ' (processing)' : ''}`}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30">
                {getButtonIcon('excel')}
              </div>
              <span className="flex-1 text-left">{getButtonText('excel')}</span>
              {exportState.excel === 'loading' && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </Button>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2" />
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  )
}