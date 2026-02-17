/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, DollarSign, Target } from "lucide-react"

const STAGES = [
    { id: 'new_match', name: 'New Match' },
    { id: 'initial_outreach', name: 'Outreach' },
    { id: 'contact_made', name: 'Contact Made' },
    { id: 'qualified', name: 'Qualified' },
    { id: 'proposal_sent', name: 'Proposal' },
    { id: 'negotiation', name: 'Negotiation' },
    { id: 'closed_won', name: 'Won' },
]

export default async function DealsPage() {
    const supabase = createClient()

    const { data: deals } = await supabase
        .from('deals')
        .select('*, companies(name), opportunities(title)')
        .order('match_score', { ascending: false })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dealsByStage = STAGES.reduce((acc, stage) => {
        acc[stage.id] = deals?.filter(d => d.stage === stage.id) || []
        return acc
    }, {} as Record<string, any[]>)

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Sales Pipeline</h2>
                <p className="text-muted-foreground">Manage your B2G deals and track progress.</p>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-[1400px] h-full">
                    {STAGES.map((stage) => (
                        <div key={stage.id} className="flex flex-col w-64 shrink-0 gap-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                    {stage.name}
                                </h3>
                                <Badge variant="secondary" className="font-mono">{dealsByStage[stage.id].length}</Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-muted/30 rounded-lg border border-dashed">
                                {dealsByStage[stage.id].map((deal) => (
                                    <Card key={deal.id} className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                                        <CardHeader className="p-3 pb-0">
                                            <div className="flex items-start justify-between gap-1">
                                                <CardTitle className="text-xs font-bold leading-tight line-clamp-2">
                                                    {deal.opportunities?.title}
                                                </CardTitle>
                                                <Badge variant="outline" className="text-[10px] px-1 h-4 shrink-0 bg-primary/5 text-primary border-primary/20">
                                                    {deal.match_score}%
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-2 space-y-2">
                                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                <Building2 className="w-3 h-3" />
                                                <span className="truncate">{deal.companies?.name}</span>
                                            </div>

                                            <div className="flex items-center justify-between pt-1 border-t border-muted/50 mt-1">
                                                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                                                    <DollarSign className="w-3 h-3" />
                                                    {new Intl.NumberFormat('en-US', {
                                                        style: 'currency',
                                                        currency: 'USD',
                                                        maximumFractionDigits: 0
                                                    }).format(deal.deal_value || 0)}
                                                </div>
                                                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                                    <Target className="w-3 h-3" />
                                                    {deal.win_probability}%
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {dealsByStage[stage.id].length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-20 filter grayscale">
                                        <Kanban className="w-8 h-8 mb-2" />
                                        <span className="text-[10px] font-medium">No deals</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function Kanban({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 7v10" />
            <path d="M12 7v10" />
            <path d="M17 7v10" />
        </svg>
    )
}
