# ✂️ Barber Booking — Đặt Lịch Cắt Tóc

Website đặt lịch cắt tóc online với thông báo email và WhatsApp.

## Tính năng

- 📅 Xem giờ trống theo ngày (xanh = còn trống, đỏ = đã đặt)
- ✅ Đặt lịch với tên + email/phone (email tùy chọn)
- 📧 Xác nhận tự động qua email (cho thợ và khách)
- 📱 Thông báo WhatsApp tự động cho thợ
- ❌ Hủy lịch qua link trong email (trước 2 tiếng)
- 🔐 Trang admin quản lý lịch & cấu hình giờ làm việc

## Cài đặt

### 1. Setup Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Vào **SQL Editor**, chạy toàn bộ nội dung file `supabase/schema.sql`
3. Copy **Project URL** và **API keys** từ Settings > API

### 2. Setup Resend (gửi email)

1. Đăng ký tại [resend.com](https://resend.com)
2. Verify domain của bạn
3. Tạo API key

### 3. Setup CallMeBot (gửi WhatsApp)

1. Lưu số **+34 644 62 76 88** vào danh bạ WhatsApp (tên: CallMeBot)
2. Gửi tin nhắn: `I allow callmebot to send me messages`
3. Bạn sẽ nhận được API key qua WhatsApp trong vài giây
4. Xem hướng dẫn chi tiết: [callmebot.com](https://www.callmebot.com/blog/free-whatsapp-messages-callmebot/)

### 4. Cài đặt & chạy local

```bash
cd barber-booking
npm install
cp .env.example .env.local
# Mở .env.local và điền đầy đủ thông tin
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

### 5. Deploy lên Vercel

```bash
npm i -g vercel
vercel --prod
```

Hoặc kết nối GitHub repo với [vercel.com](https://vercel.com) và thêm biến môi trường trong dashboard.

## Cấu trúc

| URL | Mô tả |
|-----|-------|
| `/` | Trang đặt lịch (công khai) |
| `/cancel/[token]` | Trang hủy lịch (link trong email) |
| `/admin` | Trang quản trị (cần mật khẩu) |
| `POST /api/bookings` | API tạo lịch hẹn |
| `GET /api/slots?date=` | API lấy giờ trống theo ngày |
| `GET/POST /api/cancel/[token]` | API xem / hủy lịch |
| `GET/DELETE /api/admin/bookings` | API quản lý lịch |
| `GET/POST /api/admin/working-hours` | API cấu hình giờ làm việc |

## Biến môi trường

Xem file `.env.example` để biết tất cả biến môi trường cần thiết.

| Biến | Mô tả |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL của Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (dùng cho server) |
| `RESEND_API_KEY` | API key của Resend |
| `BARBER_EMAIL` | Email của thợ nhận thông báo |
| `FROM_EMAIL` | Email gửi đi (phải là domain đã verify trong Resend) |
| `CALLMEBOT_PHONE` | Số WhatsApp của thợ (có mã quốc gia, ví dụ: 84901234567) |
| `CALLMEBOT_APIKEY` | API key của CallMeBot |
| `NEXT_PUBLIC_BASE_URL` | URL của website (dùng để tạo link hủy) |
| `ADMIN_PASSWORD` | Mật khẩu trang admin |

## Mặc định

- **Giờ làm việc**: Thứ 2 – Thứ 7, 09:00 – 18:00 (9 slot/ngày)
- **Chủ nhật**: Nghỉ
- **Mỗi slot**: 1 tiếng
- **Hủy lịch**: Cho phép trước 2 tiếng so với giờ hẹn
- **Múi giờ**: Server xử lý theo thời gian thực tế của máy chủ
