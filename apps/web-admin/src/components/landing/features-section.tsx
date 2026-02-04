"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useTransform } from "framer-motion";
import {
  Activity,
  Bell,
  Cloud,
  Cpu,
  Globe,
  Lock,
  type LucideIcon,
  Shield,
  Smartphone,
  TrendingUp,
  Wifi,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// FEATURE CARD WITH 3D HOVER EFFECT
// ============================================================================

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);
  const brightness = useTransform(mouseX, [-0.5, 0, 0.5], [0.95, 1, 1.05]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        filter: `brightness(${brightness})`,
      }}
      className="group relative"
    >
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300",
          "hover:border-slate-300/80 hover:shadow-xl",
          "dark:border-slate-700/60 dark:bg-slate-800/80 dark:hover:border-slate-600/80"
        )}
      >
        {/* Top gradient line */}
        <div
          className={cn(
            "absolute left-0 top-0 h-1 w-full bg-gradient-to-r opacity-80",
            feature.gradient
          )}
        />

        {/* Glowing background on hover */}
        <div
          className={cn(
            "absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30",
            feature.iconBg
          )}
        />

        {/* Icon */}
        <div
          className={cn(
            "relative z-10 mb-4 inline-flex rounded-xl p-3 shadow-lg transition-transform duration-300 group-hover:scale-110",
            `bg-gradient-to-br ${feature.gradient}`
          )}
        >
          <feature.icon className="h-6 w-6 text-white" />
        </div>

        {/* Content */}
        <h3 className="relative z-10 mb-2 text-lg font-semibold text-slate-900 dark:text-white">
          {feature.title}
        </h3>
        <p className="relative z-10 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {feature.description}
        </p>

        {/* Decorative element */}
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
          className="absolute bottom-4 right-4 opacity-10"
        >
          <feature.icon className="h-20 w-20" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// BENTO GRID FEATURE CARD
// ============================================================================

interface BentoFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  span?: "normal" | "wide" | "tall";
  visual?: React.ReactNode;
}

function BentoCard({ feature, index }: { feature: BentoFeature; index: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const spanClasses = {
    normal: "",
    wide: "md:col-span-2",
    tall: "md:row-span-2",
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl",
        "dark:border-slate-700/60 dark:bg-slate-800/80",
        spanClasses[feature.span ?? "normal"]
      )}
    >
      {/* Animated gradient background */}
      <motion.div
        className={cn(
          "absolute -right-1/4 -top-1/4 h-1/2 w-1/2 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-50",
          `bg-gradient-to-br ${feature.gradient}`
        )}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10">
        {/* Icon */}
        <div
          className={cn(
            "mb-4 inline-flex rounded-2xl p-3 shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110",
            `bg-gradient-to-br ${feature.gradient}`
          )}
        >
          <feature.icon className="h-6 w-6 text-white" />
        </div>

        {/* Content */}
        <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {feature.description}
        </p>

        {/* Optional visual element */}
        {feature.visual && <div className="mt-4">{feature.visual}</div>}
      </div>
    </motion.div>
  );
}

// ============================================================================
// LIVE ACTIVITY VISUAL
// ============================================================================

