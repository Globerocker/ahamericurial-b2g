import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Bell, Lock, Zap, Key, Database, ArrowRight } from "lucide-react"

export default function SettingsPage() {
  const settingsCards = [
    {
      icon: User,
      title: "Profile Settings",
      description: "Manage your personal information, email, and account details",
      href: "/settings/profile",
      status: "Active"
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure email, in-app, and mobile notifications",
      href: "/settings/notifications",
      status: "Active"
    },
    {
      icon: Lock,
      title: "Security",
      description: "Password, two-factor authentication, and login sessions",
      href: "/settings/security",
      status: "Coming Soon"
    },
    {
      icon: Zap,
      title: "Integrations",
      description: "Connect and manage third-party services and APIs",
      href: "/settings/integrations",
      status: "Coming Soon"
    },
    {
      icon: Key,
      title: "API Keys",
      description: "Create and manage API keys for programmatic access",
      href: "/settings/api-keys",
      status: "Coming Soon"
    },
    {
      icon: Database,
      title: "Data & Privacy",
      description: "Download your data, manage privacy settings, and data retention",
      href: "/settings/data",
      status: "Coming Soon"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and integrations.</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsCards.map((setting) => {
          const Icon = setting.icon
          const isActive = setting.status === "Active"

          return (
            <Link key={setting.title} href={isActive ? setting.href : "#"} className={isActive ? "" : "pointer-events-none"}>
              <Card className={`h-full hover:shadow-lg transition-all ${!isActive ? "opacity-60" : "hover:border-primary cursor-pointer"}`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{setting.title}</CardTitle>
                    </div>
                    <CardDescription>{setting.description}</CardDescription>
                  </div>
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className={isActive ? "bg-emerald-500/10 text-emerald-600" : ""}
                  >
                    {setting.status}
                  </Badge>
                </CardHeader>
                {isActive && (
                  <CardContent>
                    <div className="flex items-center text-primary text-sm font-medium">
                      Open <ArrowRight className="h-4 w-4 ml-2" />
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <CardDescription>Quick summary of your account status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Plan</p>
              <p className="text-sm font-medium">Professional</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Billing</p>
              <p className="text-sm font-medium">Active</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Member Since</p>
              <p className="text-sm font-medium">Jan 15, 2024</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">2FA</p>
              <p className="text-sm font-medium text-yellow-600">Not Enabled</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dangerous Zone */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These actions cannot be undone. Please proceed with caution.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" disabled>Export Data</Button>
            <Button variant="destructive" disabled>Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
