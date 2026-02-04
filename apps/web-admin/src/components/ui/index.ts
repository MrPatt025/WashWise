// ============================================================================
// WashWise UI Component Library
// World-class, production-ready components
// ============================================================================

// Base Components
export * from "./button";
export * from "./label";
export * from "./checkbox";

// Layout Components
export * from "./card";
export * from "./dialog";
export * from "./modal";
export * from "./alert-dialog";

// Data Display
export * from "./avatar";
export * from "./badge";
export * from "./stat-card";
export * from "./data-table";
export * from "./pagination";
export * from "./empty-state";
export * from "./timeline";

// Charts & Stats
export * from "./chart";
export * from "./metrics-card";

// Activity Feed (explicit exports to avoid conflicts)
export {
  ActivityFeed,
  ActivityItemCard,
  CompactActivityList,
  type ActivityItem,
  type ActivityType,
} from "./activity-feed";

// Status Indicator (explicit exports to avoid conflicts)
export {
  StatusIndicator,
  MachineStatusBadge,
  ConnectionStatus,
  MachineStatusCard,
  StatusOverview,
} from "./status-indicator";

// Data Visualization (explicit exports to avoid conflicts)
export {
  ProgressRing as DataProgressRing,
  DonutChart as DataDonutChart,
  StatComparison,
  MiniBarChart,
  GaugeChart,
  HeatMap,
} from "./data-visualization";

export {
  Stat,
  StatWithSparkline,
  StatGrid,
  ComparisonStat,
  AnimatedCounter as StatAnimatedCounter,
  GoalStat,
  StatList,
} from "./stat";

// Advanced Table (explicit exports to avoid conflicts)
export {
  Table,
  TableHeader,
  TableHeaderRow,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableFooter,
  TableToolbar,
  ColumnVisibilityToggle,
  ExportButton,
  FilterPanel,
  EmptyTable,
  type TableColumn,
  type SortDirection,
  type FilterState,
} from "./table";

// Progress Components (explicit to avoid conflicts)
export {
  ProgressBar,
  MultiProgress,
  CircularProgress,
  StepProgress,
  CountdownProgress,
} from "./progress";

// Navigation
export * from "./breadcrumb";
export * from "./tabs";
export * from "./navigation";
export * from "./dropdown-menu";

// Forms - use form-elements as primary (most comprehensive)
export * from "./form-elements";

// File Upload
export * from "./file-upload";

// Menus & Dropdowns
export * from "./menu";

// Feedback
export * from "./toast";
export * from "./sonner";
export * from "./tooltip";
export * from "./skeleton";
export * from "./error-boundary";
export * from "./banner";
export * from "./alert";
export * from "./confirm-dialog";

// Loading States
export * from "./loading";

// Keyboard Shortcuts
export * from "./keyboard-shortcuts";

// Overlays
export * from "./command";
export * from "./accordion";

// Theme & Utilities
export * from "./theme-provider";
export * from "./animations";

// Dashboard Widgets
export * from "./dashboard-widget";

// World-Class UI Components
export * from "./notification-center";
export * from "./stat-showcase";
export * from "./glassmorphism-card";
export * from "./advanced-select";
