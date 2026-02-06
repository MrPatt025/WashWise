"use client";

export const dynamic = "force-dynamic";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginRequest, LoginRequestSchema } from "@washwise/types";
import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Shield, Sparkles, WashingMachine, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Error codes from backend
type LoginErrorCode =
  | "INVALID_CREDENTIALS"
  | "MULTIPLE_TENANTS"
  | "TENANT_NOT_FOUND"
  | "ACCOUNT_LOCKED"
  | "UNKNOWN";

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

interface ApiError {
  response?: {
    data?: ApiErrorResponse;
  };
}

/**
 * Map API error codes to user-friendly messages
 */
function mapLoginError(error: unknown): {
  message: string;
  code: LoginErrorCode;
  focusField?: string;
} {
  const apiError = error as ApiError | undefined;
  const rawCode = apiError?.response?.data?.code;
  const code: LoginErrorCode =
    rawCode === "INVALID_CREDENTIALS" ||
    rawCode === "MULTIPLE_TENANTS" ||
    rawCode === "TENANT_NOT_FOUND" ||
    rawCode === "ACCOUNT_LOCKED"
      ? rawCode
      : "UNKNOWN";
  const serverMessage = apiError?.response?.data?.message;

  switch (code) {
    case "MULTIPLE_TENANTS":
      return {
        code,
        message:
          "Your email is associated with multiple laundromats. Please specify the laundromat slug.",
        focusField: "tenantSlug",
      };

    case "TENANT_NOT_FOUND":
      return {
        code,
        message: "Laundromat not found. Please check the slug and try again.",
        focusField: "tenantSlug",
      };

    case "INVALID_CREDENTIALS":
      return {
        code,
        message: "Invalid email or password. Please try again.",
        focusField: "email",
      };

    case "ACCOUNT_LOCKED":
      return {
        code,
        message:
          "Your account has been locked due to too many failed attempts. Please try again later.",
      };

    default:
      return {
        code: "UNKNOWN",
        message: serverMessage || "Login failed. Please try again.",
      };
  }
}

export default function LoginPage() {
  const [error, setError] = useState<{
    message: string;
    code: LoginErrorCode;
  } | null>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    setError(null);
    try {
      await loginMutation.mutateAsync(data);
    } catch (err: unknown) {
      const mappedError = mapLoginError(err);
      setError({ message: mappedError.message, code: mappedError.code });

      // Focus the relevant field
      if (mappedError.focusField) {
        setTimeout(() => {
          if (mappedError.focusField === "tenantSlug") {
            slugInputRef.current?.focus();
            slugInputRef.current?.select();
          } else if (mappedError.focusField === "email") {
            emailInputRef.current?.focus();
          } else {
            setFocus(mappedError.focusField as keyof LoginRequest);
          }
        }, 100);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-600 lg:flex lg:w-1/2">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Floating Shapes */}
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <Link href="/" className="mb-12 flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <WashingMachine className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold">WashWise</span>
          </Link>

          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            Smart Laundromat
            <br />
            Management
          </h1>
          <p className="mt-4 max-w-md text-lg text-violet-100">
            Transform your laundromat operations with AI-powered monitoring, real-time analytics,
            and smart automation.
          </p>

          {/* Feature Pills */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI Predictions</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Real-time Updates</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-violet-200">Laundromats</div>
            </div>
            <div>
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm text-violet-200">Machines</div>
            </div>
            <div>
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-sm text-violet-200">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-4 dark:bg-slate-950 lg:w-1/2">
        {/* Mobile Logo */}
        <div className="absolute left-4 top-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-2">
              <WashingMachine className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold">WashWise</span>
          </Link>
        </div>

        <Card className="w-full max-w-md border-0 bg-white shadow-xl dark:bg-slate-900">
          <CardHeader className="space-y-1 pb-2 text-center">
            <div className="mb-2 flex justify-center lg:hidden">
              <div className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-3">
                <WashingMachine className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to your WashWise account</CardDescription>
          </CardHeader>
          <form id="login-form" name="login-form" onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {error.code === "INVALID_CREDENTIALS" && "Invalid Credentials"}
                    {error.code === "MULTIPLE_TENANTS" && "Multiple Laundromats"}
                    {error.code === "TENANT_NOT_FOUND" && "Laundromat Not Found"}
                    {error.code === "ACCOUNT_LOCKED" && "Account Locked"}
                    {error.code === "UNKNOWN" && "Login Failed"}
                  </AlertTitle>
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              {/* Laundromat Slug */}
              <div className="space-y-2">
                <Label htmlFor="tenantSlug">Laundromat Slug</Label>
                <Input
                  id="tenantSlug"
                  autoComplete="organization"
                  placeholder="demo, my-laundry-bkk"
                  {...register("tenantSlug")}
                  ref={(e) => {
                    register("tenantSlug").ref(e);
                    slugInputRef.current = e;
                  }}
                  className={
                    error?.code === "MULTIPLE_TENANTS" || error?.code === "TENANT_NOT_FOUND"
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.tenantSlug && (
                  <p className="text-sm text-destructive">{errors.tenantSlug.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  The slug you used when registering your laundromat (e.g.{" "}
                  <code className="rounded bg-muted px-1">demo</code>).
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  {...register("email")}
                  ref={(e) => {
                    register("email").ref(e);
                    emailInputRef.current = e;
                  }}
                  className={
                    error?.code === "INVALID_CREDENTIALS"
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-violet-600 hover:text-violet-700 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
