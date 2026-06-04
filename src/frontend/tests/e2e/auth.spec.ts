import { test, expect } from '@playwright/test'

test.describe('Auth Flows', () => {
  test('user can register as company', async ({ page }) => {
    await page.goto('/register')
    await page.fill('[name=email]', 'test@company.com')
    await page.fill('[name=password]', 'Test1234!')
    await page.selectOption('[name=role]', 'COMPANY')
    await page.fill('[name=companyName]', 'Acme SA')
    await page.fill('[name=companyCuit]', '30-12345678-9')
    await page.click('[type=submit]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('user can login and logout', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[type=email]', 'test@company.com')
    await page.fill('[type=password]', 'Test1234!')
    await page.click('[type=submit]')
    await expect(page).toHaveURL('/dashboard')
  })
})
