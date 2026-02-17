import { createClient } from "@/lib/supabase/server"
import { OpportunitiesList } from "@/components/opportunities/opportunities-list"

export default async function OpportunitiesPage({
    searchParams,
}: {
    searchParams: { q?: string; state?: string; complexity_score?: string }
}) {
    const supabase = createClient()

    let query = supabase.from('opportunities').select('*', { count: 'exact' })

    if (searchParams.q) {
        query = query.ilike('title', `%${searchParams.q}%`)
    }
    if (searchParams.state) {
        query = query.eq('state', searchParams.state)
    }
    if (searchParams.complexity_score) {
        query = query.eq('complexity_score', parseInt(searchParams.complexity_score))
    }

    const { data: opportunities, count } = await query
        .order('created_at', { ascending: false })
        .limit(200)

    return (
        <OpportunitiesList
            opportunities={opportunities || []}
            count={count || 0}
        />
    )
}
