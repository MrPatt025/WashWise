"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Play,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// ANIMATED GRADIENT ORB
// ============================================================================

function GradientOrb({
  className,
  delay = 0,
  size = "lg",
}: {
  className?: string;
  delay?: number;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "h-[200px] w-[200px]",
    md: "h-[350px] w-[350px]",
    lg: "h-[500px] w-[500px]",
    xl: "h-[700px] w-[700px]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.1, 1],
        x: [0, 30, 0],
        y: [0, -20, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        repeatType: "reverse",
        delay,
        ease: "easeInOut",
      }}
      className={cn("absolute rounded-full blur-[100px]", sizes[size], className)}
    />
  );
}

// ============================================================================
// FLOATING BADGE COMPONENT
// ============================================================================

interface FloatingBadgeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "left" | "right";
}

function FloatingBadge({
  children,
  className,
  delay = 0,
  direction = "right",
}: FloatingBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction === "right" ? 50 : -50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
      className={cn(
        "absolute hidden rounded-2xl border border-white/20 bg-white/90 p-4 shadow-2xl backdrop-blur-xl lg:block",
        "dark:border-slate-700/50 dark:bg-slate-800/90",
        className
      )}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// ANIMATED TEXT WITH TYPING EFFECT
// ============================================================================

function TypewriterText({ words }: { words: string[] }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const currentWord = words[currentIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (displayText.length < currentWord.length) {
            setDisplayText(currentWord.slice(0, displayText.length + 1));
          } else {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText(displayText.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? 50 : 100
    );

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, words]);

  return (
    <span className="relative">
      <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
        {displayText}
      </span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="ml-1 inline-block h-[1em] w-[3px] bg-gradient-to-b from-violet-600 to-indigo-600"
      />
    </span>
  );
}

// ============================================================================
// ANIMATED COUNTER
// ============================================================================

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  React.useEffect(() => {
    if (!isVisible) {
      return;
    }

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
      }
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ============================================================================
// DASHBOARD PREVIEW WITH ANIMATION
// ============================================================================

function DashboardPreview() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);

  const springConfig = { damping: 25, stiffness: 150 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const stats = [
    { label: "Total Machines", value: "24", trend: "+3", color: "violet" },
    { label: "Available Now", value: "18", trend: null, color: "emerald" },
    { label: "In Use", value: "5", trend: null, color: "amber" },
    { label: "Today's Revenue", value: "฿12,847", trend: "+18%", color: "blue" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
        rotateX: springRotateX,
        rotateY: springRotateY,
      }}
      className="relative mx-auto mt-16 max-w-5xl"
    >
      {/* Glow effect */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-cyan-500/20 blur-2xl" />

      {/* Main dashboard container */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex gap-1.5">
            <motion.div whileHover={{ scale: 1.2 }} className="h-3 w-3 rounded-full bg-red-400" />
            <motion.div whileHover={{ scale: 1.2 }} className="h-3 w-3 rounded-full bg-amber-400" />
            <motion.div whileHover={{ scale: 1.2 }} className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-500 shadow-inner dark:bg-slate-700/50">
              <Shield className="h-3 w-3 text-green-500" />
              <span>app.washwise.io/dashboard</span>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 dark:from-slate-900 dark:to-slate-800/50">
          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-lg dark:bg-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </span>
                  {stat.trend && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {stat.trend}
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "mt-2 text-2xl font-bold",
                    stat.color === "violet" && "text-violet-600",
                    stat.color === "emerald" && "text-emerald-600",
                    stat.color === "amber" && "text-amber-600",
                    stat.color === "blue" && "text-blue-600"
                  )}
                >
                  {stat.value}
                </div>
                <div
                  className={cn(
                    "absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 transition-all group-hover:opacity-20",
                    stat.color === "violet" && "bg-violet-500",
                    stat.color === "emerald" && "bg-emerald-500",
                    stat.color === "amber" && "bg-amber-500",
                    stat.color === "blue" && "bg-blue-500"
                  )}
                />
              </motion.div>
            ))}
          </div>

          {/* Chart section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Weekly Revenue
              </span>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <BarChart3 className="h-3 w-3" />
                <span>+23% from last week</span>
              </div>
            </div>
            <div className="flex h-32 items-end gap-2">
              {[45, 72, 58, 89, 65, 95, 82].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 1.2 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                  className="relative flex-1 rounded-t-lg bg-gradient-to-t from-violet-600 to-indigo-500"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 + i * 0.1 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-slate-500"
                  >
                    ฿{Math.floor(h * 150).toLocaleString()}
                  </motion.div>
                </motion.div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating notification badges */}
      <FloatingBadge className="-right-6 top-1/4" delay={1.5}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Alert Received
            </p>
            <p className="text-xs text-slate-500">Machine #7 needs attention</p>
          </div>
        </div>
      </FloatingBadge>

      <FloatingBadge className="-left-6 bottom-1/3" delay={1.8} direction="left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-500">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-600">Revenue Up 23%</p>
            <p className="text-xs text-slate-500">Compared to last week</p>
          </div>
        </div>
      </FloatingBadge>
    </motion.div>
  );
}

