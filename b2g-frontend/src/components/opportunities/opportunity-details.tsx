"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { Target, ExternalLink, ShieldCheck, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCallback } from "react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Match {
    id: string
    match_score: number
    contractor_id: string
    contractors: {
        name: string
        source: string
        readiness_score: number
        readiness_reasoning: string
    }
}

export interface Opportunity {
    id: string
    notice_id: string
    title: string
    agency: string
    priority_flag: string
    contractor_type: string
    estimated_value: number
    deadline: string
    complexity_score: number
    required_capabilities: string[]
    // NEW: Quick Win Fields
    ai_summary?: string
    key_requirements?: string[]
    win_probability?: number
    competition_level?: 'Low' | 'Medium' | 'High'
    recommended_action?: string
}

export function OpportunityDetails({
    opportunity,
    isOpen,
    onOpenChange
}: {
    opportunity: Opportunity | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [matches, setMatches] = useState<Match[]>([])
    const [loading, setLoading] = useState(false)
    const [discovering, setDiscovering] = useState(false)
    const supabase = createClient()

    const fetchMatches = useCallback(async () => {
        if (!opportunity) return
        setLoading(true)
        const { data } = await supabase
            .from('matches')
            .select('*, contractors(*)')
            .eq('opportunity_id', opportunity.notice_id)
            .order('match_score', { ascending: false })
            .limit(10)

        setMatches(data || [])
        setLoading(false)
    }, [opportunity, supabase])

    useEffect(() => {
        if (isOpen && opportunity) {
            fetchMatches()
        }
    }, [isOpen, opportunity, fetchMatches])

    async function triggerVendorDiscovery() {
        if (!opportunity) return
        setDiscovering(true)
        try {
            const response = await fetch("/api/trigger-vendor-discovery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ opportunityId: opportunity.notice_id }),
            })
            if (!response.ok) throw new Error("Failed")
            setTimeout(() => fetchMatches(), 3000)
        } catch (error) {
            console.error(error)
        } finally {
            setDiscovering(false)
        }
    }

    if (!opportunity) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{opportunity.priority_flag}</Badge>
                        <Badge variant="secondary">{opportunity.contractor_type}</Badge>
                    </div>
                    <DialogTitle className="text-2xl">{opportunity.title}</DialogTitle>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-mono">
                        {opportunity.notice_id} | {opportunity.agency}
                    </p>
                </DialogHeader>

                <div className="grid gap-8 py-6">
                    {/* Opportunity Summary */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground uppercase mb-1">Estimated Value</p>
                            <p className="text-xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(opportunity.estimated_value || 0)}
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground uppercase mb-1">Deadline</p>
                            <p className="text-xl font-bold">
                                {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-1 mb-1">
                                <p className="text-xs text-muted-foreground uppercase">Complexity</p>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>AI-calculated score based on contract requirements, volume, and technical depth.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <div key={s} className={`w-3 h-3 rounded-full ${opportunity.complexity_score >= s ? "bg-primary" : "bg-muted"}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Matches Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                Top Matched Contractors
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={triggerVendorDiscovery}
                                disabled={discovering}
                            >
                                {discovering ? "Searching..." : "Find Contractors"}
                            </Button>
                            <span className="text-xs text-muted-foreground">Threshold: 75% Match</span>
                        </div>

                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Contractor</TableHead>
                                        <TableHead>Match Score</TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Readiness
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs">
                                                            <p>Based on SAM registration, past performance, and current certifications.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8">Loading matches...</TableCell></TableRow>
                                    ) : matches.length > 0 ? (
                                        matches.map((match) => (
                                            <TableRow key={match.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{match.contractors.name}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase">{match.contractors.source}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-green-500">{match.match_score}%</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">{match.contractors.readiness_score}%</span>
                                                        {match.contractors.readiness_score >= 80 && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="h-8 gap-1">
                                                        Invite
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No matches found for this opportunity</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Requirements Tags */}
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Required Capabilities</h4>
                        <div className="flex flex-wrap gap-2">
                            {opportunity.required_capabilities?.map((cap: string) => (
                                <Badge key={cap} variant="outline">{cap}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
