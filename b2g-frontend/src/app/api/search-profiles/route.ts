import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch all search profiles
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('search_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Create or update search profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from('search_profiles')
      .upsert({
        name: body.name,
        naics_codes: body.naics_codes || [],
        min_budget: body.min_budget,
        max_budget: body.max_budget,
        min_days_to_deadline: body.min_days_to_deadline,
        set_asides: body.set_asides || [],
        exclude_keywords: body.exclude_keywords || [],
        is_active: body.is_active !== false,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'name'
      })
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete search profile
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Profile name required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('search_profiles')
      .delete()
      .eq('name', name);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
