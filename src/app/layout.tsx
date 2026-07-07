import './globals.css';
export const metadata = {
  title: 'IranHotel Operations System — Super App',
  description: 'Enterprise operations, CRM, task, calendar and supply OS for IranHotel',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};
export const viewport = { themeColor: '#2563eb' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="fa" dir="rtl"><body>{children}</body></html>; }
