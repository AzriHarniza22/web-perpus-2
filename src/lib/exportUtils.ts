import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import Papa from 'papaparse'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Booking, Room, Tour, User } from './types'

// Import error handling utilities from export-consolidator
// Note: These would ideally be in a shared utilities file, but for now we'll duplicate the essential parts

// Enhanced error types for comprehensive error handling
export class ExportError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error,
    public context?: Record<string, unknown>,
    public retryable: boolean = false,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'ExportError'
  }
}

export class FileSizeError extends ExportError {
  constructor(size: number, maxSize: number) {
    const sizeMB = (size / (1024 * 1024)).toFixed(2)
    const maxSizeMB = maxSize.toString()
    super(
      `File size (${sizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
      'FILE_SIZE_EXCEEDED',
      undefined,
      { size, maxSize, sizeMB, maxSizeMB },
      false,
      `Ukuran file (${sizeMB}MB) melebihi batas maksimum (${maxSizeMB}MB). Silakan kurangi jumlah data atau gunakan format lain.`
    )
  }
}

export class NetworkError extends ExportError {
  constructor(message: string, cause?: Error) {
    super(
      `Network error: ${message}`,
      'NETWORK_ERROR',
      cause,
      { timestamp: new Date().toISOString() },
      true,
      'Koneksi jaringan bermasalah. Periksa koneksi internet Anda dan coba lagi.'
    )
  }
}

export class FileSystemError extends ExportError {
  constructor(message: string, cause?: Error) {
    super(
      `File system error: ${message}`,
      'FILESYSTEM_ERROR',
      cause,
      { timestamp: new Date().toISOString() },
      true,
      'Terjadi kesalahan sistem file. Pastikan ada cukup ruang penyimpanan dan coba lagi.'
    )
  }
}

export class DataProcessingError extends ExportError {
  constructor(message: string, cause?: Error) {
    super(
      `Data processing error: ${message}`,
      'DATA_PROCESSING_ERROR',
      cause,
      { timestamp: new Date().toISOString() },
      false,
      'Terjadi kesalahan dalam memproses data. Periksa format data dan coba lagi.'
    )
  }
}

export class ValidationError extends ExportError {
  constructor(message: string, field?: string) {
    super(
      `Validation error: ${message}`,
      'VALIDATION_ERROR',
      undefined,
      { field, timestamp: new Date().toISOString() },
      false,
      `Data tidak valid: ${message}. Periksa input data dan coba lagi.`
    )
  }
}

// Enhanced logging utility
class ExportLogger {
  private context: Record<string, unknown>

  constructor(context: Record<string, unknown> = {}) {
    this.context = { timestamp: new Date().toISOString(), ...context }
  }

  info(message: string, data?: Record<string, unknown>): void {
    console.info(`[ExportUtils] ${message}`, { ...this.context, ...data })
  }

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(`[ExportUtils] ${message}`, { ...this.context, ...data })
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    console.error(`[ExportUtils] ${message}`, {
      ...this.context,
      error: error?.message,
      stack: error?.stack,
      ...data
    })
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[ExportUtils] ${message}`, { ...this.context, ...data })
    }
  }
}

// Retry utility with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  config: { maxAttempts: number; baseDelay: number; maxDelay: number; backoffFactor: number; retryableErrors: string[] } = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: ['NETWORK_ERROR', 'FILESYSTEM_ERROR']
  },
  context: Record<string, unknown> = {}
): Promise<T> {
  const logger = new ExportLogger(context)

  let lastError: Error

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      logger.debug(`Attempt ${attempt}/${config.maxAttempts}`)
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Check if error is retryable
      const isRetryable = error instanceof ExportError && error.retryable

      if (!isRetryable || attempt === config.maxAttempts) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      )

      logger.warn(`Retryable error on attempt ${attempt}, retrying in ${delay}ms`, {
        error: lastError.message,
        attempt,
        maxAttempts: config.maxAttempts,
        delay
      })

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Memory management constants
const MAX_FILE_SIZE_MB = 50 // Maximum file size in MB
const MAX_ROWS_PROCESSING = 10000 // Maximum rows to process at once

// Safe blob URL management with cleanup
class BlobManager {
  private blobUrls: Set<string> = new Set()

  createBlobUrl(content: string, mimeType: string): string {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    this.blobUrls.add(url)
    return url
  }

  revokeBlobUrl(url: string): void {
    if (this.blobUrls.has(url)) {
      URL.revokeObjectURL(url)
      this.blobUrls.delete(url)
    }
  }

  revokeAllBlobUrls(): void {
    this.blobUrls.forEach(url => this.revokeBlobUrl(url))
  }

  getActiveBlobCount(): number {
    return this.blobUrls.size
  }
}

// Global blob manager instance
const blobManager = new BlobManager()

export interface ExportData {
  bookings: (Booking & {
    profiles?: User
    rooms?: Room
    tours?: Tour
  })[]
  rooms: Room[]
  tours: Tour[]
  users: User[]
  currentTab: 'general' | 'room' | 'tour' | 'user'
  filters: {
    dateRange?: { from: Date; to: Date }
    selectedRooms?: string[]
    quickSelect?: string
  }
  metadata: {
    exportDate: Date
    userName?: string
    totalBookings: number
    totalRooms: number
    totalUsers: number
  }
}

export interface ExportOptions {
  includeCharts?: boolean
  includeRawData?: boolean
  dateFormat?: string
  fileName?: string
  includeMetadata?: boolean
}

