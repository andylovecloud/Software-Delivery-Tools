import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Đặt Lịch Cắt Tóc',
  description: 'Đặt lịch cắt tóc online nhanh chóng và tiện lợi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
