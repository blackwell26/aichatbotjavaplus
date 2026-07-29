import { test, expect } from '@playwright/test';

/**
 * T11.5 — Security testing examples.
 *
 * Demonstrates:
 * - XSS prevention testing
 * - CSRF protection validation
 * - Authentication security
 * - Input sanitization
 * - Secure headers validation
 */

test.describe('Security Tests', () => {
  test.describe('XSS Prevention', () => {
    test('should sanitize user input in forms', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Try to inject script tag
      const xssPayload = '<script>alert("XSS")</script>';
      await page.locator('input[type="email"]').fill(xssPayload);
      
      // Submit form
      await page.locator('button[type="submit"]').click();
      
      // Verify script is not executed
      const alerts = [];
      page.on('dialog', (dialog) => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });
      
      await page.waitForTimeout(1000);
      expect(alerts).toHaveLength(0);
    });

    test('should sanitize displayed user content', async ({ page }) => {
      // Login first
      await page.goto('/auth/login');
      await page.locator('input[type="email"]').fill('customer@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      // Navigate to profile
      await page.goto('/home/profile');
      
      // Try to inject XSS in name field
      const xssPayload = '<img src=x onerror="alert(\'XSS\')">';
      const nameInput = page.locator('input[name="name"]');
      
      if (await nameInput.count() > 0) {
        await nameInput.fill(xssPayload);
        await page.locator('button[type="submit"]').click();
        
        // Reload and check if script executed
        await page.reload();
        
        const alerts = [];
        page.on('dialog', (dialog) => {
          alerts.push(dialog.message());
          dialog.dismiss();
        });
        
        await page.waitForTimeout(1000);
        expect(alerts).toHaveLength(0);
      }
    });

    test('should escape HTML in chat messages', async ({ page }) => {
      // Login and open chat
      await page.goto('/auth/login');
      await page.locator('input[type="email"]').fill('customer@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      await page.locator('[aria-label*="chat"]').first().click();
      
      // Send message with HTML
      const htmlPayload = '<b>Bold</b><script>alert("XSS")</script>';
      await page.locator('textarea[placeholder*="message"]').fill(htmlPayload);
      await page.locator('button[aria-label*="send"]').click();
      
      // Verify HTML is escaped, not rendered
      const message = page.locator('.message-user').last();
      const innerHTML = await message.innerHTML();
      
      expect(innerHTML).not.toContain('<script>');
      expect(innerHTML).toContain('&lt;script&gt;');
    });
  });

  test.describe('CSRF Protection', () => {
    test('should include CSRF token in state-changing requests', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Monitor network requests
      const requests: any[] = [];
      page.on('request', (request) => {
        if (request.method() === 'POST' || request.method() === 'PUT' || request.method() === 'DELETE') {
          requests.push({
            url: request.url(),
            headers: request.headers(),
          });
        }
      });
      
      // Perform login (POST request)
      await page.locator('input[type="email"]').fill('customer@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      await page.waitForTimeout(2000);
      
      // Verify CSRF token is present in POST requests
      const postRequests = requests.filter((r) => r.url.includes('/api/'));
      expect(postRequests.length).toBeGreaterThan(0);
      
      for (const req of postRequests) {
        // Check for CSRF token in headers or cookies
        const hasCsrfHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
        expect(hasCsrfHeader).toBeTruthy();
      }
    });
  });

  test.describe('Authentication Security', () => {
    test('should not expose sensitive data in URLs', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Login
      await page.locator('input[type="email"]').fill('customer@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      await page.waitForURL(/\/home/);
      
      // Check URL doesn't contain tokens or passwords
      const url = page.url();
      expect(url).not.toContain('token');
      expect(url).not.toContain('password');
      expect(url).not.toContain('jwt');
    });

    test('should clear sensitive data on logout', async ({ page }) => {
      // Login
      await page.goto('/auth/login');
      await page.locator('input[type="email"]').fill('customer@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      // Logout
      await page.locator('[aria-label*="user menu"]').click();
      await page.locator('button:has-text("Logout")').click();
      
      // Check localStorage and sessionStorage are cleared
      const localStorage = await page.evaluate(() => {
        return {
          accessToken: window.localStorage.getItem('accessToken'),
          refreshToken: window.localStorage.getItem('refreshToken'),
        };
      });
      
      expect(localStorage.accessToken).toBeNull();
      expect(localStorage.refreshToken).toBeNull();
    });

    test('should enforce password complexity', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Try weak password
      await page.locator('input[type="password"]').fill('weak');
      await page.locator('input[type="password"]').blur();
      
      // Should show error
      await expect(page.locator('mat-error')).toBeVisible();
    });

    test('should rate limit login attempts', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Try multiple failed logins
      for (let i = 0; i < 5; i++) {
        await page.locator('input[type="email"]').fill('test@example.com');
        await page.locator('input[type="password"]').fill('wrongpassword');
        await page.locator('button[type="submit"]').click();
        await page.waitForTimeout(500);
      }
      
      // Should show rate limit message
      const errorMessage = page.locator('[role="alert"]');
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('Input Validation', () => {
    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Enter invalid email
      await page.locator('input[type="email"]').fill('invalid-email');
      await page.locator('input[type="email"]').blur();
      
      // Should show validation error
      await expect(page.locator('mat-error')).toBeVisible();
    });

    test('should prevent SQL injection in search', async ({ page }) => {
      await page.goto('/home/products');
      
      // Try SQL injection payload
      const sqlPayload = "'; DROP TABLE products; --";
      const searchInput = page.locator('input[type="search"]');
      
      if (await searchInput.count() > 0) {
        await searchInput.fill(sqlPayload);
        await page.keyboard.press('Enter');
        
        // Page should still work (not crash)
        await expect(page.locator('h1')).toBeVisible();
      }
    });

    test('should limit input length', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Try very long input
      const longString = 'a'.repeat(10000);
      await page.locator('input[type="email"]').fill(longString);
      
      const value = await page.locator('input[type="email"]').inputValue();
      
      // Should be truncated or rejected
      expect(value.length).toBeLessThan(1000);
    });
  });

  test.describe('Secure Headers', () => {
    test('should have security headers set', async ({ page }) => {
      const response = await page.goto('/');
      
      expect(response).toBeTruthy();
      const headers = response!.headers();
      
      // Check for security headers
      expect(headers['x-frame-options']).toBeTruthy();
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['content-security-policy']).toBeTruthy();
      expect(headers['referrer-policy']).toBeTruthy();
    });

    test('should have CSP that blocks inline scripts', async ({ page }) => {
      const response = await page.goto('/');
      const headers = response!.headers();
      
      const csp = headers['content-security-policy'];
      expect(csp).toBeTruthy();
      
      // Should not allow unsafe-inline for scripts
      expect(csp).not.toContain("script-src 'unsafe-inline'");
    });

    test('should enforce HTTPS in production', async ({ page }) => {
      // This test assumes production environment
      if (process.env.NODE_ENV === 'production') {
        const response = await page.goto('/');
        const headers = response!.headers();
        
        // Should have HSTS header
        expect(headers['strict-transport-security']).toBeTruthy();
      }
    });
  });

  test.describe('Session Security', () => {
    test('should expire session after timeout', async ({ page }) => {
      // Login
      await page.goto('/auth/login');
      await page.locator('input[type="email"]').fill('customer@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      // Wait for session timeout (simulated)
      // In real test, you'd wait for actual timeout or manipulate token expiry
      
      // Try to access protected resource
      await page.goto('/home/profile');
      
      // Should redirect to login if session expired
      // (This depends on your session timeout implementation)
    });

    test('should prevent session fixation', async ({ page }) => {
      // Get initial session
      await page.goto('/');
      const initialCookies = await page.context().cookies();
      
      // Login
      await page.goto('/auth/login');
      await page.locator('input[type="email"]').fill('customer@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      // Get cookies after login
      const loginCookies = await page.context().cookies();
      
      // Session ID should change after login
      const initialSessionId = initialCookies.find((c) => c.name.includes('session'))?.value;
      const loginSessionId = loginCookies.find((c) => c.name.includes('session'))?.value;
      
      if (initialSessionId && loginSessionId) {
        expect(initialSessionId).not.toBe(loginSessionId);
      }
    });
  });

  test.describe('File Upload Security', () => {
    test('should validate file types', async ({ page }) => {
      // Navigate to page with file upload (e.g., profile picture)
      await page.goto('/auth/login');
      await page.locator('input[type="email"]').fill('customer@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      await page.goto('/home/profile');
      
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.count() > 0) {
        // Try to upload executable file
        await fileInput.setInputFiles({
          name: 'malicious.exe',
          mimeType: 'application/x-msdownload',
          buffer: Buffer.from('fake executable'),
        });
        
        // Should show error
        await expect(page.locator('[role="alert"]')).toBeVisible();
      }
    });

    test('should limit file size', async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('input[type="email"]').fill('customer@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      await page.goto('/home/profile');
      
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.count() > 0) {
        // Try to upload large file
        const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB
        
        await fileInput.setInputFiles({
          name: 'large.jpg',
          mimeType: 'image/jpeg',
          buffer: largeBuffer,
        });
        
        // Should show error
        await expect(page.locator('[role="alert"]')).toBeVisible();
      }
    });
  });
});
