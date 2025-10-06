import { ChartData } from 'chart.js'

export interface ExtractedChartData {
  [chartKey: string]: {
    title: string
    type: string
    viewMode?: string
    data: {
      labels: string[]
      datasets: Array<{
        label: string
        data: (number | null)[]
        backgroundColor?: string | string[]
        borderColor?: string | string[]
        fill?: boolean
      }>
    }
    summary: {
      totalDataPoints: number
      dataPointCount: number
      averageValue: number
      maxValue: number
      minValue: number
      trends?: Array<{
        label: string
        direction: 'up' | 'down' | 'stable'
        percentage: number
      }>
    }
    rawData?: any[][]
  }
}

export class ChartDataExtractor {
  /**
   * Extract data from chart data objects
   */
  async extractChartData(chartDataMap: {
    [chartKey: string]: {
      title: string
      data: any
      type: string
      viewMode?: string
    }
  }): Promise<ExtractedChartData> {
    const extractedData: ExtractedChartData = {}

    for (const [chartKey, chartInfo] of Object.entries(chartDataMap)) {
      try {
        extractedData[chartKey] = await this.extractSingleChartData(chartKey, chartInfo)
      } catch (error) {
        console.warn(`Failed to extract data for chart ${chartKey}:`, error)
        // Continue with other charts even if one fails
      }
    }

    return extractedData
  }

  /**
   * Extract data from a single chart
   */
  private async extractSingleChartData(
    chartKey: string,
    chartInfo: {
      title: string
      data: any
      type: string
      viewMode?: string
    }
  ): Promise<ExtractedChartData[string]> {
    const { title, data, type, viewMode } = chartInfo

    // Normalize chart data structure
    const normalizedData = this.normalizeChartData(data)

    // Calculate summary statistics
    const summary = this.calculateChartSummary(normalizedData)

    // Extract raw data for Excel export
    const rawData = this.extractRawDataForExcel(normalizedData)

    return {
      title,
      type,
      viewMode,
      data: normalizedData,
      summary,
      rawData
    }
  }

  /**
   * Normalize different chart data formats to a consistent structure
   */
  private normalizeChartData(data: any): {
    labels: string[]
    datasets: Array<{
      label: string
      data: (number | null)[]
      backgroundColor?: string | string[]
      borderColor?: string | string[]
      fill?: boolean
    }>
  } {
    // Handle Chart.js data format
    if (data.labels && data.datasets) {
      return {
        labels: Array.isArray(data.labels) ? data.labels.map(String) : [],
        datasets: data.datasets.map((dataset: any) => ({
          label: dataset.label || 'Unnamed Dataset',
          data: Array.isArray(dataset.data) ? dataset.data.map((val: any) =>
            val === null || val === undefined ? null : Number(val)
          ) : [],
          backgroundColor: dataset.backgroundColor,
          borderColor: dataset.borderColor,
          fill: dataset.fill
        }))
      }
    }

    // Handle array data format
    if (Array.isArray(data)) {
      return {
        labels: data.map((_, index) => `Data ${index + 1}`),
        datasets: [{
          label: 'Data Series',
          data: data.map((val: any) => val === null || val === undefined ? null : Number(val))
        }]
      }
    }

    // Handle object data format
    if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data)
      return {
        labels: entries.map(([key]) => String(key)),
        datasets: [{
          label: 'Data Series',
          data: entries.map(([, value]) => value === null || value === undefined ? null : Number(value))
        }]
      }
    }

    // Fallback for unknown format
    return {
      labels: [],
      datasets: []
    }
  }

  /**
   * Calculate summary statistics for the chart data
   */
  private calculateChartSummary(data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: (number | null)[]
    }>
  }): ExtractedChartData[string]['summary'] {
    const allValues: number[] = []

    // Collect all numeric values from datasets
    data.datasets.forEach(dataset => {
      dataset.data.forEach(value => {
        if (typeof value === 'number' && !isNaN(value)) {
          allValues.push(value)
        }
      })
    })

    if (allValues.length === 0) {
      return {
        totalDataPoints: 0,
        dataPointCount: 0,
        averageValue: 0,
        maxValue: 0,
        minValue: 0
      }
    }

    const sum = allValues.reduce((acc, val) => acc + val, 0)
    const average = sum / allValues.length
    const max = Math.max(...allValues)
    const min = Math.min(...allValues)

    // Calculate trends (simplified)
    const trends = this.calculateTrends(data)

    return {
      totalDataPoints: data.labels.length,
      dataPointCount: allValues.length,
      averageValue: Math.round(average * 100) / 100,
      maxValue: max,
      minValue: min,
      trends
    }
  }

  /**
   * Calculate trend information for the chart
   */
  private calculateTrends(data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: (number | null)[]
    }>
  }): Array<{
    label: string
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }> {
    const trends: Array<{
      label: string
      direction: 'up' | 'down' | 'stable'
      percentage: number
    }> = []

    data.datasets.forEach(dataset => {
      const numericValues = dataset.data.filter((val): val is number =>
        typeof val === 'number' && !isNaN(val)
      )

      if (numericValues.length >= 2) {
        const firstValue = numericValues[0]
        const lastValue = numericValues[numericValues.length - 1]
        const change = lastValue - firstValue
        const percentage = firstValue !== 0 ? (change / firstValue) * 100 : 0

        let direction: 'up' | 'down' | 'stable' = 'stable'
        if (Math.abs(percentage) > 1) {
          direction = percentage > 0 ? 'up' : 'down'
        }

        trends.push({
          label: dataset.label,
          direction,
          percentage: Math.round(Math.abs(percentage) * 100) / 100
        })
      }
    })

    return trends
  }

  /**
   * Extract raw data in a format suitable for Excel export
   */
  private extractRawDataForExcel(data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: (number | null)[]
      backgroundColor?: string | string[]
      borderColor?: string | string[]
    }>
  }): any[][] {
    const rawData: any[][] = []

    // Header row
    const headers = ['Label', ...data.datasets.map(dataset => dataset.label)]
    rawData.push(headers)

    // Data rows
    data.labels.forEach((label, index) => {
      const row: string[] = [label]
      data.datasets.forEach(dataset => {
        const value = dataset.data[index]
        row.push(value !== null ? String(value) : 'N/A')
      })
      rawData.push(row)
    })

    return rawData
  }

  /**
   * Extract chart data from React chart components (if accessible)
   */
  async extractFromChartComponents(chartRefs: {
    [key: string]: React.RefObject<any>
  }): Promise<ExtractedChartData> {
    const extractedData: ExtractedChartData = {}

    for (const [chartKey, ref] of Object.entries(chartRefs)) {
      try {
        if (ref.current && ref.current.chartInstance) {
          const chart = ref.current.chartInstance
          extractedData[chartKey] = await this.extractFromChartJSInstance(chart)
        }
      } catch (error) {
        console.warn(`Failed to extract from chart component ${chartKey}:`, error)
      }
    }

    return extractedData
  }

  /**
   * Extract data from Chart.js instance
   */
  private async extractFromChartJSInstance(chart: any): Promise<ExtractedChartData[string]> {
    const data = chart.data
    const options = chart.options

    return {
      title: options?.plugins?.title?.text || 'Chart',
      type: chart.config?.type || 'line',
      data: this.normalizeChartData(data),
      summary: this.calculateChartSummary(this.normalizeChartData(data)),
      rawData: this.extractRawDataForExcel(this.normalizeChartData(data))
    }
  }
}