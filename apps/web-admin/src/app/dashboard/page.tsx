"use client";

import { useMachines, useMachineStats } from "@/hooks/use-machines";
import { useAuthStore } from "@/stores/auth.store";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { SkeletonStat } from "@/components/ui/skeleton";
import { CircularProgress, ProgressBar, StatCard, StatsGrid } from "@/components/ui/stat-card";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  WashingMachine,
  Wrench,
} from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: stats, isLoading: statsLoading } = useMachineStats();
  const { data: machines, isLoading: machinesLoading } = useMachines({
    page: 1,
    limit: 5,
  });

  // Calculate percentages for visualizations
  const totalMachines = stats?.total ?? 0;
  const availablePercent = totalMachines > 0 ? ((stats?.idle ?? 0) / totalMachines) * 100 : 0;
  const utilizationPercent = totalMachines > 0 ? ((stats?.inUse ?? 0) / totalMachines) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName ?? user?.fullName ?? "User"}! Here&apos;s your laundromat
            overview.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-green-700 dark:bg-green-950 dark:text-green-300 md:flex">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">All systems operational</span>
        </div>
      </div>

      {/* Stats Grid with new StatCard component */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
      ) : (
        <StatsGrid columns={5}>
          <StatCard
            title="Total Machines"
            value={stats?.total ?? 0}
            icon={<WashingMachine className="h-5 w-5" />}
            variant="info"
            helpText="Total number of machines in your laundromat"
            onClick={() => (window.location.href = "/dashboard/machines")}
          />
          <StatCard
            title="Available"
            value={stats?.idle ?? 0}
            icon={<CheckCircle className="h-5 w-5" />}
            variant="success"
            trendLabel="ready to use"
            helpText="Machines available for customers"
          />
          <StatCard
            title="In Use"
            value={stats?.inUse ?? 0}
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
            trendLabel="currently running"
            helpText="Machines currently being used"
          />
          <StatCard
            title="Errors"
            value={stats?.error ?? 0}
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="danger"
            helpText="Machines that need attention"
          />
          <StatCard
            title="Maintenance"
            value={stats?.maintenance ?? 0}
            icon={<Wrench className="h-5 w-5" />}
            variant="default"
            helpText="Machines under scheduled maintenance"
          />
        </StatsGrid>
      )}

      {/* Utilization Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Availability Rate</CardTitle>
            <CardDescription>Machines ready for use</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4">
            <CircularProgress value={availablePercent} variant="success" label="Available" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Utilization Rate</CardTitle>
            <CardDescription>Current machine usage</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4">
            <CircularProgress value={utilizationPercent} variant="warning" label="In Use" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Machine Status Overview</CardTitle>
            <CardDescription>Status distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <ProgressBar
              value={stats?.idle ?? 0}
              max={totalMachines || 1}
              label="Available"
              variant="success"
              size="sm"
            />
            <ProgressBar
              value={stats?.inUse ?? 0}
              max={totalMachines || 1}
              label="In Use"
              variant="warning"
              size="sm"
            />
            <ProgressBar
              value={(stats?.error ?? 0) + (stats?.maintenance ?? 0)}
              max={totalMachines || 1}
              label="Unavailable"
              variant="danger"
              size="sm"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-1.5">
                <Activity className="h-5 w-5 text-violet-600" />
              </div>
              Recent Machines
            </CardTitle>
            <CardDescription>Latest machine status from your laundromat</CardDescription>
          </CardHeader>
          <CardContent>
            {machinesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : !machines?.items || machines.items.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No machines found. Add your first machine to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {(machines.items ?? []).map((machine) => (
                  <div
                    key={machine.id}
                    className="flex items-center justify-between rounded-xl border p-4 transition-all hover:bg-muted/50 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-2">
                        <WashingMachine className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium">{machine.name ?? machine.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {machine.serialNumber ?? machine.machineNumber ?? "No serial"} •{" "}
                          {machine.type}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={machine.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-1.5">
                <WashingMachine className="h-5 w-5 text-blue-600" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks for managing your laundromat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a
              href="/dashboard/machines"
              className="flex items-center gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 hover:shadow-sm"
            >
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2">
                <WashingMachine className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Manage Machines</p>
                <p className="text-sm text-muted-foreground">Add, edit, or remove machines</p>
              </div>
            </a>
            <a
              href="/dashboard/machines"
              className="flex items-center gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 hover:shadow-sm"
            >
              <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Monitor Status</p>
                <p className="text-sm text-muted-foreground">Real-time machine monitoring</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
