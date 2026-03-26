import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Billing</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your subscription and billing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>You are currently on the Free plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200">
            <div>
              <p className="font-semibold">Free Plan</p>
              <p className="text-sm text-neutral-500">Up to 3 connected accounts, 30 scheduled posts/month</p>
            </div>
            <Button>Upgrade</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 text-center py-4">No billing history</p>
        </CardContent>
      </Card>
    </div>
  );
}
