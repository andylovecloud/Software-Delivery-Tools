import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendBookingEmails, sendWhatsApp } from '@/lib/notifications';
import { format } from 'date-fns';
import { vi as viLocale } from 'date-fns/locale';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customer_name, customer_email, customer_phone, appointment_date, appointment_hour } = body;

  if (!customer_name || !appointment_date || appointment_hour === undefined) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
  }

  const db = supabaseAdmin();

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
      { error: 'Giờ này đã có người đặt, vui lòng chọn giờ khác' },
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
    return NextResponse.json({ error: 'Không thể tạo lịch hẹn' }, { status: 500 });
  }

  // Send notifications (fire-and-forget)
  const dateObj = new Date(
    `${appointment_date}T${String(appointment_hour).padStart(2, '0')}:00:00`
  );
  const appointmentStr = format(dateObj, "EEEE dd/MM/yyyy 'lúc' HH:mm", { locale: viLocale });
  const whatsappMsg = `📅 Lịch mới: ${customer_name} - ${appointmentStr}`;

  void sendBookingEmails(booking);
  void sendWhatsApp(whatsappMsg);

  return NextResponse.json({ booking }, { status: 201 });
}
