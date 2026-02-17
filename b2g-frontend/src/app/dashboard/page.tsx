import { createClient } from "@/lib/supabase/server"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Briefcase,
    UserPlus,
    Target,
    ArrowUpRight,
    Clock
} from "lucide-react"

export default async function DashboardPage() {
    const supabase = createClient()

    // Fetch KPIs
    const [
        { count: opportunitiesCount },
        { count: activeDealsCount },
        { count: newApplicationsCount },
        { data: highMatches }
    ] = await Promise.all([
        supabase.from('opportunities').select('*', { count: 'exact', head: true }),
        supabase.from('deals').select('*', { count: 'exact', head: true }).not('stage', 'in', '("closed_won", "closed_lost")'),
        supabase.from('contractor_applications').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('matches').select('*, opportunities(title), contractors(name)').gte('match_score', 85).limit(5)
    ])

    // Fetch Recent Activity
    const { data: recentActivities } = await supabase
        .from('activities')
        .select('*, companies(name)')
        .order('created_at', { ascending: false })
        .limit(10)

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Overview of your government contracting pipeline.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{opportunitiesCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Ingested from SAM.gov</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeDealsCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Currently in pipeline</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Applications</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{newApplicationsCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Matches</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{highMatches?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Score ≥ 85%</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent High-Score Matches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Contractor</TableHead>
                                    <TableHead>Opportunity</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {highMatches?.map((match) => (
                                    <TableRow key={match.id}>
                                        <TableCell className="font-medium">{match.contractors?.name}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{match.opportunities?.title}</TableCell>
                                        <TableCell className="text-right font-bold text-green-500">{match.match_score}%</TableCell>
                                    </TableRow>
                                ))}
                                {(!highMatches || highMatches.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No matches found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivities?.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{activity.subject}</p>
                                        <p className="text-xs text-muted-foreground">{activity.companies?.name}</p>
                                    </div>
                                    <div className="ml-auto text-xs text-muted-foreground">
                                        {new Date(activity.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {(!recentActivities || recentActivities.length === 0) && (
                                <div className="text-center py-4 text-muted-foreground text-sm">No recent activity</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
