'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { DateRange } from 'react-day-picker'
import { useRouter, useSearchParams } from 'next/navigation'

export interface FilterState {
  dateRange: DateRange | undefined
  quickSelect: string | null
  selectedRooms: string[]
  searchQuery: string
}

interface FilterValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface UseFilterStateOptions {
  debounceMs?: number
  validateOnChange?: boolean
  persistToUrl?: boolean
}

const initialState: FilterState = {
  dateRange: undefined,
  quickSelect: null,
  selectedRooms: [],
  searchQuery: ''
}

export function useFilterState(options: UseFilterStateOptions = {}) {
  const {
    debounceMs = 300,
    validateOnChange = true,
    persistToUrl = true
  } = options

  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize state from URL or use defaults
  const [filterState, setFilterState] = useState<FilterState>(() => {
    if (!persistToUrl) return initialState

    const urlState: FilterState = {
      dateRange: undefined,
      quickSelect: searchParams.get('quickSelect'),
      selectedRooms: searchParams.get('rooms')?.split(',').filter(Boolean) || [],
      searchQuery: searchParams.get('search') || ''
    }

    // Parse date range from URL
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    if (fromDate && toDate) {
      urlState.dateRange = {
        from: new Date(fromDate),
        to: new Date(toDate)
      }
    }

    return urlState
  })

  // Debounced search query for performance
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(filterState.searchQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(filterState.searchQuery)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [filterState.searchQuery, debounceMs])

  // Persist state to URL
  const updateUrl = useCallback((newState: FilterState) => {
    if (!persistToUrl) return

    const params = new URLSearchParams()

    if (newState.quickSelect) {
      params.set('quickSelect', newState.quickSelect)
    }

    if (newState.selectedRooms.length > 0) {
      params.set('rooms', newState.selectedRooms.join(','))
    }

    if (newState.searchQuery) {
      params.set('search', newState.searchQuery)
    }

    if (newState.dateRange?.from && newState.dateRange?.to) {
      params.set('from', newState.dateRange.from.toISOString())
      params.set('to', newState.dateRange.to.toISOString())
    }

    // Update URL without triggering navigation
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }, [persistToUrl])

  // Update state and URL
  const updateFilterState = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => {
      const newState = { ...prev, ...updates }
      updateUrl(newState)
      return newState
    })
  }, [updateUrl])

  // Filter validation
  const validateFilters = useCallback((state: FilterState): FilterValidation => {
    const errors: string[] = []
    const warnings: string[] = []

    // Date range validation
    if (state.dateRange?.from && state.dateRange?.to) {
      if (state.dateRange.from > state.dateRange.to) {
        errors.push('Start date must be before end date')
      }

      const daysDiff = Math.ceil(
        (state.dateRange.to.getTime() - state.dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff > 365) {
        warnings.push('Large date range may impact performance')
      }
    }

    // Room selection validation
    if (state.selectedRooms.length > 10) {
      warnings.push('Selecting many rooms may impact performance')
    }

    // Search query validation
    if (state.searchQuery.length > 100) {
      warnings.push('Very long search query may not be effective')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }, [])

  // Get validation for current state
  const validation = useMemo(() => {
    if (!validateOnChange) {
      return { isValid: true, errors: [], warnings: [] }
    }
    return validateFilters(filterState)
  }, [filterState, validateFilters, validateOnChange])

  // Quick filter handlers
  const setQuickSelect = useCallback((period: string | null) => {
    updateFilterState({
      quickSelect: period,
      dateRange: undefined // Clear custom date range when using quick select
    })
  }, [updateFilterState])

  const setDateRange = useCallback((range: DateRange | undefined) => {
    updateFilterState({
      dateRange: range,
      quickSelect: null // Clear quick select when using custom date range
    })
  }, [updateFilterState])

  const setSelectedRooms = useCallback((rooms: string[]) => {
    updateFilterState({ selectedRooms: rooms })
  }, [updateFilterState])

  const setSearchQuery = useCallback((query: string) => {
    updateFilterState({ searchQuery: query })
  }, [updateFilterState])

  // Bulk operations
  const clearAllFilters = useCallback(() => {
    setFilterState(initialState)
    if (persistToUrl) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [persistToUrl])

  const resetToDefaults = useCallback(() => {
    clearAllFilters()
  }, [clearAllFilters])

  // Filter combination helpers
  const hasActiveFilters = useMemo(() => {
    return !!(
      filterState.dateRange ||
      filterState.quickSelect ||
      filterState.selectedRooms.length > 0 ||
      filterState.searchQuery
    )
  }, [filterState])

  const getActiveFilterCount = useMemo(() => {
    let count = 0
    if (filterState.dateRange || filterState.quickSelect) count++
    if (filterState.selectedRooms.length > 0) count++
    if (filterState.searchQuery) count++
    return count
  }, [filterState])

  // Export filter state for debugging/analytics
  const exportFilterState = useCallback(() => {
    return {
      ...filterState,
      validation,
      hasActiveFilters,
      activeFilterCount: getActiveFilterCount,
      timestamp: new Date().toISOString()
    }
  }, [filterState, validation, hasActiveFilters, getActiveFilterCount])

  return {
    // State
    filterState,
    debouncedSearchQuery,
    validation,

    // Computed values
    hasActiveFilters,
    activeFilterCount: getActiveFilterCount,

    // Actions
    setQuickSelect,
    setDateRange,
    setSelectedRooms,
    setSearchQuery,
    updateFilterState,
    clearAllFilters,
    resetToDefaults,

    // Utilities
    validateFilters,
    exportFilterState
  }
}