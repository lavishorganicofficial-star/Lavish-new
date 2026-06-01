import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user basic info
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();

    // Fetch influencer extended info
    const { data: influencerProfile } = await supabase
      .from('influencer_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        ...userProfile,
        ...influencerProfile,
        email: user.email,
      }
    });
  } catch (error: any) {
    console.error('Error fetching influencer profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Split updates into profiles table and influencer_profiles table
    const profileUpdates: any = {};
    if (body.full_name !== undefined) profileUpdates.full_name = body.full_name;
    if (body.phone !== undefined) profileUpdates.phone = body.phone;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);
      
      if (profileError) throw profileError;
    }

    const influencerUpdates: any = {};
    const editableInfluencerFields = [
      'instagram_handle', 'follower_count', 'youtube_channel', 'content_niche',
      'bank_account_number', 'bank_ifsc', 'bank_account_name', 'upi_id'
    ];

    editableInfluencerFields.forEach(field => {
      if (body[field] !== undefined) {
        influencerUpdates[field] = body[field];
      }
    });

    if (Object.keys(influencerUpdates).length > 0) {
      const { error: influencerError } = await supabase
        .from('influencer_profiles')
        .update(influencerUpdates)
        .eq('id', user.id);
        
      if (influencerError) throw influencerError;
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Error updating influencer profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
