import './globals.css'

export const metadata = {
  title: 'SBRS | Sinema Bilet Rezervasyon Sistemi',
  description: 'Geleceğin sinema deneyimi.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <nav className="navbar glass-panel">
          <a href="/" className="nav-brand">SBRS Cinema</a>
          <div>
            <a href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Giriş Yap</a>
          </div>
        </nav>
        <main style={{ padding: '40px 5%' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
