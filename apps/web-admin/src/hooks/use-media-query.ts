import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

/**
 * Common breakpoints matching Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Subscribe to window resize events
 */
function subscribeResize(callback: () => void): () => void {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

/**
 * Get current window width
 */
function getWindowWidth(): number {
  return typeof window !== "undefined" ? window.innerWidth : 0;
}

/**
 * Hook for responsive design based on media queries
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Initial check
    setMatches(mediaQuery.matches);

    // Event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [query, getMatches]);

  return matches;
}

/**
 * Hook for breakpoint-based responsive design
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, breakpoint } = useBreakpoint();
 *
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * ```
 */
export function useBreakpoint() {
  const width = useSyncExternalStore(
    subscribeResize,
    getWindowWidth,
    () => 0 // Server-side default
  );

  const breakpoint: BreakpointKey | "xs" =
    width >= BREAKPOINTS["2xl"]
      ? "2xl"
      : width >= BREAKPOINTS.xl
        ? "xl"
        : width >= BREAKPOINTS.lg
          ? "lg"
          : width >= BREAKPOINTS.md
            ? "md"
            : width >= BREAKPOINTS.sm
              ? "sm"
              : "xs";

  return {
    width,
    breakpoint,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isSmall: width < BREAKPOINTS.sm,
    isMedium: width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg,
    isLarge: width >= BREAKPOINTS.lg,
    isXLarge: width >= BREAKPOINTS.xl,
    is2XLarge: width >= BREAKPOINTS["2xl"],
  };
}

/**
 * Hook for checking if screen is at or above a breakpoint
 *
 * @example
 * ```tsx
 * const isLgOrLarger = useMinBreakpoint("lg");
 * ```
 */
export function useMinBreakpoint(breakpoint: BreakpointKey): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

/**
 * Hook for checking if screen is below a breakpoint
 *
 * @example
 * ```tsx
 * const isBelowMd = useMaxBreakpoint("md");
 * ```
 */
export function useMaxBreakpoint(breakpoint: BreakpointKey): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`);
}

/**
 * Hook for user preference: reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Hook for user preference: color scheme
 */
export function usePrefersColorScheme(): "light" | "dark" | "no-preference" {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const prefersLight = useMediaQuery("(prefers-color-scheme: light)");

  if (prefersDark) return "dark";
  if (prefersLight) return "light";
  return "no-preference";
}

/**
 * Hook for high contrast mode
 */
export function usePrefersHighContrast(): boolean {
  return useMediaQuery("(prefers-contrast: more)");
}

/**
 * Hook for detecting touch devices
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          // @ts-expect-error - msMaxTouchPoints is IE-specific
          navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}

/**
 * Hook for detecting orientation
 */
export function useOrientation(): "portrait" | "landscape" {
  const isPortrait = useMediaQuery("(orientation: portrait)");
  return isPortrait ? "portrait" : "landscape";
}

/**
 * Hook for window dimensions
 */
export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

/**
 * Hook for detecting if user prefers dark mode, with manual override
 */
export function useDarkMode(defaultValue?: boolean): [boolean, (value: boolean) => void] {
  const prefersDark = usePrefersColorScheme() === "dark";
  const [isDark, setIsDark] = useState(defaultValue ?? prefersDark);

  // Sync with system preference if no default is provided
  useEffect(() => {
    if (defaultValue === undefined) {
      setIsDark(prefersDark);
    }
  }, [prefersDark, defaultValue]);

  return [isDark, setIsDark];
}
