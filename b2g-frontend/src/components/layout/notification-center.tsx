"use client"

import { useState } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Notification {
  id: string
  title: string
  description: string
  type: "info" | "success" | "warning" | "error"
  timestamp: Date
  read: boolean
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New Opportunities Available",
      description: "5 new government contracts matching your profile",
      type: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      read: false
    },
    {
      id: "2",
      title: "Application Approved",
      description: "TechCorp Solutions has been approved",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false
    },
    {
      id: "3",
      title: "Deadline Approaching",
      description: "Navy IT Services contract deadline in 3 days",
      type: "warning",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true
    },
    {
      id: "4",
      title: "Sync Complete",
      description: "SAM.gov sync completed successfully",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      read: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success": return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
      case "warning": return "bg-yellow-500/10 text-yellow-600 border-yellow-200"
      case "error": return "bg-red-500/10 text-red-600 border-red-200"
      default: return "bg-blue-500/10 text-blue-600 border-blue-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success": return "✓"
      case "warning": return "!"
      case "error": return "⚠"
      default: return "ℹ"
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500"
            variant="default"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Notifications</DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </DialogHeader>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} cursor-pointer hover:shadow-sm transition-all ${
                    !notification.read ? "border-current border-2" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg mt-0.5">{getTypeIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs opacity-80 mt-0.5">{notification.description}</p>
                      <p className="text-xs opacity-60 mt-1">{formatTime(notification.timestamp)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* View All Link */}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => {
                setOpen(false)
                // Navigate to notifications page
                window.location.href = "/settings/notifications"
              }}
            >
              View All Notifications
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
