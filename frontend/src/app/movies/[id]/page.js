export const dynamic = 'force-dynamic';

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
            
            {Object.keys(showtimesByCinema).length === 0 ? (
                <p>Bu film için henüz seans tanımlanmamıştır.</p>
            ) : (
                Object.keys(showtimesByCinema).map(cinemaName => (
                    <div key={cinemaName} style={{ marginBottom: '30px' }}>
                        <h3 style={{ color: 'var(--accent-color)', marginBottom: '15px' }}>📍 {cinemaName}</h3>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            {showtimesByCinema[cinemaName].map(st => {
                                const timeString = new Date(st.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                return (
                                    <a key={st.showtime_id} href={`/showtimes/${st.showtime_id}/seats`} style={{ textDecoration: 'none' }}>
                                        <div className="glass-card" style={{ padding: '15px 25px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--accent-color)' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{timeString}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>{st.hall_name}</div>
                                        </div>
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

    </div>
  );
}
