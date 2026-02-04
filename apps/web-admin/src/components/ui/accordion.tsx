"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Minus, Plus } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface AccordionItem {
  id: string;
  title: string | React.ReactNode;
  content: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | React.ReactNode;
}

// ============================================================================
// Accordion Context
// ============================================================================

interface AccordionContextValue {
  expandedItems: Set<string>;
  toggleItem: (id: string) => void;
  variant: AccordionVariant;
  iconPosition: "left" | "right";
  allowMultiple: boolean;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion component");
  }
  return context;
}

// ============================================================================
// Accordion Container
// ============================================================================

type AccordionVariant = "default" | "bordered" | "separated" | "ghost";

interface AccordionProps {
  children: React.ReactNode;
  type?: "single" | "multiple";
  defaultExpanded?: string[];
  expanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  variant?: AccordionVariant;
  iconPosition?: "left" | "right";
  className?: string;
}

export function Accordion({
  children,
  type = "single",
  defaultExpanded = [],
  expanded: controlledExpanded,
  onExpandedChange,
  variant = "default",
  iconPosition = "right",
  className,
}: AccordionProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState<Set<string>>(
    new Set(defaultExpanded)
  );

  const isControlled = controlledExpanded !== undefined;
  const expandedItems = React.useMemo(
    () => (isControlled ? new Set(controlledExpanded) : uncontrolledExpanded),
    [isControlled, controlledExpanded, uncontrolledExpanded]
  );

  const toggleItem = React.useCallback(
    (id: string) => {
      const newExpanded = new Set(expandedItems);

      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        if (type === "single") {
          newExpanded.clear();
        }
        newExpanded.add(id);
      }

      if (!isControlled) {
        setUncontrolledExpanded(newExpanded);
      }
      onExpandedChange?.(Array.from(newExpanded));
    },
    [expandedItems, type, isControlled, onExpandedChange]
  );

  const variantClasses = {
    default:
      "border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700",
    bordered: "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden",
    separated: "space-y-3",
    ghost: "",
  };

  return (
    <AccordionContext.Provider
      value={{
        expandedItems,
        toggleItem,
        variant,
        iconPosition,
        allowMultiple: type === "multiple",
      }}
    >
      <div className={cn(variantClasses[variant], className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

// ============================================================================
// Accordion Item
// ============================================================================

interface AccordionItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function AccordionItemComponent({ id, children, disabled, className }: AccordionItemProps) {
  const { variant } = useAccordionContext();

  const variantClasses = {
    default: "",
    bordered: "border-b border-gray-200 dark:border-gray-700 last:border-b-0",
    separated: "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden",
    ghost: "",
  };

  return (
    <div
      data-accordion-item={id}
      data-disabled={disabled || undefined}
      className={cn(variantClasses[variant], disabled && "opacity-50", className)}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Accordion Trigger
// ============================================================================

interface AccordionTriggerProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function AccordionTrigger({
  id,
  children,
  disabled,
  icon,
  className,
}: AccordionTriggerProps) {
  const { expandedItems, toggleItem, variant, iconPosition } = useAccordionContext();
  const isExpanded = expandedItems.has(id);

  const Icon = icon || (
    <ChevronDown
      className={cn("h-5 w-5 transition-transform duration-200", isExpanded && "rotate-180")}
    />
  );

  const variantClasses = {
    default: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
    bordered: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
    separated: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg",
  };

  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      aria-controls={`accordion-content-${id}`}
      id={`accordion-trigger-${id}`}
      disabled={disabled}
      onClick={() => !disabled && toggleItem(id)}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        variantClasses[variant],
        disabled && "cursor-not-allowed",
        className
      )}
    >
      {iconPosition === "left" && (
        <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">{Icon}</span>
      )}
      <span className="flex-1 font-medium text-gray-900 dark:text-white">{children}</span>
      {iconPosition === "right" && (
        <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">{Icon}</span>
      )}
    </button>
  );
}

// ============================================================================
// Accordion Content
// ============================================================================

interface AccordionContentProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionContent({ id, children, className }: AccordionContentProps) {
  const { expandedItems } = useAccordionContext();
  const isExpanded = expandedItems.has(id);

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          id={`accordion-content-${id}`}
          aria-labelledby={`accordion-trigger-${id}`}
          role="region"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className={cn("px-4 pb-4 text-gray-600 dark:text-gray-300", className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Simple Accordion (all-in-one component)
// ============================================================================

interface SimpleAccordionProps {
  items: AccordionItem[];
  type?: "single" | "multiple";
  defaultExpanded?: string[];
  expanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  variant?: AccordionVariant;
  iconPosition?: "left" | "right";
  iconType?: "chevron" | "plus-minus";
  className?: string;
}

export function SimpleAccordion({
  items,
  type = "single",
  defaultExpanded = [],
  expanded,
  onExpandedChange,
  variant = "default",
  iconPosition = "right",
  iconType = "chevron",
  className,
}: SimpleAccordionProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set(defaultExpanded));

  const isControlled = expanded !== undefined;
  const currentExpanded = isControlled ? new Set(expanded) : expandedItems;

  const handleToggle = (id: string) => {
    const newExpanded = new Set(currentExpanded);

    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      if (type === "single") {
        newExpanded.clear();
      }
      newExpanded.add(id);
    }

    if (!isControlled) {
      setExpandedItems(newExpanded);
    }
    onExpandedChange?.(Array.from(newExpanded));
  };

  const variantClasses = {
    default:
      "border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700",
    bordered: "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden",
    separated: "space-y-3",
    ghost: "",
  };

  const itemVariantClasses = {
    default: "",
    bordered: "border-b border-gray-200 dark:border-gray-700 last:border-b-0",
    separated: "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden",
    ghost: "",
  };

  const triggerVariantClasses = {
    default: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
    bordered: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
    separated: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg",
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      {items.map((item) => {
        const isExpanded = currentExpanded.has(item.id);

        const icon =
          iconType === "plus-minus" ? (
            isExpanded ? (
              <Minus className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )
          ) : (
            <ChevronDown
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          );

        return (
          <div
            key={item.id}
            className={cn(itemVariantClasses[variant], item.disabled && "opacity-50")}
          >
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={`accordion-content-${item.id}`}
              id={`accordion-trigger-${item.id}`}
              disabled={item.disabled}
              onClick={() => !item.disabled && handleToggle(item.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                triggerVariantClasses[variant],
                item.disabled && "cursor-not-allowed"
              )}
            >
              {iconPosition === "left" && (
                <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>
              )}
              {item.icon && (
                <span className="flex-shrink-0 text-gray-500 dark:text-gray-400">{item.icon}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{item.title}</span>
                  {item.badge && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.subtitle && (
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                )}
              </div>
              {iconPosition === "right" && (
                <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>
              )}
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  id={`accordion-content-${item.id}`}
                  aria-labelledby={`accordion-trigger-${item.id}`}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 text-gray-600 dark:text-gray-300">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// FAQ Accordion
// ============================================================================

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

export function FAQAccordion({ items, className }: FAQAccordionProps) {
  const accordionItems: AccordionItem[] = items.map((item, index) => ({
    id: `faq-${index}`,
    title: item.question,
    content: (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {typeof item.answer === "string" ? <p>{item.answer}</p> : item.answer}
      </div>
    ),
  }));

  return (
    <SimpleAccordion
      items={accordionItems}
      type="single"
      variant="separated"
      iconType="plus-minus"
      className={className}
    />
  );
}

// ============================================================================
// Collapsible (simple single item)
// ============================================================================

interface CollapsibleProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function Collapsible({
  trigger,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  disabled,
  className,
  triggerClassName,
  contentClassName,
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = () => {
    if (disabled) {
      return;
    }

    const newState = !isOpen;
    if (!isControlled) {
      setUncontrolledOpen(newState);
    }
    onOpenChange?.(newState);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between gap-2",
          disabled && "cursor-not-allowed opacity-50",
          triggerClassName
        )}
      >
        {trigger}
        <ChevronDown
          className={cn(
            "h-5 w-5 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={contentClassName}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Details/Summary Style Accordion
// ============================================================================

interface DetailsAccordionItem {
  summary: string | React.ReactNode;
  details: React.ReactNode;
  open?: boolean;
}

interface DetailsAccordionProps {
  items: DetailsAccordionItem[];
  className?: string;
}

export function DetailsAccordion({ items, className }: DetailsAccordionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <details
          key={index}
          open={item.open}
          className="group rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <span className="font-medium text-gray-900 dark:text-white">{item.summary}</span>
            <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 text-gray-600 dark:text-gray-300">{item.details}</div>
        </details>
      ))}
    </div>
  );
}
