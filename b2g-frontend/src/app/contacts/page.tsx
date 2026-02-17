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
import { User, Mail, Phone, ExternalLink } from "lucide-react"

export default async function ContactsPage() {
    const supabase = createClient()

    const { data: contacts } = await supabase
        .from('contacts')
        .select('*, companies(name)')
        .order('last_name', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
                    <p className="text-muted-foreground">People at companies in your network.</p>
                </div>
                <Button className="gap-2">
                    <User className="h-4 w-4" />
                    Add Contact
                </Button>
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contact Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Seniority</TableHead>
                            <TableHead>Primary?</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts?.map((contact) => (
                            <TableRow key={contact.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col gap-0.5">
                                        <span>{contact.first_name} {contact.last_name}</span>
                                        <span className="text-xs text-muted-foreground">{contact.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm font-medium text-primary hover:underline cursor-pointer flex items-center gap-1.5">
                                        {contact.companies?.name}
                                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{contact.job_title || 'N/A'}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {contact.seniority}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {contact.is_primary_contact ? (
                                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Yes</Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">No</span>
                                    )}
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
                        {(!contacts || contacts.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    No contacts found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
