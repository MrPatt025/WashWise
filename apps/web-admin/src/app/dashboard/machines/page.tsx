"use client";

import { useState } from "react";

export const dynamic = "force-dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMachines,
  useCreateMachine,
  useDeleteMachine,
  useSimulateStatus,
} from "@/hooks/use-machines";
import { CreateMachineSchema, type CreateMachine } from "@washwise/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, WashingMachine, Loader2, Trash2, Zap } from "lucide-react";

export default function MachinesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  const { data, isLoading } = useMachines();
  const createMutation = useCreateMachine();
  const deleteMutation = useDeleteMachine();
  const simulateMutation = useSimulateStatus();

  // Safe defaults to prevent undefined errors
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

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
    },
  });

  const machineType = watch("type");

  const onCreateSubmit = async (data: CreateMachine) => {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
      reset();
    } catch (error) {
      // Error handled by mutation
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

  // Cycle through backend statuses - matches MachineStatus.java
  const getNextStatus = (current: string): string => {
    const statuses = ["IDLE", "RUNNING", "MAINTENANCE", "ERROR", "OFFLINE"];
    const currentIndex = statuses.indexOf(current);
    return statuses[(currentIndex + 1) % statuses.length];
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this machine?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Status badge helper - matches backend MachineStatus enum
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IDLE":
        return <Badge variant="success">Available</Badge>;
      case "RESERVED":
        return <Badge variant="warning">Reserved</Badge>;
      case "RUNNING":
        return <Badge variant="warning">In Use</Badge>;
      case "MAINTENANCE":
        return <Badge variant="destructive">Maintenance</Badge>;
      case "OUT_OF_ORDER":
        return <Badge variant="destructive">Out of Order</Badge>;
      case "ERROR":
        return <Badge variant="destructive">Error</Badge>;
      case "OFFLINE":
        return <Badge variant="outline">Offline</Badge>;
      case "DISABLED":
        return <Badge variant="outline">Disabled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Machines</h1>
          <p className="text-muted-foreground">
            Manage your laundromat machines with real-time status updates
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Machine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onCreateSubmit)}>
              <DialogHeader>
                <DialogTitle>Add New Machine</DialogTitle>
                <DialogDescription>
                  Enter the details of your new machine
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Machine Name</Label>
                  <Input
                    id="name"
                    placeholder="Washer 1"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number (optional)</Label>
                  <Input
                    id="serialNumber"
                    placeholder="WM-001"
                    {...register("serialNumber")}
                  />
                  {errors.serialNumber && (
                    <p className="text-sm text-destructive">
                      {errors.serialNumber.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={machineType}
                    onValueChange={(value) =>
                      setValue("type", value as "WASHER" | "DRYER")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WASHER">Washer</SelectItem>
                      <SelectItem value="DRYER">Dryer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacityKg">Capacity (kg)</Label>
                    <Input
                      id="capacityKg"
                      type="number"
                      step="0.1"
                      placeholder="10"
                      {...register("capacityKg", { valueAsNumber: true })}
                    />
                    {errors.capacityKg && (
                      <p className="text-sm text-destructive">
                        {errors.capacityKg.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerCycle">Price per Cycle ($)</Label>
                    <Input
                      id="pricePerCycle"
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      {...register("pricePerCycle", { valueAsNumber: true })}
                    />
                    {errors.pricePerCycle && (
                      <p className="text-sm text-destructive">
                        {errors.pricePerCycle.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model (optional)</Label>
                  <Input
                    id="model"
                    placeholder="Samsung WF45"
                    {...register("model")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
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

      {/* Machines Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <WashingMachine className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No machines yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Add your first machine to start managing your laundromat
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Machine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((machine) => (
            <Card
              key={machine.id}
              className="relative overflow-hidden transition-shadow hover:shadow-lg"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        machine.type === "WASHER"
                          ? "bg-blue-100"
                          : "bg-orange-100"
                      }`}
                    >
                      <WashingMachine
                        className={`h-5 w-5 ${
                          machine.type === "WASHER"
                            ? "text-blue-500"
                            : "text-orange-500"
                        }`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {machine.name ?? machine.label}
                      </CardTitle>
                      <CardDescription>
                        {machine.serialNumber ??
                          machine.machineNumber ??
                          "No serial"}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(machine.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{machine.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium">
                      {machine.capacityKg ?? "-"} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">
                      ${(machine.pricePerCycle ?? 0).toFixed(2)}
                    </span>
                  </div>
                  {machine.model && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-medium">{machine.model}</span>
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
                    onClick={() => handleDelete(machine.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {total > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {items.length} of {total} machines
        </div>
      )}
    </div>
  );
}
