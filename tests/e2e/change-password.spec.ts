import { test, expect } from '@playwright/test'

test.describe('Change Password Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for profile page access
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        }
      }))
    })
  })

  test('should display change password form when button is clicked', async ({ page }) => {
    await page.goto('/profile')

    // Click the "Ubah Password" button
    await page.click('text=Ubah Password')

    // Verify form is displayed
    await expect(page.locator('input[id="current_password"]')).toBeVisible()
    await expect(page.locator('input[id="new_password"]')).toBeVisible()
    await expect(page.locator('input[id="confirm_password"]')).toBeVisible()
    await expect(page.locator('button:has-text("Ubah Password")')).toBeVisible()
  })

  test('should validate current password is required', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    // Leave current password empty and fill others
    await page.fill('input[id="new_password"]', 'newpassword123')
    await page.fill('input[id="confirm_password"]', 'newpassword123')

    // Submit form
    await page.click('button:has-text("Ubah Password")')

    // Check for error message
    await expect(page.locator('text=Password saat ini diperlukan')).toBeVisible()
  })

  test('should validate new password is required', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    // Fill current password and confirmation, leave new password empty
    await page.fill('input[id="current_password"]', 'currentpass')
    await page.fill('input[id="confirm_password"]', 'newpassword123')

    await page.click('button:has-text("Ubah Password")')

    await expect(page.locator('text=Password baru diperlukan')).toBeVisible()
  })

  test('should validate password confirmation matches', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    await page.fill('input[id="current_password"]', 'currentpass')
    await page.fill('input[id="new_password"]', 'newpassword123')
    await page.fill('input[id="confirm_password"]', 'differentpassword')

    await page.click('button:has-text("Ubah Password")')

    await expect(page.locator('text=Konfirmasi password tidak cocok')).toBeVisible()
  })

  test('should validate minimum password length', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    await page.fill('input[id="current_password"]', 'currentpass')
    await page.fill('input[id="new_password"]', '12345') // 5 characters
    await page.fill('input[id="confirm_password"]', '12345')

    await page.click('button:has-text("Ubah Password")')

    await expect(page.locator('text=Password baru minimal 6 karakter')).toBeVisible()
  })

  test('should successfully change password with valid data', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    // Mock successful API response
    await page.route('/api/change-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Password changed successfully' })
      })
    })

    await page.fill('input[id="current_password"]', 'currentpass')
    await page.fill('input[id="new_password"]', 'newpassword123')
    await page.fill('input[id="confirm_password"]', 'newpassword123')

    await page.click('button:has-text("Ubah Password")')

    // Check for success message
    await expect(page.locator('text=Password berhasil diubah!')).toBeVisible()

    // Form should be hidden after successful submission
    await expect(page.locator('input[id="current_password"]')).not.toBeVisible()
  })

  test('should clear form after successful password change', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    await page.route('/api/change-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Password changed successfully' })
      })
    })

    await page.fill('input[id="current_password"]', 'currentpass')
    await page.fill('input[id="new_password"]', 'newpassword123')
    await page.fill('input[id="confirm_password"]', 'newpassword123')

    await page.click('button:has-text("Ubah Password")')

    // Wait for success and form to be cleared
    await expect(page.locator('text=Password berhasil diubah!')).toBeVisible()

    // Re-open form to check if it's cleared
    await page.click('text=Ubah Password')

    // Fields should be empty
    await expect(page.locator('input[id="current_password"]')).toHaveValue('')
    await expect(page.locator('input[id="new_password"]')).toHaveValue('')
    await expect(page.locator('input[id="confirm_password"]')).toHaveValue('')
  })

  test('should show error for incorrect current password', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    await page.route('/api/change-password', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Current password is incorrect' })
      })
    })

    await page.fill('input[id="current_password"]', 'wrongpassword')
    await page.fill('input[id="new_password"]', 'newpassword123')
    await page.fill('input[id="confirm_password"]', 'newpassword123')

    await page.click('button:has-text("Ubah Password")')

    await expect(page.locator('text=Current password is incorrect')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    await page.route('/api/change-password', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' })
      })
    })

    await page.fill('input[id="current_password"]', 'currentpass')
    await page.fill('input[id="new_password"]', 'newpassword123')
    await page.fill('input[id="confirm_password"]', 'newpassword123')

    await page.click('button:has-text("Ubah Password")')

    await expect(page.locator('text=Internal server error')).toBeVisible()
  })

  test('should cancel password change and clear form', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    await page.fill('input[id="current_password"]', 'currentpass')
    await page.fill('input[id="new_password"]', 'newpassword123')
    await page.fill('input[id="confirm_password"]', 'newpassword123')

    // Click cancel button
    await page.click('button:has-text("Batal")')

    // Form should be hidden
    await expect(page.locator('input[id="current_password"]')).not.toBeVisible()

    // Re-open form to check if it's cleared
    await page.click('text=Ubah Password')

    await expect(page.locator('input[id="current_password"]')).toHaveValue('')
    await expect(page.locator('input[id="new_password"]')).toHaveValue('')
    await expect(page.locator('input[id="confirm_password"]')).toHaveValue('')
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    // Check form labels
    await expect(page.locator('label[for="current_password"]')).toContainText('Password Saat Ini')
    await expect(page.locator('label[for="new_password"]')).toContainText('Password Baru')
    await expect(page.locator('label[for="confirm_password"]')).toContainText('Konfirmasi Password Baru')

    // Check input types are password
    await expect(page.locator('input[id="current_password"]')).toHaveAttribute('type', 'password')
    await expect(page.locator('input[id="new_password"]')).toHaveAttribute('type', 'password')
    await expect(page.locator('input[id="confirm_password"]')).toHaveAttribute('type', 'password')
  })

  test('should handle loading state during submission', async ({ page }) => {
    await page.goto('/profile')
    await page.click('text=Ubah Password')

    // Mock slow API response
    await page.route('/api/change-password', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Password changed successfully' })
      })
    })

    await page.fill('input[id="current_password"]', 'currentpass')
    await page.fill('input[id="new_password"]', 'newpassword123')
    await page.fill('input[id="confirm_password"]', 'newpassword123')

    await page.click('button:has-text("Ubah Password")')

    // Button should show loading state
    await expect(page.locator('button:has-text("Ubah Password")')).toBeDisabled()

    // After completion, success message should appear
    await expect(page.locator('text=Password berhasil diubah!')).toBeVisible()
  })
})