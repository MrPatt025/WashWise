"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Modal Context & Provider
// ============================================================================

interface ModalState {
  id: string;
  component: React.ReactNode;
  props?: ModalOptions;
}

interface ModalContextValue {
  modals: ModalState[];
  openModal: (id: string, component: React.ReactNode, options?: ModalOptions) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isOpen: (id: string) => boolean;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = React.useState<ModalState[]>([]);

  const openModal = React.useCallback(
    (id: string, component: React.ReactNode, options?: ModalOptions) => {
      setModals((prev) => {
        // Don't add if already exists
        if (prev.some((m) => m.id === id)) {
          return prev;
        }
        return [...prev, { id, component, props: options }];
      });
    },
    []
  );

  const closeModal = React.useCallback((id: string) => {
    setModals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const closeAllModals = React.useCallback(() => {
    setModals([]);
  }, []);

  const isOpen = React.useCallback((id: string) => modals.some((m) => m.id === id), [modals]);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modals.length > 0) {
        const lastModal = modals[modals.length - 1];
        if (!lastModal.props?.preventEscapeClose) {
          closeModal(lastModal.id);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modals, closeModal]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (modals.length > 0) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [modals.length]);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAllModals, isOpen }}>
      {children}
      <ModalContainer />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}

// ============================================================================
// Modal Container (renders all modals)
// ============================================================================

function ModalContainer() {
  const { modals } = useModal();

  if (modals.length === 0) {
    return null;
  }

  return (
    <>
      {modals.map((modal, index) => (
        <ModalWrapper key={modal.id} modal={modal} zIndex={50 + index * 10} />
      ))}
    </>
  );
}

function ModalWrapper({ modal, zIndex }: { modal: ModalState; zIndex: number }) {
  const { closeModal } = useModal();

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm duration-200 animate-in fade-in"
        onClick={() => {
          if (!modal.props?.preventBackdropClose) {
            closeModal(modal.id);
          }
        }}
      />

      {/* Modal Content */}
      <div className="relative duration-200 animate-in fade-in zoom-in-95">{modal.component}</div>
    </div>
  );
}

// ============================================================================
// Modal Component
// ============================================================================

interface ModalOptions {
  preventEscapeClose?: boolean;
  preventBackdropClose?: boolean;
}

interface ModalProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  onClose?: () => void;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[90vw] max-h-[90vh]",
};

export function Modal({ children, className, size = "md", onClose }: ModalProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900",
        sizeClasses[size],
        className
      )}
      role="dialog"
      aria-modal="true"
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === ModalHeader) {
          return React.cloneElement(child as React.ReactElement<ModalHeaderProps>, {
            onClose,
          });
        }
        return child;
      })}
    </div>
  );
}

// ============================================================================
// Modal Header
// ============================================================================

interface ModalHeaderProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export function ModalHeader({
  children,
  title,
  description,
  onClose,
  showCloseButton = true,
  className,
}: ModalHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between border-b border-gray-200 p-6 dark:border-gray-800",
        className
      )}
    >
      <div className="flex-1">
        {title && <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>}
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
        {children}
      </div>

      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="ml-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Modal Body
// ============================================================================

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn("max-h-[60vh] overflow-y-auto p-6", className)}>{children}</div>;
}

// ============================================================================
// Modal Footer
// ============================================================================

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// useModalState Hook (for controlled modals)
// ============================================================================

interface UseModalStateOptions {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function useModalState(options: UseModalStateOptions = {}) {
  const { defaultOpen = false, onOpenChange } = options;
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const open = React.useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  const close = React.useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => {
      const newValue = !prev;
      onOpenChange?.(newValue);
      return newValue;
    });
  }, [onOpenChange]);

  return { isOpen, open, close, toggle };
}

// ============================================================================
// Sheet / Drawer Component
// ============================================================================

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sheetSideClasses = {
  left: "left-0 top-0 h-full animate-in slide-in-from-left duration-300",
  right: "right-0 top-0 h-full animate-in slide-in-from-right duration-300",
  top: "top-0 left-0 w-full animate-in slide-in-from-top duration-300",
  bottom: "bottom-0 left-0 w-full animate-in slide-in-from-bottom duration-300",
};

const sheetSizeClasses = {
  left: { sm: "w-64", md: "w-80", lg: "w-96", xl: "w-[480px]", full: "w-full" },
  right: {
    sm: "w-64",
    md: "w-80",
    lg: "w-96",
    xl: "w-[480px]",
    full: "w-full",
  },
  top: { sm: "h-32", md: "h-48", lg: "h-64", xl: "h-96", full: "h-full" },
  bottom: { sm: "h-32", md: "h-48", lg: "h-64", xl: "h-96", full: "h-full" },
};

export function Sheet({
  open,
  onClose,
  children,
  side = "right",
  size = "md",
  className,
}: SheetProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm duration-200 animate-in fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "absolute bg-white shadow-2xl dark:bg-gray-900",
          sheetSideClasses[side],
          sheetSizeClasses[side][size],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Sheet Header
// ============================================================================

interface SheetHeaderProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export function SheetHeader({
  children,
  title,
  description,
  onClose,
  showCloseButton = true,
  className,
}: SheetHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between border-b border-gray-200 p-4 dark:border-gray-800",
        className
      )}
    >
      <div className="flex-1">
        {title && <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>}
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
        {children}
      </div>

      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="ml-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Sheet Body
// ============================================================================

interface SheetBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function SheetBody({ children, className }: SheetBodyProps) {
  return <div className={cn("flex-1 overflow-y-auto p-4", className)}>{children}</div>;
}

// ============================================================================
// Sheet Footer
// ============================================================================

interface SheetFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function SheetFooter({ children, className }: SheetFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Prebuilt Modal Components
// ============================================================================

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "info" | "warning" | "error" | "success";
}

const alertVariantClasses = {
  info: "text-blue-600 dark:text-blue-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  error: "text-red-600 dark:text-red-400",
  success: "text-green-600 dark:text-green-400",
};

export function AlertModal({
  open,
  onClose,
  title,
  message,
  confirmLabel = "OK",
  variant = "info",
}: AlertModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Modal size="sm" onClose={onClose}>
        <ModalHeader title={title} onClose={onClose} />
        <ModalBody>
          <p className={cn("text-sm", alertVariantClasses[variant])}>{message}</p>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            {confirmLabel}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ============================================================================
// Fullscreen Modal
// ============================================================================

interface FullscreenModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function FullscreenModal({ open, onClose, children, title }: FullscreenModalProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-white duration-200 animate-in fade-in dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        {title && <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>}
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
