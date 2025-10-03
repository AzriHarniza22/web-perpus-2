import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Booking, Room, Tour, User } from './types'

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

// CSV Export Function
export async function exportToCSV(
  data: ExportData,
  options: ExportOptions = {}
): Promise<void> {
  const { currentTab, filters, metadata } = data
  const fileName = options.fileName || generateFileName('csv', currentTab, filters)

  // Prepare CSV data based on current tab
   let csvData: (string | number | string[])[][] = []

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
  const { currentTab, filters, metadata } = data
  const fileName = options.fileName || generateFileName('pdf', currentTab, filters)

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 20

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - 20) {
      pdf.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Title and metadata
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

  // Add summary statistics
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

  // Add data based on current tab
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
  }

  // Save PDF
  pdf.save(fileName)
}

// Excel Export Function
export async function exportToExcel(
  data: ExportData,
  options: ExportOptions = {}
): Promise<void> {
  const { currentTab, filters, metadata } = data
  const fileName = options.fileName || generateFileName('excel', currentTab, filters)

  const workbook = XLSX.utils.book_new()

  // Metadata sheet
  if (options.includeMetadata !== false) {
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
  }

  // Add data sheets based on current tab
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
  const filteredBookings = filterBookingsByRoom(bookings, filters.selectedRooms)

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

// Helper functions for PDF data preparation
async function addGeneralTabPDFData(pdf: jsPDF, data: ExportData, startY: number): Promise<void> {
  let yPosition = startY
  const { bookings, rooms, users } = data

  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Recent bookings table
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
  })
}

async function addRoomTabPDFData(pdf: jsPDF, data: ExportData, startY: number): Promise<void> {
  let yPosition = startY
  const { bookings, rooms, filters } = data
  const filteredBookings = filterBookingsByRoom(bookings, filters.selectedRooms)

  // Room utilization summary
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('UTILISASI RUANGAN', 20, yPosition)
  yPosition += 10

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')

  rooms.forEach(room => {
    const roomBookings = filteredBookings.filter(b => b.room_id === room.id)
    if (roomBookings.length > 0) {
      pdf.text(`${room.name}: ${roomBookings.length} booking`, 20, yPosition)
      yPosition += 5
    }
  })
}

async function addTourTabPDFData(pdf: jsPDF, data: ExportData, startY: number): Promise<void> {
  let yPosition = startY
  const { bookings, tours } = data

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
}

async function addUserTabPDFData(pdf: jsPDF, data: ExportData, startY: number): Promise<void> {
  let yPosition = startY
  const { users } = data

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
  const filteredBookings = filterBookingsByRoom(bookings, filters.selectedRooms)

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
function filterBookingsByRoom(bookings: (Booking & { profiles?: User; rooms?: Room; tours?: Tour })[], selectedRooms?: string[]): (Booking & { profiles?: User; rooms?: Room; tours?: Tour })[] {
  if (!selectedRooms || selectedRooms.length === 0) return bookings
  return bookings.filter(booking => selectedRooms.includes(booking.room_id))
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimal places
}