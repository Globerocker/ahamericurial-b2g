import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface MatchRequest {
    company_name: string;
    email: string;
    primary_naics: string;
    city: string;
    state: string;
    certifications: string[];
    capabilities: string;
    sam_registered: boolean;
}

interface MatchedOpportunity {
    id: string;
    title: string;
    agency: string;
    estimated_value: number;
    deadline: string;
    fitting_score: number;
    match_reasons: string[];
    required_capabilities: string[];
    naics: string;
    city: string;
    state: string;
}

export async function POST(request: Request) {
    try {
        const body: MatchRequest = await request.json();
        const { primary_naics, city, state, certifications, capabilities, sam_registered } = body;

        const supabase = await createClient();

        // Fetch opportunities from Supabase
        const { data: opportunities, error } = await supabase
            .from('opportunities')
            .select('*')
            .gte('deadline', new Date().toISOString())
            .order('deadline', { ascending: true })
            .limit(100);

        if (error) {
            console.error('Error fetching opportunities:', error);
            return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
        }

        if (!opportunities || opportunities.length === 0) {
            return NextResponse.json({ matches: [] });
        }

        // Calculate fitting score for each opportunity
        const matches: MatchedOpportunity[] = opportunities
            .map((opp) => {
                const score = calculateFittingScore(opp, {
                    primary_naics,
                    city,
                    state,
                    certifications,
                    capabilities: capabilities.toLowerCase(),
                    sam_registered,
                });

                return {
                    id: opp.id,
                    title: opp.title,
                    agency: opp.agency || 'Unknown Agency',
                    estimated_value: opp.estimated_value || 0,
                    deadline: opp.deadline,
                    fitting_score: score.total,
                    match_reasons: score.reasons,
                    required_capabilities: opp.required_capabilities || [],
                    naics: opp.naics || '',
                    city: opp.city || '',
                    state: opp.state || '',
                };
            })
            .filter((match) => match.fitting_score >= 50) // Only return >= 50% matches
            .sort((a, b) => b.fitting_score - a.fitting_score) // Sort by score descending
            .slice(0, 20); // Limit to top 20 matches

        return NextResponse.json({ matches });
    } catch (error) {
        console.error('Error in match-opportunities:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

interface OpportunityData {
    naics?: string | string[];
    state?: string;
    city?: string;
    required_capabilities?: string[];
    raw_json?: { setAside?: string };
    complexity_score?: number;
    estimated_value?: number;
}

interface ContractorData {
    primary_naics: string;
    city: string;
    state: string;
    certifications: string[];
    capabilities: string;
    sam_registered: boolean;
}

function calculateFittingScore(
    opportunity: OpportunityData,
    contractor: ContractorData
) {
    let score = 0;
    const reasons: string[] = [];

    // 1. NAICS Match (40 points)
    if (opportunity.naics) {
        const oppNaics = Array.isArray(opportunity.naics)
            ? opportunity.naics
            : opportunity.naics.split(',').map((n: string) => n.trim());

        if (oppNaics.includes(contractor.primary_naics)) {
            score += 40;
            reasons.push('NAICS Code Match');
        } else {
            // Partial match for same industry (first 4 digits)
            const contractorPrefix = contractor.primary_naics.substring(0, 4);
            const hasPartialMatch = oppNaics.some((n: string) => n.startsWith(contractorPrefix));
            if (hasPartialMatch) {
                score += 20;
                reasons.push('Similar Industry');
            }
        }
    }

    // 2. Location Proximity (20 points)
    if (opportunity.state && contractor.state) {
        if (opportunity.state.toUpperCase() === contractor.state.toUpperCase()) {
            score += 20;
            reasons.push('Same State');

            // Bonus for same city
            if (
                opportunity.city &&
                contractor.city &&
                opportunity.city.toLowerCase() === contractor.city.toLowerCase()
            ) {
                score += 5;
                reasons.push('Local Opportunity');
            }
        } else {
            // Adjacent states or regional proximity could be added here
            score += 5;
        }
    }

    // 3. Capabilities Match (30 points)
    if (opportunity.required_capabilities && contractor.capabilities) {
        const requiredCaps = Array.isArray(opportunity.required_capabilities)
            ? opportunity.required_capabilities.map((c: string) => c.toLowerCase())
            : [];

        const contractorCaps = contractor.capabilities.toLowerCase();

        let capabilityMatches = 0;
        const matchedCaps: string[] = [];

        requiredCaps.forEach((cap: string) => {
            if (contractorCaps.includes(cap)) {
                capabilityMatches++;
                matchedCaps.push(cap);
            }
        });

        if (capabilityMatches > 0) {
            const capScore = Math.min(30, (capabilityMatches / requiredCaps.length) * 30);
            score += capScore;
            if (matchedCaps.length > 0) {
                reasons.push(`${matchedCaps.length} Capability Match${matchedCaps.length > 1 ? 'es' : ''}`);
            }
        }
    }

    // 4. Certifications Bonus (10 points)
    if (contractor.certifications.length > 0) {
        // Check if opportunity has set-aside requirements
        const oppSetAsides = opportunity.raw_json?.setAside
            ? opportunity.raw_json.setAside.toLowerCase()
            : '';

        let certBonus = 0;
        const matchedCerts: string[] = [];

        contractor.certifications.forEach((cert) => {
            if (
                (cert === '8a' && oppSetAsides.includes('8a')) ||
                (cert === 'sdvosb' && oppSetAsides.includes('sdvosb')) ||
                (cert === 'wosb' && oppSetAsides.includes('wosb')) ||
                (cert === 'hubzone' && oppSetAsides.includes('hubzone')) ||
                (cert === 'sb' && oppSetAsides.includes('small business'))
            ) {
                certBonus += 5;
                matchedCerts.push(cert.toUpperCase());
            }
        });

        if (certBonus > 0) {
            score += Math.min(10, certBonus);
            reasons.push(`${matchedCerts.join(', ')} Certified`);
        }
    }

    // 5. SAM Registration Bonus (5 points)
    if (contractor.sam_registered) {
        score += 5;
        reasons.push('SAM Registered');
    }

    // 6. Complexity Score Modifier
    if (opportunity.complexity_score) {
        // Lower complexity = easier to win = slight bonus
        if (opportunity.complexity_score <= 2) {
            score += 5;
            reasons.push('Low Complexity');
        }
    }

    // 7. Contract Value Consideration
    if (opportunity.estimated_value) {
        // Sweet spot for small businesses: $10k - $5M
        if (opportunity.estimated_value >= 10000 && opportunity.estimated_value <= 5000000) {
            score += 5;
            reasons.push('Appropriate Contract Size');
        }
    }

    return {
        total: Math.min(100, Math.round(score)),
        reasons,
    };
}
