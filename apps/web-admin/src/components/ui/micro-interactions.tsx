"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// TILT CARD - 3D perspective tilt on hover
// ============================================================================

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  perspective?: number;
  maxTilt?: number;
  scale?: number;
  glareOpacity?: number;
}

export const TiltCard = memo(function TiltCard({
  children,
  className,
  perspective = 1000,
  maxTilt = 10,
  scale = 1.02,
  glareOpacity = 0.1,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springConfig = { damping: 20, stiffness: 300 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) {
        return;
      }

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const percentX = (e.clientX - centerX) / (rect.width / 2);
      const percentY = (e.clientY - centerY) / (rect.height / 2);

      rotateX.set(-percentY * maxTilt);
      rotateY.set(percentX * maxTilt);
      glareX.set(50 + percentX * 50);
      glareY.set(50 + percentY * 50);
    },
    [rotateX, rotateY, glareX, glareY, maxTilt]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={ref}
      className={cn("relative", className)}
      style={{
        perspective,
        transformStyle: "preserve-3d",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        scale: isHovered ? scale : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: "preserve-3d",
        }}
        className="h-full w-full"
      >
        {children}
        {isHovered && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,${glareOpacity}) 0%, transparent 60%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>
    </motion.div>
  );
});

// ============================================================================
// MAGNETIC BUTTON - Magnetic cursor effect
// ============================================================================

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export const MagneticButton = memo(function MagneticButton({
  children,
  className,
  strength = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) {
        return;
      }

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      x.set((e.clientX - centerX) * strength);
      y.set((e.clientY - centerY) * strength);
    },
    [x, y, strength]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
});

// ============================================================================
// REVEAL TEXT - Text reveal on scroll
// ============================================================================

interface RevealTextProps {
  children: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export const RevealText = memo(function RevealText({
  children,
  className,
  delay = 0,
  staggerDelay = 0.03,
}: RevealTextProps) {
  const words = children.split(" ");

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: delay + i * staggerDelay,
              ease: [0.33, 1, 0.68, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
});

// ============================================================================
// COUNTER ANIMATION - Animated number counter
// ============================================================================

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export const AnimatedCounterAdvanced = memo(function AnimatedCounterAdvanced({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  className,
  decimals = 0,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) {
      return;
    }

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
      }
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(easeOutQuart * end);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, isInView]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      {suffix}
    </span>
  );
});

// ============================================================================
// FLOATING ELEMENT - Continuous float animation
// ============================================================================

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
  delay?: number;
}

export const FloatingElement = memo(function FloatingElement({
  children,
  className,
  duration = 6,
  distance = 20,
  delay = 0,
}: FloatingElementProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-distance / 2, distance / 2, -distance / 2],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
});

// ============================================================================
// PARALLAX SCROLL - Scroll-based parallax
// ============================================================================

interface ParallaxScrollProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: "up" | "down";
}

export function ParallaxScroll({
  children,
  className,
  speed = 0.5,
  direction = "up",
}: ParallaxScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) {
        return;
      }
      const rect = ref.current.getBoundingClientRect();
      const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const movement = scrollPercent * speed * 100;
      setOffset(direction === "up" ? -movement : movement);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed, direction]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ y: offset }}>{children}</motion.div>
    </div>
  );
}

// ============================================================================
// STAGGER CHILDREN - Staggered entrance animation
// ============================================================================

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

export const StaggerChildren = memo(function StaggerChildren({
  children,
  className,
  staggerDelay = 0.1,
  initialDelay = 0,
}: StaggerChildrenProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: initialDelay,
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.33, 1, 0.68, 1] as const,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
});

// ============================================================================
// GLASS CARD - Glassmorphism card effect
// ============================================================================

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: number;
  borderOpacity?: number;
}

export const GlassCard = memo(function GlassCard({
  children,
  className,
  blur = 12,
  borderOpacity = 0.1,
}: GlassCardProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl bg-white/5", className)}
      style={{
        backdropFilter: `blur(${blur}px)`,
        border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
      }}
    >
      {children}
    </div>
  );
});

// ============================================================================
// HOVER SCALE - Simple scale on hover
// ============================================================================

interface HoverScaleProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export const HoverScale = memo(function HoverScale({
  children,
  className,
  scale = 1.05,
}: HoverScaleProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
});

// ============================================================================
// RIPPLE EFFECT - Click ripple animation
// ============================================================================

interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function RippleEffect({
  children,
  className,
  color = "rgba(255, 255, 255, 0.3)",
}: RippleEffectProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return (
    <div className={cn("relative overflow-hidden", className)} onClick={handleClick}>
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: color,
            }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ width: 500, height: 500, x: -250, y: -250, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// BORDER GRADIENT - Animated gradient border
// ============================================================================

interface BorderGradientProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  colors?: string[];
  duration?: number;
}

export const BorderGradient = memo(function BorderGradient({
  children,
  className,
  borderWidth = 2,
  colors = ["#7c3aed", "#4f46e5", "#2563eb", "#7c3aed"],
  duration = 4,
}: BorderGradientProps) {
  return (
    <div className={cn("relative rounded-2xl p-[1px]", className)}>
      <motion.div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: `linear-gradient(90deg, ${colors.join(", ")})`,
          backgroundSize: "200% 100%",
          padding: borderWidth,
        }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div className="relative z-10 rounded-[inherit] bg-slate-950">{children}</div>
    </div>
  );
});

// ============================================================================
// TYPEWRITER - Typewriter text effect
// ============================================================================

interface TypewriterProps {
  words: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export function Typewriter({
  words,
  className,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
}: TypewriterProps) {
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
            setTimeout(() => setIsDeleting(true), pauseDuration);
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
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        className="inline-block w-[2px] bg-current"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        |
      </motion.span>
    </span>
  );
}
