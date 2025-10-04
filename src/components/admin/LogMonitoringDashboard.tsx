'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogLevel, LogCategory } from '@/lib/logger'
import { logAggregator } from '@/lib/logAggregator'
import { performanceMonitor } from '@/lib/performanceMonitor'

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
  duration?: number
}

export function LogMonitoringDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [performanceReport, setPerformanceReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<LogCategory | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [timeRange, setTimeRange] = useState('1h')

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [filterLevel, filterCategory, searchTerm, timeRange])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load logs based on filters
      const endTime = new Date()
      const startTime = new Date()

      switch (timeRange) {
        case '15m':
          startTime.setMinutes(endTime.getMinutes() - 15)
          break
        case '1h':
          startTime.setHours(endTime.getHours() - 1)
          break
        case '6h':
          startTime.setHours(endTime.getHours() - 6)
          break
        case '24h':
          startTime.setDate(endTime.getDate() - 1)
          break
        case '7d':
          startTime.setDate(endTime.getDate() - 7)
          break
      }

      // In a real implementation, you would fetch this from your logging service
      // For now, we'll use the aggregator
      const filteredLogs = logAggregator.getLogs({
        level: filterLevel === 'all' ? undefined : filterLevel,
        category: filterCategory === 'all' ? undefined : filterCategory,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        limit: 1000,
      }).filter(log => {
        if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false
        }
        return true
      })

      setLogs(filteredLogs.reverse()) // Most recent first

      // Load metrics
      const currentMetrics = logAggregator.getMetrics()
      setMetrics(currentMetrics)

      // Load performance report
      const report = performanceMonitor.generateReport(startTime.toISOString(), endTime.toISOString())
      setPerformanceReport(report)

    } catch (error) {
      console.error('Failed to load monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLevelBadgeVariant = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return 'destructive'
      case LogLevel.WARN:
        return 'secondary'
      case LogLevel.INFO:
        return 'default'
      case LogLevel.DEBUG:
        return 'outline'
      default:
        return 'default'
    }
  }

  const getLevelName = (level: LogLevel) => {
    return LogLevel[level] || 'UNKNOWN'
  }

  const getCategoryName = (category: LogCategory) => {
    return category.toString().toLowerCase().replace('_', ' ')
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `logs-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-center mt-2">Loading monitoring data...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Log Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Monitor application logs and performance metrics</p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          Export Logs
        </Button>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLogs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Last {timeRange}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(metrics.errorRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.errorCount} errors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceReport?.performance?.averageDuration ?
                  formatDuration(performanceReport.performance.averageDuration) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all operations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {performanceReport?.performance?.successRate ?
                  performanceReport.performance.successRate.toFixed(1) : '0'}%
              </div>
              <p className="text-xs text-muted-foreground">
                Operation success rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Top Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="timeRange">Time Range</Label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">Last 15 minutes</SelectItem>
                      <SelectItem value="1h">Last hour</SelectItem>
                      <SelectItem value="6h">Last 6 hours</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level">Log Level</Label>
                  <Select value={filterLevel.toString()} onValueChange={(value) => setFilterLevel(value as LogLevel | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value={LogLevel.DEBUG.toString()}>Debug</SelectItem>
                      <SelectItem value={LogLevel.INFO.toString()}>Info</SelectItem>
                      <SelectItem value={LogLevel.WARN.toString()}>Warning</SelectItem>
                      <SelectItem value={LogLevel.ERROR.toString()}>Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={filterCategory.toString()} onValueChange={(value) => setFilterCategory(value as LogCategory | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.values(LogCategory).map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace('_', ' ').toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs ({logs.length})</CardTitle>
              <CardDescription>
                Showing the most recent log entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No logs found</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getLevelBadgeVariant(log.level)}>
                            {getLevelName(log.level)}
                          </Badge>
                          <Badge variant="outline">
                            {getCategoryName(log.category)}
                          </Badge>
                          {log.duration && (
                            <Badge variant="outline">
                              {formatDuration(log.duration)}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm">{log.message}</p>

                      {log.context && Object.keys(log.context).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">Context</summary>
                          <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </details>
                      )}

                      {log.error && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-red-600">Error Details</summary>
                          <div className="mt-2 space-y-1">
                            <p><strong>Name:</strong> {log.error.name}</p>
                            <p><strong>Message:</strong> {log.error.message}</p>
                            {log.error.stack && (
                              <pre className="bg-red-50 p-2 rounded text-xs overflow-x-auto">
                                {log.error.stack}
                              </pre>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {performanceReport && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Total Operations</p>
                    <p className="text-2xl font-bold">{performanceReport.performance.totalOperations}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Average Duration</p>
                    <p className="text-2xl font-bold">{formatDuration(performanceReport.performance.averageDuration)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {performanceReport.performance.successRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Slowest Operation</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatDuration(performanceReport.performance.slowestOperation)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Total Queries</p>
                    <p className="text-2xl font-bold">{performanceReport.database.totalQueries}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Average Query Time</p>
                    <p className="text-2xl font-bold">{formatDuration(performanceReport.database.averageQueryTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Slow Queries</p>
                    <p className="text-2xl font-bold text-yellow-600">{performanceReport.database.slowQueries}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Failed Queries</p>
                    <p className="text-2xl font-bold text-red-600">{performanceReport.database.failedQueries}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {metrics?.topErrors && metrics.topErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Errors</CardTitle>
                <CardDescription>Most frequent error messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.topErrors.map((error: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{error.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Last seen: {new Date(error.lastSeen).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {error.count} occurrences
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}