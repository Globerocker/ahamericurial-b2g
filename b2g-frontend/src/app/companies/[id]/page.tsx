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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Users,
    Target,
    Globe,
    Mail,
    Phone,
    MapPin,
    ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CompanyDetailPage({
    params,
}: {
    params: { id: string }
}) {
    const supabase = createClient()

    const [
        { data: company },
        { data: contacts },
        { data: deals }
    ] = await Promise.all([
        supabase.from('companies').select('*').eq('id', params.id).single(),
        supabase.from('contacts').select('*').eq('company_id', params.id),
        supabase.from('deals').select('*, opportunities(title)').eq('company_id', params.id)
    ])

    if (!company) {
        notFound()
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/companies">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{company.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{company.qualification_status}</Badge>
                        <Badge variant="secondary">{company.lifecycle_stage}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Company Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <a href={company.website} target="_blank" className="text-primary hover:underline">{company.website}</a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{company.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{company.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{company.address}, {company.city}, {company.state} {company.zip}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">UEI</span>
                                <span className="font-mono">{company.uei || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">CAGE Code</span>
                                <span className="font-mono">{company.cage_code || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Primary NAICS</span>
                                <span className="font-mono">{company.primary_naics || 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Contacts</CardTitle>
                            </div>
                            <Button size="sm" variant="outline">Add Contact</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contacts?.map((contact) => (
                                        <TableRow key={contact.id}>
                                            <TableCell className="font-medium">
                                                {contact.first_name} {contact.last_name}
                                                {contact.is_primary_contact && (
                                                    <Badge className="ml-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] h-4">
                                                        Primary
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs">{contact.job_title}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{contact.email}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!contacts || contacts.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground text-sm">
                                                No contacts found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Deals</CardTitle>
                            </div>
                            <Badge variant="secondary">{deals?.length || 0} active</Badge>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Opportunity</TableHead>
                                        <TableHead>Stage</TableHead>
                                        <TableHead className="text-right">Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deals?.map((deal) => (
                                        <TableRow key={deal.id}>
                                            <TableCell className="font-medium text-xs max-w-[200px] truncate">
                                                {deal.opportunities?.title}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] capitalize">
                                                    {deal.stage.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                    maximumFractionDigits: 0
                                                }).format(deal.deal_value || 0)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!deals || deals.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground text-sm">
                                                No deals found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
