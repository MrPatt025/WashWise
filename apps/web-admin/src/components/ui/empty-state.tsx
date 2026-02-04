import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  AlertCircle,
  CreditCard,
  FolderOpen,
  type LucideIcon,
  Search,
  Settings,
  Users,
  WashingMachine,
} from "lucide-react";

interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional class names */
  className?: string;
}

/**
 * Empty state component for when no data is available
 * Used to guide users on what to do next
 */
export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
    >
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-muted-foreground">{description}</p>}
      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && <Button onClick={action.onClick}>{action.label}</Button>}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured empty states for common scenarios
 */
export const emptyStates = {
  machines: (onAdd: () => void) => (
    <EmptyState
      icon={WashingMachine}
      title="No machines yet"
      description="Add your first machine to start managing your laundromat"
      action={{ label: "Add Machine", onClick: onAdd }}
    />
  ),

  users: (onInvite: () => void) => (
    <EmptyState
      icon={Users}
      title="No team members"
      description="Invite team members to help manage your laundromat"
      action={{ label: "Invite Member", onClick: onInvite }}
    />
  ),

  transactions: () => (
    <EmptyState
      icon={CreditCard}
      title="No transactions yet"
      description="Transactions will appear here once customers start using your machines"
    />
  ),

  searchNoResults: (query: string, onClear: () => void) => (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No items match "${query}". Try adjusting your search.`}
      action={{ label: "Clear Search", onClick: onClear }}
    />
  ),

  error: (onRetry: () => void) => (
    <EmptyState
      icon={AlertCircle}
      title="Something went wrong"
      description="We couldn't load the data. Please try again."
      action={{ label: "Try Again", onClick: onRetry }}
    />
  ),

  settings: () => (
    <EmptyState
      icon={Settings}
      title="Configure your settings"
      description="Set up your laundromat preferences and configurations"
    />
  ),
};
