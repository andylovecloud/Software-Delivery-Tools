import { Resend } from 'resend';
import { format } from 'date-fns';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

function formatAppointment(date: string, hour: number): string {
  const d = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
  return format(d, 'EEEE, dd/MM/yyyy HH:mm');
}

interface BookingNotificationData {
  customer_name: string;
  customer_email: string | null;
  appointment_date: string;
  appointment_hour: number;
  cancel_token: string;
}

interface CancellationNotificationData {
  customer_name: string;
  customer_email: string | null;
  appointment_date: string;
  appointment_hour: number;
}

export async function sendBookingEmails(booking: BookingNotificationData): Promise<void> {
  const resend = getResend();
  const appointmentStr = formatAppointment(booking.appointment_date, booking.appointment_hour);
  const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/cancel/${booking.cancel_token}`;

  // Email to barber
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: process.env.BARBER_EMAIL!,
      subject: `📅 New booking: ${booking.customer_name} - ${appointmentStr}`,
      html: `
        <h2>You have a new appointment!</h2>
        <p><strong>Customer:</strong> ${booking.customer_name}</p>
        <p><strong>Time:</strong> ${appointmentStr}</p>
        ${booking.customer_email ? `<p><strong>Email:</strong> ${booking.customer_email}</p>` : ''}
        <hr/>
        <p><a href="${cancelUrl}">Cancel this appointment</a></p>
      `,
    });
  } catch (e) {
    console.error('Failed to send barber booking email:', e);
  }

  // Email to customer (if provided)
  if (booking.customer_email) {
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: booking.customer_email,
        subject: `✅ Booking confirmation - ${appointmentStr}`,
        html: `
          <h2>Your appointment is confirmed!</h2>
          <p><strong>Time:</strong> ${appointmentStr}</p>
          <p>If you need to cancel, use the link below at least <strong>2 hours</strong> before the appointment:</p>
          <p><a href="${cancelUrl}">🗑️ Cancel appointment</a></p>
          <p style="color:#888;font-size:12px;">Cancellation link: ${cancelUrl}</p>
        `,
      });
    } catch (e) {
      console.error('Failed to send customer booking email:', e);
    }
  }
}

export async function sendCancellationEmails(booking: CancellationNotificationData): Promise<void> {
  const resend = getResend();
  const appointmentStr = formatAppointment(booking.appointment_date, booking.appointment_hour);

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: process.env.BARBER_EMAIL!,
      subject: `❌ Cancellation: ${booking.customer_name} - ${appointmentStr}`,
      html: `<p><strong>${booking.customer_name}</strong> cancelled the appointment at <strong>${appointmentStr}</strong>.</p>`,
    });
  } catch (e) {
    console.error('Failed to send barber cancellation email:', e);
  }

  if (booking.customer_email) {
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: booking.customer_email,
        subject: `❌ Appointment cancelled - ${appointmentStr}`,
        html: `<p>Your appointment at <strong>${appointmentStr}</strong> has been cancelled successfully.</p><p><a href="${process.env.NEXT_PUBLIC_BASE_URL}">Book a new appointment</a></p>`,
      });
    } catch (e) {
      console.error('Failed to send customer cancellation email:', e);
    }
  }
}

export async function sendWhatsApp(message: string): Promise<void> {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return;

  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apikey}`;
  try {
    await fetch(url);
  } catch (e) {
    console.error('Failed to send WhatsApp notification:', e);
  }
}
