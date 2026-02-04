import { createHash, randomUUID } from "node:crypto";

import { hash, verify } from "argon2";
import jwt from "jsonwebtoken";

import { AUTH_CONSTANTS } from "@washwise/config";
import { prisma, type Prisma } from "@washwise/database";
import type { AuthResponse, LoginRequest, RegisterRequest, TokenPayload } from "@washwise/types";

import env from "../config/env.js";

// Helper to hash refresh token for storage
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Use Prisma's type utility for User with Tenant relation
type UserWithTenant = Prisma.UserGetPayload<{
  include: { tenant: true };
}>;

export class AuthService {
  /**
   * Register a new user and tenant
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if email already exists globally (for simplicity; could be per-tenant)
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password with Argon2id
    const hashedPassword = await hash(data.password);

    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Generate slug from tenant name
      const baseSlug =
        data.tenantSlug ||
        data.tenantName
          .toLowerCase()
          .replaceAll(/[^a-z0-9]+/g, "-")
          .replaceAll(/(?:^-)|(?:-$)/g, "");
      let slug = baseSlug;
      let counter = 0;

      // Ensure unique slug
      while (await tx.tenant.findUnique({ where: { slug } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }

      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          slug,
          plan: "FREE",
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: `${data.firstName} ${data.lastName}`,
          role: "OWNER", // First user is owner
          tenantId: tenant.id,
        },
        include: { tenant: true },
      });

      return user;
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(result);

    return this.buildAuthResponse(result, tokens.accessToken);
  }

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse & { refreshToken: string }> {
    const user = await prisma.user.findFirst({
      where: { email: data.email },
      include: { tenant: true },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValid = await verify(user.password, data.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Generate new token pair with new family ID
    const tokens = await this.generateTokenPair(user);

    return {
      ...this.buildAuthResponse(user, tokens.accessToken),
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Refresh access token with rotation and reuse detection
   * CRITICAL: Implements token theft detection via familyId
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const hashedToken = hashToken(refreshToken);

    // Find the refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { hashedToken },
      include: {
        user: {
          include: { tenant: true },
        },
      },
    });

    // Token not found
    if (!storedToken) {
      throw new Error("Invalid refresh token");
    }

    // Check if token has been revoked (REUSE DETECTION)
    if (storedToken.revoked) {
      // SECURITY BREACH DETECTED: Token reuse attempt!
      // Revoke ALL tokens in this family immediately
      await this.revokeTokenFamily(storedToken.familyId);
      throw new Error("Token reuse detected - all sessions revoked");
    }

    // Check if token has expired
    if (storedToken.expiresAt < new Date()) {
      throw new Error("Refresh token expired");
    }

    // Mark current token as revoked (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Generate new token pair with SAME family ID (maintains the chain)
    const tokens = await this.generateTokenPair(storedToken.user, storedToken.familyId);

    return tokens;
  }

  /**
   * Logout - revoke all tokens in the family
   */
  async logout(refreshToken: string): Promise<void> {
    const hashedToken = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { hashedToken },
    });

    if (storedToken) {
      await this.revokeTokenFamily(storedToken.familyId);
    }
  }

  /**
   * Revoke all tokens in a family (for logout or theft detection)
   */
  private async revokeTokenFamily(familyId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { familyId },
      data: { revoked: true },
    });
  }

  /**
   * Generate access and refresh token pair
   */
  private async generateTokenPair(user: UserWithTenant, familyId?: string): Promise<TokenPair> {
    // Create new family ID if not provided (new login)
    const tokenFamilyId = familyId ?? randomUUID();

    // Generate access token (short-lived, stored in memory)
    const accessPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_SECONDS,
    });

    // Generate refresh token (long-lived, stored in httpOnly cookie)
    const refreshToken = randomUUID();
    const hashedRefreshToken = hashToken(refreshToken);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        hashedToken: hashedRefreshToken,
        userId: user.id,
        familyId: tokenFamilyId,
        expiresAt: new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_SECONDS * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Build auth response object
   */
  private buildAuthResponse(user: UserWithTenant, accessToken: string): AuthResponse {
    // Split the name into firstName and lastName
    const nameParts = user.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        fullName: user.name,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
        },
      },
    };
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}

export default AuthService;
