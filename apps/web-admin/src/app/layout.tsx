import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Force dynamic rendering for all pages - prevents static generation issues with React Query
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WashWise - Smart Laundromat Management",
  description: "Manage your laundromat with real-time IoT monitoring",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
