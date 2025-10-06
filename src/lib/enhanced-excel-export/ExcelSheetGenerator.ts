import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Booking, Room, Tour, User } from '@/lib/types'
import { EnhancedExportData, EnhancedExportOptions } from './EnhancedExcelExportService'
import { ComprehensiveMetadata } from './MetadataGenerator'
import { StatisticalSummary, TrendAnalysis } from './StatisticalCalculator'
import { ExtractedChartData } from './ChartDataExtractor'

export interface SheetGenerationOptions {
  includeCharts: boolean
  includeRawData: boolean
  includeStatisticalSummaries: boolean
  includeTrendAnalysis: boolean
}

export interface GenerationContext {
  workbook: XLSX.WorkBook
  data: EnhancedExportData
  metadata: ComprehensiveMetadata
  extractedChartData: ExtractedChartData
  statisticalSummaries: StatisticalSummary
  trendAnalysis: TrendAnalysis
  options: SheetGenerationOptions
}

export class ExcelSheetGenerator {

  /**
   * Generate all sheets for the enhanced Excel export
   */
  async generateAllSheets(context: GenerationContext): Promise<void> {
    const { workbook, data, metadata, options } = context

    // Progress callback for large datasets
    const progressCallback = (progress: number, status: string) => {
      // Progress callback can be added to EnhancedExportData interface if needed
      console.log(`Export progress: ${progress}% - ${status}`)
    }

    try {
      progressCallback(10, 'Generating cover sheet...')

      // 1. Cover Sheet
      await this.generateCoverSheet(workbook, metadata)

      progressCallback(20, 'Generating table of contents...')

      // 2. Table of Contents
      await this.generateTableOfContents(workbook, options)

      progressCallback(30, 'Generating metadata summary...')

      // 3. Metadata Summary
      await this.generateMetadataSummarySheet(workbook, metadata)

      progressCallback(40, 'Generating statistical summaries...')

      // 4. Statistical Summaries (if enabled)
      if (options.includeStatisticalSummaries) {
        await this.generateStatisticalSummarySheets(workbook, context.statisticalSummaries)
      }

      progressCallback(50, 'Generating trend analysis...')

      // 5. Trend Analysis (if enabled)
      if (options.includeTrendAnalysis) {
        await this.generateTrendAnalysisSheets(workbook, context.trendAnalysis)
      }

      progressCallback(60, 'Generating chart data sheets...')

      // 6. Chart Data Sheets (if enabled)
      if (options.includeCharts) {
        await this.generateChartDataSheets(workbook, context.extractedChartData)
      }

      progressCallback(70, 'Generating raw data sheets...')

      // 7. Raw Data Sheets (if enabled)
      if (options.includeRawData) {
        await this.generateRawDataSheets(workbook, data)
      }

      progressCallback(90, 'Finalizing workbook...')

      // 8. Apply formatting and styling
      await this.applyWorkbookFormatting(workbook)

      progressCallback(100, 'Export complete')

    } catch (error) {
      console.error('Error generating Excel sheets:', error)
      throw error
    }
  }

  /**
   * Generate cover sheet with export information
   */
  private async generateCoverSheet(workbook: XLSX.WorkBook, metadata: ComprehensiveMetadata): Promise<void> {
    const coverData = [
      ['SISTEM RESERVASI PERPUSTAKAAN ACEH'],
      ['LAPORAN ANALYTICS KOMPREHENSIF'],
      [''],
      ['INFORMASI EXPORT'],
      ['Tanggal Export', metadata.exportInfo.exportTimestamp],
      ['Aplikasi', metadata.exportInfo.applicationName],
      ['Versi', metadata.exportInfo.exportVersion],
      [''],
      ['KONTEKS DATA'],
      ['Tab Aktif', metadata.dataContext.currentTab.toUpperCase()],
      ['Total Record', String(metadata.dataContext.totalRecords)],
      ...(metadata.dataContext.dateRange ? [
        ['Periode Data', metadata.dataContext.dateRange.formatted],
        ['Jumlah Hari', String(metadata.dataContext.dateRange.days)]
      ] : []),
      ...(metadata.dataContext.filters.roomCount && metadata.dataContext.filters.roomCount > 0 ? [
        ['Ruangan Difilter', String(metadata.dataContext.filters.roomCount)]
      ] : []),
      [''],
      ['RINGKASAN DATA'],
      ['Total Booking', String(metadata.dataSummary.bookings.total)],
      ['Total Ruangan', String(metadata.dataSummary.rooms.total)],
      ['Total Tour', String(metadata.dataSummary.tours.total)],
      ['Total Pengguna', String(metadata.dataSummary.users.total)],
      [''],
      ['FITUR EXPORT'],
      ...metadata.exportConfiguration.features.map(feature => [feature, '✓']),
      [''],
      ['KUALITAS DATA'],
      ['Kelengkapan Data', `${Math.round((metadata.qualityMetrics.dataCompleteness.bookingsWithProfiles + metadata.qualityMetrics.dataCompleteness.bookingsWithRooms) / 2)}%`],
      ['Record Duplikat', String(metadata.qualityMetrics.dataQuality.duplicateRecords)]
    ]

    const coverSheet = XLSX.utils.aoa_to_sheet(coverData)

    // Style the cover sheet
    this.applySheetStyles(coverSheet, {
      title: { font: { bold: true, sz: 16 } },
      headers: { font: { bold: true, sz: 12 } }
    })

    XLSX.utils.book_append_sheet(workbook, coverSheet, 'Cover')
  }

