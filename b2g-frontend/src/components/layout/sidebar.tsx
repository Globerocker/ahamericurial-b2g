"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Search,
    FileCheck,
    Kanban,
    Building2,
    Users,
    Settings,
    ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Opportunities', href: '/opportunities', icon: Search },
    { name: 'Applications', href: '/applications', icon: FileCheck },
    { name: 'Deals', href: '/deals', icon: Kanban },
    { name: 'Companies', href: '/companies', icon: Building2 },
    { name: 'Contacts', href: '/contacts', icon: Users },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex flex-col w-64 border-r bg-card h-screen sticky top-0">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight text-primary">Americurial</h1>
                <p className="text-xs text-muted-foreground mt-1">B2G Automation System</p>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                            {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t">
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                >
                    <Settings className="w-4 h-4" />
                    Settings
                </Link>
            </div>
        </div>
    )
}
