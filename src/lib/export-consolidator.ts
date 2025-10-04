import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import Papa from 'papaparse'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ExportData, ExportOptions } from './exportUtils'
import { Booking, User, Room, Tour } from './types'

// Memory management constants
const MAX_FILE_SIZE_MB = 50 // Maximum file size in MB
const MAX_ROWS_PROCESSING = 10000 // Maximum rows to process at once
const BLOB_CLEANUP_DELAY = 100 // Delay before cleanup in ms

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

export class MemoryError extends ExportError {
  constructor(message: string, cause?: Error) {
    super(
      `Memory error: ${message}`,
      'MEMORY_ERROR',
      cause,
      { timestamp: new Date().toISOString() },
      false,
      'Data terlalu besar untuk diproses. Coba kurangi jumlah data atau gunakan filter.'
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

export class QuotaExceededError extends ExportError {
  constructor(message: string) {
    super(
      `Quota exceeded: ${message}`,
      'QUOTA_EXCEEDED',
      undefined,
      { timestamp: new Date().toISOString() },
      false,
      'Kuota ekspor terlampaui. Coba lagi nanti atau hubungi administrator.'
    )
  }
}

// Retry configuration and utilities
interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableErrors: string[]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableErrors: ['NETWORK_ERROR', 'FILESYSTEM_ERROR']
}

// Enhanced logging utility
class ExportLogger {
  private context: Record<string, unknown>

  constructor(context: Record<string, unknown> = {}) {
    this.context = { timestamp: new Date().toISOString(), ...context }
  }

  info(message: string, data?: Record<string, unknown>): void {
    console.info(`[Export] ${message}`, { ...this.context, ...data })
  }

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(`[Export] ${message}`, { ...this.context, ...data })
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    console.error(`[Export] ${message}`, {
      ...this.context,
      error: error?.message,
      stack: error?.stack,
      ...data
    })
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Export] ${message}`, { ...this.context, ...data })
    }
  }
}

// Retry utility with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: Record<string, unknown> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  const logger = new ExportLogger(context)

  let lastError: Error

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      logger.debug(`Attempt ${attempt}/${finalConfig.maxAttempts}`)
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Check if error is retryable
      const isRetryable = error instanceof ExportError && error.retryable

      if (!isRetryable || attempt === finalConfig.maxAttempts) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      )

      logger.warn(`Retryable error on attempt ${attempt}, retrying in ${delay}ms`, {
        error: lastError.message,
        attempt,
        maxAttempts: finalConfig.maxAttempts,
        delay
      })

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Error recovery utilities
interface ErrorRecoveryOptions {
  fallbackFormats?: Array<'csv' | 'pdf' | 'excel'>
  reduceDataSize?: boolean
  skipMetadata?: boolean
  onError?: (error: ExportError) => void
}

class ExportErrorBoundary {
  private logger: ExportLogger
  private recoveryOptions: ErrorRecoveryOptions

  constructor(context: Record<string, unknown>, recoveryOptions: ErrorRecoveryOptions = {}) {
    this.logger = new ExportLogger(context)
    this.recoveryOptions = recoveryOptions
  }

  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    format: string
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      this.logger.error(`Export operation failed for ${format}`, error as Error)

      if (error instanceof ExportError && this.recoveryOptions.onError) {
        this.recoveryOptions.onError(error)
      }

      // Try fallback formats if available
      if (error instanceof ExportError &&
          this.recoveryOptions.fallbackFormats &&
          this.recoveryOptions.fallbackFormats.length > 0) {

        this.logger.info(`Attempting fallback formats: ${this.recoveryOptions.fallbackFormats.join(', ')}`)

        for (const fallbackFormat of this.recoveryOptions.fallbackFormats) {
          try {
            this.logger.info(`Trying fallback format: ${fallbackFormat}`)
            // Note: This would need to be implemented based on the specific fallback logic
            // For now, we'll throw a recovery suggestion error
            throw new ExportError(
              `Primary format ${format} failed, fallback to ${fallbackFormat} not implemented`,
              'FALLBACK_NOT_IMPLEMENTED',
              error as Error,
              { originalFormat: format, fallbackFormat },
              false,
              `Format ${format} gagal. Fallback ke ${fallbackFormat} belum tersedia.`
            )
          } catch (fallbackError) {
            this.logger.error(`Fallback format ${fallbackFormat} also failed`, fallbackError as Error)
          }
        }
      }

      throw error
    }
  }
}

// Utility functions for memory management
function estimateDataSize(data: unknown[][]): number {
  // Rough estimation of data size in bytes
  const jsonString = JSON.stringify(data)
  return new Blob([jsonString]).size
}

function validateFileSize(data: unknown[][], maxSizeMB: number = MAX_FILE_SIZE_MB): void {
  const estimatedSize = estimateDataSize(data)
  const sizeMB = estimatedSize / (1024 * 1024)

  if (sizeMB > maxSizeMB) {
    throw new FileSizeError(estimatedSize, maxSizeMB)
  }
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

// Safe blob URL management with cleanup
class BlobManager {
  private blobUrls: Set<string> = new Set()
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map()

  createBlobUrl(content: string, mimeType: string): string {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    this.blobUrls.add(url)

    // Set up delayed cleanup
    const timer = setTimeout(() => {
      this.revokeBlobUrl(url)
    }, BLOB_CLEANUP_DELAY)

    this.cleanupTimers.set(url, timer)
    return url
  }

  revokeBlobUrl(url: string): void {
    if (this.blobUrls.has(url)) {
      URL.revokeObjectURL(url)
      this.blobUrls.delete(url)

      const timer = this.cleanupTimers.get(url)
      if (timer) {
        clearTimeout(timer)
        this.cleanupTimers.delete(url)
      }
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

/**
 * Generic configuration for tab data processing
 * Uses 'any' type for flexibility across different data types (Booking, User, etc.)
 * This is necessary because the interface needs to handle different data structures
 * dynamically based on the specific tab configuration being used.
 * Type safety is maintained through explicit type annotations in TAB_CONFIGS.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TabDataConfig<T = any> {
  title: string
  dataSelector: (data: ExportData) => T[]
  headers: string[]
  rowMapper: (item: T, index: number, data?: ExportData) => (string | number)[]
  summaryStats?: Array<{ label: string; value: (data: T[]) => string | number }>
}

export interface ExportTabConfig {
  general: TabDataConfig
  room: TabDataConfig
  tour: TabDataConfig
  user: TabDataConfig
}

// Consolidated tab configurations to eliminate duplication
export const TAB_CONFIGS: ExportTabConfig = {
  general: {
    title: 'DATA BOOKING UMUM',
    dataSelector: (data) => data.bookings,
    headers: ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Deskripsi Acara', 'Catatan'],
    rowMapper: (booking: ExportData['bookings'][0]) => [
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
  },
  room: {
    title: 'DATA BOOKING PER RUANGAN',
    dataSelector: (data) => data.bookings,
    headers: ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Jumlah Tamu', 'Durasi (jam)'],
    rowMapper: (booking: ExportData['bookings'][0]) => [
      booking.id,
      booking.profiles?.full_name || 'Unknown',
      booking.profiles?.email || 'Unknown',
      booking.profiles?.institution || 'Unknown',
      booking.rooms?.name || 'Unknown',
      format(new Date(booking.start_time), 'dd/MM/yyyy HH:mm'),
      format(new Date(booking.end_time), 'dd/MM/yyyy HH:mm'),
      booking.status,
      booking.guest_count || 0,
      calculateDuration(booking.start_time, booking.end_time)
    ]
  },
  tour: {
    title: 'DATA BOOKING TOUR',
    dataSelector: (data) => data.bookings.filter((b: Booking) => (b as { tours?: unknown }).tours),
    headers: ['ID', 'Pengguna', 'Email', 'Institusi', 'Tour', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Jumlah Peserta', 'Durasi (jam)'],
    rowMapper: (booking: ExportData['bookings'][0]) => [
      booking.id,
      booking.profiles?.full_name || 'Unknown',
      booking.profiles?.email || 'Unknown',
      booking.profiles?.institution || 'Unknown',
      booking.tours?.name || 'Unknown',
      format(new Date(booking.start_time), 'dd/MM/yyyy HH:mm'),
      format(new Date(booking.end_time), 'dd/MM/yyyy HH:mm'),
      booking.status,
      booking.guest_count || 0,
      calculateDuration(booking.start_time, booking.end_time)
    ]
  },
  user: {
    title: 'DATA PENGGUNA',
    dataSelector: (data) => data.users,
    headers: ['ID', 'Nama Lengkap', 'Email', 'Institusi', 'Telepon', 'Role', 'Total Booking', 'Tanggal Dibuat'],
    rowMapper: (user: User, _, data) => {
      const userBookings = data?.bookings.filter((b: Booking) => (b as { user_id?: string }).user_id === user.id) || []
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
    }
  }
}

/**
 * Generate metadata section for exports
 */
export function generateMetadataSection(data: ExportData, options: ExportOptions = {}): string[][] {
  const { metadata, filters } = data
  const sections: string[][] = []

  if (options.includeMetadata !== false) {
    sections.push(['LAPORAN ANALYTICS PERPUSTAKAAN ACEH'])
    sections.push(['Tab:', data.currentTab.charAt(0).toUpperCase() + data.currentTab.slice(1)])
    sections.push(['Tanggal Export:', format(metadata.exportDate, 'dd/MM/yyyy HH:mm', { locale: id })])

    if (metadata.userName) {
      sections.push(['Diexport oleh:', metadata.userName])
    }

    if (filters.dateRange) {
      sections.push([
        'Periode:',
        format(filters.dateRange.from, 'dd/MM/yyyy', { locale: id }),
        'sampai',
        format(filters.dateRange.to, 'dd/MM/yyyy', { locale: id })
      ])
    }

    sections.push([''])
    sections.push(['RINGKASAN STATISTIK'])
    sections.push(['Total Booking:', String(metadata.totalBookings)])
    sections.push(['Total Ruangan:', String(metadata.totalRooms)])
    sections.push(['Total Pengguna:', String(metadata.totalUsers)])
    sections.push([''])
  }

  return sections
}

/**
 * Generate consolidated CSV data for any tab
 */
export function generateTabCSVData(data: ExportData, tabName: keyof ExportTabConfig): string[][] {
  const config = TAB_CONFIGS[tabName]
  const tabData = config.dataSelector(data)
  const metadataSection = generateMetadataSection(data)

  const csvData = [
    ...metadataSection,
    [config.title],
    config.headers,
    ...tabData.map((item, index) => config.rowMapper(item, index, data))
  ]

  return csvData as string[][]
}

/**
 * Generate consolidated PDF content for any tab
 */
export async function generateTabPDFContent(
  pdf: jsPDF,
  data: ExportData,
  tabName: keyof ExportTabConfig,
  startY: number
): Promise<number> {
  let yPosition = startY
  const config = TAB_CONFIGS[tabName]
  const tabData = config.dataSelector(data)

  const checkPageBreak = (requiredHeight: number): boolean => {
    if (yPosition + requiredHeight > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Add tab title
  checkPageBreak(20)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text(config.title, 20, yPosition)
  yPosition += 15

  // Add data in chunks to handle page breaks
  const itemsPerPage = 15
  for (let i = 0; i < tabData.length; i += itemsPerPage) {
    checkPageBreak(30)

    const chunk = tabData.slice(i, i + itemsPerPage)

    // Add headers for each chunk
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    config.headers.forEach((header, colIndex) => {
      pdf.text(header, 20 + (colIndex * 25), yPosition)
    })
    yPosition += 8

    // Add data rows
    pdf.setFont('helvetica', 'normal')
    chunk.forEach((item) => {
      checkPageBreak(6)
      const row = config.rowMapper(item, i, data)
      row.forEach((cell, colIndex) => {
        pdf.text(String(cell), 20 + (colIndex * 25), yPosition)
      })
      yPosition += 5
    })

    yPosition += 5
  }

  return yPosition
}

/**
 * Generate consolidated Excel sheets for any tab
 */
export function generateTabExcelSheet(
  workbook: XLSX.WorkBook,
  data: ExportData,
  tabName: keyof ExportTabConfig,
  sheetName: string
): void {
  const config = TAB_CONFIGS[tabName]
  const tabData = config.dataSelector(data)
  const metadataSection = generateMetadataSection(data)

  const sheetData = [
    ...metadataSection,
    [config.title],
    config.headers,
    ...tabData.map((item, index) => config.rowMapper(item, index, data))
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
}

/**
 * Consolidated CSV export function with comprehensive error handling and retry mechanisms
 */
export async function exportTabToCSV(
  data: ExportData,
  tabName: keyof ExportTabConfig,
  options: ExportOptions = {}
): Promise<void> {
  const logger = new ExportLogger({
    operation: 'exportTabToCSV',
    tabName,
    dataSize: JSON.stringify(data).length,
    timestamp: new Date().toISOString()
  })

  const errorBoundary = new ExportErrorBoundary(
    { operation: 'exportTabToCSV', tabName },
    {
      fallbackFormats: ['excel', 'pdf'],
      onError: (error) => logger.error('CSV export failed', error)
    }
  )

  await errorBoundary.executeWithRecovery(async () => {
    let csvContent = ''

    try {
      logger.info('Starting CSV export process')

      // Validate input data
      if (!data || !data.bookings || !data.users) {
        throw new ValidationError('Data ekspor tidak lengkap atau tidak valid', 'data')
      }

      if (!TAB_CONFIGS[tabName]) {
        throw new ValidationError(`Tab konfigurasi tidak ditemukan: ${tabName}`, 'tabName')
      }

      // Validate data size before processing
      const csvData = generateTabCSVData(data, tabName)
      validateFileSize(csvData)

      logger.debug('Data validation passed, processing CSV data')

      // Process data in chunks for large datasets
      const config = TAB_CONFIGS[tabName]
      const tabData = config.dataSelector(data)

      if (tabData.length > MAX_ROWS_PROCESSING) {
        logger.info(`Processing large dataset in chunks (${tabData.length} rows > ${MAX_ROWS_PROCESSING})`)

        // Process in chunks for memory efficiency
        const chunks = chunkArray(tabData, MAX_ROWS_PROCESSING)
        const csvChunks: string[][] = []

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]
          logger.debug(`Processing chunk ${i + 1}/${chunks.length}`)

          const chunkWithHeaders = [
            ...generateMetadataSection(data),
            [config.title],
            config.headers,
            ...chunk.map((item, index) => config.rowMapper(item, index, data).map(cell => String(cell)))
          ]
          csvChunks.push(...chunkWithHeaders)
        }

        csvContent = Papa.unparse(csvChunks)
      } else {
        csvContent = Papa.unparse(csvData)
      }

      const fileName = options.fileName ||
        `${data.currentTab}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`

      logger.info(`Generated CSV content (${csvContent.length} characters), initiating download`)

      // Use retry mechanism for file download
      await withRetry(
        async () => {
          downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;')
        },
        { maxAttempts: 2 },
        { operation: 'csv_download', fileName }
      )

      logger.info('CSV export completed successfully')

    } catch (error) {
      // Cleanup any blob URLs that might have been created
      blobManager.revokeAllBlobUrls()

      if (error instanceof ExportError) {
        logger.error('Export error occurred', error, {
          code: error.code,
          retryable: error.retryable,
          context: error.context
        })
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

        // Check if it's a memory-related error
        if (error.message.includes('memory') || error.message.includes('allocation')) {
          throw new MemoryError(error.message, error)
        }
      }

      // Generic error fallback
      const exportError = new ExportError(
        `CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CSV_EXPORT_FAILED',
        error as Error,
        { tabName, dataSize: JSON.stringify(data).length },
        false,
        'Gagal mengekspor data CSV. Periksa data dan coba lagi.'
      )

