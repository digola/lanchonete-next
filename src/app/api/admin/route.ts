import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Validate token server-side using Supabase auth endpoint
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Token validation failed');
    }

    const userData = await userResponse.json();

    // Check for is_super_admin claim (adjust based on your actual claim name)
    if (!userData.user_metadata?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden: Missing super admin privileges' }, { status: 403 });
    }

    // Perform privileged action: fetch categories
    const { data, error } = await supabaseAdmin.from('categories').select('*').limit(100);

    if (error) throw error;

    return NextResponse.json({ categories: data });
  } catch (err) {
    console.error('Admin API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}