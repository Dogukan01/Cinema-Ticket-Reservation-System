// Server Component (Next.js App Router varsayılanı) olarak veriyi sunucu tarafında çekeriz
export const dynamic = 'force-dynamic'; // Her istekte taze veri çek

async function getMovies() {
  try {
    // Backend API'ye istek at (Server tarafında localhost genellikle 127.0.0.1 olarak çözümlenir)
    const res = await fetch('http://127.0.0.1:3000/api/catalog/movies', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Filmler getirilemedi');
    }
    return res.json();
  } catch (error) {
    console.error('API Hatası:', error);
    return [];
  }
}

export default async function Home() {
  const movies = await getMovies();

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2.5rem', textShadow: '0 2px 10px rgba(239, 68, 68, 0.3)' }}>
        Vizyondaki Filmler
      </h1>
      
      {movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Şu an vizyonda film bulunmuyor veya Backend sunucusuna bağlanılamadı.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '10px', color: 'var(--text-secondary)' }}>
            Not: Eğer filmler yoksa, TMDB Cron Job'ı henüz çalışmamış olabilir veya Backend kapalı olabilir.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
          {movies.map((movie) => (
            <div key={movie.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div 
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  backgroundImage: `url(${movie.poster_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '8px', 
                  marginBottom: '15px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                }}
              />
              <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>{movie.title}</h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>⏳ {movie.duration_minutes} Dk</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                  📅 {new Date(movie.release_date).getFullYear()}
                </span>
              </div>
              
              <p style={{ 
                fontSize: '0.9rem', 
                flexGrow: 1, 
                display: '-webkit-box', 
                WebkitLineClamp: 3, 
                WebkitBoxOrient: 'vertical', 
                overflow: 'hidden' 
              }}>
                {movie.description}
              </p>
              
              <button className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>
                Bilet Al
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
