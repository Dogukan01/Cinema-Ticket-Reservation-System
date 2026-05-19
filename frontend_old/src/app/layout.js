import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'SBRS | Sinema Bilet Rezervasyon Sistemi',
  description: 'Geleceğin sinema deneyimi.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <Header />
        <main style={{ padding: '40px 5%' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
