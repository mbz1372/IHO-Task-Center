import './globals.css';
export const metadata = { title: 'IranHotel OS', description: 'IranHotel Operations System' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
