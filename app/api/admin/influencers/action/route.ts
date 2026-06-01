import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendWhatsAppInfluencerApproved, sendWhatsAppInfluencerRejected } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'Missing id or action' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data: inf, error } = await supabase
      .from('influencer_profiles')
      .update({
        status: action,
        approved_at: action === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select('*, profiles!influencer_profiles_id_fkey(full_name, phone, referral_code)')
      .single();

    if (error) throw error;

    // Send WhatsApp notification
    const phone = inf.profiles?.phone;
    const name = inf.profiles?.full_name?.split(' ')[0];

    if (phone && name) {
      if (action === 'approved') {
        let code = inf.profiles?.referral_code;
        if (!code) {
          // Generate a referral code if they don't have one
          code = (name.toUpperCase().replace(/[^A-Z]/g, '') + Math.floor(1000 + Math.random() * 9000)).substring(0, 10);
          await supabase.from('profiles').update({ referral_code: code }).eq('id', id);
        }
        
        // Ensure they have 'influencer' role if approved
        await supabase.from('profiles').update({ role: 'influencer' }).eq('id', id);
        await supabase.auth.admin.updateUserById(id, { user_metadata: { user_role: 'influencer' } });

        sendWhatsAppInfluencerApproved({
          phone,
          name,
          discountCode: code,
          commissionRate: inf.commission_rate,
        }).catch(console.error);
      } else if (action === 'rejected') {
        sendWhatsAppInfluencerRejected({
          phone,
          name,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Influencer Action]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
