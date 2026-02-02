"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMachines,
  useCreateMachine,
  useDeleteMachine,
  useSimulateStatus,
} from "@/hooks/use-machines";
import { useDebouncedState } from "@/hooks/use-debounce";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { CreateMachineSchema, type CreateMachine, type MachineQuery } from "@washwise/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, TypeBadge } from "@/components/ui/badge";
import { SkeletonMachine } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { ConfirmDialog, useDeleteConfirm } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, WashingMachine, Loader2, Trash2, Zap, Filter, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default function MachinesPage() {
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  // Filter states
  const [search, debouncedSearch, setSearch] = useDebouncedState("", 300);
  const [typeFilter, setTypeFilter] = useState<"all" | "WASHER" | "DRYER">("all");
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | "IDLE"
    | "RESERVED"
    | "RUNNING"
    | "MAINTENANCE"
    | "OUT_OF_ORDER"
    | "ERROR"
    | "OFFLINE"
    | "DISABLED"
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: PAGE_SIZE,
  });

  // Build query
  const query: MachineQuery = {
    page: pagination.page,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };

  // Data fetching
  const { data, isLoading, isFetching, refetch } = useMachines(query);
  const createMutation = useCreateMachine();
  const deleteMutation = useDeleteMachine();
  const simulateMutation = useSimulateStatus();

  // Delete confirmation
  const deleteConfirm = useDeleteConfirm();

  // Safe defaults
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateMachine>({
    resolver: zodResolver(CreateMachineSchema),
    defaultValues: {
      type: "WASHER",
      pricePerCycle: 5,
    },
  });

  const machineType = watch("type");

  // Keyboard shortcuts
  useKeyboardShortcut("ctrl+n", () => setIsCreateOpen(true), {
    description: "Add new machine",
  });

  useKeyboardShortcut(
    "ctrl+f",
    () => {
      document.getElementById("machine-search")?.focus();
    },
    {
      description: "Focus search",
    }
  );

  // Handlers
  const onCreateSubmit = async (formData: CreateMachine) => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateOpen(false);
      reset();
    } catch {
      // Error handled by mutation with toast
    }
  };

  const handleSimulate = async (machineId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    setSimulatingId(machineId);
    try {
      await simulateMutation.mutateAsync({ machineId, status: nextStatus });
    } finally {
      setSimulatingId(null);
    }
  };

  const getNextStatus = (current: string): string => {
    const statuses = ["IDLE", "RUNNING", "MAINTENANCE", "ERROR", "OFFLINE"];
    const currentIndex = statuses.indexOf(current);
    return statuses[(currentIndex + 1) % statuses.length];
  };

  const handleDelete = useCallback(
    (id: string, name: string) => {
      deleteConfirm.confirmDelete(name, async () => {
        await deleteMutation.mutateAsync(id);
      });
    },
    [deleteConfirm, deleteMutation]
  );

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters = debouncedSearch || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machines</h1>
          <p className="text-muted-foreground">
            Manage your laundromat machines with real-time status updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Machine
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit(onCreateSubmit)}>
                <DialogHeader>
                  <DialogTitle>Add New Machine</DialogTitle>
                  <DialogDescription>
                    Enter the details of your new washing machine or dryer
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Machine Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Washer 1, Large Dryer"
                      {...register("name")}
                      autoFocus
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <Select
                        value={machineType}
                        onValueChange={(value) => setValue("type", value as "WASHER" | "DRYER")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WASHER">🧺 Washer</SelectItem>
                          <SelectItem value="DRYER">🔥 Dryer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pricePerCycle">Price per Cycle ($) *</Label>
                      <Input
                        id="pricePerCycle"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="5.00"
                        {...register("pricePerCycle", { valueAsNumber: true })}
                      />
                      {errors.pricePerCycle && (
                        <p className="text-sm text-destructive">{errors.pricePerCycle.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacityKg">Capacity (kg)</Label>
                      <Input
                        id="capacityKg"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="10"
                        {...register("capacityKg", { valueAsNumber: true })}
                      />
                      {errors.capacityKg && (
                        <p className="text-sm text-destructive">{errors.capacityKg.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input id="serialNumber" placeholder="WM-001" {...register("serialNumber")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" placeholder="Samsung WF45" {...register("model")} />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Machine"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            id="machine-search"
            value={search}
            onChange={setSearch}
            placeholder="Search by name, serial number..."
            debounce={0}
            isLoading={isFetching && !!debouncedSearch}
            containerClassName="max-w-md"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="animate-in slide-in-from-top-2">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v as "all" | "WASHER" | "DRYER")}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="WASHER">Washers</SelectItem>
                    <SelectItem value="DRYER">Dryers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="IDLE">Available</SelectItem>
                    <SelectItem value="RUNNING">In Use</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Machines Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonMachine key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={WashingMachine}
              title={hasActiveFilters ? "No machines found" : "No machines yet"}
              description={
                hasActiveFilters
                  ? "Try adjusting your search or filters"
                  : "Add your first machine to start managing your laundromat"
              }
              action={
                hasActiveFilters
                  ? { label: "Clear Filters", onClick: clearFilters }
                  : {
                      label: "Add Machine",
                      onClick: () => setIsCreateOpen(true),
                    }
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((machine) => (
              <Card
                key={machine.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-200",
                  "hover:scale-[1.02] hover:shadow-lg",
                  "focus-within:ring-2 focus-within:ring-primary/50"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex-shrink-0 rounded-full p-2",
                          machine.type === "WASHER"
                            ? "bg-blue-100 dark:bg-blue-950"
                            : "bg-orange-100 dark:bg-orange-950"
                        )}
                      >
                        <WashingMachine
                          className={cn(
                            "h-5 w-5",
                            machine.type === "WASHER"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-orange-600 dark:text-orange-400"
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{machine.name}</CardTitle>
                        <CardDescription className="truncate">
                          {machine.serialNumber || machine.machineNumber || "No serial"}
                        </CardDescription>
                      </div>
                    </div>
                    <StatusBadge status={machine.status} size="sm" />
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <TypeBadge type={machine.type} size="sm" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">
                        {machine.capacityKg ? `${machine.capacityKg} kg` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        ${machine.pricePerCycle.toFixed(2)}
                      </span>
                    </div>
                    {machine.model && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model</span>
                        <span className="max-w-[120px] truncate font-medium">{machine.model}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSimulate(machine.id, machine.status)}
                      disabled={simulatingId === machine.id}
                      title="Simulate status change"
                    >
                      {simulatingId === machine.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="mr-1 h-4 w-4" />
                          Simulate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(machine.id, machine.name)}
                      disabled={deleteMutation.isPending}
                      title="Delete machine"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              page={pagination.page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              className="pt-4"
            />
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog {...deleteConfirm.dialogProps} />
    </div>
  );
}
