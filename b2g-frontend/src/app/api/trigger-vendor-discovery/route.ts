import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
    try {
        const { opportunityId } = await request.json()

        if (!opportunityId) {
            return NextResponse.json(
                { error: "opportunityId is required" },
                { status: 400 }
            )
        }

        // Fetch the opportunity details from Supabase
        const supabase = await createClient()
        const { data: opportunity, error } = await supabase
            .from("opportunities")
            .select("*")
            .eq("notice_id", opportunityId)
            .single()

        if (error || !opportunity) {
            return NextResponse.json(
                { error: "Opportunity not found" },
                { status: 404 }
            )
        }

        // Call the vendor discovery webhook
        const webhookUrl = process.env.N8N_VENDOR_DISCOVERY_WEBHOOK_URL

        if (!webhookUrl) {
            return NextResponse.json(
                { error: "N8N_VENDOR_DISCOVERY_WEBHOOK_URL is not configured" },
                { status: 500 }
            )
        }

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ opportunity }),
        })

        if (!response.ok) {
            throw new Error(`n8n responded with ${response.status}`)
        }

        return NextResponse.json({ success: true, message: "Vendor discovery started" })
    } catch (error) {
        console.error("Vendor Discovery Error:", error)
        return NextResponse.json(
            { error: "Failed to trigger vendor discovery" },
            { status: 500 }
        )
    }
}