  /**
   * Generate table of contents
   */
  private async generateTableOfContents(workbook: XLSX.WorkBook, options: SheetGenerationOptions): Promise<void> {
    const tocData: string[][] = [
      ['DAFTAR ISI'],
      [''],
      ['1.', 'Cover', 'Halaman informasi export'],
      ['2.', 'Daftar Isi', 'Halaman ini'],
      ['3.', 'Ringkasan Metadata', 'Informasi detail tentang data'],
    ]

    let sheetNumber = 4

    if (options.includeStatisticalSummaries) {
      tocData.push([String(sheetNumber++) + '.', 'Ringkasan Statistik', 'Analisis statistik komprehensif'])
    }

    if (options.includeTrendAnalysis) {
      tocData.push([String(sheetNumber++) + '.', 'Analisis Tren', 'Tren dan pola data'])
    }

    if (options.includeCharts) {
      tocData.push([String(sheetNumber++) + '.', 'Data Chart', 'Data dari komponen chart'])
    }

    if (options.includeRawData) {
      tocData.push([String(sheetNumber++) + '.', 'Data Mentah', 'Data booking lengkap'])
      tocData.push([String(sheetNumber++) + '.', 'Data Ruangan', 'Informasi ruangan'])
      tocData.push([String(sheetNumber++) + '.', 'Data Tour', 'Informasi tour'])
      tocData.push([String(sheetNumber++) + '.', 'Data Pengguna', 'Informasi pengguna'])
    }

    const tocSheet = XLSX.utils.aoa_to_sheet(tocData)

    this.applySheetStyles(tocSheet, {
      title: { font: { bold: true, sz: 14 } },
      headers: { font: { bold: true, sz: 12 } }
    })

    XLSX.utils.book_append_sheet(workbook, tocSheet, 'Daftar Isi')
  }

  /**
   * Generate metadata summary sheet
   */
  private async generateMetadataSummarySheet(workbook: XLSX.WorkBook, metadata: ComprehensiveMetadata): Promise<void> {
    const metadataGenerator = new (await import('./MetadataGenerator')).MetadataGenerator()
    const summaryData = metadataGenerator.generateMetadataSummary(metadata)

    const metadataSheet = XLSX.utils.aoa_to_sheet(summaryData)

    this.applySheetStyles(metadataSheet, {
      sectionHeaders: { font: { bold: true, sz: 12 }, fill: { patternType: 'solid', fgColor: { rgb: 'EFEFEF' } } }
    })

    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata Summary')
  }

  /**
   * Generate statistical summary sheets
   */
  private async generateStatisticalSummarySheets(workbook: XLSX.WorkBook, summaries: StatisticalSummary): Promise<void> {
    // Overview sheet
    const overviewData = [
      ['RINGKASAN STATISTIK OVERVIEW'],
      [''],
      ['METRIK UTAMA'],
      ['Total Booking', String(summaries.overview.totalBookings)],
      ['Total Pengguna', String(summaries.overview.totalUsers)],
      ['Total Ruangan', String(summaries.overview.totalRooms)],
      ['Total Tour', String(summaries.overview.totalTours)],
      ['Periode Data', `${summaries.overview.dateRange.days} hari`],
      [''],
      ['METRIK BOOKING'],
      ['Rata-rata Tamu per Booking', String(summaries.bookingMetrics.averageGuestsPerBooking)],
      ['Rata-rata Durasi (jam)', String(summaries.bookingMetrics.averageDurationHours)],
      ['Jam Puncak', `${summaries.bookingMetrics.peakBookingHour}:00`],
      ['Hari Puncak', summaries.bookingMetrics.peakBookingDay],
      ['Tingkat Pembatalan', `${summaries.bookingMetrics.cancellationRate}%`]
    ]

    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData)
    this.applySheetStyles(overviewSheet, {
      sectionHeaders: { font: { bold: true, sz: 12 } },
      data: { alignment: { horizontal: 'right' } }
    })
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Statistik Overview')

