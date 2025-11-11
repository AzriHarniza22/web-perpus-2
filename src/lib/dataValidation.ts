/**
 * Data Validation and Consistency Check Utilities
 * Ensures analytics data accuracy and identifies potential issues
 */

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  warnings: ValidationWarning[]
}

export interface ValidationIssue {
  type: 'error'
  code: string
  message: string
  field?: string
  value?: unknown
  context?: string
}

export interface ValidationWarning {
  type: 'warning'
  code: string
  message: string
  field?: string
  value?: unknown
  context?: string
}

/**
 * Validate utilization rates (should never exceed 100%)
 */
export function validateUtilizationRates(
  roomUtilizations: Array<{ roomId: string; roomName: string; utilization: number }>
): ValidationResult {
  const issues: ValidationIssue[] = []
  const warnings: ValidationWarning[] = []

  roomUtilizations.forEach(room => {
    if (room.utilization > 100) {
      issues.push({
        type: 'error',
        code: 'UTILIZATION_EXCEEDS_100',
        message: `Room "${room.roomName}" has utilization rate of ${room.utilization}%, which exceeds 100%`,
        field: 'utilizationRate',
        value: room.utilization,
        context: `Room ID: ${room.roomId}`
      })
    } else if (room.utilization > 90) {
      warnings.push({
        type: 'warning',
        code: 'UTILIZATION_HIGH',
        message: `Room "${room.roomName}" has high utilization rate of ${room.utilization}%`,
        field: 'utilizationRate',
        value: room.utilization
      })
    }
  })

  return { isValid: issues.length === 0, issues, warnings }
}

/**
 * Validate booking statistics consistency
 */
export function validateBookingStatistics(
  totalBookings: number,
  statusBreakdown: {
    approved: number
    pending: number
    rejected: number
    cancelled?: number
    completed?: number
  }
): ValidationResult {
  const issues: ValidationIssue[] = []
  const warnings: ValidationWarning[] = []

  const accountedBookings = Object.values(statusBreakdown).reduce((sum, count) => sum + (count || 0), 0)

  if (accountedBookings !== totalBookings) {
    const difference = totalBookings - accountedBookings
    issues.push({
      type: 'error',
      code: 'BOOKING_STATISTICS_MISMATCH',
      message: `Booking statistics mismatch: ${accountedBookings} accounted out of ${totalBookings} total (${difference} missing)`,
      context: `Status breakdown: ${JSON.stringify(statusBreakdown)}`
    })
  }

  if (accountedBookings > totalBookings) {
    issues.push({
      type: 'error',
      code: 'BOOKING_STATISTICS_OVERFLOW',
      message: `Booking statistics show ${accountedBookings} accounted but only ${totalBookings} total bookings`,
      context: `Status breakdown: ${JSON.stringify(statusBreakdown)}`
    })
  }

  return { isValid: issues.length === 0, issues, warnings }
}

/**
 * Validate user statistics calculations
 */
export function validateUserStatistics(
  totalUsers: number,
  userBookingData: Array<{ userId: string; bookingCount: number; approvedBookingCount: number }>
): ValidationResult {
  const issues: ValidationIssue[] = []
  const warnings: ValidationWarning[] = []

  if (userBookingData.length !== totalUsers) {
    warnings.push({
      type: 'warning',
      code: 'USER_COUNT_MISMATCH',
      message: `User count mismatch: ${userBookingData.length} users with booking data but ${totalUsers} total users reported`,
      value: { expected: totalUsers, actual: userBookingData.length }
    })
  }

  // Check for users with inconsistent booking counts
  userBookingData.forEach(user => {
    if (user.approvedBookingCount > user.bookingCount) {
      issues.push({
        type: 'error',
        code: 'USER_APPROVED_EXCEEDS_TOTAL',
        message: `User ${user.userId} has ${user.approvedBookingCount} approved bookings but only ${user.bookingCount} total bookings`,
        field: 'approvedBookingCount',
        value: user.approvedBookingCount,
        context: `Total bookings: ${user.bookingCount}`
      })
    }
  })

  // Calculate and validate average bookings
  const totalCalculatedBookings = userBookingData.reduce((sum, user) => sum + user.bookingCount, 0)
  const averageBookings = totalUsers > 0 ? totalCalculatedBookings / totalUsers : 0

  if (averageBookings > 50) {
    warnings.push({
      type: 'warning',
      code: 'HIGH_AVERAGE_BOOKINGS',
      message: `Unusually high average bookings per user: ${averageBookings.toFixed(1)}`,
      value: averageBookings
    })
  }

  return { isValid: issues.length === 0, issues, warnings }
}

