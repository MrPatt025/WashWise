"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Animation timing presets
 */
export const TIMING = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
} as const;

/**
 * Easing presets
 */
export const EASING = {
  linear: "linear",
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  // Custom cubic-bezier curves
  spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/**
 * Fade In/Out Animation Component
 */
export interface FadeProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  unmountOnExit?: boolean;
}

export function Fade({
  show,
  children,
  duration = TIMING.normal,
  delay = 0,
  className,
  unmountOnExit = true,
}: FadeProps) {
  const [shouldRender, setShouldRender] = React.useState(show);

  React.useEffect(() => {
    if (show) {
      setShouldRender(true);
    }
  }, [show]);

  const handleAnimationEnd = () => {
    if (!show && unmountOnExit) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        show ? "animate-in fade-in" : "animate-out fade-out",
        className,
      )}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
}

/**
 * Slide Animation Component
 */
export interface SlideProps {
  show: boolean;
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  delay?: number;
  className?: string;
  unmountOnExit?: boolean;
}

const slideDirections = {
  up: { in: "slide-in-from-bottom-4", out: "slide-out-to-bottom-4" },
  down: { in: "slide-in-from-top-4", out: "slide-out-to-top-4" },
  left: { in: "slide-in-from-right-4", out: "slide-out-to-right-4" },
  right: { in: "slide-in-from-left-4", out: "slide-out-to-left-4" },
};

export function Slide({
  show,
  children,
  direction = "up",
  duration = TIMING.normal,
  delay = 0,
  className,
  unmountOnExit = true,
}: SlideProps) {
  const [shouldRender, setShouldRender] = React.useState(show);
  const slideClass = slideDirections[direction];

  React.useEffect(() => {
    if (show) {
      setShouldRender(true);
    }
  }, [show]);

  const handleAnimationEnd = () => {
    if (!show && unmountOnExit) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        show
          ? `animate-in fade-in ${slideClass.in}`
          : `animate-out fade-out ${slideClass.out}`,
        className,
      )}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
}

/**
 * Scale Animation Component
 */
export interface ScaleProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
  unmountOnExit?: boolean;
}

export function Scale({
  show,
  children,
  duration = TIMING.normal,
  delay = 0,
  className,
  unmountOnExit = true,
}: ScaleProps) {
  const [shouldRender, setShouldRender] = React.useState(show);

  React.useEffect(() => {
    if (show) {
      setShouldRender(true);
    }
  }, [show]);

  const handleAnimationEnd = () => {
    if (!show && unmountOnExit) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        show
          ? "animate-in fade-in zoom-in-95"
          : "animate-out fade-out zoom-out-95",
        className,
      )}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
}

/**
 * Stagger children animations
 */
export interface StaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}

