"use client";

import { useEffect } from "react";

/**
 * Global error boundary - catches errors in root layout
 * Uses inline styles since global CSS may not be available
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fafafa",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: "1rem",
          }}
        >
          {/* Error icon */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Error code */}
          <h1
            style={{
              fontSize: "4rem",
              fontWeight: "800",
              color: "#e5e7eb",
              margin: 0,
              letterSpacing: "-0.05em",
            }}
          >
            500
          </h1>

          {/* Title */}
          <h2
            style={{
              marginTop: "0.5rem",
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#111827",
            }}
          >
            Something went wrong
          </h2>

          {/* Description */}
          <p
            style={{
              marginTop: "0.5rem",
              color: "#6b7280",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            We encountered a critical error. Our team has been notified and is working to fix the
            issue.
          </p>

          {/* Actions */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.875rem",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "transparent",
                color: "#374151",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.875rem",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Reload Page
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "transparent",
                color: "#6b7280",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.875rem",
              }}
            >
              Go Home
            </button>
          </div>

          {/* Error digest (for support) */}
          {error.digest && (
            <p
              style={{
                marginTop: "2rem",
                fontSize: "0.75rem",
                color: "#9ca3af",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
