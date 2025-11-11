/**
 * Test file to verify data accuracy fixes
 * This file can be run independently to test the implemented fixes
 */

import { comprehensiveDataValidation, generateValidationReport } from './dataValidation'

// Test data for validation
const mockBookings = [
  { id: '1', status: 'approved', user_id: 'user1', start_time: '2025-11-06T10:00:00Z' },
  { id: '2', status: 'pending', user_id: 'user2', start_time: '2025-11-06T11:00:00Z' },
  { id: '3', status: 'approved', user_id: 'user1', start_time: '2025-11-06T12:00:00Z' },
  { id: '4', status: 'completed', user_id: 'user3', start_time: '2025-11-06T13:00:00Z' }
]

const mockRooms = [
  { id: 'room1', name: 'Study Room A', capacity: 10, utilization: 150 }, // Should trigger validation error
  { id: 'room2', name: 'Conference Room', capacity: 20, utilization: 85 } // Valid
]

const mockUsers = [
  {
    id: 'user1',
    full_name: 'azri azri harniza35@gmail.com',
    email: 'test@example.com',
    institution: 'usk'
  },
  {
    id: 'user2',
    full_name: 'john doe',
    email: 'john@example.com',
    institution: 'Unknown University'
  }
]

/**
 * Clean user names by removing duplicates and formatting issues
 */
function cleanUserName(name: string): string {
  if (!name) return 'Unknown'
  
  // Remove duplicate words (e.g., "azri azri" -> "azri")
  const words = name.split(' ').filter(word => word.trim())
  const uniqueWords = []
  const seen = new Set()
  
  for (const word of words) {
    const lowerWord = word.toLowerCase()
    if (!seen.has(lowerWord)) {
      seen.add(lowerWord)
      uniqueWords.push(word)
    }
  }
  
  return uniqueWords.join(' ').trim() || 'Unknown'
}

/**
 * Clean institution names by removing truncation and fixing formatting
 */
function cleanInstitutionName(institution: string): string {
  if (!institution) return 'Unknown'
  
  // Common replacements for truncated names
  const replacements: Record<string, string> = {
    'usk': 'Universitas Syiah Kuala',
    'qweqew': 'Unknown Institution',
    'qweqewqwe': 'Unknown Institution',
  }
  
  const cleaned = replacements[institution] || institution
  
  // Capitalize first letter of each word
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim() || 'Unknown'
}

export function testDataAccuracyFixes(): void {
  console.log('=== Testing Data Accuracy Fixes ===\n')

  // Test 1: User Name Cleaning
  console.log('1. Testing User Name Cleaning:')
  const testNames = [
    'azri azri harniza35@gmail.com',
    'john john doe',
    'normal name',
    '',
    '   extra   spaces   '
  ]

  testNames.forEach(name => {
    const cleaned = cleanUserName(name)
    console.log(`  "${name}" -> "${cleaned}"`)
  })

  // Test 2: Institution Name Cleaning
  console.log('\n2. Testing Institution Name Cleaning:')
  const testInstitutions = [
    'usk',
    'qweqew',
    'normal university',
    'QWEQEWQWE',
    'unknown'
  ]

  testInstitutions.forEach(inst => {
    const cleaned = cleanInstitutionName(inst)
    console.log(`  "${inst}" -> "${cleaned}"`)
  })

  // Test 3: Data Validation
  console.log('\n3. Testing Data Validation:')
  const heatmapData = [
    { hour: 9, day: 'Monday', count: 2, intensity: 50 },
    { hour: 10, day: 'Monday', count: 4, intensity: 100 },
    { hour: 11, day: 'Monday', count: 1, intensity: 25 }
  ]

  const validationResult = comprehensiveDataValidation({
    rooms: mockRooms,
    bookings: mockBookings,
    users: mockUsers,
    heatmapData
  })

  const report = generateValidationReport(validationResult)
  console.log('  Validation Report:')
  console.log(report)

  // Test 4: Utilization Rate Calculations
  console.log('4. Testing Utilization Rate Calculations:')
  const testCases = [
    { bookings: 15, capacity: 10 }, // Should be capped at 100%
    { bookings: 5, capacity: 20 },  // Should be 25%
    { bookings: 25, capacity: 30 }  // Should be 83%
  ]

  testCases.forEach(({ bookings, capacity }) => {
    const rawUtilization = (bookings / capacity) * 100
    const cappedUtilization = Math.min(Math.round(rawUtilization), 100)
    console.log(`  Bookings: ${bookings}, Capacity: ${capacity} -> ${cappedUtilization}%`)
  })

  console.log('\n=== Test Complete ===')
}