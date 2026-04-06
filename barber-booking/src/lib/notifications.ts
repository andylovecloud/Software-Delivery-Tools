import { Resend } from 'resend';
import { format } from 'date-fns';
import { vi as viLocale } from 'date-fns/locale';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

function formatAppointment(date: string, hour: number): string {
  const d = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
  return format(d, "EEEE, dd/MM/yyyy 'lúc' HH:mm", { locale: viLocale });
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
      subject: `📅 Lịch mới: ${booking.customer_name} - ${appointmentStr}`,
      html: `
        <h2>Bạn có lịch hẹn mới!</h2>
        <p><strong>Khách hàng:</strong> ${booking.customer_name}</p>
        <p><strong>Thời gian:</strong> ${appointmentStr}</p>
        ${booking.customer_email ? `<p><strong>Email:</strong> ${booking.customer_email}</p>` : ''}
        <hr/>
        <p><a href="${cancelUrl}">Hủy lịch này</a></p>
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
        subject: `✅ Xác nhận lịch cắt tóc - ${appointmentStr}`,
        html: `
          <h2>Lịch hẹn của bạn đã được xác nhận!</h2>
          <p><strong>Thời gian:</strong> ${appointmentStr}</p>
          <p>Nếu bạn muốn hủy lịch, vui lòng nhấn vào link bên dưới <strong>trước 2 tiếng</strong>:</p>
          <p><a href="${cancelUrl}">🗑️ Hủy lịch hẹn</a></p>
          <p style="color:#888;font-size:12px;">Link hủy: ${cancelUrl}</p>
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
      subject: `❌ Hủy lịch: ${booking.customer_name} - ${appointmentStr}`,
      html: `<p><strong>${booking.customer_name}</strong> đã hủy lịch hẹn vào <strong>${appointmentStr}</strong>.</p>`,
    });
  } catch (e) {
    console.error('Failed to send barber cancellation email:', e);
  }

  if (booking.customer_email) {
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: booking.customer_email,
        subject: `❌ Lịch hẹn đã được hủy - ${appointmentStr}`,
        html: `<p>Lịch hẹn của bạn vào <strong>${appointmentStr}</strong> đã được hủy thành công.</p><p><a href="${process.env.NEXT_PUBLIC_BASE_URL}">Đặt lịch mới</a></p>`,
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
