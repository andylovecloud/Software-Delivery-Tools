'use client';
import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { vi as viLocale } from 'date-fns/locale';

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

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [tab, setTab] = useState<'bookings' | 'hours'>('bookings');
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const fetchData = useCallback(async (pwd: string) => {
    const headers = { 'x-admin-password': pwd };
    const [bRes, wRes] = await Promise.all([
      fetch('/api/admin/bookings', { headers }),
      fetch('/api/admin/working-hours', { headers }),
    ]);
    if (!bRes.ok) {
      setError('Sai mật khẩu hoặc lỗi kết nối');
      setAuthed(false);
      return;
    }
    const bData = await bRes.json();
    const wData = await wRes.json();
    setBookings(bData.bookings || []);
    setWorkingHours(wData.working_hours || []);
    setAuthed(true);
    setError('');
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await fetchData(password);
  }

  async function handleCancel(id: string) {
    if (!confirm('Xác nhận hủy lịch hẹn này?')) return;
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
              placeholder="Mật khẩu admin"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Đăng nhập
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
          Đăng xuất
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
          📋 Lịch hẹn ({confirmedBookings.length})
        </button>
        <button
          onClick={() => setTab('hours')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            tab === 'hours' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          ⏰ Giờ làm việc
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
                Xóa lọc
              </button>
            )}
            <button
              onClick={() => fetchData(password)}
              className="text-sm text-blue-500 hover:underline ml-auto"
            >
              🔄 Làm mới
            </button>
          </div>

          <div className="space-y-3">
            {filteredBookings.length === 0 && (
              <p className="text-gray-400 text-center py-8">Không có lịch hẹn</p>
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
                      {format(dateObj, "EEEE dd/MM/yyyy 'lúc' HH:mm", { locale: viLocale })}
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
                      {b.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'}
                    </span>
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                      >
                        Hủy
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
        <div className="space-y-3">
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
                <span className="text-sm text-gray-600">Làm việc</span>
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
          <p className="text-xs text-gray-400 mt-2">
            * Thay đổi giờ sẽ được lưu ngay lập tức.
          </p>
        </div>
      )}
    </main>
  );
}
