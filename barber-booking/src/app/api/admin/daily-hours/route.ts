import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { timingSafeEqual } from 'crypto';

function checkAuth(request: NextRequest): boolean {
  const provided = request.headers.get('x-admin-password') ?? '';
  const expected = process.env.ADMIN_PASSWORD ?? '';
  if (!expected || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

function validHourRange(start: number, end: number): boolean {
  return Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end <= 24 && start < end;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('daily_working_hours')
    .select('*')
    .order('target_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ daily_hours: data });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { target_date, start_hour, end_hour, is_active, note } = body;

  if (!target_date || start_hour === undefined || end_hour === undefined) {
    return NextResponse.json(
      { error: 'target_date, start_hour, end_hour required' },
      { status: 400 }
    );
  }

  if (!validHourRange(Number(start_hour), Number(end_hour))) {
    return NextResponse.json({ error: 'Invalid start/end hour range' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db.from('daily_working_hours').upsert(
    {
      target_date,
      start_hour: Number(start_hour),
      end_hour: Number(end_hour),
      is_active: Boolean(is_active),
      note: note || null,
    },
    { onConflict: 'target_date' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { target_date } = body;

  if (!target_date) {
    return NextResponse.json({ error: 'target_date required' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db.from('daily_working_hours').delete().eq('target_date', target_date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
