'use client';
import { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfDay } from 'date-fns';

interface Slot {
  hour: number;
  label: string;
  available: boolean;
}

interface BookingConfirmation {
  dateLabel: string;
  timeLabel: string;
  emailProvided: boolean;
}

export default function BookingPage() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  async function fetchSlots(date: Date) {
    setLoadingSlots(true);
    setSelectedHour(null);
    setSuccessMsg('');
    setErrorMsg('');
    const d = format(date, 'yyyy-MM-dd');
    try {
      const res = await fetch(`/api/slots?date=${d}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  }

  useEffect(() => {
    fetchSlots(today);
  }, [today]);

  function handleDateChange(offset: number) {
    const newDate = addDays(selectedDate, offset);
    if (newDate < today) return;
    setSelectedDate(newDate);
    fetchSlots(newDate);
  }

  function handleDateInput(e: React.ChangeEvent<HTMLInputElement>) {
    const d = new Date(e.target.value + 'T00:00:00');
    if (d < today) return;
    setSelectedDate(d);
    fetchSlots(d);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedHour === null || !form.name.trim()) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name.trim(),
          customer_email: form.email.trim() || null,
          customer_phone: form.phone.trim() || null,
          appointment_date: dateStr,
          appointment_hour: selectedHour,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      const timeLabel = `${String(selectedHour).padStart(2, '0')}:00`;
      const dateLabel = format(selectedDate, 'dd/MM/yyyy');
      setSuccessMsg(
        `✅ Booking confirmed! Your appointment is at ${timeLabel} on ${dateLabel}.` +
        (form.email ? ' A confirmation email has been sent.' : '')
      );
      setConfirmation({
        dateLabel,
        timeLabel,
        emailProvided: Boolean(form.email),
      });
      setShowConfirmModal(true);
      setForm({ name: '', email: '', phone: '' });
      setSelectedHour(null);
      fetchSlots(selectedDate);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBookAnother(): void {
    setShowConfirmModal(false);
    setErrorMsg('');
    fetchSlots(selectedDate);
  }

  function handleFinishBookingFlow(): void {
    setShowConfirmModal(false);
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">✂️ Barber Booking</h1>
        <p className="text-gray-500 mt-2">Choose a date and time that works for you</p>
      </div>

      {/* Date Picker */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">📅 Select date</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
          >
            ◀
          </button>
          <input
            type="date"
            value={dateStr}
            min={format(today, 'yyyy-MM-dd')}
            onChange={handleDateInput}
            className="flex-1 border rounded-lg px-3 py-2 text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => handleDateChange(1)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
          >
            ▶
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-2 capitalize">
          {format(selectedDate, 'EEEE, dd/MM/yyyy')}
        </p>
      </div>

      {/* Slots */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">🕐 Select time</h2>
        {loadingSlots ? (
          <p className="text-center text-gray-400 py-4">Loading...</p>
        ) : slots.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No available working hours for this date</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {slots.map((slot) => (
              <button
                key={slot.hour}
                disabled={!slot.available}
                onClick={() => setSelectedHour(slot.available ? slot.hour : null)}
                className={`py-3 rounded-xl font-medium text-sm transition-all ${
                  !slot.available
                    ? 'bg-red-100 text-red-400 cursor-not-allowed'
                    : selectedHour === slot.hour
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {slot.label}
                {!slot.available && <span className="block text-xs mt-0.5">Booked</span>}
              </button>
            ))}
          </div>
        )}
        {slots.length > 0 && (
          <div className="flex gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Available</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Booked</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Selected</span>
          </div>
        )}
      </div>

      {/* Booking Form */}
      {selectedHour !== null && (
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            📝 Booking details -{' '}
            <span className="text-blue-600">{String(selectedHour).padStart(2, '0')}:00</span>{' '}
            on {format(selectedDate, 'dd/MM/yyyy')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email{' '}
                <span className="text-gray-400 font-normal">(optional - receive confirmation & cancel link)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0901234567"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Booking...' : '✅ Confirm booking'}
            </button>
          </form>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-4">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
          {errorMsg}
        </div>
      )}

      {showConfirmModal && confirmation && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Booking successful</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your appointment is confirmed for <strong>{confirmation.timeLabel}</strong> on{' '}
              <strong>{confirmation.dateLabel}</strong>.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {confirmation.emailProvided
                ? 'A confirmation email is being sent. Do you want to book another time slot?'
                : 'Do you want to book another time slot?'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBookAnother}
                className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition"
              >
                Yes, book another
              </button>
              <button
                onClick={handleFinishBookingFlow}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 font-medium hover:bg-gray-50 transition"
              >
                No, done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-400 mt-8 space-y-1">
        <p>⏰ Working hours: Monday - Saturday | 09:00 - 18:00</p>
        <p>⏱ Each appointment: 1 hour | 🚫 Cancel at least 2 hours in advance</p>
      </div>
    </main>
  );
}
