export const dynamic = 'force-dynamic';
import ShowtimeList from '@/components/ShowtimeList';

async function getMovieDetails(id) {
  try {
    const res = await fetch(`http://127.0.0.1:3000/api/catalog/movies/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Film detayları alınamadı');
    return res.json();
  } catch (error) {
    console.error('API Hatası:', error);
    return null;
  }
}

export default async function MovieDetails({ params }) {
  const { id } = await params;
  const movie = await getMovieDetails(id);

  if (!movie) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><h1>Film Bulunamadı</h1></div>;
  }

  // Seansları sinemalara göre gruplayalım
  const showtimesByCinema = {};
  if (movie.showtimes && Array.isArray(movie.showtimes)) {
      movie.showtimes.forEach(st => {
          if (!showtimesByCinema[st.cinema_name]) {
              showtimesByCinema[st.cinema_name] = [];
          }
          showtimesByCinema[st.cinema_name].push(st);
      });
  }

  return (
    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
      
      {/* Sol Taraf: Afiş ve Detaylar */}
      <div style={{ flex: '1 1 300px' }}>
        <img 
          src={movie.poster_url} 
          alt={movie.title} 
          style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }} 
        />
        <h1 style={{ marginTop: '20px', fontSize: '2.5rem', textShadow: '0 2px 10px rgba(239, 68, 68, 0.3)' }}>{movie.title}</h1>
        <p style={{ marginTop: '10px', fontSize: '1.1rem', lineHeight: '1.8' }}>{movie.description}</p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', color: 'var(--text-secondary)' }}>
            <span>⏳ {movie.duration_minutes} Dakika</span>
            <span>📅 {new Date(movie.release_date).toLocaleDateString('tr-TR')}</span>
        </div>
      </div>

      {/* Sağ Taraf: Seanslar */}
      <div style={{ flex: '2 1 500px' }} className="glass-panel">
        <div style={{ padding: '30px' }}>
            <h2 style={{ marginBottom: '30px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Seans Seçimi</h2>
            <ShowtimeList showtimesByCinema={showtimesByCinema} />
        </div>
      </div>

    </div>
  );
}
