import { RegistrationData, ValidationError } from './types'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone validation regex (Indonesian format)
const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,11}$/

// Password validation (minimum 6 characters)
const PASSWORD_MIN_LENGTH = 6

export function validateRegistrationData(data: RegistrationData): ValidationError[] {
  const errors: ValidationError[] = []

  // Email validation - optimized regex test
  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' })
  }

  // Password validation - simple length check
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' })
  } else if (data.password.length < PASSWORD_MIN_LENGTH) {
    errors.push({ field: 'password', message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` })
  }

  // Full name validation - optimized string check
  const trimmedName = data.fullName?.trim()
  if (!trimmedName) {
    errors.push({ field: 'fullName', message: 'Full name is required' })
  } else if (trimmedName.length < 2) {
    errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters' })
  }

  // Institution validation (optional) - only if provided
  if (data.institution?.trim() && data.institution.trim().length < 2) {
    errors.push({ field: 'institution', message: 'Institution name must be at least 2 characters' })
  }

  // Phone validation (optional) - only if provided
  if (data.phone?.trim() && !PHONE_REGEX.test(data.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid Indonesian phone number' })
  }

  return errors
}

export function sanitizeRegistrationData(data: RegistrationData): RegistrationData {
  return {
    email: data.email.toLowerCase().trim(),
    password: data.password,
    fullName: data.fullName.trim(),
    institution: data.institution?.trim() || '',
    phone: data.phone?.trim() || ''
  }
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone)
}

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH
}