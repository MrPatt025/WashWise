"use client";

import { useAuthStore } from "@/stores/auth.store";

export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Building,
  Calendar,
  CreditCard,
  Key,
  Mail,
  MapPin,
  Palette,
  Shield,
  User,
} from "lucide-react";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your account and laundromat settings</p>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { icon: User, label: "Profile", active: true },
          { icon: Building, label: "Business" },
          { icon: Bell, label: "Notifications" },
          { icon: Palette, label: "Appearance" },
          { icon: Key, label: "Security" },
          { icon: CreditCard, label: "Billing" },
        ].map((item) => (
          <Button
            key={item.label}
            variant={item.active ? "default" : "outline"}
            size="sm"
            className={
              item.active
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                : "hover:border-violet-300 hover:bg-violet-50 dark:hover:border-violet-700 dark:hover:bg-violet-950"
            }
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Account Information */}
          <Card className="overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
            <div className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-2">
                  <User className="h-5 w-5 text-violet-600" />
                </div>
                Account Information
              </CardTitle>
              <CardDescription>Your personal account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                  <p className="font-medium">
                    {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Role</label>
                  <div>
                    <Badge className="bg-gradient-to-r from-violet-500 to-indigo-500">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Member Since</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">January 2024</p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:border-violet-300 hover:bg-violet-50"
                >
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card className="overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
            <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-2">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                Business Information
              </CardTitle>
              <CardDescription>Your laundromat details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Laundromat Name
                  </label>
                  <p className="font-semibold">{user?.tenant?.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Tenant ID</label>
                  <p className="font-mono text-xs text-muted-foreground">{user?.tenant?.id}</p>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                    <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Demo Location</p>
                    <p className="text-xs text-muted-foreground">
                      123 Main Street, Bangkok, Thailand
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:border-blue-300 hover:bg-blue-50"
                >
                  Edit Business Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security Card */}
          <Card className="overflow-hidden border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-2">
                  <Shield className="h-4 w-4 text-emerald-600" />
                </div>
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-Factor Auth</span>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  >
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Password Strength</span>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  >
                    Strong
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Login</span>
                  <span className="text-xs text-muted-foreground">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold">Account Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-violet-100">Plan</span>
                  <Badge className="bg-white/20 hover:bg-white/30">Professional</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-violet-100">Machines</span>
                  <span className="font-semibold">24 / 50</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-violet-100">Users</span>
                  <span className="font-semibold">3 / 10</span>
                </div>
              </div>
              <Button className="mt-4 w-full bg-white text-violet-600 hover:bg-violet-50">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
            <CardContent className="p-6">
              <h3 className="mb-2 font-semibold">Need Help?</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Our support team is available 24/7 to assist you.
              </p>
              <Button
                variant="outline"
                className="w-full hover:border-violet-300 hover:bg-violet-50"
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
