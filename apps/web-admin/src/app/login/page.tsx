"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginRequestSchema, type LoginRequest } from "@washwise/types";
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
import { Loader2, WashingMachine, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Error codes from backend
type LoginErrorCode =
  | "INVALID_CREDENTIALS"
  | "MULTIPLE_TENANTS"
  | "TENANT_NOT_FOUND"
  | "ACCOUNT_LOCKED"
  | "UNKNOWN";

/**
 * Map API error codes to user-friendly messages
 */
function mapLoginError(error: any): {
  message: string;
  code: LoginErrorCode;
  focusField?: string;
} {
  const code = (error?.response?.data?.code as LoginErrorCode) || "UNKNOWN";
  const serverMessage = error?.response?.data?.message;

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
    } catch (err: any) {
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary p-3">
              <WashingMachine className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your WashWise account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
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
                placeholder="demo, my-laundry-bkk"
                {...register("tenantSlug")}
                ref={(e) => {
                  register("tenantSlug").ref(e);
                  (slugInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
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
                placeholder="admin@example.com"
                {...register("email")}
                ref={(e) => {
                  register("email").ref(e);
                  (emailInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
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
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
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
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
