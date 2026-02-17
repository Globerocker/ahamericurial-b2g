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
import { Building2, ExternalLink, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default async function CompaniesPage() {
    const supabase = createClient()

    const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
                    <p className="text-muted-foreground">Manage your directory of government contractors.</p>
                </div>
                <Button className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Add Company
                </Button>
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Readiness</TableHead>
                            <TableHead>Sync Status</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies?.map((company) => (
                            <TableRow key={company.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col gap-0.5">
                                        <Link href={`/companies/${company.id}`} className="hover:underline text-primary flex items-center gap-1.5">
                                            {company.name}
                                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                        </Link>
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{company.website}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            company.qualification_status === 'hot_lead' ? 'default' :
                                                company.qualification_status === 'qualified' ? 'secondary' : 'outline'
                                        }
                                    >
                                        {company.qualification_status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${company.readiness_score || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono">{company.readiness_score || 0}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] h-5",
                                            company.hubspot_sync_status === 'synced' ? "text-emerald-500 bg-emerald-500/10" : "text-yellow-500 bg-yellow-500/10"
                                        )}
                                    >
                                        {company.hubspot_sync_status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{company.city}, {company.state}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon">
                                            <Mail className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!companies || companies.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    No companies found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
