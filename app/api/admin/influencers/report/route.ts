import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { renderInfluencerReportStream } from '@/components/pdf/InfluencerReport';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    
    const { data } = await supabase
      .from('influencer_profiles')
      .select('*, profiles!influencer_profiles_id_fkey(full_name)')
      .eq('status', 'approved')
      .order('total_sales', { ascending: false });

    const stream = await renderInfluencerReportStream(data || [], "All Time");
    
    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Influencer-Report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });

  } catch (err) {
    console.error('Report Generation Error:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
