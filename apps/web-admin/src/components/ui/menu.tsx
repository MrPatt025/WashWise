"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Circle, type LucideIcon } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

type MenuPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
  children?: MenuItem[];
}

// ============================================================================
// Menu Context
// ============================================================================

interface MenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  placement: MenuPlacement;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  closeMenu: () => void;
}

const MenuContext = React.createContext<MenuContextValue | null>(null);

function useMenuContext() {
  const context = React.useContext(MenuContext);
  if (!context) {
    throw new Error("Menu components must be used within a Menu");
  }
  return context;
}

// ============================================================================
// Menu
// ============================================================================

interface MenuProps {
  children: React.ReactNode;
  placement?: MenuPlacement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Menu({ children, placement = "bottom-start", open, onOpenChange }: MenuProps) {
  const [isOpen, setIsOpenState] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const triggerRef = React.useRef<HTMLElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const setIsOpen = React.useCallback(
    (value: boolean) => {
      if (open === undefined) {
        setIsOpenState(value);
      }
      onOpenChange?.(value);
      if (!value) {
        setActiveIndex(-1);
      }
    },
    [open, onOpenChange]
  );

  const actualIsOpen = open !== undefined ? open : isOpen;

  const closeMenu = React.useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (actualIsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actualIsOpen, setIsOpen]);

  // Close on Escape
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (actualIsOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [actualIsOpen, setIsOpen]);

  const contextValue = React.useMemo(
    () => ({
      isOpen: actualIsOpen,
      setIsOpen,
      triggerRef,
      menuRef,
      placement,
      activeIndex,
      setActiveIndex,
      closeMenu,
    }),
    [actualIsOpen, setIsOpen, placement, activeIndex, closeMenu]
  );

  return (
    <MenuContext.Provider value={contextValue}>
      <div className="relative inline-block">{children}</div>
    </MenuContext.Provider>
  );
}

// ============================================================================
// Menu Trigger
// ============================================================================

interface MenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export function MenuTrigger({ children, asChild = false, className }: MenuTriggerProps) {
  const { triggerRef, isOpen, setIsOpen } = useMenuContext();

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{
        ref?: React.Ref<HTMLElement>;
        onClick?: () => void;
        onKeyDown?: (e: React.KeyboardEvent) => void;
        "aria-expanded"?: boolean;
        "aria-haspopup"?: boolean;
      }>,
      {
        ref: triggerRef,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        "aria-expanded": isOpen,
        "aria-haspopup": true,
      }
    );
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      className={className}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-expanded={isOpen}
      aria-haspopup="menu"
    >
      {children}
    </button>
  );
}

// ============================================================================
// Menu Content
// ============================================================================

const placementStyles: Record<MenuPlacement, string> = {
  "bottom-start": "top-full left-0 mt-1",
  "bottom-end": "top-full right-0 mt-1",
  "top-start": "bottom-full left-0 mb-1",
  "top-end": "bottom-full right-0 mb-1",
};

interface MenuContentProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
}

export function MenuContent({ children, className, minWidth = 180 }: MenuContentProps) {
  const { isOpen, menuRef, placement } = useMenuContext();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute z-50 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800",
            "focus:outline-none",
            placementStyles[placement],
            className
          )}
          style={{ minWidth }}
          role="menu"
          aria-orientation="vertical"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Menu Item
// ============================================================================

interface MenuItemProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function MenuItem({
  children,
  icon: Icon,
  shortcut,
  disabled = false,
  danger = false,
  onClick,
  href,
  className,
}: MenuItemProps) {
  const { closeMenu } = useMenuContext();

  const handleClick = () => {
    if (disabled) {
      return;
    }
    onClick?.();
    closeMenu();
  };

  const content = (
    <>
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="ml-auto pl-4 text-xs text-gray-400 dark:text-gray-500">{shortcut}</span>
      )}
    </>
  );

  const itemClassName = cn(
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
    "focus:bg-gray-100 focus:outline-none dark:focus:bg-gray-700",
    disabled
      ? "cursor-not-allowed opacity-50"
      : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
    danger ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-200",
    className
  );

  if (href && !disabled) {
    return (
      <a href={href} className={itemClassName} role="menuitem" onClick={closeMenu}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={itemClassName}
      onClick={handleClick}
      disabled={disabled}
      role="menuitem"
    >
      {content}
    </button>
  );
}

// ============================================================================
// Menu Separator
// ============================================================================

interface MenuSeparatorProps {
  className?: string;
}

export function MenuSeparator({ className }: MenuSeparatorProps) {
  return (
    <div className={cn("my-1 h-px bg-gray-200 dark:bg-gray-700", className)} role="separator" />
  );
}

