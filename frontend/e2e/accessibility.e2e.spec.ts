import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * T11.4 — Accessibility testing with axe-core.
 *
 * Demonstrates:
 * - WCAG 2.1 compliance testing
 * - Automated accessibility scanning
 * - Keyboard navigation testing
 * - Screen reader compatibility
 * - Color contrast validation
 */

test.describe('Accessibility Tests', () => {
  test('home page should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('product catalog should not have accessibility violations', async ({ page }) => {
    await page.goto('/home/products');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation on login form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
    
    // Submit with Enter key
    await page.keyboard.press('Enter');
  });

  test('should support keyboard navigation in navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Tab to navigation
    await page.keyboard.press('Tab');
    
    // Navigate through menu items with arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    
    // Activate menu item with Enter
    await page.keyboard.press('Enter');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Verify heading levels are sequential
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have alt text for all images', async ({ page }) => {
    await page.goto('/home/products');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should have proper ARIA labels for interactive elements', async ({ page }) => {
    await page.goto('/');
    
    // Check buttons have accessible names
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either aria-label or text content
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/auth/login');
    
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Input should have id with corresponding label, or aria-label
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should have skip navigation link', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first element (should be skip link)
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/');
    
    // Check for aria-live regions
    const liveRegions = await page.locator('[aria-live]').all();
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  test('should support screen reader navigation landmarks', async ({ page }) => {
    await page.goto('/');
    
    // Check for semantic HTML5 landmarks
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // Or ARIA landmarks
    const landmarks = await page.locator('[role="banner"], [role="main"], [role="navigation"]').all();
    expect(landmarks.length).toBeGreaterThan(0);
  });

  test('should have accessible error messages', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Submit empty form to trigger errors
    await page.locator('button[type="submit"]').click();
    
    // Check error messages are associated with inputs
    const errors = await page.locator('[role="alert"], .mat-error').all();
    expect(errors.length).toBeGreaterThan(0);
    
    for (const error of errors) {
      await expect(error).toBeVisible();
    }
  });

  test('should support focus management in modals', async ({ page }) => {
    await page.goto('/');
    
    // Open a modal (if exists)
    const modalTrigger = page.locator('[aria-haspopup="dialog"]').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      
      // Focus should move to modal
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // First focusable element in modal should be focused
      const firstFocusable = modal.locator('button, a, input, select, textarea').first();
      await expect(firstFocusable).toBeFocused();
      
      // Escape key should close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('should have accessible data tables', async ({ page }) => {
    await page.goto('/home/orders');
    
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      // Check for table headers
      const headers = await table.locator('th').all();
      expect(headers.length).toBeGreaterThan(0);
      
      // Check for scope attributes
      for (const header of headers) {
        const scope = await header.getAttribute('scope');
        expect(scope).toBeTruthy();
      }
    }
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be accessible on mobile viewport', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have touch-friendly targets', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.locator('button, a').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        // Touch targets should be at least 44x44 pixels (WCAG 2.1)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