      logger.error('Unexpected error during CSV export', exportError)
      throw exportError
    }
  }, 'csv')
}

/**
 * Consolidated PDF export function with comprehensive error handling and retry mechanisms
 */
export async function exportTabToPDF(
  data: ExportData,
  tabName: keyof ExportTabConfig,
  options: ExportOptions = {}
): Promise<void> {
  const logger = new ExportLogger({
    operation: 'exportTabToPDF',
    tabName,
    dataSize: JSON.stringify(data).length,
    timestamp: new Date().toISOString()
  })

  const errorBoundary = new ExportErrorBoundary(
    { operation: 'exportTabToPDF', tabName },
    {
      fallbackFormats: ['csv', 'excel'],
      onError: (error) => logger.error('PDF export failed', error)
    }
  )

  await errorBoundary.executeWithRecovery(async () => {
    let pdf: jsPDF | null = null

    try {
      logger.info('Starting PDF export process')

      // Validate input data
      if (!data || !data.bookings || !data.users) {
        throw new ValidationError('Data ekspor tidak lengkap atau tidak valid', 'data')
      }

      if (!TAB_CONFIGS[tabName]) {
        throw new ValidationError(`Tab konfigurasi tidak ditemukan: ${tabName}`, 'tabName')
      }

      // Validate data size before processing
      const config = TAB_CONFIGS[tabName]
      const tabData = config.dataSelector(data)

      if (tabData.length > MAX_ROWS_PROCESSING) {
        throw new ExportError(
          `Dataset too large for PDF export (${tabData.length} rows). Please use CSV or Excel format for large datasets.`,
          'PDF_DATASET_TOO_LARGE',
          undefined,
          { rowCount: tabData.length, maxRows: MAX_ROWS_PROCESSING },
          false,
          `Dataset terlalu besar untuk ekspor PDF (${tabData.length} baris). Gunakan format CSV atau Excel untuk dataset besar.`
        )
      }

      logger.info(`Creating PDF document for ${tabData.length} rows`)

      pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      let yPosition = 20

      const fileName = options.fileName ||
        `${data.currentTab}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.pdf`

      // Add metadata with error handling
      try {
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.text('LAPORAN ANALYTICS PERPUSTAKAAN ACEH', pageWidth / 2, yPosition, { align: 'center' })
        yPosition += 20
      } catch (pdfError) {
        throw new ExportError(
          'Failed to add PDF metadata',
          'PDF_METADATA_ERROR',
          pdfError as Error,
          { yPosition, pageWidth },
          false,
          'Gagal menambahkan metadata ke PDF. File mungkin corrupt.'
        )
      }

      // Add tab content with error handling
      try {
        yPosition = await generateTabPDFContent(pdf, data, tabName, yPosition)
      } catch (contentError) {
        throw new ExportError(
          'Failed to generate PDF content',
          'PDF_CONTENT_ERROR',
          contentError as Error,
          { tabName, yPosition },
          false,
          'Gagal menghasilkan konten PDF. Periksa data dan coba lagi.'
        )
      }

      logger.info('PDF content generated, saving file')

      // Use retry mechanism for file save operation
      await withRetry(
        async () => {
          pdf!.save(fileName)
        },
        { maxAttempts: 2 },
        { operation: 'pdf_save', fileName }
      )

      logger.info('PDF export completed successfully')

    } catch (error) {
      // Cleanup PDF instance if it exists
      if (pdf) {
        try {
          // Clean up any resources used by jsPDF
          pdf = null
        } catch (cleanupError) {
          logger.warn('Error during PDF cleanup', { error: cleanupError })
        }
      }

      if (error instanceof ExportError) {
        logger.error('Export error occurred', error, {
          code: error.code,
          retryable: error.retryable,
          context: error.context
        })
        throw error
      }

      if (error instanceof Error) {
        // Check if it's a memory-related error (PDF generation can be memory intensive)
        if (error.message.includes('memory') || error.message.includes('allocation') || error.message.includes('canvas')) {
          throw new MemoryError(error.message, error)
        }

        // Check if it's a file system error
        if (error.message.includes('filesystem') || error.message.includes('storage') || error.message.includes('save')) {
          throw new FileSystemError(error.message, error)
        }
      }

      // Generic error fallback
      const exportError = new ExportError(
        `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PDF_EXPORT_FAILED',
        error as Error,
        { tabName, dataSize: JSON.stringify(data).length },
        false,
        'Gagal mengekspor data PDF. Periksa data dan coba lagi.'
      )

      logger.error('Unexpected error during PDF export', exportError)
      throw exportError
    }
  }, 'pdf')
}

/**
 * Consolidated Excel export function with comprehensive error handling and retry mechanisms
 */
export async function exportTabToExcel(
  data: ExportData,
  tabName: keyof ExportTabConfig,
  options: ExportOptions = {}
): Promise<void> {
  const logger = new ExportLogger({
    operation: 'exportTabToExcel',
    tabName,
    dataSize: JSON.stringify(data).length,
    timestamp: new Date().toISOString()
  })

  const errorBoundary = new ExportErrorBoundary(
    { operation: 'exportTabToExcel', tabName },
    {
      fallbackFormats: ['csv', 'pdf'],
      onError: (error) => logger.error('Excel export failed', error)
    }
  )

  await errorBoundary.executeWithRecovery(async () => {
    let workbook: XLSX.WorkBook | null = null

    try {
      logger.info('Starting Excel export process')

      // Validate input data
      if (!data || !data.bookings || !data.users) {
        throw new ValidationError('Data ekspor tidak lengkap atau tidak valid', 'data')
      }

      if (!TAB_CONFIGS[tabName]) {
        throw new ValidationError(`Tab konfigurasi tidak ditemukan: ${tabName}`, 'tabName')
      }

      // Validate data size before processing
      const config = TAB_CONFIGS[tabName]
      const tabData = config.dataSelector(data)

      if (tabData.length > MAX_ROWS_PROCESSING) {
        logger.info(`Processing large dataset in chunks (${tabData.length} rows > ${MAX_ROWS_PROCESSING})`)

        // Process in chunks for memory efficiency
        workbook = XLSX.utils.book_new()
        const chunks = chunkArray(tabData, MAX_ROWS_PROCESSING)
        const fileName = options.fileName ||
          `${data.currentTab}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`

        // Add metadata sheet if requested
        if (options.includeMetadata !== false) {
          try {
            const metadataSheet = generateMetadataSection(data)
            const metadataWS = XLSX.utils.aoa_to_sheet(metadataSheet)
            XLSX.utils.book_append_sheet(workbook, metadataWS, 'Metadata')
          } catch (metadataError) {
            logger.warn('Failed to add metadata sheet, continuing without metadata', { error: metadataError })
          }
        }

        // Add data in chunks
        chunks.forEach((chunk, index) => {
          try {
            logger.debug(`Processing Excel chunk ${index + 1}/${chunks.length}`)

            const chunkData = [
              ...generateMetadataSection(data),
              [config.title],
              config.headers,
              ...chunk.map((item, itemIndex) => config.rowMapper(item, itemIndex, data).map(cell => String(cell)))
            ]

            const sheetName = `Data_${index + 1}`
            const worksheet = XLSX.utils.aoa_to_sheet(chunkData)
            XLSX.utils.book_append_sheet(workbook!, worksheet, sheetName)
          } catch (chunkError) {
            logger.error(`Failed to process chunk ${index + 1}`, chunkError as Error)
            throw new DataProcessingError(
              `Failed to process Excel chunk ${index + 1}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`,
              chunkError as Error
            )
          }
        })

        logger.info('All chunks processed, saving Excel file')

        // Use retry mechanism for file write operation
        await withRetry(
          async () => {
            XLSX.writeFile(workbook!, fileName)
          },
          { maxAttempts: 2 },
          { operation: 'excel_write', fileName }
        )

      } else {
        logger.info(`Processing standard dataset (${tabData.length} rows)`)

        // Standard processing for smaller datasets
        workbook = XLSX.utils.book_new()
        const fileName = options.fileName ||
          `${data.currentTab}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`

        // Add metadata sheet
        if (options.includeMetadata !== false) {
          try {
            const metadataSheet = generateMetadataSection(data)
            const metadataWS = XLSX.utils.aoa_to_sheet(metadataSheet)
            XLSX.utils.book_append_sheet(workbook, metadataWS, 'Metadata')
          } catch (metadataError) {
            logger.warn('Failed to add metadata sheet, continuing without metadata', { error: metadataError })
          }
        }

        // Add tab data sheet
        try {
          generateTabExcelSheet(workbook, data, tabName, tabName.charAt(0).toUpperCase() + tabName.slice(1))
        } catch (sheetError) {
          throw new DataProcessingError(
            `Failed to generate Excel sheet: ${sheetError instanceof Error ? sheetError.message : 'Unknown error'}`,
            sheetError as Error
          )
        }

        logger.info('Excel workbook created, saving file')

        // Use retry mechanism for file write operation
        await withRetry(
          async () => {
            XLSX.writeFile(workbook!, fileName)
          },
          { maxAttempts: 2 },
          { operation: 'excel_write', fileName }
        )
      }

      logger.info('Excel export completed successfully')

    } catch (error) {
      // Cleanup workbook if it exists
      if (workbook) {
        try {
          // Clean up any resources used by XLSX
          workbook = null
        } catch (cleanupError) {
          logger.warn('Error during Excel cleanup', { error: cleanupError })
        }
      }

      if (error instanceof ExportError) {
        logger.error('Export error occurred', error, {
          code: error.code,
          retryable: error.retryable,
          context: error.context
        })
        throw error
      }

      if (error instanceof Error) {
        // Check if it's a memory-related error (Excel can be memory intensive)
        if (error.message.includes('memory') || error.message.includes('allocation')) {
          throw new MemoryError(error.message, error)
        }

        // Check if it's a file system error
        if (error.message.includes('filesystem') || error.message.includes('storage') || error.message.includes('write')) {
          throw new FileSystemError(error.message, error)
        }
      }

      // Generic error fallback
      const exportError = new ExportError(
        `Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXCEL_EXPORT_FAILED',
        error as Error,
        { tabName, dataSize: JSON.stringify(data).length },
        false,
        'Gagal mengekspor data Excel. Periksa data dan coba lagi.'
      )

      logger.error('Unexpected error during Excel export', exportError)
      throw exportError
    }
  }, 'excel')
}