/**
 * Validate data quality issues
 */
export function validateDataQuality(
  users: Array<{ full_name?: string; email?: string; institution?: string }>,
  bookings: Array<{ user_id: string; status: string; start_time?: string; end_time?: string }>
): ValidationResult {
  const issues: ValidationIssue[] = []
  const warnings: ValidationWarning[] = []

  // Check for malformed user names
  users.forEach(user => {
    if (user.full_name) {
      // Check for duplicate words
      const words = user.full_name.split(' ').filter(w => w.trim())
      const uniqueWords = new Set(words.map(w => w.toLowerCase()))
      
      if (words.length !== uniqueWords.size) {
        warnings.push({
          type: 'warning',
          code: 'DUPLICATE_WORDS_IN_NAME',
          message: `User name "${user.full_name}" appears to have duplicate words`,
          field: 'full_name',
          value: user.full_name
        })
      }

      // Check for extremely short names
      if (user.full_name.trim().length < 2) {
        issues.push({
          type: 'error',
          code: 'NAME_TOO_SHORT',
          message: `User name "${user.full_name}" is too short`,
          field: 'full_name',
          value: user.full_name
        })
      }
    }
  })

  // Check for truncated institution names
  users.forEach(user => {
    if (user.institution) {
      const invalidInstitutions = ['usk', 'qweqew', 'qweqewqwe', 'test', 'unknown']
      if (invalidInstitutions.includes(user.institution.toLowerCase())) {
        warnings.push({
          type: 'warning',
          code: 'TRUNCATED_INSTITUTION_NAME',
          message: `Institution name "${user.institution}" appears to be truncated or test data`,
          field: 'institution',
          value: user.institution
        })
      }
    }
  })

  // Check for invalid booking times
  bookings.forEach(booking => {
    if (booking.start_time && booking.end_time) {
      const startTime = new Date(booking.start_time)
      const endTime = new Date(booking.end_time)
      
      if (endTime <= startTime) {
        issues.push({
          type: 'error',
          code: 'INVALID_BOOKING_DURATION',
          message: `Booking has end time before or equal to start time`,
          field: 'end_time',
          value: booking.end_time,
          context: `Start: ${booking.start_time}, End: ${booking.end_time}`
        })
      }
    }
  })

  // Check for future booking times (relative to current time)
  const now = new Date()
  bookings.forEach(booking => {
    if (booking.start_time) {
      const startTime = new Date(booking.start_time)
      if (startTime > now) {
        warnings.push({
          type: 'warning',
          code: 'FUTURE_BOOKING_TIME',
          message: `Booking has start time in the future: ${booking.start_time}`,
          field: 'start_time',
          value: booking.start_time
        })
      }
    }
  })

  return { isValid: issues.length === 0, issues, warnings }
}

/**
 * Validate heatmap data integrity
 */
export function validateHeatmapData(
  heatmapData: Array<{ hour: number; day: string; count: number; intensity?: number }>
): ValidationResult {
  const issues: ValidationIssue[] = []
  const warnings: ValidationWarning[] = []

  if (!heatmapData || heatmapData.length === 0) {
    issues.push({
      type: 'error',
      code: 'EMPTY_HEATMAP_DATA',
      message: 'Heatmap data is empty or null'
    })
    return { isValid: false, issues, warnings }
  }

  // Check for all-zero heatmap
  const totalBookings = heatmapData.reduce((sum, cell) => sum + cell.count, 0)
  if (totalBookings === 0) {
    warnings.push({
      type: 'warning',
      code: 'ALL_ZERO_HEATMAP',
      message: 'Heatmap shows all zero values - this may indicate no data or filtering issues'
    })
  }

  // Validate intensity calculations
  const maxCount = Math.max(...heatmapData.map(d => d.count), 0)
  heatmapData.forEach(cell => {
    if (cell.intensity !== undefined) {
      const expectedIntensity = maxCount > 0 ? Math.round((cell.count / maxCount) * 100) : 0
      if (cell.intensity !== expectedIntensity) {
        warnings.push({
          type: 'warning',
          code: 'INTENSITY_MISMATCH',
          message: `Cell intensity mismatch: expected ${expectedIntensity}, got ${cell.intensity}`,
          context: `Cell: ${cell.day} ${cell.hour}:00, Count: ${cell.count}`
        })
      }
    }
  })

  return { isValid: issues.length === 0, issues, warnings }
}

