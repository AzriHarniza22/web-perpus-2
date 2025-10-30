import { test, expect } from '@playwright/test'

test.describe('Forgot Password Flow', () => {
  test('should redirect to forgot password page from login page', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')

    // Click the "Lupa password?" link
    await page.click('text=Lupa password?')

    // Verify redirect to forgot password page
    await expect(page).toHaveURL('/forgot-password')

    // Verify page title and content
    await expect(page.locator('h1')).toContainText('Reset Password')
    await expect(page.locator('text=Masukkan email Anda untuk menerima link reset password')).toBeVisible()
  })

  test('should display forgot password form correctly', async ({ page }) => {
    await page.goto('/forgot-password')

    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Kirim Link Reset')
    await expect(page.locator('text=Kembali ke Login')).toBeVisible()

    // Check email input attributes
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('placeholder', 'nama@email.com')
    await expect(emailInput).toHaveAttribute('required')
  })

  test('should validate email input', async ({ page }) => {
    await page.goto('/forgot-password')

    // Submit empty form
    await page.click('button[type="submit"]')

    // Check for validation error
    await expect(page.locator('text=Email is required')).toBeVisible()

    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.click('button[type="submit"]')

    // Check for email format validation
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('should show success message after submitting valid email', async ({ page }) => {
    await page.goto('/forgot-password')

    // Mock the API response for successful email sending
    await page.route('/api/auth/reset-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Enter valid email
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Check for success message
    await expect(page.locator('text=Email reset password telah dikirim')).toBeVisible()
  })

  test('should show error message for API failure', async ({ page }) => {
    await page.goto('/forgot-password')

    // Mock API failure
    await page.route('/api/auth/reset-password', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'User not found' })
      })
    })

    // Enter email and submit
    await page.fill('input[type="email"]', 'nonexistent@example.com')
    await page.click('button[type="submit"]')

    // Check for error message
    await expect(page.locator('text=User not found')).toBeVisible()
  })

  test('should redirect back to login page', async ({ page }) => {
    await page.goto('/forgot-password')

    // Click "Kembali ke Login" link
    await page.click('text=Kembali ke Login')

    // Verify redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/forgot-password')

    // Check form labels
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('aria-describedby')

    // Check error messages have proper roles
    await page.fill('input[type="email"]', '')
    await page.click('button[type="submit"]')

    const errorMessage = page.locator('[role="alert"]')
    await expect(errorMessage).toBeVisible()
  })

  test('should handle loading state during submission', async ({ page }) => {
    await page.goto('/forgot-password')

    // Mock slow API response
    await page.route('/api/auth/reset-password', async route => {
      // Delay response to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Check loading button text
    await expect(page.locator('button[type="submit"]')).toContainText('Mengirim...')

    // Button should be disabled during loading
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('should auto-redirect to login after successful submission', async ({ page }) => {
    await page.goto('/forgot-password')

    // Mock successful response
    await page.route('/api/auth/reset-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Wait for success message
    await expect(page.locator('text=Email reset password telah dikirim')).toBeVisible()

    // Wait for auto-redirect (5 seconds as per implementation)
    await page.waitForTimeout(5000)

    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })
})