// Utility function to format filename with timestamp and filters
export function generateFileName(
  fileFormat: 'csv' | 'pdf' | 'excel',
  currentTab: string,
  filters: ExportData['filters']
): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  const tabName = currentTab.charAt(0).toUpperCase() + currentTab.slice(1)
  let filterInfo = ''

  if (filters.dateRange) {
    const fromDate = format(filters.dateRange.from, 'yyyy-MM-dd')
    const toDate = format(filters.dateRange.to, 'yyyy-MM-dd')
    filterInfo = `_${fromDate}_to_${toDate}`
  }

  if (filters.selectedRooms && filters.selectedRooms.length > 0) {
    filterInfo += `_${filters.selectedRooms.length}rooms`
  }

  return `analytics_${tabName}${filterInfo}_${timestamp}.${fileFormat === 'excel' ? 'xlsx' : fileFormat}`
}

// CSV Export Function with comprehensive error handling
export async function exportToCSV(
  data: ExportData,
  options: ExportOptions = {}
): Promise<void> {
  const logger = new ExportLogger({
    operation: 'exportToCSV',
    currentTab: data.currentTab,
    dataSize: JSON.stringify(data).length,
    timestamp: new Date().toISOString()
  })

  try {
    logger.info('Starting CSV export process')

    // Validate input data
    if (!data || !data.bookings || !data.users) {
      throw new ValidationError('Data ekspor tidak lengkap atau tidak valid', 'data')
    }

    const { currentTab, filters, metadata } = data
    const fileName = options.fileName || generateFileName('csv', currentTab, filters)

    logger.debug('Input validation passed, preparing CSV data')

    // Prepare CSV data based on current tab
    const csvData: (string | number | string[])[][] = []

    // Add metadata header with error handling
    if (options.includeMetadata !== false) {
      try {
        csvData.push(['LAPORAN ANALYTICS PERPUSTAKAAN ACEH'])
        csvData.push(['Tab:', currentTab.charAt(0).toUpperCase() + currentTab.slice(1)])
        csvData.push(['Tanggal Export:', format(metadata.exportDate, 'dd/MM/yyyy HH:mm', { locale: id })])
        if (metadata.userName) {
          csvData.push(['Diexport oleh:', metadata.userName])
        }
        if (filters.dateRange) {
          csvData.push([
            'Periode:',
            format(filters.dateRange.from, 'dd/MM/yyyy', { locale: id }),
            'sampai',
            format(filters.dateRange.to, 'dd/MM/yyyy', { locale: id })
          ])
        }
        csvData.push([''])
      } catch (metadataError) {
        throw new DataProcessingError(
          `Failed to generate metadata section: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`,
          metadataError as Error
        )
      }
    }

    // Add data based on current tab with error handling
    try {
      switch (currentTab) {
        case 'general':
          csvData.push(...getGeneralTabCSVData(data))
          break
        case 'room':
          csvData.push(...getRoomTabCSVData(data))
          break
        case 'tour':
          csvData.push(...getTourTabCSVData(data))
          break
        case 'user':
          csvData.push(...getUserTabCSVData(data))
          break
        default:
          throw new ValidationError(`Tab tidak dikenali: ${currentTab}`, 'currentTab')
      }
    } catch (dataError) {
      throw new DataProcessingError(
        `Failed to generate ${currentTab} tab data: ${dataError instanceof Error ? dataError.message : 'Unknown error'}`,
        dataError as Error
      )
    }

    // Convert to CSV string with error handling
    let csvContent: string
    try {
      csvContent = Papa.unparse(csvData)
      logger.debug(`CSV content generated (${csvContent.length} characters)`)
    } catch (parseError) {
      throw new DataProcessingError(
        `Failed to parse CSV data: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        parseError as Error
      )
    }

    // Validate file size
    const estimatedSize = new Blob([csvContent]).size
    const sizeMB = estimatedSize / (1024 * 1024)
    if (sizeMB > MAX_FILE_SIZE_MB) {
      throw new FileSizeError(estimatedSize, MAX_FILE_SIZE_MB)
    }

    // Create and download file with retry mechanism
    await withRetry(
      async () => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = blobManager.createBlobUrl(csvContent, 'text/csv;charset=utf-8;')

        try {
          link.setAttribute('href', url)
          link.setAttribute('download', fileName)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
        } finally {
          document.body.removeChild(link)
          blobManager.revokeBlobUrl(url)
        }
      },
      {
        maxAttempts: 2,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffFactor: 2,
        retryableErrors: ['NETWORK_ERROR', 'FILESYSTEM_ERROR']
      },
      { operation: 'csv_download', fileName }
    )

    logger.info('CSV export completed successfully')

  } catch (error) {
    logger.error('CSV export failed', error as Error)

    if (error instanceof ExportError) {
      throw error
    }

    if (error instanceof Error) {
      // Check if it's a network-related error
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new NetworkError(error.message, error)
      }

      // Check if it's a file system error
      if (error.message.includes('filesystem') || error.message.includes('storage')) {
        throw new FileSystemError(error.message, error)
      }
    }

    // Generic error fallback
    throw new ExportError(
      `CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CSV_EXPORT_FAILED',
      error as Error,
      { currentTab: data.currentTab, dataSize: JSON.stringify(data).length },
      false,
      'Gagal mengekspor data CSV. Periksa data dan coba lagi.'
    )
  }
}

// PDF Export Function with comprehensive error handling
export async function exportToPDF(
  data: ExportData,
  options: ExportOptions = {}
): Promise<void> {
  const logger = new ExportLogger({
    operation: 'exportToPDF',
    currentTab: data.currentTab,
    dataSize: JSON.stringify(data).length,
    timestamp: new Date().toISOString()
  })

  let pdf: jsPDF | null = null

  try {
    logger.info('Starting PDF export process')

    // Validate input data
    if (!data || !data.bookings || !data.users) {
      throw new ValidationError('Data ekspor tidak lengkap atau tidak valid', 'data')
    }

    const { currentTab, filters, metadata } = data
    const fileName = options.fileName || generateFileName('pdf', currentTab, filters)

    logger.debug('Input validation passed, creating PDF document')

    pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 20

    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - 20) {
        pdf!.addPage()
        yPosition = 20
        return true
      }
      return false
    }

    // Title and metadata with error handling
    try {
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('LAPORAN ANALYTICS PERPUSTAKAAN ACEH', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Tab: ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`, 20, yPosition)
      yPosition += 7
      pdf.text(`Tanggal Export: ${format(metadata.exportDate, 'dd/MM/yyyy HH:mm', { locale: id })}`, 20, yPosition)
      yPosition += 7
      if (metadata.userName) {
        pdf.text(`Diexport oleh: ${metadata.userName}`, 20, yPosition)
        yPosition += 7
      }
      if (filters.dateRange) {
        pdf.text(
          `Periode: ${format(filters.dateRange.from, 'dd/MM/yyyy', { locale: id })} - ${format(filters.dateRange.to, 'dd/MM/yyyy', { locale: id })}`,
          20,
          yPosition
        )
        yPosition += 7
      }
      yPosition += 10
    } catch (metadataError) {
      throw new ExportError(
        'Failed to add PDF metadata',
        'PDF_METADATA_ERROR',
        metadataError as Error,
        { yPosition, pageWidth },
        false,
        'Gagal menambahkan metadata ke PDF. File mungkin corrupt.'
      )
    }

    // Add summary statistics with error handling
    try {
      checkPageBreak(40)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('RINGKASAN STATISTIK', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Total Booking: ${metadata.totalBookings}`, 20, yPosition)
      yPosition += 6
      pdf.text(`Total Ruangan: ${metadata.totalRooms}`, 20, yPosition)
      yPosition += 6
      pdf.text(`Total Pengguna: ${metadata.totalUsers}`, 20, yPosition)
      yPosition += 15
    } catch (statsError) {
      throw new ExportError(
        'Failed to add PDF statistics',
        'PDF_STATISTICS_ERROR',
        statsError as Error,
        { yPosition },
        false,
        'Gagal menambahkan statistik ke PDF.'
      )
    }

    // Add data based on current tab with error handling
    try {
      switch (currentTab) {
        case 'general':
          await addGeneralTabPDFData(pdf, data, yPosition)
          break
        case 'room':
          await addRoomTabPDFData(pdf, data, yPosition)
          break
        case 'tour':
          await addTourTabPDFData(pdf, data, yPosition)
          break
        case 'user':
          await addUserTabPDFData(pdf, data, yPosition)
          break
        default:
          throw new ValidationError(`Tab tidak dikenali: ${currentTab}`, 'currentTab')
      }
    } catch (dataError) {
      throw new ExportError(
        `Failed to generate ${currentTab} tab data`,
        'PDF_DATA_ERROR',
        dataError as Error,
        { currentTab, yPosition },
        false,
        `Gagal menghasilkan data tab ${currentTab}. Periksa data dan coba lagi.`
      )
    }

    // Save PDF with retry mechanism
    await withRetry(
      async () => {
        pdf!.save(fileName)
      },
      {
        maxAttempts: 2,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffFactor: 2,
        retryableErrors: ['NETWORK_ERROR', 'FILESYSTEM_ERROR']
      },
      { operation: 'pdf_save', fileName }
    )

    logger.info('PDF export completed successfully')

  } catch (error) {
    // Cleanup PDF instance if it exists
    if (pdf) {
      try {
        pdf = null
      } catch (cleanupError) {
        logger.warn('Error during PDF cleanup', { error: cleanupError })
      }
    }

    logger.error('PDF export failed', error as Error)

    if (error instanceof ExportError) {
      throw error
    }

    if (error instanceof Error) {
      // Check if it's a memory-related error (PDF generation can be memory intensive)
      if (error.message.includes('memory') || error.message.includes('allocation') || error.message.includes('canvas')) {
        throw new ExportError(
          `Memory error: ${error.message}`,
          'MEMORY_ERROR',
          error,
          { currentTab: data.currentTab },
          false,
          'Data terlalu besar untuk diproses. Coba kurangi jumlah data atau gunakan format lain.'
        )
      }

      // Check if it's a file system error
      if (error.message.includes('filesystem') || error.message.includes('storage') || error.message.includes('save')) {
        throw new FileSystemError(error.message, error)
      }
    }

    // Generic error fallback
    throw new ExportError(
      `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PDF_EXPORT_FAILED',
      error as Error,
      { currentTab: data.currentTab, dataSize: JSON.stringify(data).length },
      false,
      'Gagal mengekspor data PDF. Periksa data dan coba lagi.'
    )
  }
}

// Excel Export Function with comprehensive error handling
export async function exportToExcel(
  data: ExportData,
  options: ExportOptions = {}
): Promise<void> {
  const logger = new ExportLogger({
    operation: 'exportToExcel',
    currentTab: data.currentTab,
    dataSize: JSON.stringify(data).length,
    timestamp: new Date().toISOString()
  })

  let workbook: XLSX.WorkBook | null = null

  try {
    logger.info('Starting Excel export process')

    // Validate input data
    if (!data || !data.bookings || !data.users) {
      throw new ValidationError('Data ekspor tidak lengkap atau tidak valid', 'data')
    }

    const { currentTab, filters, metadata } = data
    const fileName = options.fileName || generateFileName('excel', currentTab, filters)

    logger.debug('Input validation passed, creating Excel workbook')

    workbook = XLSX.utils.book_new()

    // Metadata sheet with error handling
    if (options.includeMetadata !== false) {
      try {
        const metadataSheet = [
          ['LAPORAN ANALYTICS PERPUSTAKAAN ACEH'],
          ['Tab', currentTab.charAt(0).toUpperCase() + currentTab.slice(1)],
          ['Tanggal Export', format(metadata.exportDate, 'dd/MM/yyyy HH:mm', { locale: id })],
          ...(metadata.userName ? [['Diexport oleh', metadata.userName]] : []),
          ...(filters.dateRange ? [[
            'Periode',
            `${format(filters.dateRange.from, 'dd/MM/yyyy', { locale: id })} - ${format(filters.dateRange.to, 'dd/MM/yyyy', { locale: id })}`
          ]] : []),
          [''],
          ['RINGKASAN STATISTIK'],
          ['Total Booking', metadata.totalBookings],
          ['Total Ruangan', metadata.totalRooms],
          ['Total Pengguna', metadata.totalUsers],
          ['']
        ]

        const metadataWS = XLSX.utils.aoa_to_sheet(metadataSheet)
        XLSX.utils.book_append_sheet(workbook, metadataWS, 'Metadata')
      } catch (metadataError) {
        logger.warn('Failed to add metadata sheet, continuing without metadata', { error: metadataError })
      }
    }

    // Add data sheets based on current tab with error handling
    try {
      switch (currentTab) {
        case 'general':
          addGeneralTabExcelSheets(workbook, data)
          break
        case 'room':
          addRoomTabExcelSheets(workbook, data)
          break
        case 'tour':
          addTourTabExcelSheets(workbook, data)
          break
        case 'user':
          addUserTabExcelSheets(workbook, data)
          break
        default:
          throw new ValidationError(`Tab tidak dikenali: ${currentTab}`, 'currentTab')
      }
    } catch (dataError) {
      throw new ExportError(
        `Failed to generate ${currentTab} tab data`,
        'EXCEL_DATA_ERROR',
        dataError as Error,
        { currentTab },
        false,
        `Gagal menghasilkan data tab ${currentTab}. Periksa data dan coba lagi.`
      )
    }

    // Save Excel file with retry mechanism
    await withRetry(
      async () => {
        XLSX.writeFile(workbook!, fileName)
      },
      {
        maxAttempts: 2,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffFactor: 2,
        retryableErrors: ['NETWORK_ERROR', 'FILESYSTEM_ERROR']
      },
      { operation: 'excel_write', fileName }
    )

    logger.info('Excel export completed successfully')

  } catch (error) {
    // Cleanup workbook if it exists
    if (workbook) {
      try {
        workbook = null
      } catch (cleanupError) {
        logger.warn('Error during Excel cleanup', { error: cleanupError })
      }
    }

    logger.error('Excel export failed', error as Error)

    if (error instanceof ExportError) {
      throw error
    }

    if (error instanceof Error) {
      // Check if it's a memory-related error (Excel can be memory intensive)
      if (error.message.includes('memory') || error.message.includes('allocation')) {
        throw new ExportError(
          `Memory error: ${error.message}`,
          'MEMORY_ERROR',
          error,
          { currentTab: data.currentTab },
          false,
          'Data terlalu besar untuk diproses. Coba kurangi jumlah data atau gunakan format lain.'
        )
      }

      // Check if it's a file system error
      if (error.message.includes('filesystem') || error.message.includes('storage') || error.message.includes('write')) {
        throw new FileSystemError(error.message, error)
      }
    }

    // Generic error fallback
    throw new ExportError(
      `Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'EXCEL_EXPORT_FAILED',
      error as Error,
      { currentTab: data.currentTab, dataSize: JSON.stringify(data).length },
      false,
      'Gagal mengekspor data Excel. Periksa data dan coba lagi.'
    )
  }
}

