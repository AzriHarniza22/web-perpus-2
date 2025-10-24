import { test, expect } from '@playwright/test'

test.describe('Authentication Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.goto('/')
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Library Reservation/)
    await expect(page.locator('text=Selamat Datang')).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveTitle(/Library Reservation/)
    await expect(page.locator('text=Bergabung Sekarang')).toBeVisible()
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page).toHaveTitle(/Library Reservation/)
    await expect(page.locator('text=Reset Password')).toBeVisible()
  })

  test('should navigate between auth pages', async ({ page }) => {
    // Start at login
    await page.goto('/login')
    await expect(page.locator('text=Belum punya akun?')).toBeVisible()

    // Go to register
    await page.locator('text=Daftar di sini').click()
    await expect(page).toHaveURL(/\/register/)
    await expect(page.locator('text=Sudah punya akun?')).toBeVisible()

    // Go back to login
    await page.locator('text=Masuk di sini').click()
    await expect(page).toHaveURL(/\/login/)

    // Go to forgot password
    await page.locator('text=Reset di sini').click()
    await expect(page).toHaveURL(/\/forgot-password/)

    // Go back to login
    await page.locator('text=Kembali ke Login').click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show validation errors on login form', async ({ page }) => {
    await page.goto('/login')

    // Submit empty form
    await page.locator('button[type="submit"]').click()

    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show validation errors on register form', async ({ page }) => {
    await page.goto('/register')

    // Submit empty form
    await page.locator('button[type="submit"]').click()

    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
    await expect(page.locator('text=Full name is required')).toBeVisible()
  })

  test('should show validation errors on forgot password form', async ({ page }) => {
    await page.goto('/forgot-password')

    // Submit empty form
    await page.locator('button[type="submit"]').click()

    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/login')

    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')

    // Trigger validation
    await page.locator('button[type="submit"]').click()

    // Check for email validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.locator('input[type="password"]')
    const toggleButton = page.locator('button[aria-label*="password"]')

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle
    await toggleButton.click()

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click toggle again
    await toggleButton.click()

    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should show confirm password validation on register', async ({ page }) => {
    await page.goto('/register')

    // Fill form with mismatched passwords
    await page.fill('input[name="fullName"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different123')

    // Check password match indicator
    await expect(page.locator('text=Password tidak cocok')).toBeVisible()
  })

  test('should show password match indicator', async ({ page }) => {
    await page.goto('/register')

    // Fill matching passwords
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')

    // Check password match indicator
    await expect(page.locator('text=Password cocok')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/login')

    // Check that key elements are visible and properly sized
    await expect(page.locator('text=Selamat Datang')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/login')

    // Check ARIA labels
    await expect(page.locator('input[aria-label="Email address"]')).toBeVisible()
    await expect(page.locator('input[aria-label="Password"]')).toBeVisible()
    await expect(page.locator('button[aria-label*="password"]')).toBeVisible()

    // Check form labels
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
  })

  test('should show loading states during form submission', async ({ page }) => {
    await page.goto('/login')

    // Fill form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')

    // Submit form (this will fail due to no backend, but should show loading)
    await page.locator('button[type="submit"]').click()

    // Check for loading state (button should be disabled and show loading text)
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
    await expect(page.locator('text=Memproses...')).toBeVisible()
  })

  test('should handle Google OAuth button', async ({ page }) => {
    await page.goto('/login')

    // Check Google login button exists
    const googleButton = page.locator('text=Masuk dengan Google')
    await expect(googleButton).toBeVisible()

    // Note: We can't actually test OAuth flow without proper setup
    // But we can verify the button exists and is clickable
    await expect(googleButton).toBeEnabled()
  })

  test('should handle back navigation', async ({ page }) => {
    await page.goto('/login')

    // Click back button
    await page.locator('text=Kembali').click()

    // Should navigate to home page
    await expect(page).toHaveURL('/')
  })

  test('should support theme toggle', async ({ page }) => {
    await page.goto('/login')

    // Check theme toggle exists
    const themeToggle = page.locator('button[aria-label*="theme"]').or(page.locator('[data-testid="theme-toggle"]'))
    await expect(themeToggle).toBeVisible()

    // Note: Testing actual theme switching would require more complex setup
  })
})