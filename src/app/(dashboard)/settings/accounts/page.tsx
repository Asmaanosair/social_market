"use client";

import { trpc } from "@/lib/trpc/client";
import { Platform } from "@/types/platform";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react";

const PLATFORM_DISPLAY: Record<string, { name: string; color: string; icon: string }> = {
  X: { name: "X (Twitter)", color: "bg-black", icon: "𝕏" },
  TIKTOK: { name: "TikTok", color: "bg-[#010101]", icon: "♪" },
  INSTAGRAM: { name: "Instagram", color: "bg-gradient-to-br from-purple-600 to-pink-500", icon: "📷" },
  FACEBOOK: { name: "Facebook", color: "bg-[#1877F2]", icon: "f" },
  SNAPCHAT: { name: "Snapchat", color: "bg-[#FFFC00]", icon: "👻" },
};

const statusIcons: Record<string, React.ReactNode> = {
  CONNECTED: <CheckCircle className="h-4 w-4 text-green-600" />,
  DISCONNECTED: <XCircle className="h-4 w-4 text-neutral-400" />,
  EXPIRED: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  ERROR: <XCircle className="h-4 w-4 text-red-500" />,
};

export default function ConnectedAccountsPage() {
  const { data, isLoading, refetch } = trpc.account.listConnected.useQuery();
  const disconnect = trpc.account.disconnect.useMutation({ onSuccess: () => refetch() });
  const refreshToken = trpc.account.refreshToken.useMutation({ onSuccess: () => refetch() });

  const connectedAccounts = data?.accounts ?? [];

  const getAccountForPlatform = (platform: string) =>
    connectedAccounts.find((a) => a.platform === platform);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Connected Accounts</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your social media platform connections</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {Object.values(["X", "TIKTOK", "INSTAGRAM", "FACEBOOK", "SNAPCHAT"]).map((platform) => {
            const display = PLATFORM_DISPLAY[platform];
            const account = getAccountForPlatform(platform);
            const isConnected = account?.status === "CONNECTED";
            const isExpired = account?.status === "EXPIRED";

            return (
              <Card key={platform}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${display.color} flex items-center justify-center text-white text-lg font-bold`}>
                        {display.icon}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{display.name}</p>
                        {account ? (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            {statusIcons[account.status]}
                            <span>{account.displayName}</span>
                            {account.tokenExpiresAt && (
                              <span className="text-neutral-400">
                                - Expires {new Date(account.tokenExpiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-400">Not connected</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refreshToken.mutate({ accountId: account!.id })}
                          disabled={refreshToken.isPending}
                        >
                          {refreshToken.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
                        </Button>
                      )}
                      {isConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnect.mutate({ accountId: account!.id })}
                          disabled={disconnect.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button size="sm" disabled>
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-neutral-400">
        Connecting an account opens the platform&apos;s authorization page. Your credentials are never stored — only encrypted OAuth tokens.
      </p>
    </div>
  );
}
