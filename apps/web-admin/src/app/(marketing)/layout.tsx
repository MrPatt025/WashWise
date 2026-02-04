import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WashWise - Smart Laundromat Management Platform",
  description:
    "Transform your laundromat with AI-powered management. Real-time monitoring, smart pricing, and seamless customer experience.",
  keywords: [
    "laundromat",
    "laundry management",
    "smart laundry",
    "IoT laundromat",
    "laundry software",
  ],
  openGraph: {
    title: "WashWise - Smart Laundromat Management",
    description: "Transform your laundromat with AI-powered management",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
