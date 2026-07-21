import '@fontsource-variable/vazirmatn';
import './design-tokens.css';
import './globals.css';

export const metadata = {
  title: 'مرکز عملیات و تسک IHO',
  description: 'سامانه یکپارچه مدیریت هتل، عملیات، تأمین و تسک ایران‌هتل',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};
export const viewport = { themeColor: '#1d4ed8', colorScheme: 'light dark' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl" suppressHydrationWarning><body>{children}</body></html>;
}
