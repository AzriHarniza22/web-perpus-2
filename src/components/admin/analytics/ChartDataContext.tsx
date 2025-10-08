'use client'

import React, { createContext, useContext, useCallback, useState } from 'react'

export interface ChartDataInfo {
  title: string
  data: any
  type: string
  viewMode?: string
}

interface ChartDataContextType {
  chartDataMap: { [chartKey: string]: ChartDataInfo }
  registerChartData: (chartKey: string, chartInfo: ChartDataInfo) => void
  clearChartData: () => void
  getChartData: () => { [chartKey: string]: ChartDataInfo }
}

const ChartDataContext = createContext<ChartDataContextType | undefined>(undefined)

export function ChartDataProvider({ children }: { children: React.ReactNode }) {
  const [chartDataMap, setChartDataMap] = useState<{ [chartKey: string]: ChartDataInfo }>({})

  const registerChartData = useCallback((chartKey: string, chartInfo: ChartDataInfo) => {
    setChartDataMap(prev => ({
      ...prev,
      [chartKey]: chartInfo
    }))
  }, [])

  const clearChartData = useCallback(() => {
    setChartDataMap({})
  }, [])

  const getChartData = useCallback(() => {
    return chartDataMap
  }, [chartDataMap])

  return (
    <ChartDataContext.Provider value={{
      chartDataMap,
      registerChartData,
      clearChartData,
      getChartData
    }}>
      {children}
    </ChartDataContext.Provider>
  )
}

export function useChartData() {
  const context = useContext(ChartDataContext)
  if (context === undefined) {
    throw new Error('useChartData must be used within a ChartDataProvider')
  }
  return context
}