// ============================================================================
// Menu Label
// ============================================================================

interface MenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function MenuLabel({ children, className }: MenuLabelProps) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Menu Group
// ============================================================================

interface MenuGroupProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function MenuGroup({ label, children, className }: MenuGroupProps) {
  return (
    <div className={className} role="group" aria-label={label}>
      {label && <MenuLabel>{label}</MenuLabel>}
      {children}
    </div>
  );
}

// ============================================================================
// Menu Checkbox Item
// ============================================================================

interface MenuCheckboxItemProps {
  children: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function MenuCheckboxItem({
  children,
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
}: MenuCheckboxItemProps) {
  const handleClick = () => {
    if (disabled) {
      return;
    }
    onCheckedChange?.(!checked);
  };

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
        "focus:bg-gray-100 focus:outline-none dark:focus:bg-gray-700",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
        "text-gray-700 dark:text-gray-200",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      role="menuitemcheckbox"
      aria-checked={checked}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border",
          checked
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-gray-300 dark:border-gray-600"
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

// ============================================================================
// Menu Radio Group
// ============================================================================

interface MenuRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const RadioGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
} | null>(null);

export function MenuRadioGroup({ value, onValueChange, children, className }: MenuRadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={className} role="group">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

// ============================================================================
// Menu Radio Item
// ============================================================================

interface MenuRadioItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function MenuRadioItem({
  value,
  children,
  disabled = false,
  className,
}: MenuRadioItemProps) {
  const context = React.useContext(RadioGroupContext);
  const isSelected = context?.value === value;

  const handleClick = () => {
    if (disabled) {
      return;
    }
    context?.onValueChange?.(value);
  };

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
        "focus:bg-gray-100 focus:outline-none dark:focus:bg-gray-700",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
        "text-gray-700 dark:text-gray-200",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      role="menuitemradio"
      aria-checked={isSelected}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full border",
          isSelected ? "border-blue-600" : "border-gray-300 dark:border-gray-600"
        )}
      >
        {isSelected && <Circle className="h-2.5 w-2.5 fill-blue-600 text-blue-600" />}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

// ============================================================================
// Submenu
// ============================================================================

interface SubmenuProps {
  label: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Submenu({
  label,
  icon: Icon,
  children,
  disabled = false,
  className,
}: SubmenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const submenuRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative"
      onMouseEnter={() => !disabled && setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
          "focus:bg-gray-100 focus:outline-none dark:focus:bg-gray-700",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
          "text-gray-700 dark:text-gray-200",
          className
        )}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
        <span className="flex-1">{label}</span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={submenuRef}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-0 ml-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            role="menu"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Context Menu
// ============================================================================

interface ContextMenuProps {
  children: React.ReactNode;
  menu: React.ReactNode;
}

export function ContextMenu({ children, menu }: ContextMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const menuRef = React.useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  };

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Close menu function
  const closeMenu = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      triggerRef: { current: null },
      menuRef,
      placement: "bottom-start" as MenuPlacement,
      activeIndex: -1,
      setActiveIndex: () => {},
      closeMenu,
    }),
    [isOpen, closeMenu]
  );

  return (
    <MenuContext.Provider value={contextValue}>
      <div onContextMenu={handleContextMenu}>{children}</div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            style={{ left: position.x, top: position.y }}
            role="menu"
          >
            {menu}
          </motion.div>
        )}
      </AnimatePresence>
    </MenuContext.Provider>
  );
}

// ============================================================================
// Simple Dropdown (convenience component)
// ============================================================================

interface SimpleDropdownProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  placement?: MenuPlacement;
  className?: string;
}

export function SimpleDropdown({
  trigger,
  items,
  placement = "bottom-start",
  className,
}: SimpleDropdownProps) {
  const renderItems = (menuItems: MenuItem[]) => {
    return menuItems.map((item) => {
      if (item.children) {
        return (
          <Submenu key={item.id} label={item.label} icon={item.icon} disabled={item.disabled}>
            {renderItems(item.children)}
          </Submenu>
        );
      }

      return (
        <MenuItem
          key={item.id}
          icon={item.icon}
          shortcut={item.shortcut}
          disabled={item.disabled}
          danger={item.danger}
          onClick={item.onClick}
          href={item.href}
        >
          {item.label}
        </MenuItem>
      );
    });
  };

  return (
    <Menu placement={placement}>
      <MenuTrigger asChild>{trigger}</MenuTrigger>
      <MenuContent className={className}>{renderItems(items)}</MenuContent>
    </Menu>
  );
}
