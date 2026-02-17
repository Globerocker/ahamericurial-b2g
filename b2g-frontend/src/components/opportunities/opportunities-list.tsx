"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCcw, Briefcase, TrendingUp, Award, AlertCircle } from "lucide-react"
import { Opportunity } from "@/components/opportunities/opportunity-details"
import { toast } from "sonner"

// ENHANCED NAICS CODES - Quick Wins
const NAICS_CATEGORIES = {
  'IT Services': ['541511', '541512', '541513', '541519', '541618'],
  'Professional Services': ['541618', '541690', '611420'],
  'Construction': ['236220'],
  'Engineering': ['541330'],
  'Data & Cloud': ['518210'],
  'Support Services': ['561210', '561621', '561730'],
  'Environmental': ['562910', '541620']
}

export function OpportunitiesList({
  opportunities: initialOpps,
  count
}: {
  opportunities: Opportunity[],
  count: number
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [loadingContractors, setLoadingContractors] = useState<string | null>(null)

  // LIMIT TO TOP 200 (Quick Win #1)
  const limitedOpps = initialOpps.slice(0, 200)

  const filteredOpps = limitedOpps.filter(opp => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.agency?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory
      ? opp.contractor_type === selectedCategory
      : true

    return matchesSearch && matchesCategory
  })

  // Sort by win probability (Quick Win #5)
  const sortedOpps = [...filteredOpps].sort((a, b) =>
    (b.win_probability || 0) - (a.win_probability || 0)
  )

  async function handleSync() {
    setSyncing(true)
    try {
      const response = await fetch('/api/trigger-sam-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        toast.success("✅ SAM.gov sync started!")
      } else {
        toast.error(`❌ Sync failed`)
      }
    } catch {
      toast.error(`❌ Error`)
    } finally {
      setSyncing(false)
    }
  }

  async function handleFindContractors(opportunityId: string, title: string) {
    setLoadingContractors(opportunityId)
    try {
      const response = await fetch('/api/trigger-vendor-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId })
      })
      if (response.ok) {
        toast.success(`🔍 Finding contractors for: "${title.substring(0, 40)}..."`)
      } else {
        toast.error(`❌ Error`)
      }
    } catch {
      toast.error(`❌ Error`)
    } finally {
      setLoadingContractors(null)
    }
  }

  // Helper functions
  const getCompetitionColor = (level?: string) => {
    switch(level) {
      case 'Low': return 'text-green-600 bg-green-50'
      case 'Medium': return 'text-yellow-600 bg-yellow-50'
      case 'High': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getWinProbabilityColor = (prob?: number) => {
    if (!prob) return 'text-gray-600'
    if (prob >= 70) return 'text-green-600'
    if (prob >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Government Opportunities</h2>
          <p className="text-muted-foreground text-sm">
            AI-powered matching • Top {sortedOpps.length} relevant contracts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-2 hidden md:block border-l pl-4">
            <p className="text-xs text-muted-foreground">Total Opportunities</p>
            <p className="text-sm font-medium">{count || 0}</p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCcw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync SAM.gov'}
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search opportunities..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-muted-foreground self-center">Categories:</span>
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-8 text-xs"
          >
            All ({limitedOpps.length})
          </Button>
          {Object.keys(NAICS_CATEGORIES).map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="h-8 text-xs"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedOpps.map((opp) => (
          <div key={opp.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-card">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <Badge variant="secondary" className="text-[10px]">
                {opp.contractor_type}
              </Badge>
              {opp.win_probability && (
                <div className={`text-sm font-bold ${getWinProbabilityColor(opp.win_probability)}`}>
                  {opp.win_probability}% Match
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
              {opp.title}
            </h3>

            {/* AI Summary (Quick Win #2) */}
            {opp.ai_summary && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {opp.ai_summary}
              </p>
            )}

            {/* Metadata */}
            <div className="space-y-2 mb-4">
              {/* Agency */}
              <div className="flex items-center gap-2 text-xs">
                <Award className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{opp.agency?.substring(0, 30)}</span>
              </div>

              {/* Competition Level */}
              {opp.competition_level && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  <Badge className={`text-[10px] ${getCompetitionColor(opp.competition_level)}`}>
                    {opp.competition_level} Competition
                  </Badge>
                </div>
              )}

              {/* Complexity */}
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className={`w-1.5 h-1.5 rounded-full ${
                        (opp.complexity_score || 0) >= s ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
              >
                Details
              </Button>
              <Button
                size="sm"
                onClick={() => handleFindContractors(opp.notice_id, opp.title)}
                disabled={loadingContractors === opp.notice_id}
                className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700"
              >
                <Briefcase className="h-3 w-3 mr-1" />
                {loadingContractors === opp.notice_id ? 'Searching...' : 'Find Match'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedOpps.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No opportunities found. Try adjusting your filters or click &quot;Sync SAM.gov&quot;.
          </p>
        </div>
      )}
    </div>
  )
}