    // User metrics sheet
    const userMetricsData = [
      ['METRIK PENGGUNA'],
      [''],
      ['RINGKASAN PENGGUNA'],
      ['Total Pengguna', String(summaries.userMetrics.activeUsers)],
      ['Pengguna Baru (Periode)', String(summaries.userMetrics.newUsersInPeriod)],
      ['Rata-rata Booking per Pengguna', String(summaries.userMetrics.averageBookingsPerUser)],
      [''],
      ['TOP INSTITUSI'],
      ['Institusi', 'Jumlah', 'Persentase']
    ]

    summaries.userMetrics.topInstitutions.forEach(inst => {
      userMetricsData.push([inst.name, String(inst.count), `${Math.round(inst.percentage)}%`])
    })

    const userMetricsSheet = XLSX.utils.aoa_to_sheet(userMetricsData)
    this.applySheetStyles(userMetricsSheet, {
      sectionHeaders: { font: { bold: true, sz: 12 } }
    })
    XLSX.utils.book_append_sheet(workbook, userMetricsSheet, 'Statistik User')

    // Room metrics sheet
    const roomMetricsData = [
      ['METRIK RUANGAN'],
      [''],
      ['RINGKASAN RUANGAN'],
      ['Tingkat Utilisasi', `${summaries.roomMetrics.utilizationRate}%`],
      ['Ruangan Terpopuler', summaries.roomMetrics.mostPopularRoomName || 'N/A'],
      ['Ruangan Kurang Populer', summaries.roomMetrics.leastPopularRoomName || 'N/A'],
      [''],
      ['UTILISASI PER RUANGAN'],
      ['Ruangan', 'Utilisasi (%)']
    ]

    Object.entries(summaries.roomMetrics.averageUtilizationByRoom).forEach(([roomName, utilization]) => {
      roomMetricsData.push([roomName, `${Math.round(utilization)}%`])
    })

