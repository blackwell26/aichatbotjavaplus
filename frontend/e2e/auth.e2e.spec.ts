import { test, expect } from '@playwright/test';

/**
 * T11.3 — E2E test example for authentication flow.
 *
 * Demonstrates:
 * - User login flow
 * - Form interaction
 * - Navigation testing
 * - Session persistence
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    await expect(page).toHaveTitle(/AI Chatbot/);
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click submit without filling form
    await page.locator('button[type="submit"]').click();
    
    // Check for validation errors
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill form with invalid credentials
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    
    // Wait for error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText(/invalid/i);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill form with valid credentials
    await page.locator('input[type="email"]').fill('customer@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Wait for navigation to home page
    await expect(page).toHaveURL(/\/home/);
    
    // Verify user is logged in (check for user menu or logout button)
    await expect(page.locator('[aria-label*="user menu"]')).toBeVisible();
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.locator('input[type="email"]').fill('customer@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/home/);
    
    // Reload page
    await page.reload();
    
    // Verify still logged in
    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('[aria-label*="user menu"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.locator('input[type="email"]').fill('customer@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/home/);
    
    // Click logout
    await page.locator('[aria-label*="user menu"]').click();
    await page.locator('button:has-text("Logout")').click();
    
    // Verify redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Verify cannot access protected routes
    await page.goto('/home/profile');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/home/profile');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click register link
    await page.locator('a:has-text("Sign up")').click();
    
    // Verify on registration page
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.locator('h1')).toContainText(/sign up|register/i);
  });
});

test.describe('Registration', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/auth/register');
    
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Enter weak password
    await page.locator('input[type="password"]').fill('weak');
    await page.locator('input[type="password"]').blur();
    
    // Check for password strength indicator
    await expect(page.locator('.password-strength')).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Fill registration form
    const timestamp = Date.now();
    await page.locator('input[name="name"]').fill('Test User');
    await page.locator('input[type="email"]').fill(`test${timestamp}@example.com`);
    await page.locator('input[type="password"]').fill('SecurePass123!');
    await page.locator('input[name="confirmPassword"]').fill('SecurePass123!');
    await page.locator('button[type="submit"]').click();
    
    // Wait for success message or redirect
    await expect(page).toHaveURL(/\/home|\/auth\/login/);
  });
});
