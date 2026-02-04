"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// AURORA BACKGROUND - Premium gradient effect
// ============================================================================

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = memo(function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-slate-950",
        className
      )}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute -inset-[10px] opacity-50 blur-[10px] invert filter will-change-transform",
            "[--aurora:repeating-linear-gradient(100deg,var(--violet-500)_10%,var(--indigo-300)_15%,var(--violet-200)_20%,var(--indigo-400)_25%,var(--violet-300)_30%)]",
            "[--dark-gradient:repeating-linear-gradient(100deg,var(--slate-950)_0%,var(--slate-950)_7%,transparent_10%,transparent_12%,var(--slate-950)_16%)]",
            "[--white-gradient:repeating-linear-gradient(100deg,white_0%,white_7%,transparent_10%,transparent_12%,white_16%)]",
            "[background-image:var(--white-gradient),var(--aurora)]",
            "[background-size:300%,_200%]",
            "[background-position:50%_50%,50%_50%]",
            "dark:invert-0 dark:[background-image:var(--dark-gradient),var(--aurora)]",
            "after:animate-aurora after:absolute after:inset-0 after:mix-blend-difference after:content-['']",
            "after:[background-image:var(--white-gradient),var(--aurora)]",
            "after:[background-size:200%,_100%]",
            "after:[background-attachment:fixed]",
            "dark:after:[background-image:var(--dark-gradient),var(--aurora)]"
          )}
        />
      </div>
      {showRadialGradient && (
        <div className="absolute inset-0 bg-slate-950 [mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]" />
      )}
      {children}
    </div>
  );
});

// ============================================================================
// GRADIENT MESH - Dynamic mesh gradient background
// ============================================================================

interface GradientMeshProps {
  className?: string;
  colors?: string[];
  speed?: number;
}

export const GradientMesh = memo(function GradientMesh({
  className,
  colors = ["#7c3aed", "#4f46e5", "#2563eb", "#7c3aed"],
  speed = 15,
}: GradientMeshProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <motion.div
        className="absolute -inset-[100%] opacity-30"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${colors[0]} 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, ${colors[1]} 0%, transparent 50%),
                       radial-gradient(circle at 40% 60%, ${colors[2]} 0%, transparent 50%),
                       radial-gradient(circle at 70% 30%, ${colors[3]} 0%, transparent 50%)`,
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
});

// ============================================================================
// SPOTLIGHT EFFECT - Follow cursor spotlight
// ============================================================================

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export const Spotlight = memo(function Spotlight({ className, fill = "white" }: SpotlightProps) {
  return (
    <svg
      className={cn(
        "animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] opacity-0 lg:w-[84%]",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#filter)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id="filter"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur" />
        </filter>
      </defs>
    </svg>
  );
});

// ============================================================================
// PARTICLE FIELD - Ambient floating particles
// ============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface ParticleFieldProps {
  className?: string;
  quantity?: number;
  color?: string;
}

export const ParticleField = memo(function ParticleField({
  className,
  quantity = 50,
  color = "white",
}: ParticleFieldProps) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: quantity }, (_, i) => ({
      id: i,
      x: (i * 37 + 13) % 100,
      y: (i * 47 + 7) % 100,
      size: ((i * 3 + 1) % 4) + 1,
      duration: ((i * 7) % 20) + 15,
      delay: (i * 0.2) % 5,
      opacity: 0.1 + ((i * 13) % 30) / 100,
    }))
  );

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: color,
            opacity: particle.opacity,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
});

// ============================================================================
// GRID PATTERN - Subtle grid background
// ============================================================================

interface GridPatternProps {
  className?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  squares?: number[][];
}

export const GridPattern = memo(function GridPattern({
  className,
  width = 40,
  height = 40,
  strokeWidth = 1,
  squares = [],
}: GridPatternProps) {
  const id = useRef(`grid-${Math.random().toString(36).slice(2, 9)}`).current;

  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      {squares.map(([x, y], i) => (
        <rect
          key={i}
          width={width - 1}
          height={height - 1}
          x={x * width + 1}
          y={y * height + 1}
          fill="currentColor"
          className="opacity-10"
        />
      ))}
    </svg>
  );
});

// ============================================================================
// GLOW EFFECT - Pulsing glow behind elements
// ============================================================================

interface GlowEffectProps {
  className?: string;
  color?: string;
  size?: number;
  blur?: number;
}

export const GlowEffect = memo(function GlowEffect({
  className,
  color = "rgba(139, 92, 246, 0.5)",
  size = 200,
  blur = 100,
}: GlowEffectProps) {
  return (
    <motion.div
      className={cn("pointer-events-none absolute rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
});

// ============================================================================
// NOISE TEXTURE - Subtle grain overlay
// ============================================================================

interface NoiseTextureProps {
  className?: string;
  opacity?: number;
}

export const NoiseTexture = memo(function NoiseTexture({
  className,
  opacity = 0.03,
}: NoiseTextureProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
});

// ============================================================================
// CURSOR GLOW - Follows mouse cursor
// ============================================================================

interface CursorGlowProps {
  className?: string;
  color?: string;
  size?: number;
}

export function CursorGlow({
  className,
  color = "rgba(139, 92, 246, 0.15)",
  size = 400,
}: CursorGlowProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - size / 2);
      mouseY.set(e.clientY - size / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, size]);

  return (
    <motion.div
      className={cn("pointer-events-none fixed z-50 rounded-full", className)}
      style={{
        x,
        y,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
    />
  );
}

// ============================================================================
// BEAM EFFECT - Animated light beam
// ============================================================================

interface BeamEffectProps {
  className?: string;
}

export const BeamEffect = memo(function BeamEffect({ className }: BeamEffectProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <motion.div
        className="absolute -left-[100%] top-0 h-[2px] w-[200%]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent)",
        }}
        animate={{
          left: ["0%", "100%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
});

// ============================================================================
// MORPHING BLOB - Organic shape animation
// ============================================================================

interface MorphingBlobProps {
  className?: string;
  color?: string;
}

export const MorphingBlob = memo(function MorphingBlob({
  className,
  color = "rgba(139, 92, 246, 0.3)",
}: MorphingBlobProps) {
  return (
    <motion.div
      className={cn("absolute", className)}
      style={{ backgroundColor: color }}
      animate={{
        borderRadius: [
          "60% 40% 30% 70% / 60% 30% 70% 40%",
          "30% 60% 70% 40% / 50% 60% 30% 60%",
          "60% 40% 30% 70% / 60% 30% 70% 40%",
        ],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
});

// ============================================================================
// SHIMMER EFFECT - Loading shimmer
// ============================================================================

interface ShimmerProps {
  className?: string;
}

export const Shimmer = memo(function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent",
        className
      )}
    />
  );
});

// ============================================================================
// GRADIENT TEXT - Animated gradient text
// ============================================================================

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
}

export const GradientText = memo(function GradientText({
  children,
  className,
  colors = ["#7c3aed", "#4f46e5", "#2563eb", "#7c3aed"],
  animationSpeed = 8,
}: GradientTextProps) {
  return (
    <motion.span
      className={cn("bg-clip-text text-transparent", className)}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "200% 100%",
      }}
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: animationSpeed,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
});