    const roomMetricsSheet = XLSX.utils.aoa_to_sheet(roomMetricsData)
    this.applySheetStyles(roomMetricsSheet, {
      sectionHeaders: { font: { bold: true, sz: 12 } }
    })
    XLSX.utils.book_append_sheet(workbook, roomMetricsSheet, 'Statistik Room')
  }

  /**
   * Generate trend analysis sheets
   */
  private async generateTrendAnalysisSheets(workbook: XLSX.WorkBook, trends: TrendAnalysis): Promise<void> {
    // Booking trends sheet
    const bookingTrendsData = [
      ['ANALISIS TREN BOOKING'],
      [''],
      ['TREN HARIAN'],
      ['Tanggal', 'Jumlah', 'Moving Average']
    ]

    trends.bookingTrends.daily.forEach(day => {
      bookingTrendsData.push([
        day.date,
        String(day.count),
        String(Math.round(day.movingAverage * 100) / 100)
      ])
    })

    const bookingTrendsSheet = XLSX.utils.aoa_to_sheet(bookingTrendsData)
    this.applySheetStyles(bookingTrendsSheet, {
      sectionHeaders: { font: { bold: true, sz: 12 } }
    })
    XLSX.utils.book_append_sheet(workbook, bookingTrendsSheet, 'Tren Booking')

    // User growth sheet
    const userGrowthData = [
      ['ANALISIS PERTUMBUHAN PENGGUNA'],
      [''],
      ['PERTUMBUHAN HARIAN'],
      ['Tanggal', 'Pengguna Baru', 'Kumulatif']
    ]

    trends.userGrowth.daily.forEach(day => {
      userGrowthData.push([
        day.date,
        String(day.newUsers),
        String(day.cumulative)
      ])
    })

    userGrowthData.push([''], [''], ['RINGKASAN'])
    userGrowthData.push(['Retention Rate', `${trends.userGrowth.retentionRate}%`])
    userGrowthData.push(['Churn Rate', `${trends.userGrowth.churnRate}%`])

    const userGrowthSheet = XLSX.utils.aoa_to_sheet(userGrowthData)
    this.applySheetStyles(userGrowthSheet, {
      sectionHeaders: { font: { bold: true, sz: 12 } }
    })
    XLSX.utils.book_append_sheet(workbook, userGrowthSheet, 'Tren User')
  }

  /**
   * Generate chart data sheets
   */
  private async generateChartDataSheets(workbook: XLSX.WorkBook, chartData: ExtractedChartData): Promise<void> {
    for (const [chartKey, chartInfo] of Object.entries(chartData)) {
      const chartDataArray = [
        [`DATA CHART: ${chartInfo.title.toUpperCase()}`],
        [''],
        ['RINGKASAN CHART'],
        ['Tipe Chart', chartInfo.type],
        ['Total Data Points', String(chartInfo.summary.totalDataPoints)],
        ['Jumlah Data', String(chartInfo.summary.dataPointCount)],
        ['Nilai Rata-rata', String(chartInfo.summary.averageValue)],
        ['Nilai Maksimum', String(chartInfo.summary.maxValue)],
        ['Nilai Minimum', String(chartInfo.summary.minValue)],
        [''],
        ['DATA CHART'],
        ['Label', ...chartInfo.data.datasets.map(dataset => dataset.label)]
      ]

      // Add data rows
      chartInfo.data.labels.forEach((label, index) => {
        const row = [label]
        chartInfo.data.datasets.forEach(dataset => {
          const value = dataset.data[index]
          row.push(value !== null ? String(value) : 'N/A')
        })
        chartDataArray.push(row)
      })

      // Add trends if available
      if (chartInfo.summary.trends && chartInfo.summary.trends.length > 0) {
        chartDataArray.push([''], ['TRENDS'])
        chartInfo.summary.trends.forEach(trend => {
          chartDataArray.push([
            trend.label,
            trend.direction.toUpperCase(),
            `${trend.percentage}%`
          ])
        })
      }

      const chartSheet = XLSX.utils.aoa_to_sheet(chartDataArray)
      this.applySheetStyles(chartSheet, {
        sectionHeaders: { font: { bold: true, sz: 12 } }
      })

      XLSX.utils.book_append_sheet(workbook, chartSheet, `Chart_${chartKey}`)
    }
  }

  /**
   * Generate raw data sheets
   */
  private async generateRawDataSheets(workbook: XLSX.WorkBook, data: EnhancedExportData): Promise<void> {
    // Extended booking type for joined data access
    type ExtendedBooking = Booking & {
      profiles?: User
      rooms?: Room
      tours?: Tour
    }

    const extendedBookings = data.bookings as ExtendedBooking[]

    // Bookings data sheet
    const bookingsData = [
      ['DATA BOOKING MENTAH'],
      [''],
      ['User Name', 'User Email', 'Institution', 'Room Name', 'Tour Name', 'Start Time', 'End Time', 'Status', 'Event Description', 'Guest Count', 'Created At']
    ]

    extendedBookings.forEach(booking => {
      bookingsData.push([
        booking.profiles?.full_name || 'Unknown',
        booking.profiles?.email || 'Unknown',
        booking.profiles?.institution || 'Unknown',
        booking.rooms?.name || 'Unknown',
        booking.tours?.name || 'Unknown',
        booking.start_time,
        booking.end_time,
        booking.status,
        booking.event_description || '',
        String(booking.guest_count || 0),
        booking.created_at
      ])
    })

    const bookingsSheet = XLSX.utils.aoa_to_sheet(bookingsData)
    this.applySheetStyles(bookingsSheet, {
      headers: { font: { bold: true, sz: 12 } }
    })
    XLSX.utils.book_append_sheet(workbook, bookingsSheet, 'Data Bookings')

    // Rooms data sheet
    const roomsData = [
      ['DATA RUANGAN MENTAH'],
      [''],
      ['ID', 'Name', 'Description', 'Capacity', 'Facilities', 'Is Active', 'Created At']
    ]

    data.rooms.forEach(room => {
      roomsData.push([
        room.id,
        room.name,
        room.description || '',
        String(room.capacity || 0),
        (room.facilities || []).join(', '),
        room.is_active ? 'Active' : 'Inactive',
        room.created_at
      ])
    })

    const roomsSheet = XLSX.utils.aoa_to_sheet(roomsData)
    this.applySheetStyles(roomsSheet, {
      headers: { font: { bold: true, sz: 12 } }
    })
    XLSX.utils.book_append_sheet(workbook, roomsSheet, 'Data Rooms')

    // Tours data sheet
    const toursData = [
      ['DATA TOUR MENTAH'],
      [''],
      ['ID', 'Name', 'Description', 'Capacity', 'Duration', 'Meeting Point', 'Guide', 'Is Active', 'Created At']
    ]

    data.tours.forEach(tour => {
      toursData.push([
        tour.id,
        tour.name,
        tour.description || '',
        String(tour.capacity || 0),
        String(tour.duration_minutes || 0),
        tour.meeting_point || '',
        tour.guide_name || '',
        tour.is_active ? 'Active' : 'Inactive',
        tour.created_at
      ])
    })

    const toursSheet = XLSX.utils.aoa_to_sheet(toursData)
    this.applySheetStyles(toursSheet, {
      headers: { font: { bold: true, sz: 12 } }
    })
    XLSX.utils.book_append_sheet(workbook, toursSheet, 'Data Tours')

    // Users data sheet
    const usersData = [
      ['DATA PENGGUNA MENTAH'],
      [''],
      ['ID', 'Full Name', 'Email', 'Institution', 'Phone', 'Role', 'Created At']
    ]

    data.users.forEach(user => {
      usersData.push([
        user.id,
        user.full_name || '',
        user.email,
        user.institution || '',
        user.phone || '',
        user.role,
        user.created_at
      ])
    })

    const usersSheet = XLSX.utils.aoa_to_sheet(usersData)
    this.applySheetStyles(usersSheet, {
      headers: { font: { bold: true, sz: 12 } }
    })
    XLSX.utils.book_append_sheet(workbook, usersSheet, 'Data Users')
  }

  /**
   * Apply formatting and styling to workbook
   */
  private async applyWorkbookFormatting(workbook: XLSX.WorkBook): Promise<void> {
    // Set column widths for better readability
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName]
      const columnWidths = this.calculateColumnWidths(worksheet)

      if (!worksheet['!cols']) {
        worksheet['!cols'] = []
      }

      columnWidths.forEach((width, index) => {
        if (!worksheet['!cols']) {
          worksheet['!cols'] = []
        }
        worksheet['!cols'][index] = { width }
      })
    })

    // Add freeze panes for better navigation
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName]

      // Freeze first row for headers
      if (!worksheet['!freeze']) {
        worksheet['!freeze'] = { xSplit: '1', ySplit: '1', topLeftCell: 'A2' }
      }
    })
  }

  /**
   * Apply styles to a sheet
   */
  private applySheetStyles(
    worksheet: XLSX.WorkSheet,
    styles: {
      title?: any
      headers?: any
      sectionHeaders?: any
      data?: any
    }
  ): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = worksheet[cellAddress]

        if (cell && cell.v) {
          // Apply title styling (first cell, large text)
          if (row === 0 && col === 0 && styles.title) {
            Object.assign(cell, styles.title)
          }
          // Apply header styling (first row)
          else if (row === 0 && styles.headers) {
            Object.assign(cell, styles.headers)
          }
          // Apply section header styling (cells containing "===")
          else if (typeof cell.v === 'string' && cell.v.includes('===') && styles.sectionHeaders) {
            Object.assign(cell, styles.sectionHeaders)
          }
          // Apply data styling
          else if (styles.data) {
            Object.assign(cell, styles.data)
          }
        }
      }
    }
  }

  /**
   * Calculate appropriate column widths based on content
   */
  private calculateColumnWidths(worksheet: XLSX.WorkSheet): number[] {
    const widths: number[] = []
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

    for (let col = range.s.c; col <= range.e.c; col++) {
      let maxWidth = 10 // Minimum width

      for (let row = range.s.r; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = worksheet[cellAddress]

        if (cell && cell.v) {
          const cellValue = String(cell.v)
          const cellWidth = Math.min(cellValue.length, 50) // Cap at 50 characters
          maxWidth = Math.max(maxWidth, cellWidth)
        }
      }

      widths.push(maxWidth + 2) // Add padding
    }

    return widths
  }
}