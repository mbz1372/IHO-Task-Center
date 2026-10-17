import '@fontsource-variable/vazirmatn';
import './design-tokens.css';
import './globals.css';

export const metadata = {
  title: 'مرکز فرمان زنجیره تأمین | ایران‌هتل',
  description: 'مدیریت ساده زنجیره تأمین ایران‌هتل: اولویت هتل، واگذاری اقدام، ثبت نتیجه و رشد فروش',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};
export const viewport = { themeColor: '#1d4ed8', colorScheme: 'light dark' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl" suppressHydrationWarning><body>{children}</body></html>;
}
