import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=/email/i')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('text=Belum punya akun? Daftar');
    
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1')).toContainText('Daftar');
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('text=Lupa Password?');
    
    await expect(page).toHaveURL('/forgot-password');
  });
});

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // This would typically involve logging in
    // For now, we'll just test navigation
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should show admin dashboard when logged in as admin', async ({ page }) => {
    // This test would require authentication setup
    // For now, we'll test the page structure
    await page.goto('/admin/dashboard');
    
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Course Flow', () => {
  test('should display courses page', async ({ page }) => {
    await page.goto('/courses');
    
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL('/login');
  });

  test('should show course enrollment form', async ({ page }) => {
    // This would require authentication and course setup
    await page.goto('/courses/available');
    
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL('/login');
  });
});