export function Stagger({
  children,
  staggerDelay = 50,
  initialDelay = 0,
  className,
}: StaggerProps) {
  const childArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <div
          key={index}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{
            animationDelay: `${initialDelay + index * staggerDelay}ms`,
            animationFillMode: "both",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Collapse/Expand Animation
 */
export interface CollapseProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export function Collapse({
  show,
  children,
  duration = TIMING.normal,
  className,
}: CollapseProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | "auto">(
    show ? "auto" : 0,
  );
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    if (show) {
      // Expanding
      setHeight(content.scrollHeight);
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setHeight("auto");
        setIsAnimating(false);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      // Collapsing
      setHeight(content.scrollHeight);
      setIsAnimating(true);
      // Force reflow
      void content.offsetHeight;
      requestAnimationFrame(() => {
        setHeight(0);
      });
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  return (
    <div
      ref={contentRef}
      className={cn(
        "overflow-hidden",
        isAnimating && "transition-[height] ease-out",
        className,
      )}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        transitionDuration: `${duration}ms`,
      }}
      aria-hidden={!show}
    >
      {children}
    </div>
  );
}

/**
 * Presence animation (mount/unmount with animation)
 */
export interface AnimatePresenceProps {
  show: boolean;
  children: React.ReactNode;
  initial?: boolean;
  animation?: "fade" | "slide" | "scale" | "slideUp" | "slideDown";
  duration?: number;
  className?: string;
}

export function AnimatePresence({
  show,
  children,
  initial = true,
  animation = "fade",
  duration = TIMING.normal,
  className,
}: AnimatePresenceProps) {
  const [shouldRender, setShouldRender] = React.useState(show);
  const [isInitialMount, setIsInitialMount] = React.useState(true);

  React.useEffect(() => {
    if (show) {
      setShouldRender(true);
    }
    setIsInitialMount(false);
  }, [show]);

  const handleAnimationEnd = () => {
    if (!show) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  const animationClasses = {
    fade: {
      in: "animate-in fade-in",
      out: "animate-out fade-out",
    },
    slide: {
      in: "animate-in fade-in slide-in-from-bottom-4",
      out: "animate-out fade-out slide-out-to-bottom-4",
    },
    scale: {
      in: "animate-in fade-in zoom-in-95",
      out: "animate-out fade-out zoom-out-95",
    },
    slideUp: {
      in: "animate-in fade-in slide-in-from-bottom-8",
      out: "animate-out fade-out slide-out-to-bottom-8",
    },
    slideDown: {
      in: "animate-in fade-in slide-in-from-top-8",
      out: "animate-out fade-out slide-out-to-top-8",
    },
  };

  const skipAnimation = isInitialMount && !initial;
  const currentAnimation = animationClasses[animation];

  return (
    <div
      className={cn(
        !skipAnimation && (show ? currentAnimation.in : currentAnimation.out),
        className,
      )}
      style={{
        animationDuration: skipAnimation ? "0ms" : `${duration}ms`,
        animationFillMode: "both",
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
}

/**
 * Skeleton Pulse Animation Wrapper
 */
export function Pulse({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("animate-pulse", className)}>{children}</div>;
}

/**
 * Spin Animation Wrapper
 */
export function Spin({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("animate-spin", className)}>{children}</div>;
}

/**
 * Bounce Animation Wrapper
 */
export function Bounce({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("animate-bounce", className)}>{children}</div>;
}

/**
 * Ping Animation Wrapper (notification indicator)
 */
export function Ping({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-3 w-3", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/75 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
    </span>
  );
}

/**
 * Shimmer effect for loading states
 */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded bg-muted",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className,
      )}
    />
  );
}

/**
 * Number counter animation hook
 */
export function useCountUp(
  end: number,
  options: {
    start?: number;
    duration?: number;
    delay?: number;
    enabled?: boolean;
  } = {},
) {
  const { start = 0, duration = 1000, delay = 0, enabled = true } = options;
  const [count, setCount] = React.useState(start);
  const countRef = React.useRef(start);
  const frameRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (!enabled) {
      setCount(end);
      return;
    }

    const startTime = performance.now() + delay;
    const endTime = startTime + duration;

    const updateCount = (currentTime: number) => {
      if (currentTime < startTime) {
        frameRef.current = requestAnimationFrame(updateCount);
        return;
      }

      const progress = Math.min((currentTime - startTime) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.round(start + (end - start) * easedProgress);

      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }

      if (currentTime < endTime) {
        frameRef.current = requestAnimationFrame(updateCount);
      }
    };

    frameRef.current = requestAnimationFrame(updateCount);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [start, end, duration, delay, enabled]);

  return count;
}

/**
 * Animated counter component
 */
export interface CountUpProps {
  value: number;
  start?: number;
  duration?: number;
  delay?: number;
  format?: (value: number) => string;
  className?: string;
}

export function CountUp({
  value,
  start = 0,
  duration = 1000,
  delay = 0,
  format = (v) => v.toLocaleString(),
  className,
}: CountUpProps) {
  const count = useCountUp(value, { start, duration, delay });

  return <span className={className}>{format(count)}</span>;
}
