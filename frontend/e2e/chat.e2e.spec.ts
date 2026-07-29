import { test, expect } from '@playwright/test';

/**
 * T11.3 — E2E test example for chat functionality.
 *
 * Demonstrates:
 * - Chat interface interaction
 * - Real-time messaging
 * - Message history
 * - Streaming responses
 */

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.locator('input[type="email"]').fill('customer@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/home/);
  });

  test('should open chat launcher', async ({ page }) => {
    // Find and click chat launcher button
    const chatLauncher = page.locator('[aria-label*="chat"]').first();
    await expect(chatLauncher).toBeVisible();
    await chatLauncher.click();
    
    // Verify chat window opens
    await expect(page.locator('.chat-window')).toBeVisible();
  });

  test('should send a message', async ({ page }) => {
    // Open chat
    await page.locator('[aria-label*="chat"]').first().click();
    await expect(page.locator('.chat-window')).toBeVisible();
    
    // Type and send message
    const messageInput = page.locator('textarea[placeholder*="message"]');
    await messageInput.fill('Hello, I need help with my order');
    await page.locator('button[aria-label*="send"]').click();
    
    // Verify message appears in chat
    await expect(page.locator('.message-user')).toContainText('Hello, I need help with my order');
  });

  test('should receive AI response', async ({ page }) => {
    // Open chat and send message
    await page.locator('[aria-label*="chat"]').first().click();
    const messageInput = page.locator('textarea[placeholder*="message"]');
    await messageInput.fill('What are your business hours?');
    await page.locator('button[aria-label*="send"]').click();
    
    // Wait for AI response
    await expect(page.locator('.message-assistant')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.message-assistant')).not.toBeEmpty();
  });

  test('should display suggested prompts', async ({ page }) => {
    // Open chat
    await page.locator('[aria-label*="chat"]').first().click();
    
    // Verify suggested prompts are visible
    await expect(page.locator('.suggested-prompts')).toBeVisible();
    await expect(page.locator('.suggested-prompt')).toHaveCount(3, { timeout: 5000 });
  });

  test('should use suggested prompt', async ({ page }) => {
    // Open chat
    await page.locator('[aria-label*="chat"]').first().click();
    
    // Click a suggested prompt
    const firstPrompt = page.locator('.suggested-prompt').first();
    const promptText = await firstPrompt.textContent();
    await firstPrompt.click();
    
    // Verify message is sent
    await expect(page.locator('.message-user')).toContainText(promptText || '');
  });

  test('should scroll to latest message', async ({ page }) => {
    // Open chat
    await page.locator('[aria-label*="chat"]').first().click();
    
    // Send multiple messages
    const messageInput = page.locator('textarea[placeholder*="message"]');
    for (let i = 0; i < 5; i++) {
      await messageInput.fill(`Message ${i + 1}`);
      await page.locator('button[aria-label*="send"]').click();
      await page.waitForTimeout(500);
    }
    
    // Verify last message is visible
    await expect(page.locator('.message-user').last()).toBeInViewport();
  });

  test('should close chat window', async ({ page }) => {
    // Open chat
    await page.locator('[aria-label*="chat"]').first().click();
    await expect(page.locator('.chat-window')).toBeVisible();
    
    // Close chat
    await page.locator('button[aria-label*="close"]').click();
    
    // Verify chat is closed
    await expect(page.locator('.chat-window')).not.toBeVisible();
  });

  test('should persist chat history', async ({ page }) => {
    // Open chat and send message
    await page.locator('[aria-label*="chat"]').first().click();
    const messageInput = page.locator('textarea[placeholder*="message"]');
    await messageInput.fill('Test message for history');
    await page.locator('button[aria-label*="send"]').click();
    
    // Close and reopen chat
    await page.locator('button[aria-label*="close"]').click();
    await page.locator('[aria-label*="chat"]').first().click();
    
    // Verify message is still there
    await expect(page.locator('.message-user')).toContainText('Test message for history');
  });

  test('should navigate to chat history page', async ({ page }) => {
    await page.goto('/chat');
    
    // Verify on chat history page
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.locator('h1')).toContainText(/chat|conversation/i);
  });
});
