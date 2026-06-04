import { test, expect } from '@playwright/test'

test.describe('Trip Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as company
    await page.goto('/login')
    await page.fill('[type=email]', 'test@company.com')
    await page.fill('[type=password]', 'Test1234!')
    await page.click('[type=submit]')
    await page.waitForURL('/dashboard')
  })

  test('company can create a new trip', async ({ page }) => {
    await page.goto('/trips/new')
    await page.fill('[name=originAddress]', 'Av. Corrientes 1000, Buenos Aires')
    await page.fill('[name=destAddress]', 'San Martín 500, Rosario')
    await page.fill('[name=scheduledDate]', '2026-06-20T08:00')
    await page.fill('[name=basePrice]', '45000')
    await page.click('[type=submit]')
    await expect(page).toHaveURL(/\/trips\/.+/)
  })

  test('company can view trips list', async ({ page }) => {
    await page.goto('/trips')
    await expect(page.locator('h1')).toContainText('Viajes')
  })
})
