import '@fontsource-variable/vazirmatn';
import './globals.css';

export const metadata = {
  title: 'IranHotel Operations System',
  description: 'Enterprise hotel CRM, operations, supply and task management platform',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};
export const viewport = { themeColor: '#2563eb' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl" suppressHydrationWarning><body>{children}</body></html>;
}