// Helper functions for CSV data preparation with error handling
function getGeneralTabCSVData(data: ExportData): (string | number | string[])[][] {
  try {
    const { bookings, rooms, users } = data

    if (!bookings || !rooms || !users) {
      throw new ValidationError('Data tidak lengkap untuk tab general', 'data')
    }

    return [
      ['=== DATA BOOKING UMUM ==='],
      ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Deskripsi Acara', 'Catatan'],
      ...bookings.map(booking => {
        try {
          return [
            booking.id,
            booking.profiles?.full_name || 'Unknown',
            booking.profiles?.email || 'Unknown',
            booking.profiles?.institution || 'Unknown',
            booking.rooms?.name || 'Unknown',
            format(new Date(booking.start_time), 'dd/MM/yyyy HH:mm'),
            format(new Date(booking.end_time), 'dd/MM/yyyy HH:mm'),
            booking.status,
            booking.event_description || '',
            booking.notes || ''
          ]
        } catch (bookingError) {
          console.warn('Error processing booking data:', bookingError)
          return [
            booking.id || 'Unknown',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error'
          ]
        }
      }),
      [''],
      ['=== DATA RUANGAN ==='],
      ['ID', 'Nama Ruangan', 'Kapasitas', 'Fasilitas', 'Status'],
      ...rooms.map(room => {
        try {
          return [
            room.id,
            room.name,
            room.capacity || 'N/A',
            room.facilities || 'N/A',
            room.is_active ? 'Active' : 'Inactive'
          ]
        } catch (roomError) {
          console.warn('Error processing room data:', roomError)
          return [
            room.id || 'Unknown',
            'Error',
            'Error',
            'Error',
            'Error'
          ]
        }
      }),
      [''],
      ['=== DATA PENGGUNA ==='],
      ['ID', 'Nama Lengkap', 'Email', 'Institusi', 'Telepon', 'Role', 'Tanggal Dibuat'],
      ...users.map(user => {
        try {
          return [
            user.id,
            user.full_name || 'N/A',
            user.email,
            user.institution || 'N/A',
            user.phone || 'N/A',
            user.role,
            format(new Date(user.created_at), 'dd/MM/yyyy')
          ]
        } catch (userError) {
          console.warn('Error processing user data:', userError)
          return [
            user.id || 'Unknown',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error'
          ]
        }
      })
    ]
  } catch (error) {
    console.error('Error generating general tab CSV data:', error)
    throw new DataProcessingError(
      `Failed to generate general tab CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error as Error
    )
  }
}

function getRoomTabCSVData(data: ExportData): (string | number)[][] {
  try {
    const { bookings, rooms, filters } = data

    if (!bookings || !rooms) {
      throw new ValidationError('Data tidak lengkap untuk tab room', 'data')
    }

    const filteredBookings = filterBookingsByRoom(bookings, filters.selectedRooms)

    return [
      ['=== DATA BOOKING PER RUANGAN ==='],
      ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Jumlah Tamu', 'Durasi (jam)'],
      ...filteredBookings.map(booking => {
        try {
          return [
            booking.id,
            booking.profiles?.full_name || 'Unknown',
            booking.profiles?.email || 'Unknown',
            booking.profiles?.institution || 'Unknown',
            booking.rooms?.name || 'Unknown',
            format(new Date(booking.start_time as string), 'dd/MM/yyyy HH:mm'),
            format(new Date(booking.end_time as string), 'dd/MM/yyyy HH:mm'),
            booking.status,
            booking.guest_count || 0,
            calculateDuration(booking.start_time as string, booking.end_time as string)
          ]
        } catch (bookingError) {
          console.warn('Error processing room booking data:', bookingError)
          return [
            booking.id || 'Unknown',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            0,
            0
          ]
        }
      })
    ]
  } catch (error) {
    console.error('Error generating room tab CSV data:', error)
    throw new DataProcessingError(
      `Failed to generate room tab CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error as Error
    )
  }
}

