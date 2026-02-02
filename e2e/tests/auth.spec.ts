/**
 * E2E Tests for Authentication Flow
 */
import { expect, test } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.describe("Registration", () => {
    test("should successfully register a new owner", async ({ page }) => {
      await page.goto("/register");

      // Fill registration form
      await page.fill('[name="name"]', "Test Owner");
      await page.fill('[name="email"]', `test_${Date.now()}@example.com`);
      await page.fill('[name="password"]', "SecurePass123!");
      await page.fill('[name="confirmPassword"]', "SecurePass123!");
      await page.fill('[name="tenantName"]', "Test Laundry Shop");

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('[data-testid="welcome-message"]')).toContainText("Test Owner");
    });

    test("should show error for duplicate email", async ({ page }) => {
      // First registration
      const email = `duplicate_${Date.now()}@example.com`;

      await page.goto("/register");
      await page.fill('[name="name"]', "First User");
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', "SecurePass123!");
      await page.fill('[name="confirmPassword"]', "SecurePass123!");
      await page.fill('[name="tenantName"]', "First Laundry");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Try to register with same email
      await page.goto("/register");
      await page.fill('[name="name"]', "Second User");
      await page.fill('[name="email"]', email);
      await page.fill('[name="password"]', "SecurePass123!");
      await page.fill('[name="confirmPassword"]', "SecurePass123!");
      await page.fill('[name="tenantName"]', "Second Laundry");
      await page.click('button[type="submit"]');

      // Should show error
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/email.*already/i);
    });

    test("should validate password requirements", async ({ page }) => {
      await page.goto("/register");

      await page.fill('[name="name"]', "Test User");
      await page.fill('[name="email"]', "test@example.com");
      await page.fill('[name="password"]', "weak");
      await page.fill('[name="confirmPassword"]', "weak");
      await page.fill('[name="tenantName"]', "Test Shop");

      // Try to submit
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });
  });

  test.describe("Login", () => {
    test.beforeEach(async ({ page }) => {
      // Create test user via API
      const response = await page.request.post("/api/v1/auth/register", {
        data: {
          email: "login_test@example.com",
          password: "SecurePass123!",
          name: "Login Test User",
          tenantName: "Login Test Laundry",
        },
      });

      if (response.status() !== 201 && response.status() !== 409) {
        throw new Error("Failed to create test user");
      }
    });

    test("should login successfully with valid credentials", async ({ page }) => {
      await page.goto("/login");

      await page.fill('[name="email"]', "login_test@example.com");
      await page.fill('[name="password"]', "SecurePass123!");
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test("should show error for invalid password", async ({ page }) => {
      await page.goto("/login");

      await page.fill('[name="email"]', "login_test@example.com");
      await page.fill('[name="password"]', "WrongPassword123!");
      await page.click('button[type="submit"]');

      // Should show error
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        /invalid.*credentials/i
      );
      await expect(page).toHaveURL(/.*login/);
    });

    test("should show error for non-existent user", async ({ page }) => {
      await page.goto("/login");

      await page.fill('[name="email"]', "nonexistent@example.com");
      await page.fill('[name="password"]', "AnyPassword123!");
      await page.click('button[type="submit"]');

      // Should show error
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        /invalid.*credentials/i
      );
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect to login when accessing dashboard without auth", async ({ page }) => {
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });

    test("should redirect to login when accessing machines without auth", async ({ page }) => {
      await page.goto("/dashboard/machines");

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });

    test("should persist login across page refresh", async ({ page }) => {
      // Login
      await page.goto("/login");
      await page.fill('[name="email"]', "login_test@example.com");
      await page.fill('[name="password"]', "SecurePass123!");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);

      // Refresh page
      await page.reload();

      // Should still be on dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });

  test.describe("Logout", () => {
    test("should logout successfully", async ({ page }) => {
      // Login first
      await page.goto("/login");
      await page.fill('[name="email"]', "login_test@example.com");
      await page.fill('[name="password"]', "SecurePass123!");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);

      // Try to access dashboard
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/.*login/);
    });
  });
});
