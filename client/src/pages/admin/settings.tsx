import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-primary">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your store configuration
        </p>
      </div>

      <div className="grid gap-6">
        {/* Store Info */}
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>
              Basic information about your art gallery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" defaultValue="Prana Art Gallery" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input id="email" type="email" placeholder="contact@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Store Description</Label>
              <Input
                id="description"
                defaultValue="A sanctuary for spiritual art, capturing the essence of yoga, devotion, and stillness."
              />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Settings</CardTitle>
            <CardDescription>
              Configure shipping rates and options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flatRate">Flat Rate Shipping ($)</Label>
                <Input id="flatRate" type="number" step="0.01" defaultValue="15.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeThreshold">Free Shipping Threshold ($)</Label>
                <Input id="freeThreshold" type="number" step="0.01" defaultValue="150.00" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Note: These settings are configured via environment variables. Update
              your .env file to change shipping rates.
            </p>
          </CardContent>
        </Card>

        {/* Stripe */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>
              Stripe integration status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Stripe is configured</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Payment processing is handled through Stripe Checkout. Configure your
              Stripe keys in the .env file.
            </p>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Webhook Endpoint</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                /api/stripe/webhook
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Account</CardTitle>
            <CardDescription>
              Manage your admin credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
            </div>
            <Button variant="outline">Change Password</Button>
            <p className="text-xs text-muted-foreground">
              Note: Authentication system is not yet implemented. This is a placeholder.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

