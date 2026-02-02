"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Theme types
 */
export type Theme = "light" | "dark" | "system";

/**
 * Theme context value
 */
interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

/**
 * Local storage key
 */
const THEME_STORAGE_KEY = "washwise-theme";

/**
 * Get system theme preference
 */
function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Theme provider props
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  /** Default theme */
  defaultTheme?: Theme;
  /** Storage key for persistence */
  storageKey?: string;
  /** Attribute to set on document element */
  attribute?: "class" | "data-theme";
  /** Enable system theme detection */
  enableSystem?: boolean;
  /** Disable transitions when switching themes */
  disableTransitionOnChange?: boolean;
}

/**
 * Theme provider component
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() => {
    if (theme === "system") return getSystemTheme();
    return theme;
  });

  // Update resolved theme when theme or system preference changes
  React.useEffect(() => {
    const root = window.document.documentElement;

    // Remove previous theme classes
    root.classList.remove("light", "dark");

    // Determine the actual theme to apply
    let actualTheme: "light" | "dark";
    if (theme === "system") {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = theme;
    }

    // Disable transitions temporarily
    if (disableTransitionOnChange) {
      root.classList.add("[&_*]:!transition-none");
    }

    // Apply theme
    if (attribute === "class") {
      root.classList.add(actualTheme);
    } else {
      root.setAttribute("data-theme", actualTheme);
    }

    setResolvedTheme(actualTheme);

    // Re-enable transitions
    if (disableTransitionOnChange) {
      const timeout = setTimeout(() => {
        root.classList.remove("[&_*]:!transition-none");
      }, 0);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [theme, attribute, disableTransitionOnChange]);

  // Listen for system theme changes
  React.useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const systemTheme = getSystemTheme();
        setResolvedTheme(systemTheme);

        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(systemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, enableSystem]);

  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    },
    [storageKey]
  );

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to use theme
 */
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Theme toggle button (simple icon button)
 */
interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={className}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/**
 * Theme dropdown selector
 */
interface ThemeSelectorProps {
  className?: string;
  /** Show labels in dropdown */
  showLabels?: boolean;
}

export function ThemeSelector({ className, showLabels = true }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
    { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, label, icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="flex items-center gap-2"
          >
            {icon}
            {showLabels && <span>{label}</span>}
            {theme === value && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Theme card selector (for settings pages)
 */
interface ThemeCardSelectorProps {
  className?: string;
}

export function ThemeCardSelector({ className }: ThemeCardSelectorProps) {
  const { theme, setTheme } = useTheme();

  const themes: {
    value: Theme;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "light",
      label: "Light",
      description: "Light background with dark text",
      icon: <Sun className="h-6 w-6" />,
    },
    {
      value: "dark",
      label: "Dark",
      description: "Dark background with light text",
      icon: <Moon className="h-6 w-6" />,
    },
    {
      value: "system",
      label: "System",
      description: "Follow your system preferences",
      icon: <Monitor className="h-6 w-6" />,
    },
  ];

  return (
    <div className={cn("grid gap-4 sm:grid-cols-3", className)}>
      {themes.map(({ value, label, description, icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg border-2 p-4 text-center transition-colors",
            theme === value
              ? "border-primary bg-primary/5"
              : "border-transparent bg-muted/50 hover:bg-muted"
          )}
        >
          <div
            className={cn(
              "rounded-full p-3",
              theme === value ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {icon}
          </div>
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {theme === value && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Theme preview component (shows both light and dark versions)
 */
interface ThemePreviewProps {
  children: React.ReactNode;
  className?: string;
}

export function ThemePreview({ children, className }: ThemePreviewProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      <div className="rounded-lg border bg-white p-4 text-black">
        <p className="mb-2 text-xs font-medium text-gray-500">Light mode</p>
        {children}
      </div>
      <div className="rounded-lg border bg-gray-900 p-4 text-white">
        <p className="mb-2 text-xs font-medium text-gray-400">Dark mode</p>
        {children}
      </div>
    </div>
  );
}

/**
 * Script to prevent FOUC (Flash of Unstyled Content)
 * Include this in the head of your document
 */
export function ThemeScript({
  storageKey = THEME_STORAGE_KEY,
  attribute = "class",
}: {
  storageKey?: string;
  attribute?: "class" | "data-theme";
}) {
  const script = `
    (function() {
      const storageKey = '${storageKey}';
      const attribute = '${attribute}';
      
      function getTheme() {
        const stored = localStorage.getItem(storageKey);
        if (stored === 'light' || stored === 'dark') return stored;
        if (stored === 'system' || !stored) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
      }
      
      const theme = getTheme();
      
      if (attribute === 'class') {
        document.documentElement.classList.add(theme);
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    })();
  `.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
