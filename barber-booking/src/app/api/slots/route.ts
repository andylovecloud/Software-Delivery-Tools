import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSlots } from '@/lib/slots';
import { WorkingHours } from '@/types';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });

  const db = supabaseAdmin();
  const dateObj = new Date(date + 'T00:00:00');
  const weekday = dateObj.getDay();

  // Check if this day is blocked
  const { data: blocked } = await db
    .from('blocked_days')
    .select('id')
    .eq('blocked_date', date)
    .maybeSingle();

  if (blocked) return NextResponse.json({ slots: [] });

  // Daily override takes precedence over weekday config.
  const { data: dailyWh } = await db
    .from('daily_working_hours')
    .select('*')
    .eq('target_date', date)
    .maybeSingle();

  // Get working hours for this weekday
  const { data: wh } = await db
    .from('working_hours')
    .select('*')
    .eq('weekday', weekday)
    .maybeSingle();

  // Get already-booked hours for this date
  const { data: bookings } = await db
    .from('bookings')
    .select('appointment_hour')
    .eq('appointment_date', date)
    .eq('status', 'confirmed');

  const bookedHours = (bookings || []).map((b: { appointment_hour: number }) => b.appointment_hour);
  const effectiveWh =
    dailyWh && typeof dailyWh.start_hour === 'number' && typeof dailyWh.end_hour === 'number'
      ? {
          ...dailyWh,
          weekday,
        }
      : wh;
  const slots = generateSlots(effectiveWh as WorkingHours | null, bookedHours);

  return NextResponse.json({ slots });
}