function getTourTabCSVData(data: ExportData): (string | number)[][] {
  try {
    const { bookings, tours } = data

    if (!bookings || !tours) {
      throw new ValidationError('Data tidak lengkap untuk tab tour', 'data')
    }

    return [
      ['=== DATA BOOKING TOUR ==='],
      ['ID', 'Pengguna', 'Email', 'Institusi', 'Tour', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Jumlah Peserta', 'Durasi (jam)'],
      ...bookings
        .filter(booking => booking.tours)
        .map(booking => {
          try {
            return [
              booking.id,
              booking.profiles?.full_name || 'Unknown',
              booking.profiles?.email || 'Unknown',
              booking.profiles?.institution || 'Unknown',
              booking.tours?.name || 'Unknown',
              format(new Date(booking.start_time), 'dd/MM/yyyy HH:mm'),
              format(new Date(booking.end_time), 'dd/MM/yyyy HH:mm'),
              booking.status,
              booking.guest_count || 0,
              calculateDuration(booking.start_time as string, booking.end_time as string)
            ]
          } catch (bookingError) {
            console.warn('Error processing tour booking data:', bookingError)
            return [
              booking.id || 'Unknown',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              0,
              0
            ]
          }
        })
    ]
  } catch (error) {
    console.error('Error generating tour tab CSV data:', error)
    throw new DataProcessingError(
      `Failed to generate tour tab CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error as Error
    )
  }
}

function getUserTabCSVData(data: ExportData): (string | number)[][] {
  try {
    const { bookings, users } = data

    if (!bookings || !users) {
      throw new ValidationError('Data tidak lengkap untuk tab user', 'data')
    }

    return [
      ['=== DATA PENGGUNA ==='],
      ['ID', 'Nama Lengkap', 'Email', 'Institusi', 'Telepon', 'Role', 'Total Booking', 'Tanggal Dibuat'],
      ...users.map(user => {
        try {
          const userBookings = bookings.filter(b => b.user_id === user.id)
          return [
            user.id,
            user.full_name || 'N/A',
            user.email,
            user.institution || 'N/A',
            user.phone || 'N/A',
            user.role,
            userBookings.length,
            format(new Date(user.created_at), 'dd/MM/yyyy')
          ]
        } catch (userError) {
          console.warn('Error processing user data:', userError)
          return [
            user.id || 'Unknown',
            'Error',
            'Error',
            'Error',
            'Error',
            'Error',
            0,
            'Error'
          ]
        }
      })
    ]
  } catch (error) {
    console.error('Error generating user tab CSV data:', error)
    throw new DataProcessingError(
      `Failed to generate user tab CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error as Error
    )
  }
}

// Helper functions for PDF data preparation with error handling
async function addGeneralTabPDFData(pdf: jsPDF, data: ExportData, startY: number): Promise<void> {
  try {
    let yPosition = startY
    const { bookings, rooms, users } = data

    if (!bookings || !rooms || !users) {
      throw new ValidationError('Data tidak lengkap untuk PDF general tab', 'data')
    }

    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage()
        yPosition = 20
        return true
      }
      return false
    }

    // Recent bookings table with error handling
    try {
      checkPageBreak(50)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('BOOKING TERKINI', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')

      // Table headers
      const headers = ['Pengguna', 'Ruangan', 'Tanggal', 'Status']
      const colWidth = (pdf.internal.pageSize.getWidth() - 40) / headers.length

      headers.forEach((header, i) => {
        pdf.text(header, 20 + (i * colWidth), yPosition)
      })
      yPosition += 6

      // Table rows (last 10 bookings)
      const recentBookings = bookings.slice(-10)
      recentBookings.forEach(booking => {
        try {
          checkPageBreak(6)
          const row = [
            booking.profiles?.full_name || 'Unknown',
            booking.rooms?.name || 'Unknown',
            format(new Date(booking.start_time), 'dd/MM'),
            booking.status
          ]

          row.forEach((cell, i) => {
            pdf.text(String(cell), 20 + (i * colWidth), yPosition)
          })
          yPosition += 5
        } catch (bookingError) {
          console.warn('Error adding booking row to PDF:', bookingError)
          // Continue with next booking instead of failing completely
        }
      })
    } catch (tableError) {
      console.warn('Error adding recent bookings table to PDF:', tableError)
      // Continue with the rest of the PDF generation
    }
  } catch (error) {
    console.error('Error in addGeneralTabPDFData:', error)
    throw new ExportError(
      `Failed to add general tab PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PDF_GENERAL_DATA_ERROR',
      error as Error,
      { startY },
      false,
      'Gagal menambahkan data tab general ke PDF.'
    )
  }
}

async function addRoomTabPDFData(pdf: jsPDF, data: ExportData, startY: number): Promise<void> {
  try {
    let yPosition = startY
    const { bookings, rooms, filters } = data

    if (!bookings || !rooms) {
      throw new ValidationError('Data tidak lengkap untuk PDF room tab', 'data')
    }

    const filteredBookings = filterBookingsByRoom(bookings, filters.selectedRooms)

    // Room utilization summary with error handling
    try {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('UTILISASI RUANGAN', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')

      rooms.forEach(room => {
        try {
          const roomBookings = filteredBookings.filter(b => b.room_id === room.id)
          if (roomBookings.length > 0) {
            pdf.text(`${room.name}: ${roomBookings.length} booking`, 20, yPosition)
            yPosition += 5
          }
        } catch (roomError) {
          console.warn('Error processing room data in PDF:', roomError)
          // Continue with next room
        }
      })
    } catch (roomError) {
      console.warn('Error adding room utilization to PDF:', roomError)
    }
  } catch (error) {
    console.error('Error in addRoomTabPDFData:', error)
    throw new ExportError(
      `Failed to add room tab PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PDF_ROOM_DATA_ERROR',
      error as Error,
      { startY },
      false,
      'Gagal menambahkan data tab room ke PDF.'
    )
  }
}

