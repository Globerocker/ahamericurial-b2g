import { NextResponse } from "next/server"

export async function POST() {
    try {
        const N8N_URL = process.env.N8N_URL || "https://n8n.srv1113360.hstgr.cloud"
        const N8N_API_KEY = process.env.N8N_API_KEY
        const WORKFLOW_ID = process.env.N8N_WORKFLOW_ID || "nHnUprASEu85qJ6G"

        if (!N8N_API_KEY) {
            throw new Error("N8N_API_KEY environment variable is not set")
        }

        // Trigger SAM Sentinel workflow via n8n API
        const response = await fetch(
            `${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`,
            {
                method: "POST",
                headers: {
                    "X-N8N-API-KEY": N8N_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({})
            }
        )

        if (!response.ok && response.status !== 405) {
            const errorText = await response.text()
            console.error(`n8n API error: ${response.status}`, errorText)
            throw new Error(`n8n API responded with ${response.status}: ${errorText}`)
        }

        return NextResponse.json({ 
            success: true, 
            message: "SAM.gov sync triggered successfully"
        })
    } catch (error) {
        console.error("SAM Sync Error:", error)
        return NextResponse.json(
            { 
                error: "Failed to trigger SAM.gov sync",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}
