import { validateRegistrationData, sanitizeRegistrationData, isValidEmail, isValidPhone, isValidPassword } from './validation'
import { RegistrationData } from './types'

describe('Validation Functions', () => {
  describe('validateRegistrationData', () => {
    it('should return no errors for valid data', () => {
      const validData: RegistrationData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        institution: 'University',
        phone: '+6281234567890'
      }

      const errors = validateRegistrationData(validData)
      expect(errors).toHaveLength(0)
    })

    it('should validate email format', () => {
      const invalidEmail: RegistrationData = {
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        institution: 'University',
        phone: '+6281234567890'
      }

      const errors = validateRegistrationData(invalidEmail)
      expect(errors).toContainEqual({
        field: 'email',
        message: 'Please enter a valid email address'
      })
    })

    it('should require email', () => {
      const noEmail: RegistrationData = {
        email: '',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        institution: 'University',
        phone: '+6281234567890'
      }

      const errors = validateRegistrationData(noEmail)
      expect(errors).toContainEqual({
        field: 'email',
        message: 'Email is required'
      })
    })

    it('should validate password length', () => {
      const shortPassword: RegistrationData = {
        email: 'test@example.com',
        password: '12345',
        confirmPassword: '12345',
        fullName: 'John Doe',
        institution: 'University',
        phone: '+6281234567890'
      }

      const errors = validateRegistrationData(shortPassword)
      expect(errors).toContainEqual({
        field: 'password',
        message: 'Password must be at least 6 characters'
      })
    })

    it('should validate password confirmation match', () => {
      const mismatchedPassword: RegistrationData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123',
        fullName: 'John Doe',
        institution: 'University',
        phone: '+6281234567890'
      }

      const errors = validateRegistrationData(mismatchedPassword)
      expect(errors).toContainEqual({
        field: 'confirmPassword',
        message: 'Passwords do not match'
      })
    })

    it('should validate full name length', () => {
      const shortName: RegistrationData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'A',
        institution: 'University',
        phone: '+6281234567890'
      }

      const errors = validateRegistrationData(shortName)
      expect(errors).toContainEqual({
        field: 'fullName',
        message: 'Full name must be at least 2 characters'
      })
    })

    it('should validate phone format', () => {
      const invalidPhone: RegistrationData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        institution: 'University',
        phone: 'invalid-phone'
      }

      const errors = validateRegistrationData(invalidPhone)
      expect(errors).toContainEqual({
        field: 'phone',
        message: 'Please enter a valid Indonesian phone number'
      })
    })

    it('should allow optional institution and phone', () => {
      const minimalData: RegistrationData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        institution: '',
        phone: ''
      }

      const errors = validateRegistrationData(minimalData)
      expect(errors).toHaveLength(0)
    })
  })

  describe('sanitizeRegistrationData', () => {
    it('should trim and lowercase email', () => {
      const data: RegistrationData = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        institution: 'University',
        phone: '+6281234567890'
      }

      const sanitized = sanitizeRegistrationData(data)
      expect(sanitized.email).toBe('test@example.com')
    })

    it('should trim full name', () => {
      const data: RegistrationData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: '  John Doe  ',
        institution: 'University',
        phone: '+6281234567890'
      }

      const sanitized = sanitizeRegistrationData(data)
      expect(sanitized.fullName).toBe('John Doe')
    })

    it('should handle empty optional fields', () => {
      const data: RegistrationData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        institution: '',
        phone: ''
      }

      const sanitized = sanitizeRegistrationData(data)
      expect(sanitized.institution).toBe('')
      expect(sanitized.phone).toBe('')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
      expect(isValidEmail('test123@example.io')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('test')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should validate Indonesian phone formats', () => {
      expect(isValidPhone('+6281234567890')).toBe(true)
      expect(isValidPhone('6281234567890')).toBe(true)
      expect(isValidPhone('081234567890')).toBe(true)
      expect(isValidPhone('6289876543210')).toBe(true)
    })

    it('should reject invalid phone formats', () => {
      expect(isValidPhone('1234567890')).toBe(false)
      expect(isValidPhone('+6281234567890123')).toBe(false)
      expect(isValidPhone('08123456')).toBe(false)
      expect(isValidPhone('invalid')).toBe(false)
      expect(isValidPhone('')).toBe(false)
    })
  })

  describe('isValidPassword', () => {
    it('should validate password length', () => {
      expect(isValidPassword('123456')).toBe(true)
      expect(isValidPassword('password123')).toBe(true)
      expect(isValidPassword('12345')).toBe(false)
      expect(isValidPassword('')).toBe(false)
    })
  })
})