import * as XLSX from 'xlsx'
import { pdf } from '@react-pdf/renderer'
import Papa from 'papaparse'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import React from 'react'
import { AnalyticsReportPDF } from '@/components/admin/analytics/pdf/AnalyticsReportPDF'
import { Booking, Room, Tour, User } from './types'
import { calculateRoomAnalytics, filterBookingsByRoom } from './roomAnalytics'
import { calculateTourAnalytics, filterTourBookings } from './tourAnalytics'
import { aggregateUserAnalytics } from './userAnalytics'
import { aggregateMonthlyBookings, calculateStats } from './chart-data-utils'
import { EnhancedExcelExportService, EnhancedExportData, EnhancedExportOptions } from './enhanced-excel-export/EnhancedExcelExportService'


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

export interface ExtendedExportOptions extends ExportOptions {
  includeStatisticalSummaries?: boolean
  includeTrendAnalysis?: boolean
  performanceOptimizations?: boolean
  onProgress?: (progress: number, status: string) => void
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

// CSV Export Function
export async function exportToCSV(
  data: ExportData,
  options: ExportOptions = {}
): Promise<void> {
  const { currentTab, filters, metadata } = data
  const fileName = options.fileName || generateFileName('csv', currentTab, filters)

  // Prepare CSV data based on current tab
   const csvData: (string | number | string[])[][] = []

  // Add metadata header
  if (options.includeMetadata !== false) {
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
  }

  // Add data based on current tab
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
  }

