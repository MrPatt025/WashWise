"use client";

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
import { User, Building, Shield } from "lucide-react";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and tenant settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge>{user?.role}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Tenant Information
            </CardTitle>
            <CardDescription>Your laundromat details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Laundromat Name</span>
              <span className="font-medium">{user?.tenantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant ID</span>
              <span className="font-mono text-xs">{user?.tenantId}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Security information about your session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-2">Authentication Details</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • Access token stored securely in memory (not localStorage)
                </li>
                <li>• Refresh token stored as HttpOnly cookie</li>
                <li>• Token rotation enabled for enhanced security</li>
                <li>• Multi-tenant isolation with tenantId verification</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
