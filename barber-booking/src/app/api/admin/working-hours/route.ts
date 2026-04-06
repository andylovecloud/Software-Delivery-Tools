import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { timingSafeEqual } from 'crypto';

function checkAuth(request: NextRequest): boolean {
  const provided = request.headers.get('x-admin-password') ?? '';
  const expected = process.env.ADMIN_PASSWORD ?? '';
  if (!expected || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('working_hours')
    .select('*')
    .order('weekday', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ working_hours: data });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { weekday, start_hour, end_hour, is_active } = body;

  if (weekday === undefined || start_hour === undefined || end_hour === undefined) {
    return NextResponse.json({ error: 'weekday, start_hour, end_hour required' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from('working_hours')
    .upsert({ weekday, start_hour, end_hour, is_active }, { onConflict: 'weekday' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
