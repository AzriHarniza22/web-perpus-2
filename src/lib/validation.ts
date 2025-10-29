import { RegistrationData, LoginData, ValidationError } from './types'

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

  // Confirm password validation
  if (!data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Please confirm your password' })
  } else if (data.password !== data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' })
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

export function validateLoginData(data: LoginData): ValidationError[] {
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
  }

  return errors
}

export function sanitizeRegistrationData(data: RegistrationData): RegistrationData {
  return {
    email: data.email.toLowerCase().trim(),
    password: data.password,
    confirmPassword: data.confirmPassword,
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

// File upload validation
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export async function validateFileUpload(file: File): Promise<FileValidationResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size exceeds 10MB limit' }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed. Only PDF, DOC, DOCX, JPEG, PNG, GIF are accepted' }
  }

  // Content validation - check file signature
  const buffer = await file.arrayBuffer()
  const signature = new Uint8Array(buffer.slice(0, 8))

  const isValidSignature = validateFileSignature(file.type, signature)
  if (!isValidSignature) {
    return { isValid: false, error: 'File content does not match the declared file type' }
  }

  return { isValid: true }
}

function validateFileSignature(mimeType: string, signature: Uint8Array): boolean {
  const signatures: Record<string, number[][]> = {
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]], // DOCX (ZIP)
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]] // GIF87a or GIF89a
  }

  const expectedSignatures = signatures[mimeType]
  if (!expectedSignatures) return false

  return expectedSignatures.some(expected => {
    return expected.every((byte, index) => signature[index] === byte)
  })
}
