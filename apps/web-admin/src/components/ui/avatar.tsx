"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

// ============================================================================
// Avatar Component
// ============================================================================

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const sizeClasses: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
  "2xl": "w-20 h-20 text-2xl",
};

const iconSizes: Record<AvatarSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-10 h-10",
};

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  shape?: "circle" | "square";
  fallback?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  shape = "circle",
  fallback,
  className,
  onClick,
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const initials = name ? getInitials(name) : null;

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-lg";

  const handleError = () => {
    setImageError(true);
  };

  // Reset error when src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const renderContent = () => {
    if (src && !imageError) {
      return (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className="h-full w-full object-cover"
          onError={handleError}
        />
      );
    }

    if (fallback) {
      return fallback;
    }

    if (initials) {
      return <span className="font-medium text-gray-700 dark:text-gray-300">{initials}</span>;
    }

    return <User className={cn("text-gray-400", iconSizes[size])} />;
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800",
        sizeClasses[size],
        shapeClass,
        onClick && "cursor-pointer transition-opacity hover:opacity-80",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {renderContent()}
    </div>
  );
}

// ============================================================================
// Avatar with Badge
// ============================================================================

interface AvatarWithBadgeProps extends AvatarProps {
  badgeContent?: React.ReactNode;
  badgePosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  badgeColor?: "green" | "red" | "yellow" | "blue" | "gray";
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

const badgePositionClasses = {
  "top-right": "top-0 right-0",
  "top-left": "top-0 left-0",
  "bottom-right": "bottom-0 right-0",
  "bottom-left": "bottom-0 left-0",
};

const badgeColorClasses = {
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  blue: "bg-blue-500",
  gray: "bg-gray-500",
};

export function AvatarWithBadge({
  badgeContent,
  badgePosition = "bottom-right",
  badgeColor = "green",
  showOnlineIndicator,
  isOnline,
  ...avatarProps
}: AvatarWithBadgeProps) {
  return (
    <div className="relative inline-block">
      <Avatar {...avatarProps} />

      {showOnlineIndicator && (
        <span
          className={cn(
            "absolute h-3 w-3 rounded-full border-2 border-white dark:border-gray-900",
            badgePositionClasses[badgePosition],
            isOnline ? badgeColorClasses.green : badgeColorClasses.gray
          )}
        />
      )}

      {badgeContent && !showOnlineIndicator && (
        <span
          className={cn(
            "absolute flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-bold text-white",
            badgePositionClasses[badgePosition],
            badgeColorClasses[badgeColor]
          )}
        >
          {badgeContent}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Avatar Group (stacked avatars)
// ============================================================================

interface AvatarGroupProps {
  avatars: {
    src?: string | null;
    name?: string;
    alt?: string;
  }[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({ avatars, max = 5, size = "md", className }: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const overlapClasses: Record<AvatarSize, string> = {
    xs: "-ml-1.5",
    sm: "-ml-2",
    md: "-ml-2.5",
    lg: "-ml-3",
    xl: "-ml-4",
    "2xl": "-ml-5",
  };

  return (
    <div className={cn("flex items-center", className)}>
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            "relative rounded-full ring-2 ring-white dark:ring-gray-900",
            index > 0 && overlapClasses[size]
          )}
          style={{ zIndex: displayAvatars.length - index }}
        >
          <Avatar src={avatar.src} name={avatar.name} alt={avatar.alt} size={size} />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            "relative rounded-full ring-2 ring-white dark:ring-gray-900",
            overlapClasses[size]
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700",
              sizeClasses[size]
            )}
          >
            <span className="font-medium text-gray-600 dark:text-gray-300">+{remainingCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// User Avatar (with name and role)
// ============================================================================

interface UserAvatarProps {
  user: {
    name?: string;
    email?: string;
    image?: string | null;
    role?: string;
  };
  size?: AvatarSize;
  showDetails?: boolean;
  className?: string;
}

export function UserAvatar({ user, size = "md", showDetails = true, className }: UserAvatarProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar src={user.image} name={user.name} alt={user.name} size={size} />

      {showDetails && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {user.name || "Unknown User"}
          </p>
          {user.email && (
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          )}
          {user.role && !user.email && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// Avatar Colors (for deterministic color based on name)
// ============================================================================

const avatarColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

export function getAvatarColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
}

// ============================================================================
// Colored Avatar (with deterministic background color)
// ============================================================================

interface ColoredAvatarProps extends Omit<AvatarProps, "className"> {
  colorSource?: string;
  className?: string;
}

export function ColoredAvatar({ colorSource, name, ...props }: ColoredAvatarProps) {
  const colorClass = getAvatarColor(colorSource || name || "");

  return <Avatar {...props} name={name} className={cn(colorClass, "text-white")} />;
}
