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
    .from('bookings')
    .select('*')
    .order('appointment_date', { ascending: true })
    .order('appointment_hour', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data });
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = supabaseAdmin();
  const { error } = await db
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
