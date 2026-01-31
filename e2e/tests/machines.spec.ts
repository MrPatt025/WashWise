/**
 * E2E Tests for Machine Management Flow
 */
import { test, expect } from '@playwright/test';

test.describe('Machine Management', () => {
    // Shared auth state
    let authToken: string;

    test.beforeAll(async ({ request }) => {
        // Create and login as owner
        const registerRes = await request.post('/api/v1/auth/register', {
            data: {
                email: `machine_test_${Date.now()}@example.com`,
                password: 'SecurePass123!',
                name: 'Machine Test Owner',
                tenantName: 'Machine Test Laundry',
            },
        });

        if (registerRes.status() === 201) {
            const data = await registerRes.json();
            authToken = data.accessToken;
        }
    });

    test.beforeEach(async ({ page }) => {
        // Set auth token in localStorage
        await page.goto('/login');
        await page.evaluate((token) => {
            localStorage.setItem('accessToken', token);
        }, authToken);
        await page.goto('/dashboard/machines');
    });

    test.describe('Machine List', () => {
        test('should display empty state when no machines', async ({ page }) => {
            await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
            await expect(page.locator('[data-testid="add-machine-button"]')).toBeVisible();
        });

        test('should display machines in a grid', async ({ page, request }) => {
            // Create a machine via API first
            await request.post('/api/v1/machines', {
                headers: { Authorization: `Bearer ${authToken}` },
                data: {
                    code: 'WASH-E2E-001',
                    type: 'WASHER',
                    model: 'Test Model',
                    pricePerCycle: 50.00,
                },
            });

            await page.reload();

            // Should display machine card
            await expect(page.locator('[data-testid="machine-card"]')).toBeVisible();
            await expect(page.locator('[data-testid="machine-code"]')).toContainText('WASH-E2E-001');
        });

        test('should filter machines by type', async ({ page, request }) => {
            // Create washer and dryer
            await request.post('/api/v1/machines', {
                headers: { Authorization: `Bearer ${authToken}` },
                data: {
                    code: 'WASH-FILTER-001',
                    type: 'WASHER',
                    model: 'Washer Model',
                    pricePerCycle: 50.00,
                },
            });

            await request.post('/api/v1/machines', {
                headers: { Authorization: `Bearer ${authToken}` },
                data: {
                    code: 'DRY-FILTER-001',
                    type: 'DRYER',
                    model: 'Dryer Model',
                    pricePerCycle: 40.00,
                },
            });

            await page.reload();

            // Filter by WASHER
            await page.click('[data-testid="filter-type"]');
            await page.click('[data-value="WASHER"]');

            // Should only show washers
            await expect(page.locator('[data-testid="machine-card"]')).toHaveCount(1);
            await expect(page.locator('[data-testid="machine-type"]')).toContainText('Washer');
        });

        test('should filter machines by status', async ({ page }) => {
            // Click status filter
            await page.click('[data-testid="filter-status"]');
            await page.click('[data-value="AVAILABLE"]');

            // Should show available machines
            const cards = page.locator('[data-testid="machine-card"]');
            const count = await cards.count();

            for (let i = 0; i < count; i++) {
                await expect(cards.nth(i).locator('[data-testid="machine-status"]'))
                    .toContainText('Available');
            }
        });
    });

    test.describe('Create Machine', () => {
        test('should open create machine dialog', async ({ page }) => {
            await page.click('[data-testid="add-machine-button"]');

            await expect(page.locator('[data-testid="create-machine-dialog"]')).toBeVisible();
            await expect(page.locator('[name="code"]')).toBeVisible();
        });

        test('should create a new machine successfully', async ({ page }) => {
            await page.click('[data-testid="add-machine-button"]');

            // Fill form
            await page.fill('[name="code"]', `WASH-NEW-${Date.now()}`);
            await page.click('[name="type"]');
            await page.click('[data-value="WASHER"]');
            await page.fill('[name="model"]', 'New Washer Model');
            await page.fill('[name="pricePerCycle"]', '55.00');

            // Submit
            await page.click('[data-testid="submit-button"]');

            // Dialog should close and machine should appear
            await expect(page.locator('[data-testid="create-machine-dialog"]')).not.toBeVisible();
            await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
        });

        test('should show error for duplicate code', async ({ page, request }) => {
            // Create machine with code first
            await request.post('/api/v1/machines', {
                headers: { Authorization: `Bearer ${authToken}` },
                data: {
                    code: 'DUPLICATE-CODE',
                    type: 'WASHER',
                    model: 'Model',
                    pricePerCycle: 50.00,
                },
            });

            await page.click('[data-testid="add-machine-button"]');

            // Try to create with same code
            await page.fill('[name="code"]', 'DUPLICATE-CODE');
            await page.click('[name="type"]');
            await page.click('[data-value="WASHER"]');
            await page.fill('[name="model"]', 'Another Model');
            await page.fill('[name="pricePerCycle"]', '50.00');

            await page.click('[data-testid="submit-button"]');

            // Should show error
            await expect(page.locator('[data-testid="error-message"]')).toContainText(/already exists/i);
        });

        test('should validate required fields', async ({ page }) => {
            await page.click('[data-testid="add-machine-button"]');

            // Try to submit empty form
            await page.click('[data-testid="submit-button"]');

            // Should show validation errors
            await expect(page.locator('[data-testid="code-error"]')).toBeVisible();
            await expect(page.locator('[data-testid="type-error"]')).toBeVisible();
        });
    });

    test.describe('Machine Details', () => {
        let machineId: string;

        test.beforeEach(async ({ request }) => {
            // Create a machine for testing
            const res = await request.post('/api/v1/machines', {
                headers: { Authorization: `Bearer ${authToken}` },
                data: {
                    code: `DETAIL-${Date.now()}`,
                    type: 'WASHER',
                    model: 'Detail Test Model',
                    pricePerCycle: 50.00,
                },
            });

            const data = await res.json();
            machineId = data.id;
        });

        test('should display machine details when clicked', async ({ page }) => {
            await page.reload();

            // Click on machine card
            await page.click('[data-testid="machine-card"]');

            // Should show details panel
            await expect(page.locator('[data-testid="machine-details"]')).toBeVisible();
            await expect(page.locator('[data-testid="detail-model"]')).toContainText('Detail Test Model');
        });

        test('should show machine statistics', async ({ page }) => {
            await page.goto(`/dashboard/machines/${machineId}`);

            await expect(page.locator('[data-testid="machine-stats"]')).toBeVisible();
            await expect(page.locator('[data-testid="stat-total-cycles"]')).toBeVisible();
            await expect(page.locator('[data-testid="stat-revenue"]')).toBeVisible();
        });
    });

    test.describe('Cycle Management', () => {
        let machineId: string;

        test.beforeEach(async ({ request }) => {
            // Create an available machine
            const res = await request.post('/api/v1/machines', {
                headers: { Authorization: `Bearer ${authToken}` },
                data: {
                    code: `CYCLE-${Date.now()}`,
                    type: 'WASHER',
                    model: 'Cycle Test Model',
                    pricePerCycle: 50.00,
                },
            });

            const data = await res.json();
            machineId = data.id;
        });

        test('should start a cycle on available machine', async ({ page }) => {
            await page.goto(`/dashboard/machines/${machineId}`);

            // Click start cycle
            await page.click('[data-testid="start-cycle-button"]');

            // Enter duration
            await page.fill('[name="duration"]', '30');
            await page.click('[data-testid="confirm-start"]');

            // Should update status
            await expect(page.locator('[data-testid="machine-status"]')).toContainText('In Use');
            await expect(page.locator('[data-testid="cycle-timer"]')).toBeVisible();
        });

        test('should show remaining time for active cycle', async ({ page, request }) => {
            // Start cycle via API
            await request.post(`/api/v1/machines/${machineId}/start`, {
                headers: { Authorization: `Bearer ${authToken}` },
                data: { durationMinutes: 30 },
            });

            await page.goto(`/dashboard/machines/${machineId}`);

            // Should show timer
            await expect(page.locator('[data-testid="cycle-timer"]')).toBeVisible();
            await expect(page.locator('[data-testid="cycle-timer"]')).toContainText(/\d+:\d+/);
        });

        test('should end cycle manually', async ({ page, request }) => {
            // Start cycle via API
            await request.post(`/api/v1/machines/${machineId}/start`, {
                headers: { Authorization: `Bearer ${authToken}` },
                data: { durationMinutes: 30 },
            });

            await page.goto(`/dashboard/machines/${machineId}`);

            // Click end cycle
            await page.click('[data-testid="end-cycle-button"]');
            await page.click('[data-testid="confirm-end"]');

            // Should update status
            await expect(page.locator('[data-testid="machine-status"]')).toContainText('Available');
        });
    });
});
