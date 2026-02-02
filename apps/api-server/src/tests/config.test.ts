import { describe, it, expect } from "vitest";
import { AUTH_CONSTANTS, API_CONSTANTS } from "@washwise/config";

describe("Config Constants", () => {
  describe("AUTH_CONSTANTS", () => {
    it("should have correct access token expiration", () => {
      expect(AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_SECONDS).toBe(15 * 60); // 15 minutes
    });

    it("should have correct refresh token expiration", () => {
      expect(AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_SECONDS).toBe(7 * 24 * 60 * 60); // 7 days
    });

    it("should have refresh cookie name defined", () => {
      expect(AUTH_CONSTANTS.REFRESH_COOKIE_NAME).toBe("washwise_refresh_token");
    });
  });

  describe("API_CONSTANTS", () => {
    it("should have correct API prefix", () => {
      expect(API_CONSTANTS.PREFIX).toBe("/api/v1");
    });

    it("should have rate limiting configured", () => {
      expect(API_CONSTANTS.RATE_LIMIT.MAX).toBeGreaterThan(0);
      expect(API_CONSTANTS.RATE_LIMIT.WINDOW_MS).toBeGreaterThan(0);
    });

    it("should have pagination defaults", () => {
      expect(API_CONSTANTS.PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(API_CONSTANTS.PAGINATION.DEFAULT_LIMIT).toBe(20);
      expect(API_CONSTANTS.PAGINATION.MAX_LIMIT).toBe(100);
    });
  });
});
