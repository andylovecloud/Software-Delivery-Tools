import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendCancellationEmails, sendWhatsApp } from '@/lib/notifications';
import { format } from 'date-fns';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = supabaseAdmin();
  const { data: booking } = await db
    .from('bookings')
    .select('customer_name, appointment_date, appointment_hour, status')
    .eq('cancel_token', token)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  return NextResponse.json({ booking });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = supabaseAdmin();
  const { data: booking } = await db
    .from('bookings')
    .select('*')
    .eq('cancel_token', token)
    .eq('status', 'confirmed')
    .maybeSingle();

  if (!booking) {
    return NextResponse.json(
      { error: 'Booking not found or already cancelled' },
      { status: 404 }
    );
  }

  // Enforce 2-hour cancellation window
  const appointmentTime = new Date(
    `${booking.appointment_date}T${String(booking.appointment_hour).padStart(2, '0')}:00:00`
  );
  const now = new Date();
  const diffHours = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 2) {
    return NextResponse.json(
      { error: 'Cannot cancel within 2 hours of the appointment time' },
      { status: 400 }
    );
  }

  // Cancel booking
  const { error } = await db
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', booking.id);

  if (error) {
    return NextResponse.json({ error: 'Unable to cancel booking. Please try again.' }, { status: 500 });
  }

  // Notify (fire-and-forget)
  const dateObj = new Date(
    `${booking.appointment_date}T${String(booking.appointment_hour).padStart(2, '0')}:00:00`
  );
  const appointmentStr = format(dateObj, 'EEEE dd/MM/yyyy HH:mm');

  void sendCancellationEmails(booking);
  void sendWhatsApp(`❌ Cancellation: ${booking.customer_name} - ${appointmentStr}`);

  return NextResponse.json({ success: true });
}
