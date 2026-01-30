"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1
              style={{ fontSize: "3rem", fontWeight: "bold", color: "#dc2626" }}
            >
              500
            </h1>
            <h2
              style={{
                marginTop: "1rem",
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Internal Server Error
            </h2>
            <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>
              Something went wrong on our end.
            </p>
            <button
              onClick={() => reset()}
              style={{
                marginTop: "1.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
