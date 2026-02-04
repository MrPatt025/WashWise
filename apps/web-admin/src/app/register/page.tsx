"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type RegisterRequest, RegisterRequestSchema } from "@washwise/types";
import { useRegister } from "@/hooks/use-auth";
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
import {
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Loader2,
  Shield,
  Sparkles,
  WashingMachine,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Error codes from backend
type ApiErrorCode =
  | "MULTIPLE_TENANTS"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "DUPLICATE_EMAIL"
  | "UNKNOWN";

/**
 * Convert a string to a URL-friendly slug
 */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Generate alternative slug suggestions for conflict resolution
 */
function generateSlugSuggestions(baseSlug: string): string[] {
  const suggestions: string[] = [];

  // Numbered suffixes
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${baseSlug}-${i}`);
  }

  // Location-based suffixes
  const locationSuffixes = ["bkk", "main", "central", "new"];
  for (const suffix of locationSuffixes) {
    if (!baseSlug.includes(suffix)) {
      suggestions.push(`${baseSlug}-${suffix}`);
      break;
    }
  }

  // Random short code
  const randomCode = Math.random().toString(36).substring(2, 5);
  suggestions.push(`${baseSlug}-${randomCode}`);

  return suggestions.slice(0, 4);
}

/**
 * Map API error codes to user-friendly messages and UI actions
 */
function mapApiError(error: any): {
  message: string;
  code: ApiErrorCode;
  suggestions?: string[];
  focusField?: string;
} {
  const code = (error?.response?.data?.code as ApiErrorCode) || "UNKNOWN";
  const serverMessage = error?.response?.data?.message;
  const field = error?.response?.data?.field;

  switch (code) {
    case "MULTIPLE_TENANTS":
      return {
        code,
        message:
          "Please specify a unique tenant slug for your laundromat. The auto-generated slug may already exist.",
        focusField: "tenantSlug",
      };

    case "CONFLICT":
      return {
        code,
        message:
          "This laundromat name or slug already exists. Please try one of the suggested alternatives or enter a different one.",
        focusField: "tenantSlug",
      };

    case "DUPLICATE_EMAIL":
      return {
        code,
        message: "An account with this email already exists. Please sign in instead.",
        focusField: "email",
      };

    case "VALIDATION_ERROR":
      return {
        code,
        message: serverMessage || "Please check your input and try again.",
        focusField: field,
      };

    default:
      return {
        code: "UNKNOWN",
        message: serverMessage || "Registration failed. Please try again.",
      };
  }
}

export default function RegisterPage() {
  const [error, setError] = useState<{
    message: string;
    code: ApiErrorCode;
  } | null>(null);
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const slugInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: {
      tenantSlug: "",
    },
  });

  // Watch tenantName and tenantSlug
  const tenantNameValue = watch("tenantName");
  const tenantSlugValue = watch("tenantSlug");

  // Auto-generate slug from tenant name if not manually edited
  useEffect(() => {
    if (tenantNameValue && !slugManuallyEdited) {
      setValue("tenantSlug", slugify(tenantNameValue));
    }
  }, [tenantNameValue, setValue, slugManuallyEdited]);

  // Generate suggestions when slug changes (for conflict cases)
  useEffect(() => {
    if (tenantSlugValue && error?.code === "CONFLICT") {
      setSlugSuggestions(generateSlugSuggestions(tenantSlugValue));
    }
  }, [tenantSlugValue, error?.code]);

  const handleSlugChange = () => {
    setSlugManuallyEdited(true);
    // Clear conflict error when user starts typing
    if (error?.code === "CONFLICT" || error?.code === "MULTIPLE_TENANTS") {
      setError(null);
      setSlugSuggestions([]);
    }
  };

  const handleSlugSuggestionClick = (suggestion: string) => {
    setValue("tenantSlug", suggestion);
    setSlugManuallyEdited(true);
    setError(null);
    setSlugSuggestions([]);
  };

  const onSubmit = async (data: RegisterRequest) => {
    setError(null);
    setSlugSuggestions([]);

    // Ensure tenantSlug is set
    const payload: RegisterRequest = {
      ...data,
      tenantSlug: data.tenantSlug || slugify(data.tenantName),
    };

    try {
      await registerMutation.mutateAsync(payload);
    } catch (err: any) {
      const mappedError = mapApiError(err);
      setError({ message: mappedError.message, code: mappedError.code });

      // Generate slug suggestions for conflict errors
      if (mappedError.code === "CONFLICT" || mappedError.code === "MULTIPLE_TENANTS") {
        const baseSlug = payload.tenantSlug || slugify(payload.tenantName);
        setSlugSuggestions(generateSlugSuggestions(baseSlug));
      }

      // Focus the relevant field
      if (mappedError.focusField) {
        setTimeout(() => {
          if (mappedError.focusField === "tenantSlug") {
            slugInputRef.current?.focus();
            slugInputRef.current?.select();
          } else if (mappedError.focusField === "email") {
            emailInputRef.current?.focus();
          } else {
            setFocus(mappedError.focusField as keyof RegisterRequest);
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
        <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <Link href="/" className="mb-12 flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <WashingMachine className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold">WashWise</span>
          </Link>

          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            Get Started
            <br />
            in Minutes
          </h1>
          <p className="mt-4 max-w-md text-lg text-violet-100">
            Join hundreds of laundromat owners who have transformed their operations with WashWise.
          </p>

          {/* Benefits */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-400/20 p-1">
                <CheckCircle className="h-5 w-5 text-green-300" />
              </div>
              <span>Free 14-day trial, no credit card</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-400/20 p-1">
                <CheckCircle className="h-5 w-5 text-green-300" />
              </div>
              <span>Setup in less than 5 minutes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-400/20 p-1">
                <CheckCircle className="h-5 w-5 text-green-300" />
              </div>
              <span>Cancel anytime, no questions asked</span>
            </div>
          </div>

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
        </div>
      </div>

      {/* Right Side - Registration Form */}
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
            <CardTitle className="text-2xl font-bold">Create account</CardTitle>
            <CardDescription>Start managing your laundromat with WashWise</CardDescription>
          </CardHeader>
          <form id="register-form" name="register-form" onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {error.code === "CONFLICT" && "Name/Slug Already Taken"}
                    {error.code === "MULTIPLE_TENANTS" && "Slug Required"}
                    {error.code === "DUPLICATE_EMAIL" && "Email Already Registered"}
                    {error.code === "VALIDATION_ERROR" && "Validation Error"}
                    {error.code === "UNKNOWN" && "Registration Failed"}
                  </AlertTitle>
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              {/* Laundromat Name */}
              <div className="space-y-2">
                <Label htmlFor="tenantName">Laundromat Name</Label>
                <Input
                  id="tenantName"
                  placeholder="My Laundromat"
                  autoComplete="organization"
                  {...register("tenantName")}
                />
                {errors.tenantName && (
                  <p className="text-sm text-destructive">{errors.tenantName.message}</p>
                )}
              </div>

              {/* Laundromat Slug */}
              <div className="space-y-2">
                <Label htmlFor="tenantSlug">Laundromat Slug</Label>
                <Input
                  id="tenantSlug"
                  placeholder="my-laundromat"
                  autoComplete="off"
                  {...register("tenantSlug", { onChange: handleSlugChange })}
                  ref={(e) => {
                    register("tenantSlug").ref(e);
                    (slugInputRef as any).current = e;
                  }}
                  className={
                    error?.code === "CONFLICT" || error?.code === "MULTIPLE_TENANTS"
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly identifier (auto-generated from name)
                </p>
                {errors.tenantSlug && (
                  <p className="text-sm text-destructive">{errors.tenantSlug.message}</p>
                )}

                {/* Slug Suggestions */}
                {slugSuggestions.length > 0 && (
                  <div className="space-y-2 rounded-md bg-muted p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span>Try one of these available slugs:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slugSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSlugSuggestionClick(suggestion)}
                          className="text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    autoComplete="given-name"
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    autoComplete="family-name"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                  ref={(e) => {
                    register("email").ref(e);
                    (emailInputRef as any).current = e;
                  }}
                  className={
                    error?.code === "DUPLICATE_EMAIL"
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                {error?.code === "DUPLICATE_EMAIL" && (
                  <p className="text-sm text-primary">
                    <Link href="/login" className="underline hover:no-underline">
                      Sign in to your existing account →
                    </Link>
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-violet-600 hover:text-violet-700 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
