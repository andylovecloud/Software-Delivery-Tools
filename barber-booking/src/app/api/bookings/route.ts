import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendBookingEmails, sendWhatsApp } from '@/lib/notifications';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customer_name, customer_email, customer_phone, appointment_date, appointment_hour } = body;

  if (!customer_name || !appointment_date || appointment_hour === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Blocked day cannot receive bookings.
  const { data: blocked } = await db
    .from('blocked_days')
    .select('id')
    .eq('blocked_date', appointment_date)
    .maybeSingle();

  if (blocked) {
    return NextResponse.json({ error: 'This date is closed. Please choose another date.' }, { status: 409 });
  }

  const dateObj = new Date(`${appointment_date}T00:00:00`);
  const weekday = dateObj.getDay();

  const { data: dailyWh } = await db
    .from('daily_working_hours')
    .select('start_hour,end_hour,is_active')
    .eq('target_date', appointment_date)
    .maybeSingle();

  const { data: weeklyWh } = await db
    .from('working_hours')
    .select('start_hour,end_hour,is_active')
    .eq('weekday', weekday)
    .maybeSingle();

  const effectiveWh = dailyWh || weeklyWh;
  const hour = Number(appointment_hour);

  if (!effectiveWh || !effectiveWh.is_active || hour < effectiveWh.start_hour || hour >= effectiveWh.end_hour) {
    return NextResponse.json({ error: 'This time slot is not available.' }, { status: 409 });
  }

  // Check if slot is still available
  const { data: existing } = await db
    .from('bookings')
    .select('id')
    .eq('appointment_date', appointment_date)
    .eq('appointment_hour', appointment_hour)
    .eq('status', 'confirmed')
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'This time slot is already booked. Please choose another one.' },
      { status: 409 }
    );
  }

  // Create booking
  const { data: booking, error } = await db
    .from('bookings')
    .insert({
      customer_name,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      appointment_date,
      appointment_hour,
    })
    .select()
    .single();

  if (error || !booking) {
    console.error('Insert error:', error);
    return NextResponse.json({ error: 'Unable to create booking' }, { status: 500 });
  }

  // Send notifications (fire-and-forget)
  const appointmentDateObj = new Date(
    `${appointment_date}T${String(appointment_hour).padStart(2, '0')}:00:00`
  );
  const appointmentStr = format(appointmentDateObj, 'EEEE dd/MM/yyyy HH:mm');
  const whatsappMsg = `📅 New booking: ${customer_name} - ${appointmentStr}`;

  void sendBookingEmails(booking);
  void sendWhatsApp(whatsappMsg);

  return NextResponse.json({ booking }, { status: 201 });
}