function LiveActivityVisual() {
  return (
    <div className="mt-4 space-y-2">
      {[
        { machine: "Washer #3", status: "Running", time: "12:34", color: "emerald" },
        { machine: "Dryer #7", status: "Available", time: "12:32", color: "blue" },
        { machine: "Washer #1", status: "Alert", time: "12:30", color: "amber" },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-700/50"
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                item.color === "emerald" && "animate-pulse bg-emerald-500",
                item.color === "blue" && "bg-blue-500",
                item.color === "amber" && "animate-pulse bg-amber-500"
              )}
            />
            <span className="font-medium">{item.machine}</span>
          </div>
          <span className="text-slate-500">{item.status}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// REVENUE CHART VISUAL
// ============================================================================

function RevenueChartVisual() {
  return (
    <div className="mt-4">
      <div className="flex h-24 items-end gap-1">
        {[35, 52, 45, 68, 75, 62, 85, 78, 92, 88, 95, 100].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
            className="flex-1 rounded-t bg-gradient-to-t from-violet-600 to-indigo-400"
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>Jan</span>
        <span>Jun</span>
        <span>Dec</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN FEATURES SECTION
// ============================================================================

interface FeaturesSectionProps {
  variant?: "grid" | "bento";
  title?: string;
  subtitle?: string;
  description?: string;
}

const defaultFeatures: Feature[] = [
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description:
      "See which machines are running, available, or need attention—updated every second with live WebSocket connections.",
    gradient: "from-violet-500 to-purple-600",
    iconBg: "bg-violet-500",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description:
      "Get notified on your phone the moment something goes wrong. Push, SMS, LINE, or email—your choice.",
    gradient: "from-blue-500 to-cyan-600",
    iconBg: "bg-blue-500",
  },
  {
    icon: TrendingUp,
    title: "Revenue Analytics",
    description:
      "Track daily, weekly, and monthly earnings with beautiful visual reports and exportable data.",
    gradient: "from-emerald-500 to-green-600",
    iconBg: "bg-emerald-500",
  },
  {
    icon: Cpu,
    title: "AI Predictions",
    description:
      "Our AI analyzes patterns to warn you about potential failures—before they cost you money.",
    gradient: "from-orange-500 to-red-600",
    iconBg: "bg-orange-500",
  },
  {
    icon: Smartphone,
    title: "Mobile Dashboard",
    description:
      "Full control from your pocket. Check your laundromat while having coffee, anywhere in the world.",
    gradient: "from-pink-500 to-rose-600",
    iconBg: "bg-pink-500",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Bank-grade encryption, SOC 2 compliance, and GDPR ready. Your data stays your data.",
    gradient: "from-slate-600 to-slate-800",
    iconBg: "bg-slate-600",
  },
];

const bentoFeatures: BentoFeature[] = [
  {
    icon: Activity,
    title: "Live Activity Feed",
    description:
      "Real-time updates on all your machines. Know what's happening the moment it happens.",
    gradient: "from-violet-500 to-purple-600",
    span: "tall",
    visual: <LiveActivityVisual />,
  },
  {
    icon: TrendingUp,
    title: "Revenue Analytics",
    description: "Track earnings and identify trends with powerful analytics.",
    gradient: "from-emerald-500 to-green-600",
    span: "wide",
    visual: <RevenueChartVisual />,
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "AI-powered notifications before problems become costly.",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    icon: Cpu,
    title: "AI Predictions",
    description: "Machine learning that prevents downtime.",
    gradient: "from-orange-500 to-red-600",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "Bank-grade encryption and SOC 2 compliance. Your data is always secure.",
    gradient: "from-slate-600 to-slate-800",
  },
  {
    icon: Cloud,
    title: "Cloud-Native",
    description: "Fully managed infrastructure with 99.99% uptime SLA.",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    icon: Globe,
    title: "Multi-Location",
    description: "Manage unlimited locations from a single dashboard.",
    gradient: "from-indigo-500 to-violet-600",
  },
  {
    icon: Wifi,
    title: "IoT Ready",
    description: "Connect your machines with our IoT sensors or existing hardware.",
    gradient: "from-teal-500 to-emerald-600",
  },
];

export function FeaturesSection({
  variant = "grid",
  title = "Everything you need to run smarter",
  subtitle = "Features",
  description = "From real-time monitoring to AI predictions, WashWise gives you the tools to maximize efficiency and revenue.",
}: FeaturesSectionProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="features"
      className="relative scroll-mt-20 overflow-hidden py-20 lg:py-28"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-slate-50/50 dark:bg-slate-900/50" />
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.3) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
          >
            <Zap className="h-4 w-4" />
            {subtitle}
          </motion.span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{description}</p>
        </motion.div>

        {/* Features Grid or Bento */}
        <div className="mt-16">
          {variant === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {defaultFeatures.map((feature, i) => (
                <FeatureCard key={feature.title} feature={feature} index={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {bentoFeatures.map((feature, i) => (
                <BentoCard key={feature.title} feature={feature} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
