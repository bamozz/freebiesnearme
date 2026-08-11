import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

// Vercel Cron always issues GET requests. When a CRON_SECRET env var exists
// on the project, Vercel automatically attaches it as `Authorization: Bearer
// <CRON_SECRET>` on requests it makes to this path - this check rejects
// anything else, so the endpoint can't be triggered by an outside request
// even though the URL itself isn't secret.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.rpc('deactivate_expired_listings');

    if (error) {
      console.error('deactivate_expired_listings RPC failed', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ranAt: new Date().toISOString() });
  } catch (err) {
    console.error('deactivate-expired cron failed', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
