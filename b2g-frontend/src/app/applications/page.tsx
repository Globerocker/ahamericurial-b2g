import { createClient } from "@/lib/supabase/server"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    CheckCircle2,
    XCircle,
    Eye
} from "lucide-react"
import { cn } from "@/lib/utils"

export default async function ApplicationsPage() {
    const supabase = createClient()

    const { data: applications } = await supabase
        .from('contractor_applications')
        .select('*')
        .order('submitted_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Applications Review</h2>
                <p className="text-muted-foreground">Review and approve contractors applying to the system.</p>
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Certifications</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications?.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col gap-0.5">
                                        <span>{app.company_name}</span>
                                        <span className="text-xs text-muted-foreground">{app.state}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                        <span>{app.contact_first_name} {app.contact_last_name}</span>
                                        <span className="text-xs text-muted-foreground">{app.contact_email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-sm font-bold",
                                            (app.application_score || 0) >= 80 ? "text-green-500" :
                                                (app.application_score || 0) >= 60 ? "text-yellow-500" : "text-red-500"
                                        )}>
                                            {app.application_score || 0}%
                                        </span>
                                        {app.status_changed_by === 'system_auto_approve' && (
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                Auto
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {app.certifications?.slice(0, 2).map((cert: string) => (
                                            <Badge key={cert} variant="outline" className="text-[10px] h-4 px-1">
                                                {cert}
                                            </Badge>
                                        ))}
                                        {(app.certifications?.length || 0) > 2 && (
                                            <span className="text-[10px] text-muted-foreground">+{app.certifications.length - 2}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            app.status === 'approved' || app.status === 'active' ? 'default' :
                                                app.status === 'rejected' ? 'destructive' : 'secondary'
                                        }
                                    >
                                        {app.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs">
                                    {new Date(app.submitted_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" title="View details">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {app.status === 'new' && (
                                            <>
                                                <Button variant="ghost" size="icon" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!applications || applications.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                    No applications found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