async function addTourTabPDFData(pdf: jsPDF, data: ExportData, startY: number): Promise<void> {
  try {
    let yPosition = startY
    const { bookings, tours } = data

    if (!bookings || !tours) {
      throw new ValidationError('Data tidak lengkap untuk PDF tour tab', 'data')
    }

    try {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('STATISTIK TOUR', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')

      const tourBookings = bookings.filter(b => b.tours)
      pdf.text(`Total Booking Tour: ${tourBookings.length}`, 20, yPosition)
      yPosition += 5

      if (tours.length > 0) {
        pdf.text(`Tour Tersedia: ${tours.length}`, 20, yPosition)
        yPosition += 5
      }
    } catch (tourError) {
      console.warn('Error adding tour statistics to PDF:', tourError)
    }
  } catch (error) {
    console.error('Error in addTourTabPDFData:', error)
    throw new ExportError(
      `Failed to add tour tab PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PDF_TOUR_DATA_ERROR',
      error as Error,
      { startY },
      false,
      'Gagal menambahkan data tab tour ke PDF.'
    )
  }
}

async function addUserTabPDFData(pdf: jsPDF, data: ExportData, startY: number): Promise<void> {
  try {
    let yPosition = startY
    const { users } = data

    if (!users) {
      throw new ValidationError('Data pengguna tidak lengkap untuk PDF user tab', 'users')
    }

    try {
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('STATISTIK PENGGUNA', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')

      const adminCount = users.filter(u => u.role === 'admin').length
      const userCount = users.filter(u => u.role === 'user').length

      pdf.text(`Total Pengguna: ${users.length}`, 20, yPosition)
      yPosition += 5
      pdf.text(`Admin: ${adminCount}`, 20, yPosition)
      yPosition += 5
      pdf.text(`User: ${userCount}`, 20, yPosition)
      yPosition += 5
    } catch (userError) {
      console.warn('Error adding user statistics to PDF:', userError)
    }
  } catch (error) {
    console.error('Error in addUserTabPDFData:', error)
    throw new ExportError(
      `Failed to add user tab PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PDF_USER_DATA_ERROR',
      error as Error,
      { startY },
      false,
      'Gagal menambahkan data tab user ke PDF.'
    )
  }
}

// Helper functions for Excel sheets with error handling
function addGeneralTabExcelSheets(workbook: XLSX.WorkBook, data: ExportData): void {
  try {
    const { bookings, rooms, users } = data

    if (!bookings || !rooms || !users) {
      throw new ValidationError('Data tidak lengkap untuk Excel general tab', 'data')
    }

    // Bookings sheet with error handling
    try {
      const bookingsSheet = XLSX.utils.aoa_to_sheet([
        ['DATA BOOKING UMUM'],
        ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Deskripsi Acara', 'Catatan'],
        ...bookings.map(booking => {
          try {
            return [
              booking.id,
              booking.profiles?.full_name || 'Unknown',
              booking.profiles?.email || 'Unknown',
              booking.profiles?.institution || 'Unknown',
              booking.rooms?.name || 'Unknown',
              booking.start_time as string,
              booking.end_time as string,
              booking.status,
              booking.event_description || '',
              booking.notes || ''
            ]
          } catch (bookingError) {
            console.warn('Error processing booking for Excel:', bookingError)
            return [
              booking.id || 'Unknown',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error'
            ]
          }
        })
      ])
      XLSX.utils.book_append_sheet(workbook, bookingsSheet, 'Bookings')
    } catch (bookingsError) {
      console.warn('Error creating bookings sheet:', bookingsError)
    }

    // Rooms sheet with error handling
    try {
      const roomsSheet = XLSX.utils.aoa_to_sheet([
        ['DATA RUANGAN'],
        ['ID', 'Nama Ruangan', 'Kapasitas', 'Fasilitas', 'Status'],
        ...rooms.map(room => {
          try {
            return [
              room.id,
              room.name,
              room.capacity || 'N/A',
              room.facilities || 'N/A',
              room.is_active ? 'Active' : 'Inactive'
            ]
          } catch (roomError) {
            console.warn('Error processing room for Excel:', roomError)
            return [
              room.id || 'Unknown',
              'Error',
              'Error',
              'Error',
              'Error'
            ]
          }
        })
      ])
      XLSX.utils.book_append_sheet(workbook, roomsSheet, 'Rooms')
    } catch (roomsError) {
      console.warn('Error creating rooms sheet:', roomsError)
    }

    // Users sheet with error handling
    try {
      const usersSheet = XLSX.utils.aoa_to_sheet([
        ['DATA PENGGUNA'],
        ['ID', 'Nama Lengkap', 'Email', 'Institusi', 'Telepon', 'Role', 'Tanggal Dibuat'],
        ...users.map(user => {
          try {
            return [
              user.id,
              user.full_name || 'N/A',
              user.email,
              user.institution || 'N/A',
              user.phone || 'N/A',
              user.role,
              user.created_at
            ]
          } catch (userError) {
            console.warn('Error processing user for Excel:', userError)
            return [
              user.id || 'Unknown',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error'
            ]
          }
        })
      ])
      XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users')
    } catch (usersError) {
      console.warn('Error creating users sheet:', usersError)
    }
  } catch (error) {
    console.error('Error in addGeneralTabExcelSheets:', error)
    throw new ExportError(
      `Failed to add general tab Excel sheets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'EXCEL_GENERAL_SHEETS_ERROR',
      error as Error,
      {},
      false,
      'Gagal menambahkan sheet tab general ke Excel.'
    )
  }
}

function addRoomTabExcelSheets(workbook: XLSX.WorkBook, data: ExportData): void {
  try {
    const { bookings, filters } = data

    if (!bookings) {
      throw new ValidationError('Data booking tidak lengkap untuk Excel room tab', 'bookings')
    }

    const filteredBookings = filterBookingsByRoom(bookings, filters.selectedRooms)

    try {
      const sheet = XLSX.utils.aoa_to_sheet([
        ['DATA BOOKING PER RUANGAN'],
        ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Jumlah Tamu', 'Durasi (jam)'],
        ...filteredBookings.map(booking => {
          try {
            return [
              booking.id,
              booking.profiles?.full_name || 'Unknown',
              booking.profiles?.email || 'Unknown',
              booking.profiles?.institution || 'Unknown',
              booking.rooms?.name || 'Unknown',
              booking.start_time as string,
              booking.end_time as string,
              booking.status,
              booking.guest_count || 0,
              calculateDuration(booking.start_time as string, booking.end_time as string)
            ]
          } catch (bookingError) {
            console.warn('Error processing room booking for Excel:', bookingError)
            return [
              booking.id || 'Unknown',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              0,
              0
            ]
          }
        })
      ])
      XLSX.utils.book_append_sheet(workbook, sheet, 'Room Bookings')
    } catch (sheetError) {
      console.warn('Error creating room bookings sheet:', sheetError)
    }
  } catch (error) {
    console.error('Error in addRoomTabExcelSheets:', error)
    throw new ExportError(
      `Failed to add room tab Excel sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'EXCEL_ROOM_SHEET_ERROR',
      error as Error,
      {},
      false,
      'Gagal menambahkan sheet tab room ke Excel.'
    )
  }
}

function addTourTabExcelSheets(workbook: XLSX.WorkBook, data: ExportData): void {
  try {
    const { bookings } = data

    if (!bookings) {
      throw new ValidationError('Data booking tidak lengkap untuk Excel tour tab', 'bookings')
    }

    try {
      const sheet = XLSX.utils.aoa_to_sheet([
        ['DATA BOOKING TOUR'],
        ['ID', 'Pengguna', 'Email', 'Institusi', 'Tour', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Jumlah Peserta', 'Durasi (jam)'],
        ...bookings
          .filter(booking => booking.tours)
          .map(booking => {
            try {
              return [
                booking.id,
                booking.profiles?.full_name || 'Unknown',
                booking.profiles?.email || 'Unknown',
                booking.profiles?.institution || 'Unknown',
                booking.tours?.name || 'Unknown',
                booking.start_time as string,
                booking.end_time as string,
                booking.status,
                booking.guest_count || 0,
                calculateDuration(booking.start_time as string, booking.end_time as string)
              ]
            } catch (bookingError) {
              console.warn('Error processing tour booking for Excel:', bookingError)
              return [
                booking.id || 'Unknown',
                'Error',
                'Error',
                'Error',
                'Error',
                'Error',
                'Error',
                'Error',
                0,
                0
              ]
            }
          })
      ])
      XLSX.utils.book_append_sheet(workbook, sheet, 'Tour Bookings')
    } catch (sheetError) {
      console.warn('Error creating tour bookings sheet:', sheetError)
    }
  } catch (error) {
    console.error('Error in addTourTabExcelSheets:', error)
    throw new ExportError(
      `Failed to add tour tab Excel sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'EXCEL_TOUR_SHEET_ERROR',
      error as Error,
      {},
      false,
      'Gagal menambahkan sheet tab tour ke Excel.'
    )
  }
}

function addUserTabExcelSheets(workbook: XLSX.WorkBook, data: ExportData): void {
  try {
    const { bookings, users } = data

    if (!bookings || !users) {
      throw new ValidationError('Data tidak lengkap untuk Excel user tab', 'data')
    }

    try {
      const sheet = XLSX.utils.aoa_to_sheet([
        ['DATA PENGGUNA'],
        ['ID', 'Nama Lengkap', 'Email', 'Institusi', 'Telepon', 'Role', 'Total Booking', 'Tanggal Dibuat'],
        ...users.map(user => {
          try {
            const userBookings = bookings.filter(b => b.user_id === user.id)
            return [
              user.id,
              user.full_name || 'N/A',
              user.email,
              user.institution || 'N/A',
              user.phone || 'N/A',
              user.role,
              userBookings.length,
              user.created_at
            ]
          } catch (userError) {
            console.warn('Error processing user for Excel:', userError)
            return [
              user.id || 'Unknown',
              'Error',
              'Error',
              'Error',
              'Error',
              'Error',
              0,
              'Error'
            ]
          }
        })
      ])
      XLSX.utils.book_append_sheet(workbook, sheet, 'Users')
    } catch (sheetError) {
      console.warn('Error creating users sheet:', sheetError)
    }
  } catch (error) {
    console.error('Error in addUserTabExcelSheets:', error)
    throw new ExportError(
      `Failed to add user tab Excel sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'EXCEL_USER_SHEET_ERROR',
      error as Error,
      {},
      false,
      'Gagal menambahkan sheet tab user ke Excel.'
    )
  }
}

// Utility functions with error handling
function filterBookingsByRoom(bookings: (Booking & { profiles?: User; rooms?: Room; tours?: Tour })[], selectedRooms?: string[]): (Booking & { profiles?: User; rooms?: Room; tours?: Tour })[] {
  try {
    if (!bookings) {
      console.warn('No bookings provided to filterBookingsByRoom')
      return []
    }

    if (!selectedRooms || selectedRooms.length === 0) return bookings

    return bookings.filter(booking => {
      try {
        return selectedRooms.includes(booking.room_id)
      } catch (filterError) {
        console.warn('Error filtering booking by room:', filterError)
        return false
      }
    })
  } catch (error) {
    console.error('Error in filterBookingsByRoom:', error)
    return []
  }
}

function calculateDuration(startTime: string, endTime: string): number {
  try {
    if (!startTime || !endTime) {
      console.warn('Invalid start or end time provided to calculateDuration')
      return 0
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid date format in calculateDuration', { startTime, endTime })
      return 0
    }

    const diffMs = end.getTime() - start.getTime()

    if (diffMs < 0) {
      console.warn('End time is before start time in calculateDuration', { startTime, endTime })
      return 0
    }

    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.error('Error in calculateDuration:', error)
    return 0
  }
}

// Cleanup function for export resources
export function cleanupExportResources(): void {
  try {
    blobManager.revokeAllBlobUrls()
  } catch (error) {
    console.warn('Error during export resource cleanup:', error)
  }
}

// Get memory usage statistics for monitoring
export function getExportMemoryStats(): {
  activeBlobCount: number
  maxFileSizeMB: number
  maxRowsProcessing: number
} {
  try {
    return {
      activeBlobCount: blobManager.getActiveBlobCount(),
      maxFileSizeMB: MAX_FILE_SIZE_MB,
      maxRowsProcessing: MAX_ROWS_PROCESSING
    }
  } catch (error) {
    console.error('Error getting export memory stats:', error)
    return {
      activeBlobCount: 0,
      maxFileSizeMB: MAX_FILE_SIZE_MB,
      maxRowsProcessing: MAX_ROWS_PROCESSING
    }
  }
}