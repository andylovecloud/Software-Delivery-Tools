'use client';
import { useState, useCallback } from 'react';
import { format } from 'date-fns';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  appointment_date: string;
  appointment_hour: number;
  status: string;
  created_at: string;
}

interface WorkingHours {
  weekday: number;
  start_hour: number;
  end_hour: number;
  is_active: boolean;
}

interface DailyWorkingHours {
  target_date: string;
  start_hour: number;
  end_hour: number;
  is_active: boolean;
  note: string | null;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [tab, setTab] = useState<'bookings' | 'hours'>('bookings');
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [dailyHours, setDailyHours] = useState<DailyWorkingHours[]>([]);
  const [dailyDate, setDailyDate] = useState('');
  const [dailyStartHour, setDailyStartHour] = useState(9);
  const [dailyEndHour, setDailyEndHour] = useState(18);
  const [dailyIsActive, setDailyIsActive] = useState(true);
  const [dailyNote, setDailyNote] = useState('');

  const fetchData = useCallback(async (pwd: string) => {
    const cleanPwd = pwd.trim();
    const headers = { 'x-admin-password': cleanPwd };
    const [bRes, wRes, dRes] = await Promise.all([
      fetch('/api/admin/bookings', { headers }),
      fetch('/api/admin/working-hours', { headers }),
      fetch('/api/admin/daily-hours', { headers }),
    ]);
    if (!bRes.ok) {
      let apiError = '';
      try {
        const errBody = await bRes.json();
        apiError = errBody?.error || '';
      } catch {
        apiError = '';
      }
      if (bRes.status === 401) {
        setError('Invalid admin password');
      } else {
        setError(apiError ? `Server error: ${apiError}` : 'Server connection error');
      }
      setAuthed(false);
      return;
    }
    const bData = await bRes.json();
    const wData = await wRes.json();
    const dData = dRes.ok ? await dRes.json() : { daily_hours: [] };
    setBookings(bData.bookings || []);
    setWorkingHours(wData.working_hours || []);
    setDailyHours(dData.daily_hours || []);
    setAuthed(true);
    setError('');
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await fetchData(password);
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this appointment?')) return;
    await fetch('/api/admin/bookings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ id }),
    });
    fetchData(password);
  }

