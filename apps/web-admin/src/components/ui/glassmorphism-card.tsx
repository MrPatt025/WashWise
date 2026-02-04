"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// Glassmorphism Card - World-class frosted glass effect
// ============================================================================

// Type to omit conflicting props between HTML and framer-motion
type MotionConflictingProps =
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";

interface GlassmorphismCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  MotionConflictingProps
> {
  children: React.ReactNode;
  variant?: "default" | "gradient" | "aurora" | "mesh";
  intensity?: "light" | "medium" | "strong";
  hover3D?: boolean;
  hoverGlow?: boolean;
  glowColor?: string;
  borderGlow?: boolean;
}

export function GlassmorphismCard({
  children,
  variant = "default",
  intensity = "medium",
  hover3D = false,
  hoverGlow = false,
  glowColor = "rgba(139, 92, 246, 0.3)",
  borderGlow = false,
  className,
  ...props
}: GlassmorphismCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Mouse position for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for 3D tilt
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), {
    stiffness: 300,
    damping: 30,
  });

  // Glare effect position
  const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover3D || !cardRef.current) {
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    if (!hover3D) {
      return;
    }
    mouseX.set(0);
    mouseY.set(0);
  };

  const intensityClasses = {
    light: "bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm",
    medium: "bg-white/50 dark:bg-slate-900/50 backdrop-blur-md",
    strong: "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {},
    gradient: {
      background: `
        linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%),
        linear-gradient(45deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)
      `,
    },
    aurora: {
      background: `
        linear-gradient(135deg, 
          rgba(34, 211, 238, 0.15) 0%, 
          rgba(168, 85, 247, 0.15) 25%, 
          rgba(236, 72, 153, 0.15) 50%, 
          rgba(251, 146, 60, 0.15) 75%, 
          rgba(34, 197, 94, 0.15) 100%
        )
      `,
    },
    mesh: {
      background: `
        radial-gradient(at 40% 20%, rgba(139, 92, 246, 0.2) 0px, transparent 50%),
        radial-gradient(at 80% 0%, rgba(59, 130, 246, 0.2) 0px, transparent 50%),
        radial-gradient(at 0% 50%, rgba(236, 72, 153, 0.2) 0px, transparent 50%),
        radial-gradient(at 80% 50%, rgba(251, 146, 60, 0.1) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(34, 197, 94, 0.15) 0px, transparent 50%)
      `,
    },
  };

  return (
    <motion.div
      ref={cardRef}
      style={hover3D ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/20 dark:border-slate-700/50",
        intensityClasses[intensity],
        hoverGlow && "transition-shadow duration-300",
        className
      )}
      whileHover={
        hoverGlow
          ? {
              boxShadow: `0 20px 40px ${glowColor}, 0 0 80px ${glowColor}`,
            }
          : undefined
      }
      {...props}
    >
      {/* Variant background */}
      <div className="pointer-events-none absolute inset-0" style={variantStyles[variant]} />

      {/* Border glow effect */}
      {borderGlow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(59, 130, 246, 0.5), rgba(236, 72, 153, 0.5))`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
      )}

      {/* Glare effect for 3D */}
      {hover3D && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([x, y]) =>
                `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.15) 0%, transparent 50%)`
            ),
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// ============================================================================
// Glassmorphism Container - For page sections
// ============================================================================

interface GlassmorphismContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  pattern?: "dots" | "grid" | "none";
}

export function GlassmorphismContainer({
  children,
  pattern = "none",
  className,
  ...props
}: GlassmorphismContainerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-white/40 p-8 backdrop-blur-xl dark:bg-slate-900/40",
        "border border-white/30 dark:border-slate-700/30",
        className
      )}
      {...props}
    >
      {/* Pattern overlay */}
      {pattern === "dots" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      )}
      {pattern === "grid" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============================================================================
// Floating Glassmorphism Card - With animation
// ============================================================================

interface FloatingGlassCardProps extends GlassmorphismCardProps {
  floatIntensity?: number;
  floatDuration?: number;
}

export function FloatingGlassCard({
  children,
  floatIntensity = 10,
  floatDuration = 3,
  className,
  ...props
}: FloatingGlassCardProps) {
  return (
    <motion.div
      animate={{
        y: [-floatIntensity / 2, floatIntensity / 2],
      }}
      transition={{
        y: {
          duration: floatDuration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      }}
    >
      <GlassmorphismCard className={className} {...props}>
        {children}
      </GlassmorphismCard>
    </motion.div>
  );
}

// ============================================================================
// Glass Button
// ============================================================================

interface GlassButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  MotionConflictingProps
> {
  variant?: "default" | "primary" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ children, variant = "default", size = "md", glow = false, className, ...props }, ref) => {
    const variantClasses = {
      default: "bg-white/20 hover:bg-white/30 text-slate-900 dark:text-white border-white/30",
      primary:
        "bg-violet-500/20 hover:bg-violet-500/30 text-violet-700 dark:text-violet-300 border-violet-500/30",
      success:
        "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      danger:
        "bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border-rose-500/30",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const glowColors = {
      default: "rgba(148, 163, 184, 0.3)",
      primary: "rgba(139, 92, 246, 0.4)",
      success: "rgba(16, 185, 129, 0.4)",
      danger: "rgba(244, 63, 94, 0.4)",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-200",
          "font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          glow && `hover:shadow-lg hover:shadow-[${glowColors[variant]}]`,
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

GlassButton.displayName = "GlassButton";

// ============================================================================
// Glass Input
// ============================================================================

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ icon, className, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl border border-white/30 bg-white/20 px-4 py-2.5 backdrop-blur-md",
            "text-slate-900 placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-400",
            "focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20",
            "transition-all duration-200",
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

// ============================================================================
// Glass Badge
// ============================================================================

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  pulse?: boolean;
  className?: string;
}

export function GlassBadge({
  children,
  variant = "default",
  pulse = false,
  className,
}: GlassBadgeProps) {
  const variantClasses = {
    default: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30",
    primary: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
    success: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    danger: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm",
        variantClasses[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              variant === "success" && "bg-emerald-500",
              variant === "warning" && "bg-amber-500",
              variant === "danger" && "bg-rose-500",
              variant === "primary" && "bg-violet-500",
              variant === "default" && "bg-slate-500"
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              variant === "success" && "bg-emerald-500",
              variant === "warning" && "bg-amber-500",
              variant === "danger" && "bg-rose-500",
              variant === "primary" && "bg-violet-500",
              variant === "default" && "bg-slate-500"
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}

// ============================================================================
// Animated Glass Background
// ============================================================================

interface AnimatedGlassBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGlassBackground({ children, className }: AnimatedGlassBackgroundProps) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-pink-500/20 blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -80, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