/**
 * Comprehensive validation of all analytics data
 */
export function comprehensiveDataValidation(
  data: {
    rooms: Array<{ id: string; name: string; capacity: number; utilization: number }>
    bookings: Array<{ id: string; status: string; user_id: string }>
    users: Array<{ id: string; full_name?: string; email?: string; institution?: string }>
    heatmapData?: Array<{ hour: number; day: string; count: number; intensity?: number }>
  }
): ValidationResult {
  const allIssues: ValidationIssue[] = []
  const allWarnings: ValidationWarning[] = []

  // Validate room utilizations
  const roomValidation = validateUtilizationRates(
    data.rooms.map(room => ({
      roomId: room.id,
      roomName: room.name,
      utilization: room.utilization
    }))
  )
  allIssues.push(...roomValidation.issues)
  allWarnings.push(...roomValidation.warnings)

  // Validate booking statistics
  const statusBreakdown = data.bookings.reduce((acc, booking) => {
    switch (booking.status) {
      case 'approved':
        acc.approved += 1
        break
      case 'pending':
        acc.pending += 1
        break
      case 'rejected':
        acc.rejected += 1
        break
      case 'cancelled':
        acc.cancelled = (acc.cancelled || 0) + 1
        break
      case 'completed':
        acc.completed = (acc.completed || 0) + 1
        break
    }
    return acc
  }, {
    approved: 0,
    pending: 0,
    rejected: 0,
    cancelled: 0,
    completed: 0
  })

  const bookingValidation = validateBookingStatistics(data.bookings.length, statusBreakdown)
  allIssues.push(...bookingValidation.issues)
  allWarnings.push(...bookingValidation.warnings)

  // Validate user statistics
  const userBookingData = data.users.map(user => {
    const userBookings = data.bookings.filter(b => b.user_id === user.id)
    return {
      userId: user.id,
      bookingCount: userBookings.length,
      approvedBookingCount: userBookings.filter(b => b.status === 'approved' || b.status === 'completed').length
    }
  })

  const userValidation = validateUserStatistics(data.users.length, userBookingData)
  allIssues.push(...userValidation.issues)
  allWarnings.push(...userValidation.warnings)

  // Validate data quality
  const qualityValidation = validateDataQuality(data.users, data.bookings)
  allIssues.push(...qualityValidation.issues)
  allWarnings.push(...qualityValidation.warnings)

  // Validate heatmap data if provided
  if (data.heatmapData) {
    const heatmapValidation = validateHeatmapData(data.heatmapData)
    allIssues.push(...heatmapValidation.issues)
    allWarnings.push(...heatmapValidation.warnings)
  }

  return {
    isValid: allIssues.length === 0,
    issues: allIssues,
    warnings: allWarnings
  }
}

/**
 * Generate validation report summary
 */
export function generateValidationReport(validation: ValidationResult): string {
  const { isValid, issues, warnings } = validation
  
  let report = `Data Validation Report\n`
  report += `=====================\n\n`
  report += `Status: ${isValid ? 'VALID' : 'INVALID'}\n`
  report += `Issues: ${issues.length}\n`
  report += `Warnings: ${warnings.length}\n\n`

  if (issues.length > 0) {
    report += `CRITICAL ISSUES:\n`
    issues.forEach((issue, index) => {
      report += `${index + 1}. [${issue.code}] ${issue.message}\n`
      if (issue.context) report += `   Context: ${issue.context}\n`
    })
    report += `\n`
  }

  if (warnings.length > 0) {
    report += `WARNINGS:\n`
    warnings.forEach((warning, index) => {
      report += `${index + 1}. [${warning.code}] ${warning.message}\n`
      if (warning.context) report += `   Context: ${warning.context}\n`
    })
  }

  return report
}