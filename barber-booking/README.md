# Barber Booking

Ứng dụng đặt lịch cắt tóc online (Next.js + Supabase) với các tính năng:

- Khách chọn ngày/giờ trống và đặt lịch ngay trên web.
- Trang admin quản lý lịch hẹn và cấu hình giờ làm việc.
- Cấu hình giờ làm việc mặc định theo thứ trong tuần.
- Cấu hình giờ làm việc riêng theo từng ngày (date-specific override).
- Email xác nhận/hủy lịch qua Resend.
- WhatsApp thông báo qua CallMeBot.
- Link hủy lịch theo token, giới hạn hủy trước 2 giờ.

## Luồng chính

1. Khách chọn ngày và xem slot rảnh.
2. Khách đặt lịch.
3. UI hiện màn hình xác nhận và hỏi có muốn đặt thêm giờ khác hay không.
4. Hệ thống gửi email/WhatsApp thông báo (nếu cấu hình biến môi trường đầy đủ).
5. Khách có thể hủy lịch qua link trong email.

## Cấu trúc website

### Frontend routes

| Route | Mô tả |
|---|---|
| `/` | Trang đặt lịch công khai |
| `/admin` | Trang quản trị (xác thực bằng mật khẩu admin) |
| `/cancel/[token]` | Trang hủy lịch qua token |

### API routes

| Route | Mô tả |
|---|---|
| `POST /api/bookings` | Tạo booking mới |
| `GET /api/slots?date=YYYY-MM-DD` | Lấy slot trống theo ngày |
| `GET /api/cancel/[token]` | Xem thông tin booking từ token |
| `POST /api/cancel/[token]` | Hủy booking từ token |
| `GET /api/admin/bookings` | Lấy danh sách booking (admin) |
| `DELETE /api/admin/bookings` | Hủy booking từ admin |
| `GET /api/admin/working-hours` | Lấy giờ làm việc mặc định theo tuần |
| `POST /api/admin/working-hours` | Cập nhật giờ làm việc mặc định theo tuần |
| `GET /api/admin/daily-hours` | Lấy danh sách override theo ngày |
| `POST /api/admin/daily-hours` | Tạo/cập nhật override theo ngày |
| `DELETE /api/admin/daily-hours` | Xóa override theo ngày |

## Cấu trúc thư mục (rút gọn)

```text
barber-booking/
	src/
		app/
			page.tsx
			admin/page.tsx
			cancel/[token]/page.tsx
			api/
				bookings/route.ts
				slots/route.ts
				cancel/[token]/route.ts
				admin/
					bookings/route.ts
					working-hours/route.ts
					daily-hours/route.ts
		lib/
			supabase.ts
			notifications.ts
			slots.ts
		types/
			index.ts
	supabase/
		schema.sql
```

## Cài đặt local

```bash
cd barber-booking
npm install
cp .env.example .env.local
```

Điền các biến môi trường trong `.env.local`, sau đó chạy:

```bash
npm run dev
```

Mở `http://localhost:3000`.

## Biến môi trường bắt buộc

| Biến | Mô tả |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key cho server/API |
| `ADMIN_PASSWORD` | Mật khẩu vào trang `/admin` |
| `NEXT_PUBLIC_BASE_URL` | Base URL website để tạo cancel link |

## Biến môi trường cho thông báo

| Biến | Mô tả |
|---|---|
| `RESEND_API_KEY` | API key Resend |
| `FROM_EMAIL` | Email gửi đi (domain phải verify trong Resend) |
| `BARBER_EMAIL` | Email nhận thông báo booking/cancel |
| `CALLMEBOT_PHONE` | Số WhatsApp nhận tin (định dạng quốc tế, ví dụ `84901234567`) |
| `CALLMEBOT_APIKEY` | API key CallMeBot |

## Setup Supabase

1. Tạo project trên Supabase.
2. Mở SQL Editor.
3. Chạy toàn bộ nội dung file `supabase/schema.sql`.

Nếu thiếu bảng, admin/API sẽ lỗi kiểu `Could not find the table 'public.bookings' in the schema cache`.

## Deploy Vercel

```bash
npm i -g vercel
vercel --prod
```

Sau khi deploy:

1. Vào Vercel Dashboard > Project > Settings > Environment Variables.
2. Add đầy đủ biến môi trường production.
3. Redeploy lại để áp dụng biến mới.

## Mặc định hệ thống

- Working hours mặc định: Monday - Saturday, `09:00 - 18:00`.
- Sunday mặc định nghỉ.
- Mỗi slot kéo dài 1 giờ.
- Hủy lịch cho phép trước ít nhất 2 giờ.

## Ghi chú vận hành

- Nếu login admin báo `Server connection error`: kiểm tra biến Supabase trên Vercel.
- Nếu đặt lịch xong không thấy email/WhatsApp: kiểm tra nhóm biến notification và domain Resend.
