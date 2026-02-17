"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Bell, Mail, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface NotificationSetting {
  id: string
  title: string
  description: string
  email: boolean
  inApp: boolean
  mobile: boolean
}

export default function NotificationsPage() {
  const [isSaving, setIsSaving] = useState(false)

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "opportunities",
      title: "New Opportunities",
      description: "Get notified when new government contracts matching your profile are posted",
      email: true,
      inApp: true,
      mobile: true
    },
    {
      id: "matches",
      title: "High-Match Opportunities",
      description: "Receive alerts for opportunities with 80%+ match score to your company",
      email: true,
      inApp: true,
      mobile: false
    },
    {
      id: "applications",
      title: "Application Updates",
      description: "Notifications about contractor applications and approvals",
      email: true,
      inApp: true,
      mobile: false
    },
    {
      id: "vendor_discovery",
      title: "Vendor Discovery Results",
      description: "Get notified when contractor search results are ready",
      email: false,
      inApp: true,
      mobile: false
    },
    {
      id: "deadlines",
      title: "Opportunity Deadlines",
      description: "Reminders when contract deadlines are approaching (3 days, 1 day, 1 hour before)",
      email: true,
      inApp: true,
      mobile: true
    },
    {
      id: "system",
      title: "System Updates",
      description: "Important updates about platform maintenance, security, and new features",
      email: true,
      inApp: true,
      mobile: false
    },
    {
      id: "digest",
      title: "Weekly Digest",
      description: "Summary of top opportunities and activities from the past week",
      email: true,
      inApp: false,
      mobile: false
    },
    {
      id: "deals",
      title: "Deal Updates",
      description: "Notifications about deals in your pipeline",
      email: false,
      inApp: true,
      mobile: false
    }
  ])

  const handleToggle = (settingId: string, type: "email" | "inApp" | "mobile") => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === settingId
          ? { ...setting, [type]: !setting[type] }
          : setting
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("✅ Notification preferences updated")
    } catch {
      toast.error("❌ Failed to update preferences")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">Choose how and when you want to be notified about important events.</p>
      </div>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Select your preferred notification methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Email Notifications</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Receive important updates via email</p>
                <Badge className="bg-emerald-500/10 text-emerald-600">Enabled</Badge>
              </CardContent>
            </Card>

            <Card className="border-2 bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold">In-App Notifications</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">See notifications in the app</p>
                <Badge className="bg-emerald-500/10 text-emerald-600">Enabled</Badge>
              </CardContent>
            </Card>

            <Card className="border-2 bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold">Mobile Push</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Get push notifications on mobile</p>
                <Badge variant="outline">Disabled</Badge>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose which events trigger notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.map((setting) => (
            <div key={setting.id} className="border-b pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{setting.title}</h3>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 ml-0">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`${setting.id}-email`}
                    checked={setting.email}
                    onCheckedChange={() => handleToggle(setting.id, "email")}
                  />
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggle(setting.id, "email")}>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={`${setting.id}-email`} className="text-xs cursor-pointer">
                      Email
                    </Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`${setting.id}-inApp`}
                    checked={setting.inApp}
                    onCheckedChange={() => handleToggle(setting.id, "inApp")}
                  />
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggle(setting.id, "inApp")}>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={`${setting.id}-inApp`} className="text-xs cursor-pointer">
                      In-App
                    </Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`${setting.id}-mobile`}
                    checked={setting.mobile}
                    onCheckedChange={() => handleToggle(setting.id, "mobile")}
                  />
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggle(setting.id, "mobile")}>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={`${setting.id}-mobile`} className="text-xs cursor-pointer">
                      Mobile
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-6 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
            <Button variant="outline">Reset to Default</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>Recent notifications sent to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { icon: CheckCircle2, title: "Application Approved", time: "2 hours ago", read: true },
              { icon: Bell, title: "New Opportunity: IT Services", time: "5 hours ago", read: true },
              { icon: AlertCircle, title: "Deadline Reminder: Navy Contract", time: "1 day ago", read: false },
              { icon: Bell, title: "Weekly Digest Available", time: "2 days ago", read: false },
            ].map((notification, idx) => {
              const Icon = notification.icon
              return (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer">
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <Badge className="bg-blue-500/10 text-blue-600 text-[10px]">New</Badge>
                  )}
                </div>
              )
            })}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Notifications
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