/**
 * Utility function to download files with comprehensive error handling and memory management
 */
function downloadFile(content: string, fileName: string, mimeType: string): void {
  const logger = new ExportLogger({
    operation: 'downloadFile',
    fileName,
    contentSize: content.length,
    mimeType,
    timestamp: new Date().toISOString()
  })

  try {
    logger.debug('Starting file download preparation')

    // Validate file size before creating blob
    const estimatedSize = new Blob([content]).size
    const sizeMB = estimatedSize / (1024 * 1024)

    if (sizeMB > MAX_FILE_SIZE_MB) {
      throw new FileSizeError(estimatedSize, MAX_FILE_SIZE_MB)
    }

    logger.debug(`File size validated (${sizeMB.toFixed(2)}MB), creating blob URL`)

    const url = blobManager.createBlobUrl(content, mimeType)
    const link = document.createElement('a')

    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'

    logger.debug('Blob URL created, appending link to DOM')

    document.body.appendChild(link)

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      try {
        logger.debug('Triggering file download')
        link.click()
        logger.info('File download initiated successfully')
      } catch (error) {
        logger.error('Failed to trigger download', error as Error)
        throw new ExportError(
          'Failed to initiate file download',
          'DOWNLOAD_FAILED',
          error as Error,
          { fileName, contentSize: content.length },
          true, // This could be a transient browser issue
          'Gagal memulai unduhan file. Periksa browser dan coba lagi.'
        )
      } finally {
        logger.debug('Cleaning up DOM elements')
        document.body.removeChild(link)
        // Cleanup will happen via the delayed timer in BlobManager
      }
    })

  } catch (error) {
    if (error instanceof ExportError) {
      logger.error('Export error during file preparation', error, {
        code: error.code,
        retryable: error.retryable
      })
      throw error
    }

    if (error instanceof Error) {
      // Check if it's a DOM-related error
      if (error.message.includes('DOM') || error.message.includes('element')) {
        throw new ExportError(
          `DOM error during file preparation: ${error.message}`,
          'DOM_ERROR',
          error,
          { fileName, contentSize: content.length },
          true, // DOM errors can be transient
          'Kesalahan DOM saat menyiapkan file. Refresh halaman dan coba lagi.'
        )
      }

      // Check if it's a browser security error
      if (error.message.includes('security') || error.message.includes('permission')) {
        throw new ExportError(
          `Browser security error: ${error.message}`,
          'BROWSER_SECURITY_ERROR',
          error,
          { fileName, contentSize: content.length },
          false,
          'Kesalahan keamanan browser. Periksa pengaturan situs dan coba lagi.'
        )
      }
    }

    // Generic error fallback
    const exportError = new ExportError(
      `Failed to prepare file for download: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'FILE_PREPARATION_FAILED',
      error as Error,
      { fileName, contentSize: content.length },
      false,
      'Gagal menyiapkan file untuk diunduh. Periksa data dan coba lagi.'
    )

    logger.error('Unexpected error during file preparation', exportError)
    throw exportError
  }
}

/**
 * Calculate duration in hours
 */
function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
}

/**
 * Filter bookings by selected rooms
 */
export function filterBookingsByRoom(bookings: Record<string, unknown>[], selectedRooms?: string[]): Record<string, unknown>[] {
  if (!selectedRooms || selectedRooms.length === 0) return bookings
  return bookings.filter(booking => selectedRooms.includes(booking.room_id as string))
}

/**
 * Cleanup function to be called when export operations are cancelled or completed
 * This ensures all blob URLs are properly cleaned up
 */
export function cleanupExportResources(): void {
  blobManager.revokeAllBlobUrls()
}

/**
 * Get memory usage statistics for monitoring
 */
export function getExportMemoryStats(): {
  activeBlobCount: number
  maxFileSizeMB: number
  maxRowsProcessing: number
} {
  return {
    activeBlobCount: blobManager.getActiveBlobCount(),
    maxFileSizeMB: MAX_FILE_SIZE_MB,
    maxRowsProcessing: MAX_ROWS_PROCESSING
  }
}