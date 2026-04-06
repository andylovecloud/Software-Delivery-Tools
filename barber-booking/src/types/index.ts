export interface Booking {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  appointment_date: string; // YYYY-MM-DD
  appointment_hour: number; // 9-17
  cancel_token: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

export interface WorkingHours {
  id: number;
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
  start_hour: number;
  end_hour: number; // exclusive
  is_active: boolean;
}

export interface BlockedDay {
  id: number;
  blocked_date: string; // YYYY-MM-DD
  reason: string | null;
}

export interface Slot {
  hour: number;
  label: string; // "09:00"
  available: boolean;
}
