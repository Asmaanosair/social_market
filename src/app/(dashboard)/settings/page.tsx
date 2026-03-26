"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, Shield, Link2, Users, CreditCard } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: user, isLoading } = trpc.user.me.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation();
  const enableMfa = trpc.user.enableMfa.useMutation();

  const [name, setName] = useState("");

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleSave = () => {
    if (!name.trim()) return;
    updateProfile.mutate({ name });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/settings/accounts" className="block">
          <Card className="hover:border-neutral-300 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Connected Accounts</p>
                <p className="text-xs text-neutral-500">Manage platforms</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings/team" className="block">
          <Card className="hover:border-neutral-300 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Team</p>
                <p className="text-xs text-neutral-500">Manage members</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings/billing" className="block">
          <Card className="hover:border-neutral-300 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Billing</p>
                <p className="text-xs text-neutral-500">Plans & payments</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-neutral-50"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : updateProfile.isSuccess ? (
                <Check className="h-4 w-4 mr-2" />
              ) : null}
              {updateProfile.isSuccess ? "Saved" : "Save Changes"}
            </Button>
            {updateProfile.error && (
              <p className="text-sm text-red-600">{updateProfile.error.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-neutral-400" />
            <div>
              <label className="text-sm font-medium">Two-Factor Authentication</label>
              <p className="text-sm text-neutral-500">
                {user?.mfaEnabled
                  ? "2FA is enabled on your account"
                  : "Add an extra layer of security to your account"}
              </p>
            </div>
          </div>
          {enableMfa.data?.secret && (
            <div className="p-3 rounded-md bg-neutral-50 text-sm">
              <p className="font-medium mb-1">Scan this with your authenticator app:</p>
              <code className="text-xs break-all">{enableMfa.data.qrCodeUrl}</code>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => enableMfa.mutate()}
            disabled={enableMfa.isPending || user?.mfaEnabled}
          >
            {user?.mfaEnabled ? "2FA Enabled" : "Enable 2FA"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Role</dt>
              <dd className="font-medium">{user?.role?.replace("_", " ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Posts Created</dt>
              <dd className="font-medium">{user?._count?.posts ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Connected Platforms</dt>
              <dd className="font-medium">{user?._count?.connectedPlatforms ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Member Since</dt>
              <dd className="font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