  async function handleUpdateHours(wh: WorkingHours) {
    await fetch('/api/admin/working-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(wh),
    });
    fetchData(password);
  }

  async function handleSaveDailyHours(e: React.FormEvent) {
    e.preventDefault();
    if (!dailyDate) return;
    await fetch('/api/admin/daily-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({
        target_date: dailyDate,
        start_hour: dailyStartHour,
        end_hour: dailyEndHour,
        is_active: dailyIsActive,
        note: dailyNote.trim() || null,
      }),
    });
    setDailyDate('');
    setDailyStartHour(9);
    setDailyEndHour(18);
    setDailyIsActive(true);
    setDailyNote('');
    fetchData(password);
  }

  async function handleDeleteDailyHours(targetDate: string) {
    if (!confirm('Delete this day-specific override?')) return;
    await fetch('/api/admin/daily-hours', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ target_date: targetDate }),
    });
    fetchData(password);
  }

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const filteredBookings = filterDate
    ? bookings.filter(b => b.appointment_date === filterDate)
    : bookings;

  if (!authed) {
    return (
      <main className="max-w-sm mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-center mb-6">🔐 Admin</h1>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Sign in
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">✂️ Admin Dashboard</h1>
        <button
          onClick={() => setAuthed(false)}
          className="text-sm text-gray-500 hover:text-red-500 transition"
        >
          Sign out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('bookings')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            tab === 'bookings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          📋 Appointments ({confirmedBookings.length})
        </button>
        <button
          onClick={() => setTab('hours')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            tab === 'hours' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          ⏰ Working Hours
        </button>
      </div>

      {tab === 'bookings' && (
        <div>
          {/* Filter by date */}
          <div className="mb-4 flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-sm text-red-500 hover:underline"
              >
                Clear filter
              </button>
            )}
            <button
              onClick={() => fetchData(password)}
              className="text-sm text-blue-500 hover:underline ml-auto"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="space-y-3">
            {filteredBookings.length === 0 && (
              <p className="text-gray-400 text-center py-8">No appointments found</p>
            )}
            {filteredBookings.map(b => {
              const dateObj = new Date(
                `${b.appointment_date}T${String(b.appointment_hour).padStart(2, '0')}:00:00`
              );
              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-xl shadow p-4 flex items-center justify-between gap-4 ${
                    b.status === 'cancelled' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{b.customer_name}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {format(dateObj, 'EEEE dd/MM/yyyy HH:mm')}
                    </p>
                    {b.customer_email && (
                      <p className="text-xs text-gray-400 truncate">{b.customer_email}</p>
                    )}
                    {b.customer_phone && (
                      <p className="text-xs text-gray-400">{b.customer_phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        b.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {b.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                    </span>
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'hours' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Default weekly working hours</h2>
            {workingHours.map(wh => (
              <div key={wh.weekday} className="bg-white rounded-xl shadow p-4 flex items-center gap-4 flex-wrap">
                <div className="w-24 font-medium text-gray-700">{WEEKDAYS[wh.weekday]}</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wh.is_active}
                    onChange={() => handleUpdateHours({ ...wh, is_active: !wh.is_active })}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-600">Working day</span>
                </label>
                {wh.is_active && (
                  <div className="flex items-center gap-2">
                    <select
                      value={wh.start_hour}
                      onChange={e => handleUpdateHours({ ...wh, start_hour: Number(e.target.value) })}
                      className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 7).map(h => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                    <span className="text-gray-400">—</span>
                    <select
                      value={wh.end_hour}
                      onChange={e => handleUpdateHours({ ...wh, end_hour: Number(e.target.value) })}
                      className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {Array.from({ length: 13 }, (_, i) => i + 8).map(h => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Date-specific availability override</h2>
            <form onSubmit={handleSaveDailyHours} className="grid md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Date</label>
                <input
                  required
                  type="date"
                  value={dailyDate}
                  onChange={e => setDailyDate(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start</label>
                <select
                  value={dailyStartHour}
                  onChange={e => setDailyStartHour(Number(e.target.value))}
                  className="w-full border rounded px-2 py-2 text-sm"
                >
                  {Array.from({ length: 17 }, (_, i) => i + 6).map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End</label>
                <select
                  value={dailyEndHour}
                  onChange={e => setDailyEndHour(Number(e.target.value))}
                  className="w-full border rounded px-2 py-2 text-sm"
                >
                  {Array.from({ length: 17 }, (_, i) => i + 7).map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Note (optional)</label>
                <input
                  value={dailyNote}
                  onChange={e => setDailyNote(e.target.value)}
                  placeholder="Example: Half day only"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 md:col-span-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={dailyIsActive}
                  onChange={e => setDailyIsActive(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                Open for bookings on this date
              </label>
              <button
                type="submit"
                className="md:col-span-2 bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
              >
                Save date override
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {dailyHours.length === 0 && (
                <p className="text-sm text-gray-400">No date-specific overrides yet.</p>
              )}
              {dailyHours.map(item => (
                <div key={item.target_date} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium">{item.target_date}</span>
                    <span className="text-gray-500 ml-2">
                      {item.is_active
                        ? `${String(item.start_hour).padStart(2, '0')}:00 - ${String(item.end_hour).padStart(2, '0')}:00`
                        : 'Closed all day'}
                    </span>
                    {item.note && <span className="text-gray-400 ml-2">({item.note})</span>}
                  </div>
                  <button
                    onClick={() => handleDeleteDailyHours(item.target_date)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            * The system uses weekly hours by default. If a date-specific override exists, it takes priority for that date.
          </p>
        </div>
      )}
    </main>
  );
}
