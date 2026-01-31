/**
 * E2E Tests for AI Chat Widget
 */
import { test, expect } from '@playwright/test';

test.describe('AI Chat Widget', () => {
    let authToken: string;

    test.beforeAll(async ({ request }) => {
        // Create and login as user
        const registerRes = await request.post('/api/v1/auth/register', {
            data: {
                email: `chat_test_${Date.now()}@example.com`,
                password: 'SecurePass123!',
                name: 'Chat Test User',
                tenantName: 'Chat Test Laundry',
            },
        });

        if (registerRes.status() === 201) {
            const data = await registerRes.json();
            authToken = data.accessToken;
        }
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.evaluate((token) => {
            localStorage.setItem('accessToken', token);
        }, authToken);
        await page.goto('/dashboard');
    });

    test.describe('Chat Widget Toggle', () => {
        test('should display chat widget trigger button', async ({ page }) => {
            await expect(page.locator('[data-testid="chat-widget-trigger"]')).toBeVisible();
        });

        test('should open chat window when clicking trigger', async ({ page }) => {
            await page.click('[data-testid="chat-widget-trigger"]');

            await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();
            await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
        });

        test('should close chat window when clicking close button', async ({ page }) => {
            await page.click('[data-testid="chat-widget-trigger"]');
            await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

            await page.click('[data-testid="chat-close-button"]');
            await expect(page.locator('[data-testid="chat-window"]')).not.toBeVisible();
        });
    });

    test.describe('Chat Interaction', () => {
        test.beforeEach(async ({ page }) => {
            await page.click('[data-testid="chat-widget-trigger"]');
        });

        test('should send message and receive response', async ({ page }) => {
            // Type message
            await page.fill('[data-testid="chat-input"]', 'Hello, what services do you offer?');
            await page.click('[data-testid="chat-send"]');

            // User message should appear
            await expect(page.locator('[data-testid="chat-message-user"]').last())
                .toContainText('Hello, what services do you offer?');

            // Wait for AI response
            await expect(page.locator('[data-testid="chat-message-assistant"]').last())
                .toBeVisible({ timeout: 15000 });

            // Response should have content
            const response = page.locator('[data-testid="chat-message-assistant"]').last();
            await expect(response).not.toBeEmpty();
        });

        test('should display typing indicator while waiting', async ({ page }) => {
            await page.fill('[data-testid="chat-input"]', 'Test message');
            await page.click('[data-testid="chat-send"]');

            // Typing indicator should appear briefly
            await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
        });

        test('should show suggestions after response', async ({ page }) => {
            await page.fill('[data-testid="chat-input"]', 'I want to book a machine');
            await page.click('[data-testid="chat-send"]');

            // Wait for response
            await expect(page.locator('[data-testid="chat-message-assistant"]').last())
                .toBeVisible({ timeout: 15000 });

            // Suggestions should appear
            await expect(page.locator('[data-testid="chat-suggestions"]')).toBeVisible();
        });

        test('should handle suggestion click', async ({ page }) => {
            await page.fill('[data-testid="chat-input"]', 'Hello');
            await page.click('[data-testid="chat-send"]');

            // Wait for suggestions
            await expect(page.locator('[data-testid="chat-suggestions"]')).toBeVisible({ timeout: 15000 });

            // Click a suggestion
            await page.click('[data-testid="suggestion-button"]');

            // Should send suggestion as new message
            const messages = page.locator('[data-testid="chat-message-user"]');
            expect(await messages.count()).toBeGreaterThan(1);
        });

        test('should preserve chat history on widget toggle', async ({ page }) => {
            // Send message
            await page.fill('[data-testid="chat-input"]', 'First message');
            await page.click('[data-testid="chat-send"]');

            // Wait for response
            await expect(page.locator('[data-testid="chat-message-assistant"]').last())
                .toBeVisible({ timeout: 15000 });

            // Close and reopen widget
            await page.click('[data-testid="chat-close-button"]');
            await page.click('[data-testid="chat-widget-trigger"]');

            // Messages should still be there
            await expect(page.locator('[data-testid="chat-message-user"]')).toBeVisible();
        });
    });

    test.describe('Intent-based Responses', () => {
        test.beforeEach(async ({ page }) => {
            await page.click('[data-testid="chat-widget-trigger"]');
        });

        test('should detect machine availability intent', async ({ page }) => {
            await page.fill('[data-testid="chat-input"]', 'Are there any machines available?');
            await page.click('[data-testid="chat-send"]');

            // Wait for response
            const response = page.locator('[data-testid="chat-message-assistant"]').last();
            await expect(response).toBeVisible({ timeout: 15000 });

            // Response should be about machine availability
            const text = await response.textContent();
            expect(text?.toLowerCase()).toMatch(/machine|available|status/);
        });

        test('should detect booking intent', async ({ page }) => {
            await page.fill('[data-testid="chat-input"]', 'I want to make a reservation');
            await page.click('[data-testid="chat-send"]');

            const response = page.locator('[data-testid="chat-message-assistant"]').last();
            await expect(response).toBeVisible({ timeout: 15000 });

            const text = await response.textContent();
            expect(text?.toLowerCase()).toMatch(/book|reservation|schedule/);
        });

        test('should handle Thai language input', async ({ page }) => {
            await page.fill('[data-testid="chat-input"]', 'สวัสดีครับ มีเครื่องซักผ้าว่างไหม');
            await page.click('[data-testid="chat-send"]');

            const response = page.locator('[data-testid="chat-message-assistant"]').last();
            await expect(response).toBeVisible({ timeout: 15000 });

            // Response should be in Thai or acknowledge Thai input
            await expect(response).not.toBeEmpty();
        });
    });

    test.describe('Chat Error Handling', () => {
        test('should handle empty message submission', async ({ page }) => {
            await page.click('[data-testid="chat-widget-trigger"]');

            // Try to send empty message
            await page.click('[data-testid="chat-send"]');

            // Should not send (button disabled or no new message)
            const messages = page.locator('[data-testid="chat-message-user"]');
            expect(await messages.count()).toBe(0);
        });

        test('should show error state on network failure', async ({ page }) => {
            await page.click('[data-testid="chat-widget-trigger"]');

            // Simulate network failure
            await page.route('**/api/v1/chat/**', route => route.abort());

            await page.fill('[data-testid="chat-input"]', 'Test message');
            await page.click('[data-testid="chat-send"]');

            // Should show error
            await expect(page.locator('[data-testid="chat-error"]')).toBeVisible({ timeout: 10000 });
        });
    });
});
