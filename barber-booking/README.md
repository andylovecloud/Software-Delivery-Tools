# Barber Booking

## Table of Contents

- English
	- [English Overview](#english-overview)
	- [Technology Stack and Purpose](#technology-stack-and-purpose)
	- [Main User Flow](#main-user-flow)
	- [Website Structure](#website-structure)
	- [Quick Local Setup](#quick-local-setup)
	- [Required Environment Variables](#required-environment-variables)
	- [Notification Environment Variables](#notification-environment-variables)
	- [Supabase Setup](#supabase-setup)
	- [Vercel Deployment](#vercel-deployment)
	- [Default Rules](#default-rules)
	- [Operations Notes](#operations-notes)
- Tiếng Việt
	- [Phiên bản Tiếng Việt](#phiên-bản-tiếng-việt)
	- [Luồng chính](#luồng-chính)
	- [Cấu trúc website](#cấu-trúc-website)
	- [Cấu trúc thư mục (rút gọn)](#cấu-trúc-thư-mục-rút-gọn)
	- [Cài đặt local](#cài-đặt-local)
	- [Biến môi trường bắt buộc](#biến-môi-trường-bắt-buộc)
	- [Biến môi trường cho thông báo](#biến-môi-trường-cho-thông-báo)
	- [Setup Supabase](#setup-supabase)
	- [Deploy Vercel](#deploy-vercel)
	- [Mặc định hệ thống](#mặc-định-hệ-thống)
	- [Ghi chú vận hành](#ghi-chú-vận-hành)

## English Overview

Online barber appointment system built with Next.js and Supabase.

Core capabilities:

- Customers can choose available date/time slots and book online.
- Admin dashboard to manage bookings and working hours.
- Weekly default working-hour configuration.
- Date-specific availability override for special days.
- Email notifications for booking confirmation and cancellation.
- WhatsApp notifications for new/cancelled bookings.
- Token-based cancellation link with a 2-hour cancellation policy.

## Technology Stack and Purpose

| Technology | Purpose |
|---|---|
| Next.js (App Router) | Full-stack web framework for UI pages and API routes in one codebase. |
| React + TypeScript | Type-safe, maintainable UI development for booking/admin flows. |
| Supabase (PostgreSQL) | Primary database for bookings, working hours, date overrides, and cancellation tokens. |
| Supabase JS SDK | Server-side and client-side data access to Supabase APIs. |
| Tailwind CSS | Fast and consistent UI styling for responsive pages. |
| Resend | Transactional email delivery for booking confirmation and cancellation emails. |
| CallMeBot | WhatsApp notifications sent to barber/admin phone number. |
| Vercel | Hosting and deployment platform for Next.js production environment. |

## Main User Flow

1. Customer selects a date and checks available slots.
2. Customer submits booking details.
3. UI shows a confirmation screen and asks whether to continue booking another slot.
4. System sends email/WhatsApp notifications when notification env vars are configured.
5. Customer can cancel via tokenized link from email.

## Website Structure

### Frontend routes

| Route | Description |
|---|---|
| `/` | Public booking page |
| `/admin` | Admin dashboard (password protected) |
| `/cancel/[token]` | Booking cancellation page by token |

### API routes

| Route | Description |
|---|---|
| `POST /api/bookings` | Create a new booking |
| `GET /api/slots?date=YYYY-MM-DD` | Get available slots by date |
| `GET /api/cancel/[token]` | Fetch booking by cancellation token |
| `POST /api/cancel/[token]` | Cancel booking by token |
| `GET /api/admin/bookings` | Get bookings list (admin) |
| `DELETE /api/admin/bookings` | Cancel booking from admin dashboard |
| `GET /api/admin/working-hours` | Get weekly default working hours |
| `POST /api/admin/working-hours` | Update weekly default working hours |
| `GET /api/admin/daily-hours` | Get date-specific overrides |
| `POST /api/admin/daily-hours` | Create/update date-specific override |
| `DELETE /api/admin/daily-hours` | Delete date-specific override |

## Quick Local Setup

```bash
cd barber-booking
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server/API |
| `ADMIN_PASSWORD` | Password to access `/admin` |
| `NEXT_PUBLIC_BASE_URL` | Public base URL used for cancellation link |

## Notification Environment Variables

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key |
| `FROM_EMAIL` | Sender email (must be verified in Resend domain settings) |
| `BARBER_EMAIL` | Recipient email for barber/admin notifications |
| `CALLMEBOT_PHONE` | WhatsApp destination number in international format |
| `CALLMEBOT_APIKEY` | CallMeBot API key |

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run full schema from `supabase/schema.sql`.

If schema is missing, admin/API may fail with errors such as:
`Could not find the table 'public.bookings' in the schema cache`.

## Vercel Deployment

```bash
npm i -g vercel
vercel --prod
```

After deploy:

1. Add all production environment variables in Vercel dashboard.
2. Redeploy to apply new env vars.

## Default Rules

- Default working hours: Monday - Saturday, `09:00 - 18:00`.
- Sunday is closed by default.
- Each appointment slot is 1 hour.
- Cancellation is allowed at least 2 hours before appointment time.

## Operations Notes

- If admin login shows `Server connection error`, verify Supabase env vars on Vercel.
- If booking succeeds but no email/WhatsApp is received, verify notification env vars and Resend domain verification.

---

## Phiên bản Tiếng Việt

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
