"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle,
  ChevronRight,
  Cpu,
  Globe,
  HelpCircle,
  Menu,
  MessageCircle,
  Minus,
  Play,
  Plus,
  Quote,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  WashingMachine,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// SCROLL PROGRESS INDICATOR
// ============================================================================

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[100] h-1 origin-left bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400"
      style={{ scaleX }}
    />
  );
}

// ============================================================================
// CURSOR GLOW EFFECT (Premium)
// ============================================================================

function CursorGlow() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 200);
      mouseY.set(e.clientY - 200);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (!mounted) {
    return null;
  }

  return (
    <motion.div
      className="pointer-events-none fixed z-30 hidden rounded-full opacity-20 blur-3xl lg:block"
      style={{
        x,
        y,
        width: 400,
        height: 400,
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
      }}
    />
  );
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  brand: {
    name: "WashWise",
    tagline: "Smart laundromat management",
    description: "Enterprise-grade IoT platform for modern laundromats",
  },
  stats: {
    laundromats: 500,
    machines: 10000,
    uptime: 99.9,
    revenueIncrease: 35,
  },
  pricing: {
    currency: "฿",
    starter: 1500,
    professional: 4500,
  },
};

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

function useInViewOnce(threshold = 0.1) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
}: {
  end: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInViewOnce();

  useEffect(() => {
    if (!isInView) {
      return;
    }

    let startTime: number;
    const duration = 2000;

    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
      }
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, isInView]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// Typewriter effect for hero
function TypewriterText({ words }: { words: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
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
// NAVIGATION
// ============================================================================

function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        isScrolled
          ? "bg-white/80 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:bg-slate-950/80"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 transition-shadow group-hover:shadow-xl group-hover:shadow-violet-500/40"
          >
            <WashingMachine className="h-5 w-5 text-white" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight">{CONFIG.brand.name}</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              <span className="relative z-10">{link.name}</span>
              <motion.div
                className="absolute inset-0 rounded-lg bg-slate-100 dark:bg-slate-800"
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{ originX: 0.5, originY: 0.5 }}
              />
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-medium">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30">
                Start Free Trial
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
        </div>

        <button
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200/50 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="grid gap-2 pt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ============================================================================
// HERO SECTION
// ============================================================================

function HeroSection() {
  const { ref, isInView } = useInViewOnce();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const rotatingWords = ["From Anywhere", "In Real-Time", "With AI", "Effortlessly"];

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden pt-24 sm:pt-32">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/80 via-white to-white dark:from-violet-950/20 dark:via-slate-950 dark:to-slate-950" />

        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[10%] top-[5%] h-[600px] w-[600px] rounded-full bg-violet-400/25 blur-[120px]"
          style={{ transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` }}
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute right-[15%] top-[20%] h-[450px] w-[450px] rounded-full bg-indigo-400/20 blur-[100px]"
          style={{
            transform: `translate(${-mousePosition.x * 0.3}px, ${-mousePosition.y * 0.3}px)`,
          }}
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-[20%] left-[30%] h-[350px] w-[350px] rounded-full bg-cyan-400/15 blur-[80px]"
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-4xl text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="#features"
              className="group inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-100 hover:shadow-md dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>
              <span>Now with AI-Powered Predictions</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-8 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Monitor Your Laundromat{" "}
            <span className="block sm:inline">
              <TypewriterText words={rotatingWords} />
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mx-auto mt-8 max-w-2xl text-lg text-slate-600 dark:text-slate-400 sm:text-xl"
          >
            Real-time machine status, revenue tracking, and AI-powered alerts—so you can run your
            business without being there.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register">
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="group h-14 bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-base font-semibold shadow-xl shadow-violet-500/25 transition-all hover:shadow-2xl hover:shadow-violet-500/40"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                variant="outline"
                className="group h-14 border-slate-300 px-8 text-base font-medium transition-all hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:hover:border-violet-700 dark:hover:bg-violet-950/50"
              >
                <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Features list */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {["No credit card required", "14-day free trial", "Setup in 5 minutes"].map(
              (feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>{feature}</span>
                </motion.div>
              )
            )}
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <DashboardPreview isInView={isInView} />
      </div>
    </section>
  );
}

// ============================================================================
// DASHBOARD PREVIEW
// ============================================================================

function DashboardPreview({ isInView }: { isInView: boolean }) {
  const stats = [
    { label: "Total Machines", value: "24", trend: "+3", color: "violet" },
    { label: "Available Now", value: "18", trend: null, color: "emerald" },
    { label: "In Use", value: "5", trend: null, color: "amber" },
    { label: "Today's Revenue", value: "฿12,847", trend: "+18%", color: "blue" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="relative mx-auto mt-16 max-w-5xl"
    >
      {/* Glow effect */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-cyan-500/20 blur-2xl" />

      {/* Main dashboard container */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
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
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.8 + i * 0.1 }}
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
              </motion.div>
            ))}
          </div>

          {/* Chart section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 1.2 }}
            className="mt-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Weekly Revenue
              </span>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                <span>+23% from last week</span>
              </div>
            </div>
            <div className="flex h-32 items-end gap-2">
              {[45, 72, 58, 89, 65, 95, 82].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={isInView ? { height: `${h}%` } : { height: 0 }}
                  transition={{ delay: 1.4 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                  className="flex-1 rounded-t-lg bg-gradient-to-t from-violet-600 to-indigo-500"
                />
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
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.8 }}
        animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 50, scale: 0.8 }}
        transition={{ duration: 0.6, delay: 1.6, type: "spring" }}
        className="absolute -right-6 top-1/4 hidden rounded-2xl border border-white/20 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/90 lg:block"
      >
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
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
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -50, scale: 0.8 }}
        animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -50, scale: 0.8 }}
        transition={{ duration: 0.6, delay: 1.8, type: "spring" }}
        className="absolute -left-6 bottom-1/3 hidden rounded-2xl border border-white/20 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-800/90 lg:block"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-600">Revenue Up 23%</p>
              <p className="text-xs text-slate-500">Compared to last week</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// LOGO CLOUD
// ============================================================================

function LogoCloud() {
  const { ref, isInView } = useInViewOnce();

  const trustedBrands = [
    "CleanSpin",
    "FreshWash",
    "LaundryHub",
    "QuickClean",
    "SparkleWash",
    "WashPro",
  ];

  return (
    <section
      ref={ref}
      className="border-y border-slate-100 bg-slate-50/50 py-16 dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          className="text-center text-sm font-medium text-slate-500 dark:text-slate-400"
        >
          Trusted by{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">500+ laundromats</span>{" "}
          across Thailand and Southeast Asia
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-14 gap-y-8"
        >
          {trustedBrands.map((brand, i) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.1, color: "#7c3aed" }}
              className="text-xl font-bold tracking-tight text-slate-400 transition-colors"
            >
              {brand}
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400"
        >
          {[
            { icon: Shield, label: "SOC 2 Certified", color: "green" },
            { icon: Shield, label: "GDPR Compliant", color: "blue" },
            { icon: Shield, label: "256-bit SSL", color: "violet" },
          ].map((badge) => (
            <div
              key={badge.label}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5",
                badge.color === "green" &&
                  "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                badge.color === "blue" &&
                  "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                badge.color === "violet" &&
                  "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
              )}
            >
              <badge.icon className="h-3.5 w-3.5" />
              <span>{badge.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// PROBLEM-SOLUTION SECTION
// ============================================================================

function ProblemSolutionSection() {
  const { ref, isInView } = useInViewOnce();

  const problems = [
    { icon: "❌", text: "You find out machines are broken only after customers complain" },
    { icon: "❌", text: "Revenue tracking means counting coins at the end of the day" },
    { icon: "❌", text: "You drive to each location just to check if everything's working" },
  ];

  const solutions = [
    "See every machine status in real-time",
    "Get instant alerts on your phone",
    "Track revenue automatically",
    "Predict maintenance before breakdowns",
  ];

  return (
    <section ref={ref} className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold uppercase tracking-wider text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <X className="h-4 w-4" />
              The Problem
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Running a laundromat shouldn&apos;t mean being chained to it
            </h2>
            <div className="mt-8 space-y-4">
              {problems.map((problem, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-4 rounded-xl bg-red-50 p-4 dark:bg-red-900/10"
                >
                  <span className="text-xl">{problem.icon}</span>
                  <p className="text-slate-700 dark:text-slate-300">{problem.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              The Solution
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              WashWise gives you{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                eyes everywhere
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              One dashboard to monitor all your machines, track revenue, and prevent problems before
              they happen.
            </p>

            <div className="mt-8 space-y-4">
              {solutions.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <Link href="/register">
                <Button className="group bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES SECTION
// ============================================================================

function FeaturesSection() {
  const { ref, isInView } = useInViewOnce();

  const features = [
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description:
        "See which machines are running, available, or need attention—updated every second.",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: Bell,
      title: "Instant Alerts",
      description:
        "Get notified on your phone the moment something goes wrong, so you can fix it fast.",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      icon: TrendingUp,
      title: "Revenue Analytics",
      description: "Track daily, weekly, and monthly earnings with beautiful visual reports.",
      gradient: "from-emerald-500 to-green-600",
    },
    {
      icon: Cpu,
      title: "AI Predictions",
      description:
        "Our AI analyzes patterns to warn you about potential failures before they happen.",
      gradient: "from-orange-500 to-red-600",
    },
    {
      icon: Smartphone,
      title: "Mobile Dashboard",
      description: "Full control from your pocket. Check your laundromat while having coffee.",
      gradient: "from-pink-500 to-rose-600",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade encryption and SOC 2 compliance. Your data stays your data.",
      gradient: "from-slate-600 to-slate-800",
    },
  ];

  return (
    <section
      ref={ref}
      id="features"
      className="relative scroll-mt-20 overflow-hidden bg-slate-50/50 py-20 dark:bg-slate-900/50 lg:py-28"
    >
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.3) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <Zap className="h-4 w-4" />
            Features
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Everything you need to run smarter
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            From real-time monitoring to AI predictions, WashWise gives you the tools to maximize
            efficiency and revenue.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-700/60 dark:bg-slate-800/80"
            >
              <div
                className={cn(
                  "absolute left-0 top-0 h-1 w-full bg-gradient-to-r",
                  feature.gradient
                )}
              />

              <div
                className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
                style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
              />

              <div
                className={cn(
                  "mb-4 inline-flex rounded-xl p-3 shadow-lg transition-transform duration-300 group-hover:scale-110",
                  `bg-gradient-to-br ${feature.gradient}`
                )}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// HOW IT WORKS SECTION
// ============================================================================

function HowItWorksSection() {
  const { ref, isInView } = useInViewOnce();

  const steps = [
    {
      number: "1",
      icon: Globe,
      title: "Create Your Account",
      description: "Sign up with your email. No credit card needed.",
    },
    {
      number: "2",
      icon: Zap,
      title: "Add Your Machines",
      description: "Enter your machine details or connect our IoT sensors.",
    },
    {
      number: "3",
      icon: BarChart3,
      title: "Start Monitoring",
      description: "Watch your dashboard come to life with real-time data.",
    },
  ];

  return (
    <section ref={ref} className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <Sparkles className="h-4 w-4" />
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Go live in under 10 minutes
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{ delay: 0.5 + i * 0.2, duration: 0.5 }}
                  className="absolute left-[calc(50%+40px)] top-8 hidden h-0.5 w-[calc(100%-80px)] origin-left bg-gradient-to-r from-violet-400 to-transparent lg:block"
                />
              )}

              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-2xl font-bold text-white shadow-xl shadow-violet-500/30"
              >
                {step.number}
              </motion.div>

              <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Link href="/register">
            <Button
              size="lg"
              className="group bg-gradient-to-r from-violet-600 to-indigo-600 px-8 shadow-xl shadow-violet-500/25"
            >
              Get Started in 5 Minutes
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// STATS SECTION
// ============================================================================

function StatsSection() {
  const { ref, isInView } = useInViewOnce();

  const stats = [
    { value: 500, suffix: "+", label: "Active Laundromats" },
    { value: 10000, suffix: "+", label: "Machines Monitored" },
    { value: 99.9, suffix: "%", label: "Uptime SLA" },
    { value: 35, suffix: "%", label: "Average Revenue Increase" },
  ];

  // Pre-computed particle positions to avoid hydration mismatch
  const statsParticles = [
    { width: 180, height: 150, left: "10%", top: "20%", x: 15, y: -10, duration: 12 },
    { width: 220, height: 180, left: "80%", top: "15%", x: -20, y: 12, duration: 15 },
    { width: 140, height: 200, left: "50%", top: "70%", x: 10, y: 18, duration: 18 },
    { width: 260, height: 130, left: "25%", top: "85%", x: -15, y: -8, duration: 14 },
    { width: 190, height: 170, left: "65%", top: "40%", x: 22, y: -15, duration: 16 },
    { width: 150, height: 220, left: "5%", top: "55%", x: -12, y: 20, duration: 13 },
    { width: 230, height: 160, left: "90%", top: "60%", x: 18, y: 8, duration: 17 },
    { width: 170, height: 190, left: "35%", top: "10%", x: -8, y: -18, duration: 11 },
    { width: 200, height: 140, left: "70%", top: "90%", x: 12, y: 15, duration: 19 },
    { width: 160, height: 210, left: "45%", top: "35%", x: -18, y: -12, duration: 14 },
  ];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 py-20"
    >
      <div className="absolute inset-0 overflow-hidden">
        {statsParticles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: particle.width,
              height: particle.height,
              left: particle.left,
              top: particle.top,
            }}
            animate={{
              x: [0, particle.x],
              y: [0, particle.y],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl font-bold text-white md:text-5xl">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-violet-200">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// TESTIMONIALS SECTION
// ============================================================================

function TestimonialsSection() {
  const { ref, isInView } = useInViewOnce();
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Somchai Laundry",
      role: "Owner",
      company: "CleanSpin Bangkok",
      content:
        "WashWise transformed how I run my laundromat. I used to drive to my shop 3 times a day just to check on things. Now I manage everything from my phone while having breakfast.",
      highlight: "Revenue up 35%",
    },
    {
      name: "Napat Srisuk",
      role: "Operations Manager",
      company: "FreshWash Chain",
      content:
        "The AI predictions saved us from 3 major breakdowns last month alone. That's easily ฿50,000 in repair costs and lost revenue we didn't have to deal with.",
      highlight: "฿50,000 saved",
    },
    {
      name: "Kanya Thongchai",
      role: "Franchise Owner",
      company: "LaundryHub",
      content:
        "Managing 5 locations used to be a nightmare. Now it's all in one dashboard. The real-time alerts mean I catch problems before customers even notice.",
      highlight: "5 locations managed",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section
      ref={ref}
      id="testimonials"
      className="scroll-mt-20 bg-slate-50 py-20 dark:bg-slate-900 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <Star className="h-4 w-4 fill-current" />
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Loved by laundromat owners everywhere
          </h2>
        </motion.div>

        <div className="mt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white shadow-2xl lg:p-12"
            >
              <Quote className="h-12 w-12 text-white/20" />
              <p className="mt-6 text-xl font-medium leading-relaxed lg:text-2xl">
                &ldquo;{testimonials[currentIndex].content}&rdquo;
              </p>
              {testimonials[currentIndex].highlight && (
                <div className="mt-6 inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                  {testimonials[currentIndex].highlight}
                </div>
              )}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-xl font-bold">
                  {testimonials[currentIndex].name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{testimonials[currentIndex].name}</p>
                  <p className="text-sm text-white/70">
                    {testimonials[currentIndex].role}, {testimonials[currentIndex].company}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  i === currentIndex
                    ? "w-8 bg-violet-600"
                    : "bg-slate-300 hover:bg-slate-400 dark:bg-slate-600"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING SECTION
// ============================================================================

function PricingSection() {
  const { ref, isInView } = useInViewOnce();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small laundromats",
      price: billing === "yearly" ? 1200 : 1500,
      features: [
        { text: "Up to 10 machines", included: true },
        { text: "Real-time monitoring", included: true },
        { text: "Basic analytics", included: true },
        { text: "Email alerts", included: true },
        { text: "AI predictions", included: false },
        { text: "Multi-location support", included: false },
      ],
    },
    {
      name: "Professional",
      description: "For growing businesses",
      price: billing === "yearly" ? 3600 : 4500,
      popular: true,
      features: [
        { text: "Up to 50 machines", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Push, SMS & LINE alerts", included: true },
        { text: "AI predictions", included: true },
        { text: "Up to 3 locations", included: true },
        { text: "Priority support", included: true },
      ],
    },
    {
      name: "Enterprise",
      description: "For large operations",
      price: "Custom",
      features: [
        { text: "Unlimited machines", included: true },
        { text: "Enterprise analytics", included: true },
        { text: "All notification channels", included: true },
        { text: "Advanced AI predictions", included: true },
        { text: "Unlimited locations", included: true },
        { text: "24/7 dedicated support", included: true },
      ],
    },
  ];

  return (
    <section ref={ref} id="pricing" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <Sparkles className="h-4 w-4" />
            Pricing
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Choose the plan that fits your business. All plans include a 14-day free trial.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "text-sm font-medium transition-colors",
              billing === "monthly" ? "text-slate-900 dark:text-white" : "text-slate-500"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
            className="relative h-7 w-14 rounded-full bg-slate-200 transition-colors dark:bg-slate-700"
          >
            <motion.div
              layout
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md",
                billing === "yearly" ? "left-8" : "left-1"
              )}
            />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBilling("yearly")}
              className={cn(
                "text-sm font-medium transition-colors",
                billing === "yearly" ? "text-slate-900 dark:text-white" : "text-slate-500"
              )}
            >
              Yearly
            </button>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Save 20%
            </span>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.1 * i }}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl border transition-all",
                plan.popular
                  ? "border-violet-300 bg-gradient-to-b from-violet-50 to-white shadow-xl dark:border-violet-700 dark:from-violet-950/50 dark:to-slate-900"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/80"
              )}
            >
              {plan.popular && (
                <div className="absolute -right-12 top-6 rotate-45">
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-12 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  {typeof plan.price === "number" ? (
                    <>
                      <span className="text-sm text-slate-500">฿</span>
                      <motion.span
                        key={plan.price}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-bold text-slate-900 dark:text-white"
                      >
                        {plan.price.toLocaleString()}
                      </motion.span>
                      <span className="text-sm text-slate-500">/month</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">
                      {plan.price}
                    </span>
                  )}
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3">
                      {feature.included ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                          <X className="h-3 w-3 text-slate-400" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          feature.included ? "text-slate-700 dark:text-slate-300" : "text-slate-400"
                        )}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === "Enterprise" ? "#contact" : "/register"}
                  className="mt-8 block"
                >
                  <Button
                    className={cn(
                      "w-full",
                      plan.popular
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25"
                        : ""
                    )}
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FAQ SECTION
// ============================================================================

function FAQSection() {
  const { ref, isInView } = useInViewOnce();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How long does it take to set up WashWise?",
      answer:
        "Most customers are up and running within 5-10 minutes. Simply create an account, add your machines, and you'll immediately see your dashboard come to life.",
    },
    {
      question: "Do I need special hardware or IoT sensors?",
      answer:
        "No special hardware is required to start. You can manually update machine statuses or use our mobile app. For real-time automated monitoring, we offer optional IoT sensors.",
    },
    {
      question: "What happens after my free trial ends?",
      answer:
        "After your 14-day trial, you can choose a plan that fits your needs. We'll send reminders before the trial ends. Your data is never deleted.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Security is our top priority. We use bank-grade 256-bit SSL encryption for all data transfers. Your data is stored in secure, SOC 2 compliant data centers.",
    },
    {
      question: "Can I manage multiple locations?",
      answer:
        "Yes! Professional and Enterprise plans support multiple locations. You can view all locations on a single dashboard and compare performance.",
    },
  ];

  return (
    <section
      ref={ref}
      id="faq"
      className="scroll-mt-20 bg-slate-50 py-20 dark:bg-slate-900 lg:py-28"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Frequently asked questions
          </h2>
        </motion.div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "overflow-hidden rounded-2xl border transition-all",
                openIndex === i
                  ? "border-violet-200 bg-violet-50/50 shadow-lg dark:border-violet-800 dark:bg-violet-950/20"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50"
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span
                  className={cn(
                    "font-semibold",
                    openIndex === i
                      ? "text-violet-700 dark:text-violet-300"
                      : "text-slate-900 dark:text-white"
                  )}
                >
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  className={cn(
                    "ml-4 flex h-8 w-8 items-center justify-center rounded-full",
                    openIndex === i
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700"
                  )}
                >
                  {openIndex === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="border-t border-violet-200/50 px-6 pb-6 pt-4 dark:border-violet-800/50">
                      <p className="text-slate-600 dark:text-slate-400">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FINAL CTA SECTION
// ============================================================================

function FinalCTASection() {
  const { ref, isInView } = useInViewOnce();

  // Pre-computed particle positions to avoid hydration mismatch
  const ctaParticles = [
    { width: 180, height: 160, left: "5%", top: "10%", x: 20, y: -15, duration: 12 },
    { width: 220, height: 200, left: "85%", top: "20%", x: -18, y: 10, duration: 16 },
    { width: 150, height: 180, left: "15%", top: "75%", x: 12, y: 22, duration: 14 },
    { width: 240, height: 140, left: "60%", top: "5%", x: -10, y: -8, duration: 18 },
    { width: 170, height: 210, left: "40%", top: "85%", x: 15, y: -20, duration: 13 },
    { width: 200, height: 170, left: "90%", top: "60%", x: -22, y: 15, duration: 17 },
    { width: 160, height: 190, left: "25%", top: "40%", x: 8, y: 18, duration: 15 },
    { width: 230, height: 150, left: "70%", top: "70%", x: -15, y: -12, duration: 11 },
    { width: 190, height: 220, left: "50%", top: "30%", x: 18, y: 8, duration: 19 },
    { width: 140, height: 200, left: "10%", top: "50%", x: -8, y: -18, duration: 14 },
    { width: 210, height: 160, left: "75%", top: "90%", x: 12, y: 20, duration: 16 },
    { width: 175, height: 185, left: "30%", top: "15%", x: -20, y: 10, duration: 12 },
    { width: 195, height: 175, left: "55%", top: "55%", x: 15, y: -15, duration: 18 },
    { width: 165, height: 195, left: "95%", top: "35%", x: -12, y: 22, duration: 13 },
    { width: 225, height: 145, left: "20%", top: "95%", x: 10, y: -10, duration: 15 },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden py-20 lg:py-28">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700"
      >
        {ctaParticles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: particle.width,
              height: particle.height,
              left: particle.left,
              top: particle.top,
            }}
            animate={{
              x: [0, particle.x],
              y: [0, particle.y],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </motion.div>

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-6 inline-flex"
          >
            <Sparkles className="h-8 w-8 text-white/80" />
          </motion.div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to run your laundromat the smart way?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-violet-100">
            Join 500+ owners who switched to WashWise. Your first 14 days are free.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="group h-14 bg-white px-8 text-base font-semibold text-violet-600 shadow-xl transition-all hover:bg-violet-50 hover:shadow-2xl"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
            </Link>
            <Link href="#contact">
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-white/30 px-8 text-base text-white hover:bg-white/10"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Talk to Sales
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-violet-200">
            No credit card required • Cancel anytime • Thai support included
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "API", href: "#" },
      { name: "Integrations", href: "#" },
    ],
    company: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#" },
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
    ],
  };

  return (
    <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                <WashingMachine className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">{CONFIG.brand.name}</span>
            </Link>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              {CONFIG.brand.tagline}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">Product</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">Company</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">Legal</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 sm:flex-row">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {currentYear} {CONFIG.brand.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-slate-400 transition-colors hover:text-violet-600"
              aria-label="Facebook"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <Link
              href="#"
              className="text-slate-400 transition-colors hover:text-violet-600"
              aria-label="LINE"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-slate-400 transition-colors hover:text-violet-600"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950">
      {/* Premium Effects */}
      <ScrollProgress />
      <CursorGlow />

      <Navigation />
      <main>
        <HeroSection />
        <LogoCloud />
        <ProblemSolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
