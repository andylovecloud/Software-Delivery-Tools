'use client';
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface BookingInfo {
  customer_name: string;
  appointment_date: string;
  appointment_hour: number;
  status: string;
}

export default function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = React.use(params);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  useEffect(() => {
    fetch(`/api/cancel/${resolvedParams.token}`)
      .then(r => r.json())
      .then(d => {
        setBooking(d.booking || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.token]);

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/cancel/${resolvedParams.token}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true });
        setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
      } else {
        setResult({ error: data.error });
      }
    } catch {
      setResult({ error: 'Something went wrong. Please try again.' });
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <div className="text-center p-12 text-gray-400">Loading...</div>;
  }

  if (!booking) {
    return (
      <main className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-xl font-semibold text-gray-800">Booking not found</h1>
        <p className="text-gray-500 mt-2 text-sm">This link is invalid or has expired.</p>
        <a href="/" className="text-blue-600 mt-4 block">← Book a new appointment</a>
      </main>
    );
  }

  const dateObj = new Date(
    `${booking.appointment_date}T${String(booking.appointment_hour).padStart(2, '0')}:00:00`
  );
  const appointmentStr = format(dateObj, 'EEEE, dd/MM/yyyy HH:mm');

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow p-8 text-center">
        <div className="text-5xl mb-4">✂️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cancel appointment</h1>
        <p className="text-gray-600 mb-2">
          Customer: <strong>{booking.customer_name}</strong>
        </p>
        <p className="text-gray-600 mb-6 capitalize">
          Time: <strong>{appointmentStr}</strong>
        </p>

        {booking.status === 'cancelled' || result?.success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
            ✅ Your appointment has been cancelled.
          </div>
        ) : result?.error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {result.error}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to cancel this appointment?
              <br />
              <span className="text-orange-500">⚠️ Cancellations are allowed up to 2 hours before the appointment.</span>
            </p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 transition"
            >
              {cancelling ? 'Cancelling...' : '🗑️ Confirm cancellation'}
            </button>
          </>
        )}
        <a href="/" className="text-blue-600 text-sm mt-6 block hover:underline">
          ← Book a new appointment
        </a>
      </div>
    </main>
  );
}
