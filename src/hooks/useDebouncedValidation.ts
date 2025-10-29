import { useCallback, useRef, useEffect } from 'react'

interface UseDebouncedValidationOptions {
  delay?: number
}

export function useDebouncedValidation<T>(
  validator: (value: T) => void,
  options: UseDebouncedValidationOptions = {}
) {
  const { delay = 300 } = options
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const validatorRef = useRef(validator)

  // Update validator ref when validator changes
  useEffect(() => {
    validatorRef.current = validator
  }, [validator])

  const debouncedValidate = useCallback((value: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      validatorRef.current(value)
    }, delay)
  }, [delay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const validateImmediately = useCallback((value: T) => {
    cancel()
    validatorRef.current(value)
  }, [cancel])

  return {
    debouncedValidate,
    validateImmediately,
    cancel
  }
}