// ============================================================================
// HERO SECTION COMPONENT
// ============================================================================

export interface HeroSectionProps {
  badge?: {
    text: string;
    icon?: React.ReactNode;
    href?: string;
  };
  title: string;
  rotatingWords?: string[];
  description: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
    icon?: React.ReactNode;
  };
  features?: string[];
  showDashboardPreview?: boolean;
}

export function HeroSection({
  badge = { text: "Now with AI-Powered Predictions", icon: <Sparkles className="h-4 w-4" /> },
  title = "Monitor Your Laundromat",
  rotatingWords = ["From Anywhere", "In Real-Time", "With AI", "Effortlessly"],
  description = "Real-time machine status, revenue tracking, and AI-powered alerts—so you can run your business without being there.",
  primaryCTA = { text: "Start Free Trial", href: "/register" },
  secondaryCTA = { text: "Watch Demo", href: "#demo", icon: <Play className="h-4 w-4" /> },
  features = ["No credit card required", "14-day free trial", "Setup in 5 minutes"],
  showDashboardPreview = true,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-screen overflow-hidden pt-24 sm:pt-32">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/80 via-white to-white dark:from-violet-950/20 dark:via-slate-950 dark:to-slate-950" />

        {/* Animated gradient orbs */}
        <GradientOrb
          className="left-[10%] top-[5%] bg-violet-400/30 dark:bg-violet-600/20"
          size="xl"
          delay={0}
        />
        <GradientOrb
          className="right-[15%] top-[20%] bg-indigo-400/25 dark:bg-indigo-600/15"
          size="lg"
          delay={2}
        />
        <GradientOrb
          className="bottom-[20%] left-[30%] bg-cyan-400/20 dark:bg-cyan-600/10"
          size="md"
          delay={4}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-4xl text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href={badge.href ?? "#"}
              className="group inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
            >
              {badge.icon && (
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {badge.icon}
                </motion.span>
              )}
              <span>{badge.text}</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-8 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            {title}{" "}
            <span className="block sm:inline">
              <TypewriterText words={rotatingWords} />
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mx-auto mt-8 max-w-2xl text-lg text-slate-600 dark:text-slate-400 sm:text-xl"
          >
            {description}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href={primaryCTA.href}>
              <Button
                size="lg"
                className="group h-14 bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-base font-semibold shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/40"
              >
                {primaryCTA.text}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            {secondaryCTA ? (
              <Link href={secondaryCTA.href}>
                <Button
                  size="lg"
                  variant="outline"
                  className="group h-14 border-slate-300 px-8 text-base font-medium transition-all hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:hover:border-violet-700 dark:hover:bg-violet-950/50"
                >
                  {secondaryCTA.icon ? (
                    <span className="mr-2 transition-transform group-hover:scale-110">
                      {secondaryCTA.icon}
                    </span>
                  ) : null}
                  {secondaryCTA.text}
                </Button>
              </Link>
            ) : null}
          </motion.div>

          {/* Features list */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
              >
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        {showDashboardPreview && <DashboardPreview />}
      </div>
    </section>
  );
}

export default HeroSection;
