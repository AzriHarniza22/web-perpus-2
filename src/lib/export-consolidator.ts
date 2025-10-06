import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import Papa from 'papaparse'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ExportData, ExportOptions } from './exportUtils'
import { Booking, User, Room, Tour } from './types'

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
    sections.push(['Sistem Reservasi Ruangan'])
    sections.push([''])
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
 * Consolidated CSV export function
 */
export async function exportTabToCSV(
  data: ExportData,
  tabName: keyof ExportTabConfig,
  options: ExportOptions = {}
): Promise<void> {
  const csvData = generateTabCSVData(data, tabName)
  const csvContent = Papa.unparse(csvData)

  const fileName = options.fileName ||
    `${data.currentTab}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`

  downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;')
}

/**
 * Consolidated PDF export function
 */
export async function exportTabToPDF(
  data: ExportData,
  tabName: keyof ExportTabConfig,
  options: ExportOptions = {}
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  let yPosition = 20

  const fileName = options.fileName ||
    `${data.currentTab}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.pdf`

  // Add metadata
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('LAPORAN ANALYTICS PERPUSTAKAAN ACEH', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Add tab content
  yPosition = await generateTabPDFContent(pdf, data, tabName, yPosition)

  pdf.save(fileName)
}

/**
 * Consolidated Excel export function
 */
export async function exportTabToExcel(
  data: ExportData,
  tabName: keyof ExportTabConfig,
  options: ExportOptions = {}
): Promise<void> {
  const workbook = XLSX.utils.book_new()
  const fileName = options.fileName ||
    `${data.currentTab}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`

  // Add metadata sheet
  if (options.includeMetadata !== false) {
    const metadataSheet = generateMetadataSection(data)
    const metadataWS = XLSX.utils.aoa_to_sheet(metadataSheet)
    XLSX.utils.book_append_sheet(workbook, metadataWS, 'Metadata')
  }

  // Add tab data sheet
  generateTabExcelSheet(workbook, data, tabName, tabName.charAt(0).toUpperCase() + tabName.slice(1))

  XLSX.writeFile(workbook, fileName)
}

/**
 * Utility function to download files
 */
function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', fileName)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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