  // Convert to CSV string
  const csvContent = Papa.unparse(csvData)

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
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

// PDF Export Function
export async function exportToPDF(
  data: ExportData,
  options: ExportOptions = {}
): Promise<void> {
  const { bookings, rooms, tours, users, filters, metadata } = data
  const fileName = options.fileName || generateFileName('pdf', 'analytics', filters)

  // Prepare data for the PDF component
  const pdfData = {
    bookings,
    rooms,
    tours,
    users,
    dateRange: filters.dateRange ? {
      start: filters.dateRange.from,
      end: filters.dateRange.to
    } : undefined,
    exportDate: metadata.exportDate,
    userName: metadata.userName || 'Unknown User'
  }

  // Generate PDF using react-pdf
  const blob = await pdf(<AnalyticsReportPDF {...pdfData} />).toBlob()

  // Create download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Excel Export Function
export async function exportToExcel(
  data: ExportData,
  options: ExportOptions = {}
): Promise<void> {
  const { currentTab, filters, metadata } = data
  const fileName = options.fileName || generateFileName('excel', currentTab, filters)

  const workbook = XLSX.utils.book_new()

  // Cover sheet
  const coverSheet = [
    ['LAPORAN ANALYTICS PERPUSTAKAAN ACEH'],
    ['Sistem Reservasi Ruangan'],
    [''],
    ['Tab', currentTab.charAt(0).toUpperCase() + currentTab.slice(1)],
    ['Tanggal Export', format(metadata.exportDate, 'dd/MM/yyyy HH:mm', { locale: id })],
    ...(metadata.userName ? [['Diexport oleh', metadata.userName]] : []),
    ...(filters.dateRange ? [
      ['Periode Mulai', format(filters.dateRange.from, 'dd/MM/yyyy', { locale: id })],
      ['Periode Akhir', format(filters.dateRange.to, 'dd/MM/yyyy', { locale: id })],
      ['Total Hari', Math.ceil((filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24))]
    ] : []),
    [''],
    ['RINGKASAN STATISTIK'],
    ['Total Booking', metadata.totalBookings],
    ['Total Ruangan', metadata.totalRooms],
    ['Total Pengguna', metadata.totalUsers]
  ]
  const coverWS = XLSX.utils.aoa_to_sheet(coverSheet)
  XLSX.utils.book_append_sheet(workbook, coverWS, 'Cover')

  // Table of Contents
  const tocSheet = [
    ['DAFTAR ISI'],
    [''],
    ['1', 'Cover', 'Halaman 1'],
    ['2', 'Ringkasan Statistik', 'Halaman 2'],
    ['3', 'Data Ruangan', 'Halaman 3'],
    ['4', 'Data Tour', 'Halaman 4'],
    ['5', 'Data Pengguna', 'Halaman 5'],
    ['6', 'Data Detail', 'Halaman 6']
  ]
  const tocWS = XLSX.utils.aoa_to_sheet(tocSheet)
  XLSX.utils.book_append_sheet(workbook, tocWS, 'Daftar Isi')

  // General Info sheet
  const generalInfoSheet = [
    ['INFORMASI UMUM'],
    [''],
    ['Ringkasan Statistik'],
    ['Total Booking', metadata.totalBookings],
    ['Total Ruangan', metadata.totalRooms],
    ['Total Pengguna', metadata.totalUsers],
    [''],
    ['Distribusi Status Booking']
  ]

  // Add status distribution
  const statusCounts = data.bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(statusCounts).forEach(([status, count]) => {
    generalInfoSheet.push([status.charAt(0).toUpperCase() + status.slice(1), count])
  })

  const generalInfoWS = XLSX.utils.aoa_to_sheet(generalInfoSheet)
  XLSX.utils.book_append_sheet(workbook, generalInfoWS, 'Info Umum')

  // Rooms sheet
  const roomsSheet = [
    ['DATA RUANGAN'],
    ['ID', 'Nama Ruangan', 'Kapasitas', 'Fasilitas', 'Status', 'Total Booking']
  ]

  data.rooms.forEach(room => {
    const roomBookings = data.bookings.filter(b => b.room_id === room.id).length
    roomsSheet.push([
      room.id,
      room.name,
      String(room.capacity || 'N/A'),
      room.facilities?.join(', ') || 'N/A',
      room.is_active ? 'Aktif' : 'Tidak Aktif',
      String(roomBookings)
    ])
  })

  const roomsWS = XLSX.utils.aoa_to_sheet(roomsSheet)
  XLSX.utils.book_append_sheet(workbook, roomsWS, 'Ruangan')

  // Tours sheet
  const toursSheet = [
    ['DATA TOUR'],
    ['Nama Tour', 'Total Booking', 'Total Peserta']
  ]

  const tourStats = data.bookings
    .filter(b => b.tours)
    .reduce((acc, booking) => {
      const tourName = booking.tours?.name || 'Unknown'
      if (!acc[tourName]) {
        acc[tourName] = { bookings: 0, participants: 0 }
      }
      acc[tourName].bookings++
      acc[tourName].participants += booking.guest_count || 0
      return acc
    }, {} as Record<string, { bookings: number; participants: number }>)

  Object.entries(tourStats).forEach(([tourName, stats]) => {
    toursSheet.push([tourName, String(stats.bookings), String(stats.participants)])
  })

  const toursWS = XLSX.utils.aoa_to_sheet(toursSheet)
  XLSX.utils.book_append_sheet(workbook, toursWS, 'Tour')

  // Users sheet
  const usersSheet = [
    ['DATA PENGGUNA'],
    ['ID', 'Nama Lengkap', 'Email', 'Institusi', 'Role', 'Total Booking', 'Tanggal Dibuat']
  ]

  data.users.forEach(user => {
    const userBookings = data.bookings.filter(b => b.user_id === user.id).length
    usersSheet.push([
      user.id,
      user.full_name || 'N/A',
      user.email,
      user.institution || 'N/A',
      user.role,
      String(userBookings),
      format(new Date(user.created_at), 'dd/MM/yyyy')
    ])
  })

  const usersWS = XLSX.utils.aoa_to_sheet(usersSheet)
  XLSX.utils.book_append_sheet(workbook, usersWS, 'Pengguna')

  // Add detailed data sheets based on current tab
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
  }

  // Save Excel file
  XLSX.writeFile(workbook, fileName)
}

// Enhanced Excel Export Function
export async function exportToEnhancedExcel(
  data: ExportData,
  options: ExtendedExportOptions = {},
  chartData?: {
    [chartKey: string]: {
      title: string
      data: any
      type: string
      viewMode?: string
    }
  }
): Promise<void> {
  try {
    // Convert existing ExportData to EnhancedExportData format
    const enhancedData: EnhancedExportData = {
      ...data,
      chartData
    }

    // Initialize the enhanced export service
    const enhancedExportService = new EnhancedExcelExportService()

    // Set progress callback if provided
    if (options.onProgress) {
      enhancedExportService.setProgressCallback(options.onProgress)
    }

    // Perform enhanced export
    await enhancedExportService.exportToExcel(enhancedData, {
      includeCharts: options.includeCharts !== false,
      includeRawData: options.includeRawData !== false,
      includeStatisticalSummaries: options.includeStatisticalSummaries !== false,
      includeTrendAnalysis: options.includeTrendAnalysis !== false,
      performanceOptimizations: options.performanceOptimizations !== false,
      fileName: options.fileName,
      dateFormat: options.dateFormat || 'dd/MM/yyyy',
      includeMetadata: options.includeMetadata !== false
    })

  } catch (error) {
    console.error('Enhanced Excel export failed:', error)
    throw new Error(`Enhanced export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Export service factory for external use
export function createEnhancedExportService(): EnhancedExcelExportService {
  return new EnhancedExcelExportService()
}

// Helper functions for CSV data preparation
function getGeneralTabCSVData(data: ExportData): (string | number | string[])[][] {
  const { bookings, rooms, users } = data

  return [
    ['=== DATA BOOKING UMUM ==='],
    ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Deskripsi Acara', 'Catatan'],
    ...bookings.map(booking => [
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
    ]),
    [''],
    ['=== DATA RUANGAN ==='],
    ['ID', 'Nama Ruangan', 'Kapasitas', 'Fasilitas', 'Status'],
    ...rooms.map(room => [
      room.id,
      room.name,
      room.capacity || 'N/A',
      room.facilities || 'N/A',
      room.is_active ? 'Active' : 'Inactive'
    ]),
    [''],
    ['=== DATA PENGGUNA ==='],
    ['ID', 'Nama Lengkap', 'Email', 'Institusi', 'Telepon', 'Role', 'Tanggal Dibuat'],
    ...users.map(user => [
      user.id,
      user.full_name || 'N/A',
      user.email,
      user.institution || 'N/A',
      user.phone || 'N/A',
      user.role,
      format(new Date(user.created_at), 'dd/MM/yyyy')
    ])
  ]
}

function getRoomTabCSVData(data: ExportData): (string | number)[][] {
  const { bookings, rooms, filters } = data
  const filteredBookings = filterBookingsByRoomLocal(bookings, filters.selectedRooms)

  return [
    ['=== DATA BOOKING PER RUANGAN ==='],
    ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Jumlah Tamu', 'Durasi (jam)'],
    ...filteredBookings.map(booking => [
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
    ])
  ]
}

function getTourTabCSVData(data: ExportData): (string | number)[][] {
  const { bookings, tours } = data

  return [
    ['=== DATA BOOKING TOUR ==='],
    ['ID', 'Pengguna', 'Email', 'Institusi', 'Tour', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Jumlah Peserta', 'Durasi (jam)'],
    ...bookings
      .filter(booking => booking.tours)
      .map(booking => [
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
      ])
  ]
}

function getUserTabCSVData(data: ExportData): (string | number)[][] {
  const { bookings, users } = data

  return [
    ['=== DATA PENGGUNA ==='],
    ['ID', 'Nama Lengkap', 'Email', 'Institusi', 'Telepon', 'Role', 'Total Booking', 'Tanggal Dibuat'],
    ...users.map(user => {
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
    })
  ]
}


// Helper functions for Excel sheets
function addGeneralTabExcelSheets(workbook: XLSX.WorkBook, data: ExportData): void {
  const { bookings, rooms, users } = data

  // Bookings sheet
  const bookingsSheet = XLSX.utils.aoa_to_sheet([
    ['DATA BOOKING UMUM'],
    ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Deskripsi Acara', 'Catatan'],
    ...bookings.map(booking => [
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
    ])
  ])
  XLSX.utils.book_append_sheet(workbook, bookingsSheet, 'Bookings')

  // Rooms sheet
  const roomsSheet = XLSX.utils.aoa_to_sheet([
    ['DATA RUANGAN'],
    ['ID', 'Nama Ruangan', 'Kapasitas', 'Fasilitas', 'Status'],
    ...rooms.map(room => [
      room.id,
      room.name,
      room.capacity || 'N/A',
      room.facilities || 'N/A',
      room.is_active ? 'Active' : 'Inactive'
    ])
  ])
  XLSX.utils.book_append_sheet(workbook, roomsSheet, 'Rooms')

  // Users sheet
  const usersSheet = XLSX.utils.aoa_to_sheet([
    ['DATA PENGGUNA'],
    ['ID', 'Nama Lengkap', 'Email', 'Institusi', 'Telepon', 'Role', 'Tanggal Dibuat'],
    ...users.map(user => [
      user.id,
      user.full_name || 'N/A',
      user.email,
      user.institution || 'N/A',
      user.phone || 'N/A',
      user.role,
      user.created_at
    ])
  ])
  XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users')
}

function addRoomTabExcelSheets(workbook: XLSX.WorkBook, data: ExportData): void {
  const { bookings, filters } = data
  const filteredBookings = filterBookingsByRoomLocal(bookings, filters.selectedRooms)

  const sheet = XLSX.utils.aoa_to_sheet([
    ['DATA BOOKING PER RUANGAN'],
    ['ID', 'Pengguna', 'Email', 'Institusi', 'Ruangan', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Jumlah Tamu', 'Durasi (jam)'],
    ...filteredBookings.map(booking => [
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
    ])
  ])
  XLSX.utils.book_append_sheet(workbook, sheet, 'Room Bookings')
}

function addTourTabExcelSheets(workbook: XLSX.WorkBook, data: ExportData): void {
  const { bookings } = data

  const sheet = XLSX.utils.aoa_to_sheet([
    ['DATA BOOKING TOUR'],
    ['ID', 'Pengguna', 'Email', 'Institusi', 'Tour', 'Waktu Mulai', 'Waktu Selesai', 'Status', 'Jumlah Peserta', 'Durasi (jam)'],
    ...bookings
      .filter(booking => booking.tours)
      .map(booking => [
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
      ])
  ])
  XLSX.utils.book_append_sheet(workbook, sheet, 'Tour Bookings')
}

function addUserTabExcelSheets(workbook: XLSX.WorkBook, data: ExportData): void {
  const { bookings, users } = data

  const sheet = XLSX.utils.aoa_to_sheet([
    ['DATA PENGGUNA'],
    ['ID', 'Nama Lengkap', 'Email', 'Institusi', 'Telepon', 'Role', 'Total Booking', 'Tanggal Dibuat'],
    ...users.map(user => {
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
    })
  ])
  XLSX.utils.book_append_sheet(workbook, sheet, 'Users')
}

// Utility functions
function filterBookingsByRoomLocal(bookings: (Booking & { profiles?: User; rooms?: Room; tours?: Tour })[], selectedRooms?: string[]): (Booking & { profiles?: User; rooms?: Room; tours?: Tour })[] {
  if (!selectedRooms || selectedRooms.length === 0) return bookings
  return bookings.filter(booking => selectedRooms.includes(booking.room_id))
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimal places
}