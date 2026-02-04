"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// SCROLL PROGRESS - Page scroll progress indicator
// ============================================================================

interface ScrollProgressProps {
  className?: string;
  color?: string;
  height?: number;
}

export function ScrollProgress({ className, color = "#7c3aed", height = 3 }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className={cn("fixed left-0 right-0 top-0 z-50 origin-left", className)}
      style={{
        scaleX,
        height,
        backgroundColor: color,
      }}
    />
  );
}

// ============================================================================
// SCROLL REVEAL - Reveal element on scroll
// ============================================================================

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  distance?: number;
}

export const ScrollReveal = memo(function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  distance = 50,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...getInitialPosition() }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
});

// ============================================================================
// PARALLAX SECTION - Full section parallax
// ============================================================================

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  backgroundImage?: string;
}

export function ParallaxSection({
  children,
  className,
  speed = 0.5,
  backgroundImage,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 200]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {backgroundImage && (
        <motion.div
          className="absolute inset-0 -z-10"
          style={{
            y,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      {children}
    </div>
  );
}

// ============================================================================
// STICKY SCROLL - Sticky element with scroll progress
// ============================================================================

interface StickyScrollProps {
  children: React.ReactNode;
  className?: string;
  targetId?: string;
}

export function StickyScroll({ children, className, targetId }: StickyScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={ref} className={cn("relative", className)} id={targetId}>
      <div className="sticky top-0">{children}</div>
    </div>
  );
}

// ============================================================================
// SCROLL FADE - Fade based on scroll position
// ============================================================================

interface ScrollFadeProps {
  children: React.ReactNode;
  className?: string;
  fadeDistance?: number;
}

export function ScrollFade({
  children,
  className,
  fadeDistance: _fadeDistance = 200,
}: ScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  void _fadeDistance; // Reserved for future use

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div ref={ref} className={className} style={{ opacity }}>
      {children}
    </motion.div>
  );
}

// ============================================================================
// SCALE ON SCROLL - Scale element as user scrolls
// ============================================================================

interface ScaleOnScrollProps {
  children: React.ReactNode;
  className?: string;
  minScale?: number;
  maxScale?: number;
}

export function ScaleOnScroll({
  children,
  className,
  minScale = 0.8,
  maxScale = 1,
}: ScaleOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [minScale, maxScale]);
  const springScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <motion.div ref={ref} className={className} style={{ scale: springScale }}>
      {children}
    </motion.div>
  );
}

// ============================================================================
// HORIZONTAL SCROLL - Horizontal scroll on vertical scroll
// ============================================================================

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function HorizontalScroll({ children, className }: HorizontalScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);

  return (
    <div ref={ref} className={cn("relative h-[300vh]", className)}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div className="flex" style={{ x }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// TEXT REVEAL ON SCROLL - Word-by-word reveal
// ============================================================================

interface TextRevealOnScrollProps {
  text: string;
  className?: string;
}

export function TextRevealOnScroll({ text, className }: TextRevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const words = text.split(" ");

  return (
    <div ref={ref} className={className}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={i} range={[start, end]} progress={scrollYProgress}>
            {word}
          </Word>
        );
      })}
    </div>
  );
}

function Word({
  children,
  range,
  progress,
}: {
  children: string;
  range: [number, number];
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const opacity = useTransform(progress, range, [0.2, 1]);

  return (
    <motion.span className="mr-2 inline-block" style={{ opacity }}>
      {children}
    </motion.span>
  );
}

// ============================================================================
// PERSPECTIVE SCROLL - 3D perspective effect
// ============================================================================

interface PerspectiveScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function PerspectiveScroll({ children, className }: PerspectiveScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15, 0, -15]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div ref={ref} className={cn("perspective-1000", className)}>
      <motion.div
        style={{
          rotateX,
          scale,
          opacity,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================================================
// BLUR ON SCROLL - Blur effect based on scroll
// ============================================================================

interface BlurOnScrollProps {
  children: React.ReactNode;
  className?: string;
  maxBlur?: number;
}

export function BlurOnScroll({ children, className, maxBlur = 10 }: BlurOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [blur, setBlur] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) {
        return;
      }
      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.top < viewportHeight && rect.bottom > 0) {
        const scrollPercent = 1 - rect.top / viewportHeight;
        const blurAmount = Math.max(0, Math.min(maxBlur, scrollPercent * maxBlur * 2 - maxBlur));
        setBlur(Math.abs(blurAmount));
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [maxBlur]);

  return (
    <div ref={ref} className={className} style={{ filter: `blur(${blur}px)` }}>
      {children}
    </div>
  );
}

// ============================================================================
// COLOR SHIFT ON SCROLL - Background color transition
// ============================================================================

interface ColorShiftProps {
  children: React.ReactNode;
  className?: string;
  colors: string[];
}

export function ColorShiftOnScroll({ children, className, colors }: ColorShiftProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [backgroundColor, setBackgroundColor] = useState(colors[0]);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) {
        return;
      }
      const rect = ref.current.getBoundingClientRect();
      const scrollPercent = Math.max(0, Math.min(1, 1 - rect.top / window.innerHeight));
      const colorIndex = Math.floor(scrollPercent * (colors.length - 1));
      setBackgroundColor(colors[Math.min(colorIndex, colors.length - 1)]);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [colors]);

  return (
    <div
      ref={ref}
      className={cn("transition-colors duration-500", className)}
      style={{ backgroundColor }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// ZOOM PARALLAX - Multiple layers with different zoom speeds
// ============================================================================

interface ZoomParallaxProps {
  layers: React.ReactNode[];
  className?: string;
}

export function ZoomParallax({ layers, className }: ZoomParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={ref} className={cn("relative h-[300vh]", className)}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {layers.map((layer, i) => {
          const scale = useTransform(scrollYProgress, [0, 1], [1, 1 + (layers.length - i) * 0.5]);

          return (
            <motion.div
              key={i}
              className="absolute inset-0"
              style={{
                scale,
                zIndex: i,
              }}
            >
              {layer}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
