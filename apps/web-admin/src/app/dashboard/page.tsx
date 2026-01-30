"use client";

import { useMachineStats, useMachines } from "@/hooks/use-machines";
import { useAuthStore } from "@/stores/auth.store";

export const dynamic = "force-dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  WashingMachine,
  CheckCircle,
  Clock,
  WifiOff,
  Wrench,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: stats, isLoading: statsLoading } = useMachineStats();
  const { data: machines, isLoading: machinesLoading } = useMachines({
    page: 1,
    limit: 5,
  });

  const statCards = [
    {
      title: "Total Machines",
      value: stats?.total ?? 0,
      icon: WashingMachine,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Available",
      value: stats?.available ?? 0,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      title: "In Use",
      value: stats?.busy ?? 0,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Offline",
      value: stats?.offline ?? 0,
      icon: WifiOff,
      color: "text-gray-500",
      bgColor: "bg-gray-100",
    },
    {
      title: "Maintenance",
      value: stats?.maintenance ?? 0,
      icon: Wrench,
      color: "text-red-500",
      bgColor: "bg-red-100",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="success">Available</Badge>;
      case "BUSY":
        return <Badge variant="warning">Busy</Badge>;
      case "OFFLINE":
        return <Badge variant="outline">Offline</Badge>;
      case "MAINTENANCE":
        return <Badge variant="destructive">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here&apos;s your laundromat overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : stat.value}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Machines
            </CardTitle>
            <CardDescription>
              Latest machine status from your laundromat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {machinesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-gray-100"
                  />
                ))}
              </div>
            ) : machines?.items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No machines found. Add your first machine to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {machines?.items.map((machine) => (
                  <div
                    key={machine.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <WashingMachine className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{machine.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {machine.serialNumber} • {machine.type}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(machine.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for managing your laundromat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a
              href="/dashboard/machines"
              className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50"
            >
              <div className="rounded-full bg-blue-100 p-2">
                <WashingMachine className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Manage Machines</p>
                <p className="text-sm text-muted-foreground">
                  Add, edit, or remove machines
                </p>
              </div>
            </a>
            <a
              href="/dashboard/machines"
              className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50"
            >
              <div className="rounded-full bg-green-100 p-2">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Monitor Status</p>
                <p className="text-sm text-muted-foreground">
                  Real-time machine monitoring
                </p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
