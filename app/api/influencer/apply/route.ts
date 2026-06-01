import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendWhatsAppInfluencerReceived } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, password, instagram_handle, youtube_channel, follower_count, content_niche, notes } = body;

    if (!name || !phone || !email || !instagram_handle || !follower_count || !content_niche) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // 1. Create or get user
    let userId: string;
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password || Math.random().toString(36).slice(-10) + 'A1!',
      email_confirm: true,
    });

    if (authError && authError.code === 'email_exists') {
      // Find the existing user
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!existingUser) {
         return NextResponse.json({ success: false, error: 'User exists but could not be retrieved' }, { status: 500 });
      }
      userId = existingUser.id;
    } else if (authError || !authUser?.user) {
      console.error('[Apply] Auth user creation failed:', authError);
      return NextResponse.json({ success: false, error: 'Could not create account' }, { status: 500 });
    } else {
      userId = authUser.user.id;
      // Update the profile created by the auth trigger
      await supabase.from('profiles').update({
        full_name: name,
        phone,
      }).eq('id', userId);
    }

    // 2. Check if influencer profile already exists
    const { data: existingInf } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingInf) {
      return NextResponse.json({ success: false, error: 'You have already applied or are an influencer' }, { status: 400 });
    }

    // 3. Create influencer profile
    const { error: insertError } = await supabase.from('influencer_profiles').insert({
      id: userId,
      instagram_handle,
      youtube_channel: youtube_channel || null,
      follower_count: parseInt(follower_count, 10),
      niche: content_niche,
      why_join: notes,
      status: 'pending'
    });

    if (insertError) {
      console.error('[Apply] Influencer insert error:', insertError);
      return NextResponse.json({ success: false, error: 'Failed to submit application' }, { status: 500 });
    }

    // 4. Send WhatsApp
    sendWhatsAppInfluencerReceived({
      phone,
      name,
    }).catch(console.error);

    return NextResponse.json({ success: true, message: 'Application submitted successfully' });
  } catch (err: any) {
    console.error('[Apply] Server error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
