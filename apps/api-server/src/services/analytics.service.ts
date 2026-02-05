import { prisma } from "@washwise/database";
import type { MachineStatus, MachineType } from "@washwise/types";

// Type definitions for Prisma select query results
interface UtilizationMachine {
  id: string;
  status: string;
  type: string;
  totalCycles: number;
  lastHeartbeat: Date | null;
}

interface RevenueMachine {
  totalCycles: number;
  pricePerCycle: number;
}

interface PerformanceMachine {
  id: string;
  status: string;
  errorCount: number;
  lastMaintenanceAt: Date | null;
  totalCycles: number;
  createdAt: Date;
}

interface RankingMachine {
  id: string;
  label: string;
  serialNumber: string;
  type: string;
  pricePerCycle: number;
  totalCycles: number;
  errorCount: number;
  status: string;
}

/**
 * Analytics Service - Provides comprehensive business intelligence
 * Handles machine utilization, revenue analytics, and performance metrics
 */
export class AnalyticsService {
  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(tenantId: string): Promise<DashboardAnalytics> {
    const [machineStats, utilizationMetrics, revenueMetrics, performanceMetrics] =
      await Promise.all([
        this.getMachineStats(tenantId),
        this.getUtilizationMetrics(tenantId),
        this.getRevenueMetrics(tenantId),
        this.getPerformanceMetrics(tenantId),
      ]);

    return {
      machineStats,
      utilizationMetrics,
      revenueMetrics,
      performanceMetrics,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get machine status distribution
   */
  async getMachineStats(tenantId: string): Promise<MachineStats> {
    const stats = await prisma.machine.groupBy({
      by: ["status", "type"],
      where: { tenantId },
      _count: true,
    });

    const result: MachineStats = {
      total: 0,
      byStatus: {
        idle: 0,
        running: 0,
        maintenance: 0,
        error: 0,
        offline: 0,
      },
      byType: {
        washer: 0,
        dryer: 0,
      },
      healthScore: 0,
    };

    for (const stat of stats) {
      const count = stat._count;
      result.total += count;

      // Map to type
      const machineType = stat.type.toLowerCase();
      if (machineType === "washer") {
        result.byType.washer += count;
      } else if (machineType === "dryer") {
        result.byType.dryer += count;
      }

      // Map status
      switch (stat.status) {
        case "IDLE":
          result.byStatus.idle += count;
          break;
        case "RUNNING":
        case "RESERVED":
          result.byStatus.running += count;
          break;
        case "MAINTENANCE":
          result.byStatus.maintenance += count;
          break;
        case "ERROR":
        case "OUT_OF_ORDER":
          result.byStatus.error += count;
          break;
        case "OFFLINE":
        case "DISABLED":
          result.byStatus.offline += count;
          break;
      }
    }

    // Calculate health score (0-100)
    const workingMachines = result.byStatus.idle + result.byStatus.running;
    result.healthScore =
      result.total > 0 ? Math.round((workingMachines / result.total) * 100) : 100;

    return result;
  }

  /**
   * Get utilization metrics
   */
  async getUtilizationMetrics(tenantId: string): Promise<UtilizationMetrics> {
    const machines: UtilizationMachine[] = await prisma.machine.findMany({
      where: { tenantId },
      select: {
        id: true,
        status: true,
        type: true,
        totalCycles: true,
        lastHeartbeat: true,
      },
    });

    const totalMachines = machines.length;
    const activeMachines = machines.filter(
      (m: UtilizationMachine) => m.status === "RUNNING" || m.status === "RESERVED"
    ).length;

    // Calculate current utilization rate
    const currentUtilization =
      totalMachines > 0 ? Math.round((activeMachines / totalMachines) * 100) : 0;

    // Calculate average cycles per machine
    const totalCycles = machines.reduce(
      (sum: number, m: UtilizationMachine) => sum + (m.totalCycles || 0),
      0
    );
    const avgCyclesPerMachine = totalMachines > 0 ? Math.round(totalCycles / totalMachines) : 0;

    // Calculate peak hours (simulated for demo)
    const peakHours = this.calculatePeakHours();

    // Recently used machines (within last 24 hours based on heartbeat)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyUsed = machines.filter(
      (m: UtilizationMachine) => m.lastHeartbeat && m.lastHeartbeat > oneDayAgo
    ).length;

    return {
      currentUtilization,
      avgCyclesPerMachine,
      peakHours,
      recentlyUsedCount: recentlyUsed,
      idleCount: machines.filter((m: UtilizationMachine) => m.status === "IDLE").length,
      utilizationTrend: this.calculateTrend(),
    };
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(tenantId: string): Promise<RevenueMetrics> {
    // Get revenue data from machine metrics aggregated data
    const machines: RevenueMachine[] = await prisma.machine.findMany({
      where: { tenantId },
      select: {
        totalCycles: true,
        pricePerCycle: true,
      },
    });

    // Calculate revenue from cycles * price
    const totalRevenue = machines.reduce(
      (sum: number, m: RevenueMachine) => sum + m.totalCycles * m.pricePerCycle,
      0
    );
    const totalCycles = machines.reduce((sum: number, m: RevenueMachine) => sum + m.totalCycles, 0);
    const avgPricePerCycle =
      machines.length > 0
        ? machines.reduce((sum: number, m: RevenueMachine) => sum + m.pricePerCycle, 0) /
          machines.length
        : 0;

    // Calculate daily average (simulated - in real app, would use transactions table)
    const dailyAverage = totalRevenue / 30; // Assuming 30 days of data

    // Weekly breakdown (simulated data for demo)
    const weeklyBreakdown = this.generateWeeklyBreakdown(totalRevenue);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCycles,
      avgRevenuePerCycle:
        totalCycles > 0 ? Math.round((totalRevenue / totalCycles) * 100) / 100 : avgPricePerCycle,
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      weeklyBreakdown,
      revenueTrend: this.calculateTrend(),
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(tenantId: string): Promise<PerformanceMetrics> {
    const machines: PerformanceMachine[] = await prisma.machine.findMany({
      where: { tenantId },
      select: {
        id: true,
        status: true,
        errorCount: true,
        lastMaintenanceAt: true,
        totalCycles: true,
        createdAt: true,
      },
    });

    // Calculate error rate
    const totalErrors = machines.reduce(
      (sum: number, m: PerformanceMachine) => sum + (m.errorCount || 0),
      0
    );
    const totalCycles = machines.reduce(
      (sum: number, m: PerformanceMachine) => sum + (m.totalCycles || 0),
      0
    );
    const errorRate = totalCycles > 0 ? Math.round((totalErrors / totalCycles) * 10000) / 100 : 0;

    // Calculate uptime
    const workingMachines = machines.filter(
      (m: PerformanceMachine) =>
        m.status !== "ERROR" && m.status !== "OUT_OF_ORDER" && m.status !== "OFFLINE"
    ).length;
    const uptime =
      machines.length > 0 ? Math.round((workingMachines / machines.length) * 10000) / 100 : 100;

    // Machines needing maintenance (not maintained in 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const needsMaintenance = machines.filter(
      (m: PerformanceMachine) => !m.lastMaintenanceAt || m.lastMaintenanceAt < thirtyDaysAgo
    ).length;

    // Mean time between failures (simulated)
    const mtbf = totalCycles > 0 && totalErrors > 0 ? Math.round(totalCycles / totalErrors) : 1000;

    return {
      uptime,
      errorRate,
      mtbf,
      needsMaintenanceCount: needsMaintenance,
      totalErrors,
      performanceTrend: this.calculateTrend(),
    };
  }

  /**
   * Get machine rankings by performance
   */
  async getMachineRankings(
    tenantId: string,
    sortBy: "revenue" | "cycles" | "errors" = "revenue",
    limit = 10
  ): Promise<MachineRanking[]> {
    // For revenue, we sort by totalCycles * pricePerCycle (calculated revenue)
    const orderByField = sortBy === "cycles" ? "totalCycles" : "errorCount";
    const orderByDirection = sortBy === "errors" ? ("asc" as const) : ("desc" as const);

    const machines = await prisma.machine.findMany({
      where: { tenantId },
      select: {
        id: true,
        label: true,
        serialNumber: true,
        type: true,
        pricePerCycle: true,
        totalCycles: true,
        errorCount: true,
        status: true,
      },
      orderBy:
        sortBy === "revenue"
          ? [{ totalCycles: "desc" }] // Sort by cycles as proxy for revenue
          : { [orderByField]: orderByDirection },
      take: limit,
    });

    return (machines as RankingMachine[]).map((m: RankingMachine, index: number) => ({
      rank: index + 1,
      id: m.id,
      name: m.label,
      serialNumber: m.serialNumber,
      type: m.type as MachineType,
      totalRevenue: m.totalCycles * m.pricePerCycle,
      totalCycles: m.totalCycles,
      errorCount: m.errorCount,
      status: m.status as MachineStatus,
    }));
  }

  /**
   * Get hourly usage pattern
   */
  async getUsagePattern(_tenantId: string): Promise<HourlyUsagePattern[]> {
    // In a real implementation, this would aggregate transaction data
    // For demo, we generate realistic patterns
    return Array.from({ length: 24 }, (_, hour) => {
      // Simulate realistic laundromat usage patterns
      let usage: number;
      if (hour >= 7 && hour <= 10) {
        usage = 60 + Math.random() * 30; // Morning peak
      } else if (hour >= 17 && hour <= 21) {
        usage = 70 + Math.random() * 25; // Evening peak
      } else if (hour >= 11 && hour <= 16) {
        usage = 40 + Math.random() * 20; // Afternoon
      } else if (hour >= 22 || hour <= 6) {
        usage = 10 + Math.random() * 15; // Night
      } else {
        usage = 30 + Math.random() * 20;
      }

      return {
        hour,
        usage: Math.round(usage),
        label: `${hour.toString().padStart(2, "0")}:00`,
      };
    });
  }

  // Helper methods
  private calculatePeakHours(): string[] {
    // Return typical laundromat peak hours
    return ["7:00-10:00", "17:00-21:00"];
  }

  private calculateTrend(): "up" | "down" | "stable" {
    // Simulate trend calculation
    const random = Math.random();
    if (random > 0.6) {
      return "up";
    }
    if (random < 0.3) {
      return "down";
    }
    return "stable";
  }

  private generateWeeklyBreakdown(totalRevenue: number): WeeklyRevenue[] {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weights = [0.12, 0.11, 0.13, 0.12, 0.14, 0.2, 0.18]; // Weekend higher

    return days.map((day, index) => ({
      day,
      revenue: Math.round(totalRevenue * weights[index] * 100) / 100,
    }));
  }
}

// Types
export interface DashboardAnalytics {
  machineStats: MachineStats;
  utilizationMetrics: UtilizationMetrics;
  revenueMetrics: RevenueMetrics;
  performanceMetrics: PerformanceMetrics;
  generatedAt: string;
}

export interface MachineStats {
  total: number;
  byStatus: {
    idle: number;
    running: number;
    maintenance: number;
    error: number;
    offline: number;
  };
  byType: {
    washer: number;
    dryer: number;
  };
  healthScore: number;
}

export interface UtilizationMetrics {
  currentUtilization: number;
  avgCyclesPerMachine: number;
  peakHours: string[];
  recentlyUsedCount: number;
  idleCount: number;
  utilizationTrend: "up" | "down" | "stable";
}

export interface RevenueMetrics {
  totalRevenue: number;
  totalCycles: number;
  avgRevenuePerCycle: number;
  dailyAverage: number;
  weeklyBreakdown: WeeklyRevenue[];
  revenueTrend: "up" | "down" | "stable";
}

export interface WeeklyRevenue {
  day: string;
  revenue: number;
}

export interface PerformanceMetrics {
  uptime: number;
  errorRate: number;
  mtbf: number;
  needsMaintenanceCount: number;
  totalErrors: number;
  performanceTrend: "up" | "down" | "stable";
}

export interface MachineRanking {
  rank: number;
  id: string;
  name: string;
  serialNumber: string;
  type: MachineType;
  totalRevenue: number;
  totalCycles: number;
  errorCount: number;
  status: MachineStatus;
}

export interface HourlyUsagePattern {
  hour: number;
  usage: number;
  label: string;
}

export default AnalyticsService;
