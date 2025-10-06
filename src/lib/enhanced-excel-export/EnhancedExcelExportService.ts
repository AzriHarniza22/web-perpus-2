import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Booking, Room, Tour, User } from '@/lib/types'
import { ChartDataExtractor } from './ChartDataExtractor'
import { StatisticalCalculator } from './StatisticalCalculator'
import { MetadataGenerator } from './MetadataGenerator'
import { ExcelSheetGenerator } from './ExcelSheetGenerator'

export interface EnhancedExportData {
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
  chartData?: {
    [chartKey: string]: {
      title: string
      data: any
      type: string
      viewMode?: string
    }
  }
}

export interface EnhancedExportOptions {
  includeCharts?: boolean
  includeRawData?: boolean
  includeStatisticalSummaries?: boolean
  includeTrendAnalysis?: boolean
  dateFormat?: string
  fileName?: string
  includeMetadata?: boolean
  performanceOptimizations?: boolean
}

export class EnhancedExcelExportService {
  private chartDataExtractor: ChartDataExtractor
  private statisticalCalculator: StatisticalCalculator
  private metadataGenerator: MetadataGenerator
  private excelSheetGenerator: ExcelSheetGenerator

  constructor() {
    this.chartDataExtractor = new ChartDataExtractor()
    this.statisticalCalculator = new StatisticalCalculator()
    this.metadataGenerator = new MetadataGenerator()
    this.excelSheetGenerator = new ExcelSheetGenerator()
  }

  /**
   * Main export orchestration method
   */
  async exportToExcel(
    data: EnhancedExportData,
    options: EnhancedExportOptions = {}
  ): Promise<void> {
    const {
      includeCharts = true,
      includeRawData = true,
      includeStatisticalSummaries = true,
      includeTrendAnalysis = true,
      performanceOptimizations = true
    } = options

    try {
      // Generate comprehensive metadata
      const metadata = this.metadataGenerator.generateMetadata(data, options)

      // Extract chart data if requested
      let extractedChartData: { [key: string]: any } = {}
      if (includeCharts && data.chartData) {
        extractedChartData = await this.chartDataExtractor.extractChartData(data.chartData)
      }

      // Calculate statistical summaries if requested
      let statisticalSummaries: any = {}
      if (includeStatisticalSummaries) {
        statisticalSummaries = this.statisticalCalculator.calculateSummaries(data)
      }

      // Calculate trend analysis if requested
      let trendAnalysis: any = {}
      if (includeTrendAnalysis) {
        trendAnalysis = this.statisticalCalculator.calculateTrendAnalysis(data)
      }

      // Create workbook with performance optimizations
      const workbook = performanceOptimizations
        ? this.createOptimizedWorkbook()
        : XLSX.utils.book_new()

      // Generate all sheets
      await this.excelSheetGenerator.generateAllSheets({
        workbook,
        data,
        metadata,
        extractedChartData,
        statisticalSummaries,
        trendAnalysis,
        options: {
          includeCharts,
          includeRawData,
          includeStatisticalSummaries,
          includeTrendAnalysis
        }
      })

      // Generate filename
      const fileName = options.fileName || this.generateFileName(data, options)

      // Save file
      XLSX.writeFile(workbook, fileName)

    } catch (error) {
      console.error('Enhanced Excel export failed:', error)
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate optimized workbook for better performance
   */
  private createOptimizedWorkbook(): XLSX.WorkBook {
    return XLSX.utils.book_new()
  }

  /**
   * Generate filename with enhanced context
   */
  private generateFileName(
    data: EnhancedExportData,
    options: EnhancedExportOptions
  ): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
    const tabName = data.currentTab.charAt(0).toUpperCase() + data.currentTab.slice(1)
    let filterInfo = ''

    if (data.filters.dateRange) {
      const fromDate = format(data.filters.dateRange.from, 'yyyy-MM-dd')
      const toDate = format(data.filters.dateRange.to, 'yyyy-MM-dd')
      filterInfo = `_${fromDate}_to_${toDate}`
    }

    if (data.filters.selectedRooms && data.filters.selectedRooms.length > 0) {
      filterInfo += `_${data.filters.selectedRooms.length}rooms`
    }

    const features = []
    if (options.includeCharts) features.push('charts')
    if (options.includeStatisticalSummaries) features.push('stats')
    if (options.includeTrendAnalysis) features.push('trends')

    const featuresStr = features.length > 0 ? `_enhanced_${features.join('_')}` : ''

    return `analytics_${tabName}${filterInfo}${featuresStr}_${timestamp}.xlsx`
  }

  /**
   * Validate export data before processing
   */
  validateExportData(data: EnhancedExportData): boolean {
    if (!data.bookings || !Array.isArray(data.bookings)) {
      throw new Error('Invalid bookings data')
    }
    if (!data.rooms || !Array.isArray(data.rooms)) {
      throw new Error('Invalid rooms data')
    }
    if (!data.users || !Array.isArray(data.users)) {
      throw new Error('Invalid users data')
    }
    if (!['general', 'room', 'tour', 'user'].includes(data.currentTab)) {
      throw new Error('Invalid current tab')
    }
    return true
  }

  /**
   * Get export progress callback for large datasets
   */
  onProgress?: (progress: number, status: string) => void

  setProgressCallback(callback: (progress: number, status: string) => void) {
    this.onProgress = callback
  }
}