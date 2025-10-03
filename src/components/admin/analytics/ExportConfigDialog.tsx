'use client'

import { useState } from 'react'
import { Settings, Calendar, FileText, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export interface ExportConfig {
  includeCharts: boolean
  includeRawData: boolean
  includeMetadata: boolean
  dateFormat: 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'MM/dd/yyyy'
  fileNameTemplate: string
  selectedDataTypes: {
    bookings: boolean
    rooms: boolean
    users: boolean
    tours: boolean
  }
  chartTypes: {
    overviewCards: boolean
    monthlyTrends: boolean
    dailyDistribution: boolean
    peakHours: boolean
    heatmaps: boolean
    guestDistribution: boolean
    timeAnalysis: boolean
  }
}

interface ExportConfigDialogProps {
  currentTab: 'general' | 'room' | 'tour' | 'user'
  filters: {
    dateRange?: { from: Date; to: Date }
    selectedRooms?: string[]
    quickSelect?: string
  }
  onConfigChange: (config: ExportConfig) => void
  trigger?: React.ReactNode
}

const defaultConfig: ExportConfig = {
  includeCharts: true,
  includeRawData: true,
  includeMetadata: true,
  dateFormat: 'dd/MM/yyyy',
  fileNameTemplate: 'analytics_{tab}_{date}_{time}',
  selectedDataTypes: {
    bookings: true,
    rooms: true,
    users: true,
    tours: false
  },
  chartTypes: {
    overviewCards: true,
    monthlyTrends: true,
    dailyDistribution: true,
    peakHours: true,
    heatmaps: true,
    guestDistribution: true,
    timeAnalysis: true
  }
}

export function ExportConfigDialog({
  currentTab,
  filters,
  onConfigChange,
  trigger
}: ExportConfigDialogProps) {
  const [config, setConfig] = useState<ExportConfig>(defaultConfig)
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    onConfigChange(config)
    setIsOpen(false)
  }

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const updateDataTypes = (dataType: keyof ExportConfig['selectedDataTypes'], checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      selectedDataTypes: {
        ...prev.selectedDataTypes,
        [dataType]: checked
      }
    }))
  }

  const updateChartTypes = (chartType: keyof ExportConfig['chartTypes'], checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      chartTypes: {
        ...prev.chartTypes,
        [chartType]: checked
      }
    }))
  }

  const getTabSpecificDataTypes = () => {
    switch (currentTab) {
      case 'general':
        return [
          { key: 'bookings', label: 'Data Booking' },
          { key: 'rooms', label: 'Data Ruangan' },
          { key: 'users', label: 'Data Pengguna' }
        ]
      case 'room':
        return [
          { key: 'bookings', label: 'Data Booking Ruangan' },
          { key: 'rooms', label: 'Data Ruangan' }
        ]
      case 'tour':
        return [
          { key: 'bookings', label: 'Data Booking Tour' },
          { key: 'tours', label: 'Data Tour' }
        ]
      case 'user':
        return [
          { key: 'users', label: 'Data Pengguna' },
          { key: 'bookings', label: 'Data Booking Pengguna' }
        ]
      default:
        return []
    }
  }

  const getTabSpecificCharts = () => {
    switch (currentTab) {
      case 'general':
        return [
          { key: 'overviewCards', label: 'Kartu Ringkasan' },
          { key: 'monthlyTrends', label: 'Trend Bulanan' },
          { key: 'dailyDistribution', label: 'Distribusi Harian' },
          { key: 'peakHours', label: 'Jam Sibuk' },
          { key: 'heatmaps', label: 'Heatmap Reservasi' }
        ]
      case 'room':
        return [
          { key: 'overviewCards', label: 'Kartu Ringkasan Ruangan' },
          { key: 'monthlyTrends', label: 'Trend Bulanan Ruangan' },
          { key: 'guestDistribution', label: 'Distribusi Tamu' },
          { key: 'heatmaps', label: 'Heatmap Waktu Ruangan' },
          { key: 'timeAnalysis', label: 'Analisis Waktu' }
        ]
      case 'tour':
        return [
          { key: 'overviewCards', label: 'Kartu Ringkasan Tour' },
          { key: 'monthlyTrends', label: 'Trend Bulanan Tour' },
          { key: 'guestDistribution', label: 'Distribusi Peserta' },
          { key: 'timeAnalysis', label: 'Analisis Waktu Tour' }
        ]
      case 'user':
        return [
          { key: 'overviewCards', label: 'Kartu Ringkasan Pengguna' },
          { key: 'monthlyTrends', label: 'Trend Registrasi' },
          { key: 'dailyDistribution', label: 'Distribusi Booking' }
        ]
      default:
        return []
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Konfigurasi Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Konfigurasi Export Data</DialogTitle>
          <DialogDescription>
            Sesuaikan pengaturan export untuk tab {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Filter Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Filter Saat Ini
            </h4>
            <div className="flex flex-wrap gap-2">
              {filters.dateRange && (
                <Badge variant="secondary">
                  {format(filters.dateRange.from, 'dd/MM/yyyy', { locale: id })} - {format(filters.dateRange.to, 'dd/MM/yyyy', { locale: id })}
                </Badge>
              )}
              {filters.selectedRooms && filters.selectedRooms.length > 0 && (
                <Badge variant="secondary">
                  {filters.selectedRooms.length} Ruangan Dipilih
                </Badge>
              )}
              {filters.quickSelect && (
                <Badge variant="secondary">
                  Filter: {filters.quickSelect}
                </Badge>
              )}
            </div>
          </div>

          {/* General Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Pengaturan Umum</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-metadata">Include Metadata</Label>
                <Switch
                  id="include-metadata"
                  checked={config.includeMetadata}
                  onCheckedChange={(checked: boolean) => updateConfig({ includeMetadata: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-raw-data">Include Raw Data</Label>
                <Switch
                  id="include-raw-data"
                  checked={config.includeRawData}
                  onCheckedChange={(checked: boolean) => updateConfig({ includeRawData: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-charts">Include Charts</Label>
                <Switch
                  id="include-charts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked: boolean) => updateConfig({ includeCharts: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-format">Format Tanggal</Label>
              <Select
                value={config.dateFormat}
                onValueChange={(value: ExportConfig['dateFormat']) => updateConfig({ dateFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">DD/MM/YYYY (Indonesia)</SelectItem>
                  <SelectItem value="yyyy-MM-dd">YYYY-MM-DD (ISO)</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/DD/YYYY (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Data Types Selection */}
          <div className="space-y-4">
            <h4 className="font-medium">Tipe Data yang Akan Diexport</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getTabSpecificDataTypes().map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`data-${key}`}
                    checked={config.selectedDataTypes[key as keyof ExportConfig['selectedDataTypes']]}
                    onCheckedChange={(checked: boolean) => updateDataTypes(key as keyof ExportConfig['selectedDataTypes'], checked)}
                  />
                  <Label htmlFor={`data-${key}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Chart Types Selection */}
          {config.includeCharts && (
            <div className="space-y-4">
              <h4 className="font-medium">Tipe Chart yang Akan Diexport</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getTabSpecificCharts().map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`chart-${key}`}
                      checked={config.chartTypes[key as keyof ExportConfig['chartTypes']]}
                      onCheckedChange={(checked: boolean) => updateChartTypes(key as keyof ExportConfig['chartTypes'], checked)}
                    />
                    <Label htmlFor={`chart-${key}`} className="text-sm">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Name Template */}
          <div className="space-y-2">
            <Label htmlFor="filename-template">Template Nama File</Label>
            <Select
              value={config.fileNameTemplate}
              onValueChange={(value) => updateConfig({ fileNameTemplate: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="analytics_{tab}_{date}_{time}">analytics_tab_tanggal_waktu</SelectItem>
                <SelectItem value="laporan_{tab}_{date}">laporan_tab_tanggal</SelectItem>
                <SelectItem value="{tab}_export_{timestamp}">tab_export_timestamp</SelectItem>
                <SelectItem value="custom">Custom Template</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSave}>
            Simpan Konfigurasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}