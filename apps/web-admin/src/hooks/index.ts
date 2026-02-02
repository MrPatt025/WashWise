// Authentication hooks
export * from "./use-auth";

// Machine data hooks
export * from "./use-machines";

// Utility hooks
export * from "./use-debounce";
export * from "./use-keyboard-shortcuts";
export * from "./use-focus-trap";
export * from "./use-media-query";
export * from "./use-local-storage";

// Common utility hooks (explicit exports to avoid conflicts)
export {
  useClickOutside,
  useScrollPosition,
  useScrollPast,
  useInView,
  useClipboard,
  useOnlineStatus,
  useToggle,
  useAsync,
  useCounter,
  useDocumentTitle,
  useHover,
  useInterval,
  useTimeout,
  useIsMounted,
} from "./use-common";
